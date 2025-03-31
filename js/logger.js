/**
 * Logger - Handles all logging functionality
 * Provides methods for logging messages with different severity levels
 */
class LoggerClass {
    constructor() {
        this.logContainer = document.getElementById('logContainer');
        this.logLevel = MCPConfig.DEFAULTS.LOG_LEVEL;
        this.logHistory = [];
        this.maxLogEntries = 100;
    }
    
    /**
     * Log a message with specified type
     * @param {string} message - The message to log
     * @param {string} type - The type of log (success, error, warning, info)
     */
    log(message, type = 'info') {
        // Store in history
        this.logHistory.push({
            timestamp: new Date(),
            message,
            type
        });
        
        // Trim history if needed
        if (this.logHistory.length > this.maxLogEntries) {
            this.logHistory.shift();
        }
        
        // If log container exists, add visual log
        if (this.logContainer) {
            this.addLogToUI(message, type);
        }
        
        // Console logging for debugging
        if (MCPConfig.DEBUG) {
            this.logToConsole(message, type);
        }
    }
    
    /**
     * Add log entry to UI
     */
    addLogToUI(message, type) {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        
        const timestamp = document.createElement('span');
        timestamp.className = 'log-timestamp';
        timestamp.textContent = new Date().toLocaleTimeString();
        
        const icon = document.createElement('i');
        icon.className = this.getIconForType(type);
        
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        
        logEntry.appendChild(timestamp);
        logEntry.appendChild(icon);
        logEntry.appendChild(messageSpan);
        
        this.logContainer.appendChild(logEntry);
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
    }
    
    /**
     * Get appropriate icon for log type
     */
    getIconForType(type) {
        switch(type) {
            case 'success': return 'fas fa-check-circle';
            case 'error': return 'fas fa-times-circle';
            case 'warning': return 'fas fa-exclamation-triangle';
            case 'info': 
            default: return 'fas fa-info-circle';
        }
    }
    
    /**
     * Log to console with appropriate styling
     */
    logToConsole(message, type) {
        const styles = {
            success: 'color: green; font-weight: bold',
            error: 'color: red; font-weight: bold',
            warning: 'color: orange; font-weight: bold',
            info: 'color: blue'
        };
        
        console.log(`%c[${type.toUpperCase()}] ${message}`, styles[type] || styles.info);
    }
    
    /**
     * Export logs to file
     */
    exportLogs() {
        const logText = this.logHistory.map(entry => 
            `[${entry.timestamp.toISOString()}] [${entry.type.toUpperCase()}] ${entry.message}`
        ).join('\n');
        
        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `mcp-installer-logs-${new Date().toISOString().slice(0,10)}.txt`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.log('Logs exported successfully', 'success');
    }
}

// Create singleton instance
const Logger = new LoggerClass();