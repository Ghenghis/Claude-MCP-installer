/**
 * Backup Operations - Handles backup and restore operations
 * Provides functionality for creating backups and restoring from backups
 */

/**
 * @typedef {Object} BackupOptions
 * @property {boolean} [excludeLargeFiles=false] - Whether to exclude large binary files
 * @property {string[]} [excludePatterns=[]] - File patterns to exclude
 * @property {boolean} [createBackupBeforeRestore=true] - Whether to create a backup before restoring
 * @property {string} [backupBasePath='./backups'] - Base path for backups
 */

/**
 * @typedef {Object} ProgressData
 * @property {string} [backupId] - Backup ID
 * @property {string} [serverId] - Server ID
 * @property {number} [progress] - Progress percentage (0-100)
 * @property {string} [message] - Progress message
 */

/**
 * @typedef {Object} BackupItem
 * @property {string} type - Item type ('config', 'data', 'log')
 * @property {string} path - Path relative to backup directory
 * @property {string} originalPath - Original file path
 * @property {number} size - File size in bytes
 */

/**
 * @typedef {Object} BackupResult
 * @property {BackupItem[]} items - Backup items
 * @property {number} totalSize - Total size of backup in bytes
 */

// Private utility functions
const _utils = {
    /**
     * Get server directory path
     * @private
     * @param {Object} server - Server information
     * @param {string} dirType - Directory type ('config', 'data', 'logs')
     * @returns {string} Directory path
     */
    getServerDirPath(server, dirType) {
        // Map directory types to their paths
        const pathMap = {
            'config': `${server.installPath}/config`,
            'data': `${server.installPath}/data`,
            'logs': `${server.installPath}/logs`
        };
        return pathMap[dirType] || `${server.installPath}/${dirType}`;
    },
    
    /**
     * Create a backup of a directory
     * @private
     * @param {string} sourceDir - Source directory path
     * @param {ProgressData} progressData - Progress data for callback
     * @param {Function} progressCallback - Progress callback function
     * @returns {Promise<string>} Backup directory path
     */
    async createDirectoryBackup(sourceDir, progressData, progressCallback) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = `${sourceDir}_backup_${timestamp}`;
        
        // Update progress
        if (progressCallback) {
            progressCallback({
                ...progressData,
                message: `Creating backup of ${sourceDir}`
            });
        }
        
        // Copy directory
        await window.FileSystemAPI.copyDirectory(sourceDir, backupDir);
        return backupDir;
    },
    
    /**
     * Process file backup or restore
     * @private
     * @param {string} sourceDir - Source directory path
     * @param {string} targetDir - Target directory path
     * @param {string} filePattern - File pattern to match
     * @param {string} fileType - File type ('config', 'data', 'log')
     * @param {string[]} excludePatterns - Patterns to exclude
     * @param {ProgressData} progressData - Progress data
     * @param {Function} progressCallback - Progress callback function
     * @param {number} baseProgress - Base progress percentage
     * @param {number} progressRange - Progress range
     * @returns {Promise<BackupResult>} Processing result
     */
    async processFiles(sourceDir, targetDir, filePattern, fileType, excludePatterns, progressData, progressCallback, baseProgress, progressRange) {
        const files = await window.FileSystemAPI.listFiles(sourceDir, filePattern, excludePatterns);
        
        const items = [];
        let totalSize = 0;
        
        // Process each file
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const progress = baseProgress + Math.floor((i / files.length) * progressRange);
            
            // Update progress
            if (progressCallback) {
                progressCallback({
                    ...progressData,
                    progress,
                    message: `Processing ${fileType} file: ${file.name}`
                });
            }
            
            // Read file content
            const content = await window.FileSystemAPI.readFile(`${sourceDir}/${file.name}`);
            
            // Write to target location
            await window.FileSystemAPI.writeFile(`${targetDir}/${file.name}`, content);
            
            // Add to items
            items.push({
                type: fileType,
                path: `${fileType}/${file.name}`,
                originalPath: `${sourceDir}/${file.name}`,
                size: content.length
            });
            
            totalSize += content.length;
        }
        
        return { items, totalSize };
    }
};

