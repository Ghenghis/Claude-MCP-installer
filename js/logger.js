/**
 * Logger - Handles all logging functionality
 * Provides methods for logging messages with different severity levels
 * Enhanced with Winston integration for production-ready logging
 */
class LoggerClass {
    constructor() {
        this.logContainer = document.getElementById('logContainer');
        this.logLevel = MCPConfig.DEFAULTS.LOG_LEVEL;
        this.logHistory = [];
        this.maxLogEntries = 100;
        this.initializeWinston();
    }
    
    /**
     * Initialize Winston logger if available
     * Falls back to console logging if Winston is not available
     */
    initializeWinston() {
        this.winston = null;
        
        try {
            // Check if Winston is available (in Node.js environment)
            if (typeof require !== 'undefined') {
                const winston = require('winston');
                
                // Create Winston logger with custom format
                this.winston = winston.createLogger({
                    level: 'info',
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.json()
                    ),
                    defaultMeta: { service: 'mcp-installer' },
                    transports: [
                        // Write all logs to console
                        new winston.transports.Console({
                            format: winston.format.combine(
                                winston.format.colorize(),
                                winston.format.simple()
                            )
                        }),
                        // Write all logs to file
                        new winston.transports.File({ 
                            filename: 'logs/error.log', 
                            level: 'error' 
                        }),
                        new winston.transports.File({ 
                            filename: 'logs/combined.log' 
                        })
                    ]
                });
            }
        } catch (error) {
            console.warn('Winston logger not available, falling back to console logging');
        }
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
        
        // Use Winston logger if available, otherwise fall back to console
        if (this.winston) {
            this.logToWinston(message, type);
        } else if (MCPConfig.DEBUG) {
            this.logToConsole(message, type);
        }
    }
    
    /**
     * Log to Winston logger
     * @param {string} message - The message to log
     * @param {string} type - The type of log
     */
    logToWinston(message, type) {
        const logLevel = this.mapTypeToWinstonLevel(type);
        this.winston[logLevel](message);
    }
    
    /**
     * Map UI log type to Winston log level
     * @param {string} type - UI log type
     * @returns {string} Winston log level
     */
    mapTypeToWinstonLevel(type) {
        const typeMap = {
            'success': 'info',
            'error': 'error',
            'warning': 'warn',
            'info': 'info',
            'debug': 'debug'
        };
        
        return typeMap[type] || 'info';
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
        
        const messageSpan = document.createElement('span');
        messageSpan.className = 'log-message';
        messageSpan.textContent = message;
        
        logEntry.appendChild(timestamp);
        logEntry.appendChild(messageSpan);
        
        this.logContainer.appendChild(logEntry);
        
        // Auto-scroll to bottom
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
    }
    
    /**
     * Log to console with appropriate styling
     */
    logToConsole(message, type) {
        const timestamp = new Date().toLocaleTimeString();
        const formattedMessage = `[${timestamp}] ${message}`;
        
        switch (type) {
            case 'success':
                console.log('%c' + formattedMessage, 'color: green');
                break;
            case 'error':
                console.error(formattedMessage);
                break;
            case 'warning':
                console.warn(formattedMessage);
                break;
            case 'debug':
                console.debug(formattedMessage);
                break;
            default:
                console.info(formattedMessage);
        }
    }
    
    /**
     * Clear log container
     */
    clearLogs() {
        if (this.logContainer) {
            this.logContainer.innerHTML = '';
        }
        this.logHistory = [];
    }
    
    /**
     * Export logs to file
     */
    exportLogs() {
        const logText = this.logHistory.map(log => 
            `[${log.timestamp.toLocaleString()}] [${log.type.toUpperCase()}] ${log.message}`
        ).join('\n');
        
        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `mcp-installer-logs-${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
}

// Create singleton instance
const Logger = new LoggerClass();

// Export for both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
} else {
    window.Logger = Logger;
}