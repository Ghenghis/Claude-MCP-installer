/**
 * Backup Core - Core functionality for backup system
 * Handles backup storage, retrieval, and management
 */

/**
 * Load existing backups
 * @returns {Promise<Array>} Array of backups
 */
async function loadBackups() {
    try {
        // In a real implementation, we would load backups from disk
        // For now, we'll load from localStorage
        const backupsJson = localStorage.getItem('mcp_backups');
        const backups = backupsJson ? JSON.parse(backupsJson) : [];
        
        // Sort backups by date (newest first)
        backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        return backups;
    } catch (error) {
        console.error('Error loading backups:', error);
        return [];
    }
}

/**
 * Save backups to storage
 * @param {Array} backups - Array of backups to save
 * @returns {Promise<void>}
 */
async function saveBackups(backups) {
    try {
        // In a real implementation, we would save backup metadata to disk
        // For now, we'll save to localStorage
        localStorage.setItem('mcp_backups', JSON.stringify(backups));
    } catch (error) {
        console.error('Error saving backups:', error);
        throw error;
    }
}

/**
 * Get a backup by ID
 * @param {Array} backups - Array of backups
 * @param {string} backupId - Backup ID
 * @returns {Object|null} Backup metadata or null if not found
 */
function getBackupById(backups, backupId) {
    return backups.find(b => b.id === backupId) || null;
}

/**
 * Get backups for a server
 * @param {Array} backups - Array of backups
 * @param {string} serverId - Server ID
 * @returns {Array} Backups for the server
 */
function getBackupsForServer(backups, serverId) {
    return backups.filter(b => b.serverId === serverId);
}

/**
 * Generate a backup ID
 * @param {string} serverId - Server ID
 * @returns {string} Backup ID
 */
function generateBackupId(serverId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `backup_${serverId}_${timestamp}_${random}`;
}

/**
 * Create backup directory structure
 * @param {string} backupId - Backup ID
 * @param {Object} options - Options
 * @returns {Promise<string>} Backup directory path
 */
async function createBackupDirectory(backupId, options) {
    try {
        // Create main backup directory
        const backupDir = `${options.backupBasePath || './backups'}/${backupId}`;
        
        // Create directory structure using the file system API
        await window.FileSystemAPI.createDirectory(backupDir);
        await window.FileSystemAPI.createDirectory(`${backupDir}/config`);
        await window.FileSystemAPI.createDirectory(`${backupDir}/data`);
        
        if (options.includeLogs) {
            await window.FileSystemAPI.createDirectory(`${backupDir}/logs`);
        }
        
        return backupDir;
    } catch (error) {
        console.error('Error creating backup directory:', error);
        throw new Error(`Failed to create backup directory: ${error.message}`);
    }
}

/**
 * Save backup manifest
 * @param {string} backupId - Backup ID
 * @param {Object} manifest - Backup manifest
 * @param {Object} options - Options
 * @returns {Promise<void>}
 */
async function saveBackupManifest(backupId, manifest, options) {
    try {
        const backupDir = `${options.backupBasePath || './backups'}/${backupId}`;
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
 * @param {Object} options - Options
 * @returns {Promise<Object>} Backup manifest
 */
async function loadBackupManifest(backupId, options) {
    try {
        const backupDir = `${options.backupBasePath || './backups'}/${backupId}`;
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
 * @param {Object} options - Options
 * @returns {Promise<void>}
 */
async function deleteBackupFiles(backupId, options) {
    try {
        const backupDir = `${options.backupBasePath || './backups'}/${backupId}`;
        
        // Delete backup directory
        await window.FileSystemAPI.deleteDirectory(backupDir, true);
    } catch (error) {
        console.error('Error deleting backup files:', error);
        throw new Error(`Failed to delete backup files: ${error.message}`);
    }
}

// Export functions for use in other modules
window.BackupCore = {
    loadBackups,
    saveBackups,
    getBackupById,
    getBackupsForServer,
    generateBackupId,
    createBackupDirectory,
    saveBackupManifest,
    loadBackupManifest,
    deleteBackupFiles
};