/**
 * Backup configuration files
 * @param {string} serverId - Server ID
 * @param {string} backupId - Backup ID
 * @param {string} backupDir - Backup directory path
 * @param {Function} [progressCallback] - Progress callback function
 * @returns {Promise<BackupResult>} Backup result
 */
async function backupConfigFiles(serverId, backupId, backupDir, progressCallback) {
    try {
        const server = await window.ServerManager.getServerInfo(serverId);
        const configDir = _utils.getServerDirPath(server, 'config');
        const backupConfigDir = `${backupDir}/config`;
        
        // Progress data object for callbacks
        const progressData = { backupId, serverId, progress: 10 };
        
        return await _utils.processFiles(
            configDir,                   // sourceDir
            backupConfigDir,             // targetDir
            '*.json',                    // filePattern
            'config',                    // fileType
            [],                          // excludePatterns
            progressData,                // progressData
            progressCallback,            // progressCallback
            10,                          // baseProgress
            20                           // progressRange
        );
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
 * @param {BackupOptions} [options={}] - Backup options
 * @param {Function} [progressCallback] - Progress callback function
 * @returns {Promise<BackupResult>} Backup result
 */
async function backupDataFiles(serverId, backupId, backupDir, options = {}, progressCallback) {
    try {
        const server = await window.ServerManager.getServerInfo(serverId);
        const dataDir = _utils.getServerDirPath(server, 'data');
        const backupDataDir = `${backupDir}/data`;
        
        // Get exclude patterns
        let excludePatterns = options.excludePatterns || [];
        if (options.excludeLargeFiles) {
            excludePatterns = [...excludePatterns, '*.bin', '*.dat', '*.db'];
        }
        
        // Progress data object for callbacks
        const progressData = { backupId, serverId, progress: 50 };
        
        return await _utils.processFiles(
            dataDir,                     // sourceDir
            backupDataDir,               // targetDir
            '*',                         // filePattern
            'data',                      // fileType
            excludePatterns,             // excludePatterns
            progressData,                // progressData
            progressCallback,            // progressCallback
            50,                          // baseProgress
            30                           // progressRange
        );
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
 * @param {Function} [progressCallback] - Progress callback function
 * @returns {Promise<BackupResult>} Backup result
 */
async function backupLogFiles(serverId, backupId, backupDir, progressCallback) {
    try {
        const server = await window.ServerManager.getServerInfo(serverId);
        const logsDir = _utils.getServerDirPath(server, 'logs');
        const backupLogsDir = `${backupDir}/logs`;
        
        // Progress data object for callbacks
        const progressData = { backupId, serverId, progress: 85 };
        
        return await _utils.processFiles(
            logsDir,                     // sourceDir
            backupLogsDir,               // targetDir
            '*.log',                     // filePattern
            'log',                       // fileType
            [],                          // excludePatterns
            progressData,                // progressData
            progressCallback,            // progressCallback
            85,                          // baseProgress
            10                           // progressRange
        );
    } catch (error) {
        console.error('Error backing up log files:', error);
        throw new Error(`Failed to backup log files: ${error.message}`);
    }
}

/**
 * Restore files of a specific type
 * @private
 * @param {string} serverId - Server ID
 * @param {Object} manifest - Backup manifest
 * @param {string} fileType - File type ('config', 'data', 'log')
 * @param {BackupOptions} [options={}] - Restore options
 * @param {Function} [progressCallback] - Progress callback function
 * @param {number} baseProgress - Base progress percentage
 * @param {number} progressRange - Progress range
 * @returns {Promise<void>}
 */
async function _restoreFiles(serverId, manifest, fileType, options = {}, progressCallback, baseProgress, progressRange) {
    try {
        const server = await window.ServerManager.getServerInfo(serverId);
        const targetDir = _utils.getServerDirPath(server, fileType);
        const backupDir = `${options.backupBasePath || './backups'}/${manifest.id}`;
        
        // Get items from manifest
        const items = manifest.items.filter(item => item.type === fileType);
        
        // Create backup of current files if requested
        if (options.createBackupBeforeRestore) {
            const progressData = { 
                backupId: manifest.id, 
                serverId, 
                progress: baseProgress 
            };
            
            await _utils.createDirectoryBackup(targetDir, progressData, progressCallback);
        }
        
        // Restore each file
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const progress = baseProgress + Math.floor((i / items.length) * progressRange);
            
            // Update progress
            if (progressCallback) {
                progressCallback({
                    backupId: manifest.id,
                    serverId,
                    progress,
                    message: `Restoring ${fileType} file: ${item.path}`
                });
            }
            
            // Read backup file
            const content = await window.FileSystemAPI.readFile(`${backupDir}/${item.path}`);
            
            // Write to original location
            await window.FileSystemAPI.writeFile(item.originalPath, content);
        }
    } catch (error) {
        console.error(`Error restoring ${fileType} files:`, error);
        throw new Error(`Failed to restore ${fileType} files: ${error.message}`);
    }
}

/**
 * Restore configuration files
 * @param {string} serverId - Server ID
 * @param {Object} manifest - Backup manifest
 * @param {BackupOptions} [options={}] - Restore options
 * @param {Function} [progressCallback] - Progress callback function
 * @returns {Promise<void>}
 */
async function restoreConfigFiles(serverId, manifest, options = {}, progressCallback) {
    return _restoreFiles(serverId, manifest, 'config', options, progressCallback, 20, 20);
}

/**
 * Restore data files
 * @param {string} serverId - Server ID
 * @param {Object} manifest - Backup manifest
 * @param {BackupOptions} [options={}] - Restore options
 * @param {Function} [progressCallback] - Progress callback function
 * @returns {Promise<void>}
 */
async function restoreDataFiles(serverId, manifest, options = {}, progressCallback) {
    return _restoreFiles(serverId, manifest, 'data', options, progressCallback, 45, 30);
}

/**
 * Server operation handler
 * @private
 * @param {string} serverId - Server ID
 * @param {string} operation - Operation type ('start' or 'stop')
 * @param {Function} [progressCallback] - Progress callback function
 * @param {number} baseProgress - Base progress percentage
 * @returns {Promise<void>}
 */
async function _handleServerOperation(serverId, operation, progressCallback, baseProgress) {
    try {
        const operationMap = {
            'start': {
                initialMessage: 'Starting server',
                completedMessage: 'Server started',
                action: window.ServerManager.startServer
            },
            'stop': {
                initialMessage: 'Stopping server',
                completedMessage: 'Server stopped',
                action: window.ServerManager.stopServer
            }
        };
        
        const handler = operationMap[operation];
        
        // Update progress
        if (progressCallback) {
            progressCallback({
                serverId,
                progress: baseProgress,
                message: handler.initialMessage
            });
        }
        
        // Perform operation
        await handler.action(serverId);
        
        // Update progress
        if (progressCallback) {
            progressCallback({
                serverId,
                progress: baseProgress + 5,
                message: handler.completedMessage
            });
        }
    } catch (error) {
        console.error(`Error ${operation}ing server:`, error);
        throw new Error(`Failed to ${operation} server: ${error.message}`);
    }
}

/**
 * Stop a server
 * @param {string} serverId - Server ID
 * @param {Function} [progressCallback] - Progress callback function
 * @returns {Promise<void>}
 */
async function stopServer(serverId, progressCallback) {
    return _handleServerOperation(serverId, 'stop', progressCallback, 5);
}

/**
 * Start a server
 * @param {string} serverId - Server ID
 * @param {Function} [progressCallback] - Progress callback function
 * @returns {Promise<void>}
 */
async function startServer(serverId, progressCallback) {
    return _handleServerOperation(serverId, 'start', progressCallback, 90);
}

// Export functions for use in other modules
window.BackupOperations = {
    backupConfigFiles,
    backupDataFiles,
    backupLogFiles,
    restoreConfigFiles,
    restoreDataFiles,
    stopServer,
    startServer
};
