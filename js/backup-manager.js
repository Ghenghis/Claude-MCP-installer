/**
 * Backup Manager - Handles comprehensive backup and restore functionality for MCP servers
 * Coordinates between specialized modules for backup operations
 */
class BackupManager {
    constructor(options = {}) {
        this.options = options;
        this.backups = [];
        this.backupInProgress = false;
        this.restoreInProgress = false;
        this.backupLocations = {
            config: options.configBackupPath || './backups/config',
            data: options.dataBackupPath || './backups/data',
            logs: options.logsBackupPath || './backups/logs'
        };
        this.currentBackupId = null;
        this.currentServerId = null;
    }

    /**
     * Initialize the backup manager
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            // Load existing backups
            await this.loadBackups();
            
            console.log('Backup manager initialized');
            
            // Trigger initialized event
            window.BackupEvents.trigger('initialized', { backups: this.backups });
            
            return true;
        } catch (error) {
            console.error('Error initializing backup manager:', error);
            return false;
        }
    }

    /**
     * Load existing backups
     * @returns {Promise<Array>} Array of backups
     */
    async loadBackups() {
        try {
            // Use the core module to load backups
            this.backups = await window.BackupCore.loadBackups();
            return this.backups;
        } catch (error) {
            console.error('Error loading backups:', error);
            this.backups = [];
            return [];
        }
    }

    /**
     * Save backups to storage
     * @returns {Promise<void>}
     */
    async saveBackups() {
        try {
            // Use the core module to save backups
            await window.BackupCore.saveBackups(this.backups);
        } catch (error) {
            console.error('Error saving backups:', error);
        }
    }

    /**
     * Create a backup for a server
     * @param {string} serverId - Server ID
     * @param {Object} options - Backup options
     * @returns {Promise<Object>} Backup metadata
     */
    async createBackup(serverId, options = {}) {
        if (this.backupInProgress) {
            throw new Error('Backup already in progress');
        }
        
        this.backupInProgress = true;
        this.currentServerId = serverId;
        
        try {
            // Get server info
            const server = await this.getServerInfo(serverId);
            
            if (!server) {
                throw new Error(`Server ${serverId} not found`);
            }
            
            // Create backup ID
            const backupId = window.BackupCore.generateBackupId(serverId);
            this.currentBackupId = backupId;
            
            // Create backup metadata
            const metadata = {
                id: backupId,
                serverId,
                serverName: server.name,
                serverType: server.type,
                createdAt: new Date().toISOString(),
                name: options.name || `Backup of ${server.name} - ${new Date().toLocaleString()}`,
                description: options.description || '',
                type: options.type || 'full', // 'full', 'config', 'data'
                size: 0,
                status: 'in_progress',
                items: []
            };
            
            // Add backup to list
            this.backups.push(metadata);
            await this.saveBackups();
            
            // Trigger backup started event
            window.BackupEvents.trigger('backupStarted', { backup: metadata });
            
            // Perform backup
            const result = await this.performBackup(serverId, backupId, options);
            
            // Update metadata
            metadata.status = 'completed';
            metadata.completedAt = new Date().toISOString();
            metadata.size = result.totalSize;
            metadata.items = result.items;
            
            // Save updated metadata
            await this.saveBackups();
            
            // Trigger backup completed event
            window.BackupEvents.trigger('backupCompleted', { backup: metadata });
            
            this.backupInProgress = false;
            this.currentBackupId = null;
            this.currentServerId = null;
            
            return metadata;
        } catch (error) {
            console.error('Error creating backup:', error);
            
            // Update backup status to failed
            const failedBackup = this.backups.find(b => b.id === this.currentBackupId);
            if (failedBackup) {
                failedBackup.status = 'failed';
                failedBackup.error = error.message;
                await this.saveBackups();
            }
            
            // Trigger backup failed event
            window.BackupEvents.trigger('backupFailed', { 
                backupId: this.currentBackupId,
                serverId: this.currentServerId,
                error: error.message
            });
            
            this.backupInProgress = false;
            this.currentBackupId = null;
            this.currentServerId = null;
            
            throw error;
        }
    }

