/**
 * Backup Logger - Tracks backup and restore activities
 */
class BackupLogger {
    constructor() {
        this.logStorageKey = 'mcp_backup_logs';
        this.maxLogs = 100;
        this.logs = this.loadLogs();
    }

    /**
     * Load logs from localStorage
     * @returns {Array} Array of log entries
     */
    loadLogs() {
        try {
            const logsJson = localStorage.getItem(this.logStorageKey);
            return logsJson ? JSON.parse(logsJson) : [];
        } catch (error) {
            console.error('Error loading backup logs:', error);
            return [];
        }
    }

    /**
     * Save logs to localStorage
     */
    saveLogs() {
        try {
            localStorage.setItem(this.logStorageKey, JSON.stringify(this.logs));
        } catch (error) {
            console.error('Error saving backup logs:', error);
        }
    }

    /**
     * Add a log entry
     * @param {string} action - Action performed (create, restore, delete)
     * @param {string} serverId - Server ID
     * @param {string} backupId - Backup ID
     * @param {Object} details - Additional details
     */
    addLog(action, serverId, backupId, details = {}) {
        const timestamp = new Date().toISOString();
        
        // Create log entry
        const logEntry = {
            id: this.generateLogId(),
            timestamp,
            action,
            serverId,
            backupId,
            details,
            status: 'success'
        };
        
        // Add to logs
        this.logs.unshift(logEntry);
        
        // Limit number of logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(0, this.maxLogs);
        }
        
        // Save logs
        this.saveLogs();
        
        // Log to console
        console.log(`Backup Log: ${action} - Server: ${serverId}, Backup: ${backupId}`);
        
        return logEntry;
    }

    /**
     * Add an error log entry
     * @param {string} action - Action performed (create, restore, delete)
     * @param {string} serverId - Server ID
     * @param {string} backupId - Backup ID
     * @param {Error} error - Error object
     * @param {Object} details - Additional details
     */
    addErrorLog(action, serverId, backupId, error, details = {}) {
        const timestamp = new Date().toISOString();
        
        // Create log entry
        const logEntry = {
            id: this.generateLogId(),
            timestamp,
            action,
            serverId,
            backupId,
            details,
            status: 'error',
            error: {
                message: error.message,
                stack: error.stack
            }
        };
        
        // Add to logs
        this.logs.unshift(logEntry);
        
        // Limit number of logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(0, this.maxLogs);
        }
        
        // Save logs
        this.saveLogs();
        
        // Log to console
        console.error(`Backup Error Log: ${action} - Server: ${serverId}, Backup: ${backupId}`, error);
        
        return logEntry;
    }

    /**
     * Get logs for a specific server
     * @param {string} serverId - Server ID
     * @returns {Array} Array of log entries
     */
    getLogsForServer(serverId) {
        return this.logs.filter(log => log.serverId === serverId);
    }

    /**
     * Get logs for a specific backup
     * @param {string} backupId - Backup ID
     * @returns {Array} Array of log entries
     */
    getLogsForBackup(backupId) {
        return this.logs.filter(log => log.backupId === backupId);
    }

    /**
     * Get logs for a specific action
     * @param {string} action - Action (create, restore, delete)
     * @returns {Array} Array of log entries
     */
    getLogsForAction(action) {
        return this.logs.filter(log => log.action === action);
    }

    /**
     * Get error logs
     * @returns {Array} Array of error log entries
     */
    getErrorLogs() {
        return this.logs.filter(log => log.status === 'error');
    }

    /**
     * Clear all logs
     */
    clearLogs() {
        this.logs = [];
        this.saveLogs();
    }

    /**
     * Generate a unique log ID
     * @returns {string} Unique log ID
     */
    generateLogId() {
        return `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Export logs as JSON
     * @returns {string} JSON string of logs
     */
    exportLogs() {
        return JSON.stringify(this.logs, null, 2);
    }

    /**
     * Import logs from JSON
     * @param {string} json - JSON string of logs
     */
    importLogs(json) {
        try {
            const importedLogs = JSON.parse(json);
            
            if (Array.isArray(importedLogs)) {
                this.logs = importedLogs;
                this.saveLogs();
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error importing backup logs:', error);
            return false;
        }
    }
}

// Initialize the BackupLogger when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.BackupLogger = new BackupLogger();
});
