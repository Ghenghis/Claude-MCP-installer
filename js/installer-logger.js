/**
 * Installer Logger - Logging functionality for the installer
 * Provides consistent logging across all modules
 */

/**
 * Log a message to the UI
 * @param {string} message - The message to log
 * @param {string} type - The type of message (info, success, warning, error)
 */
function logMessage(message, type = '') {
    // Get the log container
    const logContainer = getLogContainer();
    if (!logContainer) return;
    
    // Create log entry element
    const logEntry = createLogEntry(message, type);
    
    // Add the log entry to the container
    logContainer.appendChild(logEntry);
    
    // Scroll to the bottom of the log container
    scrollLogToBottom(logContainer);
}

/**
 * Get the log container element
 * @returns {HTMLElement|null} The log container element or null if not found
 */
function getLogContainer() {
    const logContainer = document.getElementById('logContainer');
    if (!logContainer) {
        console.error('Log container not found');
        return null;
    }
    return logContainer;
}

/**
 * Create a log entry element
 * @param {string} message - The message to log
 * @param {string} type - The type of message (info, success, warning, error)
 * @returns {HTMLElement} The log entry element
 */
function createLogEntry(message, type) {
    // Create log entry element
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    
    // Set log entry content
    logEntry.textContent = message;
    
    return logEntry;
}

/**
 * Scroll to the bottom of the log container
 * @param {HTMLElement} logContainer - The log container element
 */
function scrollLogToBottom(logContainer) {
    logContainer.scrollTop = logContainer.scrollHeight;
}

/**
 * Log a JSON-related message to the UI
 * @param {string} message - The message to log
 * @param {string} type - The type of message (info, success, warning, error)
 */
function logJsonMessage(message, type = '') {
    // Get the JSON log container
    const jsonLogContainer = document.getElementById('jsonLogContainer');
    if (!jsonLogContainer) {
        // Fall back to regular log container if JSON log container not found
        logMessage(message, type);
        return;
    }
    
    // Create log entry element
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = message;
    
    // Add the log entry to the container
    jsonLogContainer.appendChild(logEntry);
    
    // Scroll to the bottom of the log container
    jsonLogContainer.scrollTop = jsonLogContainer.scrollHeight;
}

/**
 * Clear the log container
 * @param {string} containerId - The ID of the log container to clear
 */
function clearLog(containerId = 'logContainer') {
    const logContainer = document.getElementById(containerId);
    if (logContainer) {
        logContainer.innerHTML = '';
    }
}

/**
 * Update the server status indicator
 * @param {string} status - The server status (running, stopped, error)
 */
function updateServerStatus(status) {
    const statusIndicator = document.getElementById('serverStatus');
    if (!statusIndicator) return;
    
    // Remove all status classes
    statusIndicator.classList.remove('running', 'stopped', 'error');
    
    // Add the appropriate status class
    statusIndicator.classList.add(status);
    
    // Update the status text
    const statusText = document.getElementById('serverStatusText');
    if (statusText) {
        statusText.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }
}

// Export functions for use in other modules
window.InstallerLogger = {
    logMessage,
    getLogContainer,
    createLogEntry,
    scrollLogToBottom,
    logJsonMessage,
    clearLog,
    updateServerStatus
};