    /**
     * Perform the actual backup
     * @param {string} serverId - Server ID
     * @param {string} backupId - Backup ID
     * @param {Object} options - Backup options
     * @returns {Promise<Object>} Backup result
     */
    async performBackup(serverId, backupId, options = {}) {
        // Create backup directory structure
        const backupDir = await window.BackupCore.createBackupDirectory(backupId, this.options);
        
        const items = [];
        let totalSize = 0;
        
        // Backup configuration files
        if (options.type === 'full' || options.type === 'config') {
            const configResult = await window.BackupOperations.backupConfigFiles(
                serverId, 
                backupId, 
                backupDir, 
                data => window.BackupEvents.trigger('backupProgress', data)
            );
            items.push(...configResult.items);
            totalSize += configResult.totalSize;
            
            // Trigger progress event
            window.BackupEvents.trigger('backupProgress', {
                backupId,
                serverId,
                progress: 33,
                message: 'Configuration files backed up'
            });
        }
        
        // Backup data files
        if (options.type === 'full' || options.type === 'data') {
            const dataResult = await window.BackupOperations.backupDataFiles(
                serverId, 
                backupId, 
                backupDir, 
                options,
                data => window.BackupEvents.trigger('backupProgress', data)
            );
            items.push(...dataResult.items);
            totalSize += dataResult.totalSize;
            
            // Trigger progress event
            window.BackupEvents.trigger('backupProgress', {
                backupId,
                serverId,
                progress: 66,
                message: 'Data files backed up'
            });
        }
        
        // Backup logs if requested
        if (options.includeLogs) {
            const logsResult = await window.BackupOperations.backupLogFiles(
                serverId, 
                backupId, 
                backupDir,
                data => window.BackupEvents.trigger('backupProgress', data)
            );
            items.push(...logsResult.items);
            totalSize += logsResult.totalSize;
            
            // Trigger progress event
            window.BackupEvents.trigger('backupProgress', {
                backupId,
                serverId,
                progress: 90,
                message: 'Log files backed up'
            });
        }
        
        // Create backup manifest
        const manifest = {
            id: backupId,
            serverId,
            createdAt: new Date().toISOString(),
            options,
            items
        };
        
        // Save manifest
        await window.BackupCore.saveBackupManifest(backupId, manifest, this.options);
        
        // Trigger progress event
        window.BackupEvents.trigger('backupProgress', {
            backupId,
            serverId,
            progress: 100,
            message: 'Backup completed'
        });
        
        return {
            items,
            totalSize
        };
    }

    /**
     * Restore a server from backup
     * @param {string} backupId - Backup ID
     * @param {Object} options - Restore options
     * @returns {Promise<Object>} Restore result
     */
    async restoreBackup(backupId, options = {}) {
        if (this.restoreInProgress) {
            throw new Error('Restore already in progress');
        }
        
        const backup = this.getBackupById(backupId);
        if (!backup) {
            throw new Error(`Backup ${backupId} not found`);
        }
        
        this.restoreInProgress = true;
        this.currentBackupId = backupId;
        this.currentServerId = backup.serverId;
        
        try {
            // Get server info
            const server = await this.getServerInfo(backup.serverId);
            
            if (!server) {
                throw new Error(`Server ${backup.serverId} not found`);
            }
            
            // Trigger restore started event
            window.BackupEvents.trigger('restoreStarted', { 
                backup,
                server,
                options
            });
            
            // Perform restore
            const result = await this.performRestore(backup, options);
            
            // Trigger restore completed event
            window.BackupEvents.trigger('restoreCompleted', { 
                backup,
                server,
                result
            });
            
            this.restoreInProgress = false;
            this.currentBackupId = null;
            this.currentServerId = null;
            
            return result;
        } catch (error) {
            console.error('Error restoring backup:', error);
            
            // Trigger restore failed event
            window.BackupEvents.trigger('restoreFailed', { 
                backupId,
                serverId: backup.serverId,
                error: error.message
            });
            
            this.restoreInProgress = false;
            this.currentBackupId = null;
            this.currentServerId = null;
            
            throw error;
        }
    }

