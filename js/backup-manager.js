/**
 * Backup Manager - Handles comprehensive backup and restore functionality for MCP servers
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
        this.eventListeners = {};
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
            this.triggerEvent('initialized', { backups: this.backups });
            
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
            // In a real implementation, we would load backups from disk
            // For now, we'll load from localStorage
            const backupsJson = localStorage.getItem('mcp_backups');
            this.backups = backupsJson ? JSON.parse(backupsJson) : [];
            
            // Sort backups by date (newest first)
            this.backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
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
            // In a real implementation, we would save backup metadata to disk
            // For now, we'll save to localStorage
            localStorage.setItem('mcp_backups', JSON.stringify(this.backups));
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
            const backupId = this.generateBackupId(serverId);
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
            this.triggerEvent('backupStarted', { backup: metadata });
            
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
            this.triggerEvent('backupCompleted', { backup: metadata });
            
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
            this.triggerEvent('backupFailed', { 
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
        const backupDir = await this.createBackupDirectory(backupId);
        
        const items = [];
        let totalSize = 0;
        
        // Backup configuration files
        if (options.type === 'full' || options.type === 'config') {
            const configResult = await this.backupConfigFiles(serverId, backupId, backupDir);
            items.push(...configResult.items);
            totalSize += configResult.totalSize;
            
            // Trigger progress event
            this.triggerEvent('backupProgress', {
                backupId,
                serverId,
                progress: 33,
                message: 'Configuration files backed up'
            });
        }
        
        // Backup data files
        if (options.type === 'full' || options.type === 'data') {
            const dataResult = await this.backupDataFiles(serverId, backupId, backupDir, options);
            items.push(...dataResult.items);
            totalSize += dataResult.totalSize;
            
            // Trigger progress event
            this.triggerEvent('backupProgress', {
                backupId,
                serverId,
                progress: 66,
                message: 'Data files backed up'
            });
        }
        
        // Backup logs if requested
        if (options.includeLogs) {
            const logsResult = await this.backupLogFiles(serverId, backupId, backupDir);
            items.push(...logsResult.items);
            totalSize += logsResult.totalSize;
            
            // Trigger progress event
            this.triggerEvent('backupProgress', {
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
        await this.saveBackupManifest(backupId, manifest);
        
        // Trigger progress event
        this.triggerEvent('backupProgress', {
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
            this.triggerEvent('restoreStarted', { 
                backup,
                server,
                options
            });
            
            // Perform restore
            const result = await this.performRestore(backup, options);
            
            // Trigger restore completed event
            this.triggerEvent('restoreCompleted', { 
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
            this.triggerEvent('restoreFailed', { 
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
        const manifest = await this.loadBackupManifest(backup.id);
        
        // Stop the server if it's running
        if (options.stopServer !== false) {
            await this.stopServer(backup.serverId);
            
            // Trigger progress event
            this.triggerEvent('restoreProgress', {
                backupId: backup.id,
                serverId: backup.serverId,
                progress: 10,
                message: 'Server stopped'
            });
        }
        
        // Restore configuration files
        if (options.restoreConfig !== false) {
            await this.restoreConfigFiles(backup.serverId, manifest, options);
            
            // Trigger progress event
            this.triggerEvent('restoreProgress', {
                backupId: backup.id,
                serverId: backup.serverId,
                progress: 40,
                message: 'Configuration files restored'
            });
        }
        
        // Restore data files
        if (options.restoreData !== false) {
            await this.restoreDataFiles(backup.serverId, manifest, options);
            
            // Trigger progress event
            this.triggerEvent('restoreProgress', {
                backupId: backup.id,
                serverId: backup.serverId,
                progress: 70,
                message: 'Data files restored'
            });
        }
        
        // Start the server if it was running
        if (options.startServer !== false) {
            await this.startServer(backup.serverId);
            
            // Trigger progress event
            this.triggerEvent('restoreProgress', {
                backupId: backup.id,
                serverId: backup.serverId,
                progress: 90,
                message: 'Server started'
            });
        }
        
        // Trigger progress event
        this.triggerEvent('restoreProgress', {
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
            await this.deleteBackupFiles(backupId);
            
            // Remove from backups list
            this.backups = this.backups.filter(b => b.id !== backupId);
            await this.saveBackups();
            
            // Trigger backup deleted event
            this.triggerEvent('backupDeleted', { backupId });
            
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
        return this.backups.find(b => b.id === backupId);
    }

    /**
     * Get backups for a server
     * @param {string} serverId - Server ID
     * @returns {Array} Backups for the server
     */
    getBackupsForServer(serverId) {
        return this.backups.filter(b => b.serverId === serverId);
    }

    /**
     * Get all backups
     * @returns {Array} All backups
     */
    getAllBackups() {
        return [...this.backups];
    }

    /**
     * Create a backup directory
     * @param {string} backupId - Backup ID
     * @returns {Promise<string>} Backup directory path
     */
    async createBackupDirectory(backupId) {
        try {
            // Create main backup directory
            const backupDir = `${this.options.backupBasePath || './backups'}/${backupId}`;
            
            // Create directory structure using the file system API
            await window.FileSystemAPI.createDirectory(backupDir);
            await window.FileSystemAPI.createDirectory(`${backupDir}/config`);
            await window.FileSystemAPI.createDirectory(`${backupDir}/data`);
            
            if (this.options.includeLogs) {
                await window.FileSystemAPI.createDirectory(`${backupDir}/logs`);
            }
            
            return backupDir;
        } catch (error) {
            console.error('Error creating backup directory:', error);
            throw new Error(`Failed to create backup directory: ${error.message}`);
        }
    }

    /**
     * Backup configuration files
     * @param {string} serverId - Server ID
     * @param {string} backupId - Backup ID
     * @param {string} backupDir - Backup directory path
     * @returns {Promise<Object>} Backup result
     */
    async backupConfigFiles(serverId, backupId, backupDir) {
        try {
            const server = await this.getServerInfo(serverId);
            const configDir = `${server.installPath}/config`;
            const backupConfigDir = `${backupDir}/config`;
            
            // Get list of configuration files
            const configFiles = await window.FileSystemAPI.listFiles(configDir, '*.json');
            
            const items = [];
            let totalSize = 0;
            
            // Copy each configuration file
            for (const file of configFiles) {
                // Update progress
                this.triggerEvent('backupProgress', {
                    backupId,
                    serverId,
                    progress: 10,
                    message: `Backing up configuration file: ${file.name}`
                });
                
                // Read file content
                const content = await window.FileSystemAPI.readFile(`${configDir}/${file.name}`);
                
                // Write to backup location
                await window.FileSystemAPI.writeFile(`${backupConfigDir}/${file.name}`, content);
                
                // Add to items
                items.push({
                    type: 'config',
                    path: `config/${file.name}`,
                    originalPath: `${configDir}/${file.name}`,
                    size: content.length
                });
                
                totalSize += content.length;
            }
            
            return { items, totalSize };
        } catch (error) {
            console.error('Error backing up configuration files:', error);
            throw new Error(`Failed to backup configuration files: ${error.message}`);
        }
    }

    /**
     * Backup data files
     * @param {string} serverId - Server ID
     * @param {string} backupId - Backup ID
     * @param {string} backupDir - Backup directory path
     * @param {Object} options - Backup options
     * @returns {Promise<Object>} Backup result
     */
    async backupDataFiles(serverId, backupId, backupDir, options = {}) {
        try {
            const server = await this.getServerInfo(serverId);
            const dataDir = `${server.installPath}/data`;
            const backupDataDir = `${backupDir}/data`;
            
            // Get list of data files (excluding large binary files if specified)
            let excludePatterns = options.excludePatterns || [];
            if (options.excludeLargeFiles) {
                excludePatterns.push('*.bin', '*.dat', '*.db');
            }
            
            const dataFiles = await window.FileSystemAPI.listFiles(dataDir, '*', excludePatterns);
            
            const items = [];
            let totalSize = 0;
            let fileCount = 0;
            
            // Copy each data file
            for (const file of dataFiles) {
                fileCount++;
                
                // Update progress
                this.triggerEvent('backupProgress', {
                    backupId,
                    serverId,
                    progress: Math.min(50 + Math.floor((fileCount / dataFiles.length) * 30), 80),
                    message: `Backing up data file: ${file.name}`
                });
                
                // Read file content
                const content = await window.FileSystemAPI.readFile(`${dataDir}/${file.name}`);
                
                // Write to backup location
                await window.FileSystemAPI.writeFile(`${backupDataDir}/${file.name}`, content);
                
                // Add to items
                items.push({
                    type: 'data',
                    path: `data/${file.name}`,
                    originalPath: `${dataDir}/${file.name}`,
                    size: content.length
                });
                
                totalSize += content.length;
            }
            
            return { items, totalSize };
        } catch (error) {
            console.error('Error backing up data files:', error);
            throw new Error(`Failed to backup data files: ${error.message}`);
        }
    }

    /**
     * Backup log files
     * @param {string} serverId - Server ID
     * @param {string} backupId - Backup ID
     * @param {string} backupDir - Backup directory path
     * @returns {Promise<Object>} Backup result
     */
    async backupLogFiles(serverId, backupId, backupDir) {
        try {
            const server = await this.getServerInfo(serverId);
            const logsDir = `${server.installPath}/logs`;
            const backupLogsDir = `${backupDir}/logs`;
            
            // Get list of log files
            const logFiles = await window.FileSystemAPI.listFiles(logsDir, '*.log');
            
            const items = [];
            let totalSize = 0;
            
            // Copy each log file
            for (const file of logFiles) {
                // Read file content
                const content = await window.FileSystemAPI.readFile(`${logsDir}/${file.name}`);
                
                // Write to backup location
                await window.FileSystemAPI.writeFile(`${backupLogsDir}/${file.name}`, content);
                
                // Add to items
                items.push({
                    type: 'log',
                    path: `logs/${file.name}`,
                    originalPath: `${logsDir}/${file.name}`,
                    size: content.length
                });
                
                totalSize += content.length;
            }
            
            return { items, totalSize };
        } catch (error) {
            console.error('Error backing up log files:', error);
            throw new Error(`Failed to backup log files: ${error.message}`);
        }
    }

    /**
     * Save backup manifest
     * @param {string} backupId - Backup ID
     * @param {Object} manifest - Backup manifest
     * @returns {Promise<void>}
     */
    async saveBackupManifest(backupId, manifest) {
        try {
            const backupDir = `${this.options.backupBasePath || './backups'}/${backupId}`;
            const manifestPath = `${backupDir}/manifest.json`;
            
            // Write manifest file
            await window.FileSystemAPI.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
        } catch (error) {
            console.error('Error saving backup manifest:', error);
            throw new Error(`Failed to save backup manifest: ${error.message}`);
        }
    }

    /**
     * Load backup manifest
     * @param {string} backupId - Backup ID
     * @returns {Promise<Object>} Backup manifest
     */
    async loadBackupManifest(backupId) {
        try {
            const backupDir = `${this.options.backupBasePath || './backups'}/${backupId}`;
            const manifestPath = `${backupDir}/manifest.json`;
            
            // Read manifest file
            const content = await window.FileSystemAPI.readFile(manifestPath);
            
            return JSON.parse(content);
        } catch (error) {
            console.error('Error loading backup manifest:', error);
            throw new Error(`Failed to load backup manifest: ${error.message}`);
        }
    }

    /**
     * Delete backup files
     * @param {string} backupId - Backup ID
     * @returns {Promise<void>}
     */
    async deleteBackupFiles(backupId) {
        try {
            const backupDir = `${this.options.backupBasePath || './backups'}/${backupId}`;
            
            // Delete backup directory
            await window.FileSystemAPI.deleteDirectory(backupDir, true);
        } catch (error) {
            console.error('Error deleting backup files:', error);
            throw new Error(`Failed to delete backup files: ${error.message}`);
        }
    }

    /**
     * Restore configuration files
     * @param {string} serverId - Server ID
     * @param {Object} manifest - Backup manifest
     * @param {Object} options - Restore options
     * @returns {Promise<void>}
     */
    async restoreConfigFiles(serverId, manifest, options = {}) {
        try {
            const server = await this.getServerInfo(serverId);
            const configDir = `${server.installPath}/config`;
            const backupDir = `${this.options.backupBasePath || './backups'}/${manifest.id}`;
            
            // Get configuration items from manifest
            const configItems = manifest.items.filter(item => item.type === 'config');
            
            // Create backup of current configuration if requested
            if (options.createBackupBeforeRestore) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const configBackupDir = `${configDir}_backup_${timestamp}`;
                
                // Copy current config directory
                await window.FileSystemAPI.copyDirectory(configDir, configBackupDir);
            }
            
            // Restore each configuration file
            for (const item of configItems) {
                // Read backup file
                const content = await window.FileSystemAPI.readFile(`${backupDir}/${item.path}`);
                
                // Write to original location
                await window.FileSystemAPI.writeFile(item.originalPath, content);
            }
        } catch (error) {
            console.error('Error restoring configuration files:', error);
            throw new Error(`Failed to restore configuration files: ${error.message}`);
        }
    }

    /**
     * Restore data files
     * @param {string} serverId - Server ID
     * @param {Object} manifest - Backup manifest
     * @param {Object} options - Restore options
     * @returns {Promise<void>}
     */
    async restoreDataFiles(serverId, manifest, options = {}) {
        try {
            const server = await this.getServerInfo(serverId);
            const dataDir = `${server.installPath}/data`;
            const backupDir = `${this.options.backupBasePath || './backups'}/${manifest.id}`;
            
            // Get data items from manifest
            const dataItems = manifest.items.filter(item => item.type === 'data');
            
            // Create backup of current data if requested
            if (options.createBackupBeforeRestore) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const dataBackupDir = `${dataDir}_backup_${timestamp}`;
                
                // Copy current data directory
                await window.FileSystemAPI.copyDirectory(dataDir, dataBackupDir);
            }
            
            // Restore each data file
            for (const item of dataItems) {
                // Read backup file
                const content = await window.FileSystemAPI.readFile(`${backupDir}/${item.path}`);
                
                // Write to original location
                await window.FileSystemAPI.writeFile(item.originalPath, content);
            }
        } catch (error) {
            console.error('Error restoring data files:', error);
            throw new Error(`Failed to restore data files: ${error.message}`);
        }
    }

    /**
     * Stop a server
     * @param {string} serverId - Server ID
     * @returns {Promise<void>}
     */
    async stopServer(serverId) {
        // In a real implementation, we would stop the server
        // For now, we'll just log it
        console.log(`Stopping server: ${serverId}`);
        
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    /**
     * Start a server
     * @param {string} serverId - Server ID
     * @returns {Promise<void>}
     */
    async startServer(serverId) {
        // In a real implementation, we would start the server
        // For now, we'll just log it
        console.log(`Starting server: ${serverId}`);
        
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 500));
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
     * Get server configuration files
     * @param {string} serverId - Server ID
     * @returns {Promise<Array>} Configuration files
     */
    async getServerConfigFiles(serverId) {
        // In a real implementation, we would get configuration files from the server
        // For now, we'll return mock data
        return [
            {
                name: 'config.json',
                path: '/app/config.json',
                size: 1024
            },
            {
                name: 'settings.json',
                path: '/app/settings.json',
                size: 512
            },
            {
                name: '.env',
                path: '/app/.env',
                size: 256
            }
        ];
    }

    /**
     * Get server data directories
     * @param {string} serverId - Server ID
     * @returns {Promise<Array>} Data directories
     */
    async getServerDataDirectories(serverId) {
        // In a real implementation, we would get data directories from the server
        // For now, we'll return mock data
        return [
            {
                name: 'data',
                path: '/app/data',
                size: 10240
            },
            {
                name: 'uploads',
                path: '/app/uploads',
                size: 20480
            },
            {
                name: 'cache',
                path: '/app/cache',
                size: 5120
            }
        ];
    }

    /**
     * Get server log files
     * @param {string} serverId - Server ID
     * @returns {Promise<Array>} Log files
     */
    async getServerLogFiles(serverId) {
        // In a real implementation, we would get log files from the server
        // For now, we'll return mock data
        return [
            {
                name: 'app.log',
                path: '/app/logs/app.log',
                size: 2048
            },
            {
                name: 'error.log',
                path: '/app/logs/error.log',
                size: 1024
            },
            {
                name: 'access.log',
                path: '/app/logs/access.log',
                size: 4096
            }
        ];
    }

    /**
     * Get file content
     * @param {string} serverId - Server ID
     * @param {string} filePath - File path
     * @returns {Promise<string>} File content
     */
    async getFileContent(serverId, filePath) {
        // In a real implementation, we would get file content from the server
        // For now, we'll return mock data
        return `Mock content for ${filePath}`;
    }

    /**
     * Get directory size
     * @param {string} serverId - Server ID
     * @param {string} dirPath - Directory path
     * @returns {Promise<number>} Directory size in bytes
     */
    async getDirectorySize(serverId, dirPath) {
        // In a real implementation, we would get directory size from the server
        // For now, we'll return mock data
        return 1024 * 1024; // 1MB
    }

    /**
     * Generate a backup ID
     * @param {string} serverId - Server ID
     * @returns {string} Backup ID
     */
    generateBackupId(serverId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 10);
        return `backup_${serverId}_${timestamp}_${random}`;
    }

    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        
        this.eventListeners[event].push(callback);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    off(event, callback) {
        if (!this.eventListeners[event]) {
            return;
        }
        
        this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }

    /**
     * Trigger an event
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    triggerEvent(event, data) {
        if (!this.eventListeners[event]) {
            return;
        }
        
        for (const callback of this.eventListeners[event]) {
            callback(data);
        }
    }
}

// Make the BackupManager globally available
window.BackupManager = BackupManager;

// Initialize the backup manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Create a global instance for use by other components
    window.backupManager = new BackupManager();
    
    // Initialize the backup manager
    await window.backupManager.initialize();
});