    /**
     * Perform the actual restore
     * @param {Object} backup - Backup metadata
     * @param {Object} options - Restore options
     * @returns {Promise<Object>} Restore result
     */
    async performRestore(backup, options = {}) {
        // Load backup manifest
        const manifest = await window.BackupCore.loadBackupManifest(backup.id, this.options);
        
        // Stop the server if it's running
        if (options.stopServer !== false) {
            await window.BackupOperations.stopServer(
                backup.serverId,
                data => window.BackupEvents.trigger('restoreProgress', data)
            );
            
            // Trigger progress event
            window.BackupEvents.trigger('restoreProgress', {
                backupId: backup.id,
                serverId: backup.serverId,
                progress: 10,
                message: 'Server stopped'
            });
        }
        
        // Restore configuration files
        if (options.restoreConfig !== false) {
            await window.BackupOperations.restoreConfigFiles(
                backup.serverId, 
                manifest, 
                options,
                data => window.BackupEvents.trigger('restoreProgress', data)
            );
            
            // Trigger progress event
            window.BackupEvents.trigger('restoreProgress', {
                backupId: backup.id,
                serverId: backup.serverId,
                progress: 40,
                message: 'Configuration files restored'
            });
        }
        
        // Restore data files
        if (options.restoreData !== false) {
            await window.BackupOperations.restoreDataFiles(
                backup.serverId, 
                manifest, 
                options,
                data => window.BackupEvents.trigger('restoreProgress', data)
            );
            
            // Trigger progress event
            window.BackupEvents.trigger('restoreProgress', {
                backupId: backup.id,
                serverId: backup.serverId,
                progress: 70,
                message: 'Data files restored'
            });
        }
        
        // Start the server if it was running
        if (options.startServer !== false) {
            await window.BackupOperations.startServer(
                backup.serverId,
                data => window.BackupEvents.trigger('restoreProgress', data)
            );
            
            // Trigger progress event
            window.BackupEvents.trigger('restoreProgress', {
                backupId: backup.id,
                serverId: backup.serverId,
                progress: 90,
                message: 'Server started'
            });
        }
        
        // Trigger progress event
        window.BackupEvents.trigger('restoreProgress', {
            backupId: backup.id,
            serverId: backup.serverId,
            progress: 100,
            message: 'Restore completed'
        });
        
        return {
            success: true,
            serverId: backup.serverId,
            backupId: backup.id
        };
    }

    /**
     * Delete a backup
     * @param {string} backupId - Backup ID
     * @returns {Promise<boolean>} Whether the backup was deleted
     */
    async deleteBackup(backupId) {
        const backup = this.getBackupById(backupId);
        if (!backup) {
            throw new Error(`Backup ${backupId} not found`);
        }
        
        try {
            // Delete backup files
            await window.BackupCore.deleteBackupFiles(backupId, this.options);
            
            // Remove from backups list
            this.backups = this.backups.filter(b => b.id !== backupId);
            await this.saveBackups();
            
            // Trigger backup deleted event
            window.BackupEvents.trigger('backupDeleted', { backupId });
            
            return true;
        } catch (error) {
            console.error('Error deleting backup:', error);
            throw error;
        }
    }

    /**
     * Get a backup by ID
     * @param {string} backupId - Backup ID
     * @returns {Object} Backup metadata
     */
    getBackupById(backupId) {
        return window.BackupCore.getBackupById(this.backups, backupId);
    }

    /**
     * Get backups for a server
     * @param {string} serverId - Server ID
     * @returns {Array} Backups for the server
     */
    getBackupsForServer(serverId) {
        return window.BackupCore.getBackupsForServer(this.backups, serverId);
    }

    /**
     * Get all backups
     * @returns {Array} All backups
     */
    getAllBackups() {
        return [...this.backups];
    }

    /**
     * Get server info
     * @param {string} serverId - Server ID
     * @returns {Promise<Object>} Server info
     */
    async getServerInfo(serverId) {
        // In a real implementation, we would get server info from the server manager
        // For now, we'll return mock data
        
        // Check if Docker manager is available
        if (window.dockerManager) {
            const container = window.dockerManager.getContainerById(serverId);
            if (container) {
                return {
                    id: container.id,
                    name: container.name,
                    type: 'docker',
                    status: container.status
                };
            }
        }
        
        // Check if server manager is available
        if (window.serverManager) {
            const server = window.serverManager.getServerById(serverId);
            if (server) {
                return {
                    id: server.id,
                    name: server.name,
                    type: server.type,
                    status: server.status
                };
            }
        }
        
        // Return mock data if server not found
        return {
            id: serverId,
            name: `Server ${serverId}`,
            type: 'unknown',
            status: 'unknown'
        };
    }

    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        window.BackupEvents.on(event, callback);
        return this;
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    off(event, callback) {
        window.BackupEvents.off(event, callback);
        return this;
    }

    /**
     * Trigger an event
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    triggerEvent(event, data) {
        window.BackupEvents.trigger(event, data);
        return this;
    }
}

// Make the BackupManager globally available
window.BackupManager = BackupManager;

// Initialize the backup manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Ensure required modules are loaded
    if (!window.BackupCore || !window.BackupOperations || !window.BackupEvents) {
        console.error('Required backup modules not loaded. Make sure to include backup-core.js, backup-operations.js, and backup-events.js before backup-manager.js');
        return;
    }
    
    // Initialize backup manager
    const backupManager = new BackupManager();
    backupManager.initialize();
});
