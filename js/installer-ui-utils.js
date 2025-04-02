/**
 * Installer UI Utils - Common utility functions for the installer UI
 */

/**
 * Detect the operating system
 * @returns {string} Operating system identifier ('windows', 'macos', 'linux', 'unknown')
 */
function detectOS() {
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.getPlatform) {
        const platform = window.electronAPI.getPlatform();
        if (platform === 'win32') return 'windows';
        if (platform === 'darwin') return 'macos';
        if (platform === 'linux') return 'linux';
        return 'unknown';
    }
    
    const userAgent = window.navigator.userAgent;
    if (userAgent.indexOf('Windows') !== -1) return 'windows';
    if (userAgent.indexOf('Mac') !== -1) return 'macos';
    if (userAgent.indexOf('Linux') !== -1) return 'linux';
    return 'unknown';
}

/**
 * Format a file path according to the current OS
 * @param {string} path - The path to format
 * @returns {string} Formatted path for the current OS
 */
function formatPathForOS(path) {
    const os = detectOS();
    
    // Replace slashes based on OS
    if (os === 'windows') {
        return path.replace(/\//g, '\\');
    } else {
        return path.replace(/\\/g, '/');
    }
}

/**
 * Get the path separator for the current OS
 * @returns {string} Path separator ('\\' for Windows, '/' for others)
 */
function getPathSeparator() {
    return detectOS() === 'windows' ? '\\' : '/';
}

/**
 * Join path segments with the appropriate separator for the current OS
 * @param {...string} segments - Path segments to join
 * @returns {string} Joined path
 */
function joinPath(...segments) {
    const separator = getPathSeparator();
    
    // Filter out empty segments
    segments = segments.filter(segment => segment !== null && segment !== undefined && segment !== '');
    
    // Join segments with the appropriate separator
    return segments.map((segment, index) => {
        // Remove leading/trailing separators except for the first segment
        if (index === 0) {
            return segment.endsWith(separator) ? segment.slice(0, -1) : segment;
        } else {
            return segment.startsWith(separator) ? segment.slice(1) : segment;
        }
    }).join(separator);
}

/**
 * Get the default installation path for the current OS
 * @returns {string} Default installation path
 */
function getDefaultInstallPath() {
    const os = detectOS();
    const homeDir = getUserHomeDirectory();
    
    switch (os) {
        case 'windows':
            return `${homeDir}\\AppData\\Local\\MCP`;
        case 'macos':
            return `${homeDir}/Library/Application Support/MCP`;
        case 'linux':
            return `${homeDir}/.local/share/MCP`;
        default:
            return `${homeDir}/MCP`;
    }
}

/**
 * Get the user's home directory
 * @returns {string} Path to the user's home directory
 */
function getUserHomeDirectory() {
    // In a real implementation, we would use Node.js os.homedir()
    // For our simulation, we'll use a platform-specific default
    const os = detectOS();
    
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.getUserHome) {
        return window.electronAPI.getUserHome();
    }
    
    switch (os) {
        case 'windows':
            return 'C:\\Users\\' + (window.username || 'User');
        case 'macos':
        case 'linux':
            return '/home/' + (window.username || 'user');
        default:
            return '';
    }
}

/**
 * Check if a path exists
 * @param {string} path - Path to check
 * @returns {Promise<boolean>} Promise that resolves to true if the path exists
 */
async function pathExists(path) {
    return new Promise((resolve) => {
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.pathExists) {
            window.electronAPI.pathExists(path)
                .then(exists => {
                    resolve(exists);
                })
                .catch(() => {
                    resolve(false);
                });
        } else {
            // Fallback to simulation for development/testing
            const existingPaths = JSON.parse(localStorage.getItem('existing_paths') || '[]');
            resolve(existingPaths.includes(path));
        }
    });
}

/**
 * Generate a unique ID
 * @returns {string} Unique ID
 */
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Format a date as a string
 * @param {Date} date - Date to format
 * @param {string} format - Format string
 * @returns {string} Formatted date string
 */
function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    if (!date) {
        date = new Date();
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}

/**
 * Format a file size in a human-readable format
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Validate a URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if the URL is valid
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Validate a GitHub repository URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if the URL is a valid GitHub repository URL
 */
function isValidGitHubUrl(url) {
    if (!isValidUrl(url)) return false;
    
    // Check if it's a GitHub URL
    const githubRegex = /^https?:\/\/github\.com\/[^/]+\/[^/]+\/?$/;
    return githubRegex.test(url);
}

/**
 * Extract repository owner and name from a GitHub URL
 * @param {string} url - GitHub repository URL
 * @returns {Object|null} Object containing owner and name, or null if invalid
 */
function extractGitHubRepoInfo(url) {
    if (!isValidGitHubUrl(url)) return null;
    
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(part => part);
        
        if (pathParts.length >= 2) {
            return {
                owner: pathParts[0],
                name: pathParts[1].replace('.git', '')
            };
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

/**
 * Validate an installation path
 * @param {string} path - Path to validate
 * @returns {boolean} True if the path is valid
 */
function isValidInstallPath(path) {
    if (!path) return false;
    
    // Check for invalid characters based on OS
    const os = detectOS();
    
    if (os === 'windows') {
        // Windows path validation
        const invalidChars = /[<>:"|?*]/;
        if (invalidChars.test(path)) return false;
        
        // Check for reserved names
        const reservedNames = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
        const parts = path.split('\\');
        for (const part of parts) {
            if (reservedNames.test(part)) return false;
        }
    } else {
        // Unix path validation
        if (path.includes('\0')) return false;
    }
    
    return true;
}

/**
 * Sanitize a string for use as a filename
 * @param {string} filename - Filename to sanitize
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
    // Replace invalid characters with underscores
    return filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
}

/**
 * Deep clone an object
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce a function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300) {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle a function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit = 300) {
    let inThrottle;
    
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}

/**
 * Log a message to the console and UI
 * @param {string} message - Message to log
 * @param {string} type - Message type ('info', 'success', 'warning', 'error')
 */
function logMessage(message, type = 'info') {
    // Log to console
    switch (type) {
        case 'success':
            console.log(`%c✓ ${message}`, 'color: green');
            break;
        case 'warning':
            console.warn(`⚠ ${message}`);
            break;
        case 'error':
            console.error(`✗ ${message}`);
            break;
        default:
            console.log(`ℹ ${message}`);
            break;
    }
    
    // Log to UI if the log container exists
    const logContainer = document.getElementById('logContainer');
    if (logContainer) {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        
        // Add timestamp
        const timestamp = formatDate(new Date(), 'HH:mm:ss');
        
        // Set icon based on type
        let icon = 'ℹ️';
        switch (type) {
            case 'success':
                icon = '✅';
                break;
            case 'warning':
                icon = '⚠️';
                break;
            case 'error':
                icon = '❌';
                break;
        }
        
        logEntry.innerHTML = `<span class="log-time">[${timestamp}]</span> <span class="log-icon">${icon}</span> <span class="log-message">${message}</span>`;
        
        // Add to log container
        logContainer.appendChild(logEntry);
        
        // Scroll to bottom
        logContainer.scrollTop = logContainer.scrollHeight;
    }
}

/**
 * Clear the log container
 */
function clearLog() {
    const logContainer = document.getElementById('logContainer');
    if (logContainer) {
        logContainer.innerHTML = '';
    }
}

/**
 * Show a notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type ('info', 'success', 'warning', 'error')
 * @param {number} duration - Duration in milliseconds
 */
function showNotification(message, type = 'info', duration = 5000) {
    // Create notification container if it doesn't exist
    let notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Set icon based on type
    let icon = 'ℹ️';
    switch (type) {
        case 'success':
            icon = '✅';
            break;
        case 'warning':
            icon = '⚠️';
            break;
        case 'error':
            icon = '❌';
            break;
    }
    
    // Set notification content
    notification.innerHTML = `
        <span class="notification-icon">${icon}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close">×</button>
    `;
    
    // Add to notification container
    notificationContainer.appendChild(notification);
    
    // Add close button event listener
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
        notification.classList.add('notification-hide');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Auto-hide after duration
    setTimeout(() => {
        notification.classList.add('notification-hide');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);
}

/**
 * Load configuration from localStorage
 * @param {string} key - Configuration key
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Configuration value
 */
function loadConfig(key, defaultValue = null) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
        console.error(`Error loading config for key ${key}:`, error);
        return defaultValue;
    }
}

/**
 * Save configuration to localStorage
 * @param {string} key - Configuration key
 * @param {*} value - Configuration value
 */
function saveConfig(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error saving config for key ${key}:`, error);
    }
}

/**
 * Get the value of a URL parameter
 * @param {string} name - Parameter name
 * @returns {string|null} Parameter value or null if not found
 */
function getUrlParameter(name) {
    name = name.replace(/[[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

/**
 * Set a URL parameter
 * @param {string} name - Parameter name
 * @param {string} value - Parameter value
 */
function setUrlParameter(name, value) {
    const url = new URL(window.location.href);
    url.searchParams.set(name, value);
    window.history.replaceState({}, '', url.toString());
}

/**
 * Remove a URL parameter
 * @param {string} name - Parameter name
 */
function removeUrlParameter(name) {
    const url = new URL(window.location.href);
    url.searchParams.delete(name);
    window.history.replaceState({}, '', url.toString());
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 * @param {*} value - Value to check
 * @returns {boolean} True if the value is empty
 */
function isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}

/**
 * Get the file extension from a path
 * @param {string} path - File path
 * @returns {string} File extension
 */
function getFileExtension(path) {
    if (!path) return '';
    
    const parts = path.split('.');
    if (parts.length === 1) return '';
    
    return parts[parts.length - 1].toLowerCase();
}

/**
 * Get the filename from a path
 * @param {string} path - File path
 * @returns {string} Filename
 */
function getFilename(path) {
    if (!path) return '';
    
    const separator = path.includes('\\') ? '\\' : '/';
    const parts = path.split(separator);
    
    return parts[parts.length - 1];
}

/**
 * Get the directory path from a file path
 * @param {string} path - File path
 * @returns {string} Directory path
 */
function getDirectoryPath(path) {
    if (!path) return '';
    
    const separator = path.includes('\\') ? '\\' : '/';
    const parts = path.split(separator);
    
    // Remove the last part (filename)
    parts.pop();
    
    return parts.join(separator);
}

/**
 * Create a delay promise
 * @param {number} ms - Delay in milliseconds
 * @returns {Promise<void>} Promise that resolves after the delay
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise<*>} Promise that resolves with the function result
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            // Calculate delay with exponential backoff
            const delayTime = baseDelay * Math.pow(2, i);
            
            // Add some randomness to prevent thundering herd
            const jitter = Math.random() * 100;
            
            // Wait before retrying
            await delay(delayTime + jitter);
        }
    }
    
    throw lastError;
}

/**
 * Determine installation method based on system capabilities
 * @param {Object} options - Installation options
 * @returns {string} Installation method ID
 */
function determineMethodId(options = {}) {
    // If method is explicitly specified, use it
    if (options.methodId) {
        return options.methodId;
    }
    
    // If Docker is specified, use Docker
    if (options.useDocker) {
        return 'docker';
    }
    
    // Check if we're running in Electron with system info
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.getSystemInfo) {
        try {
            const systemInfo = window.electronAPI.getSystemInfo();
            
            // Check for Python installation
            if (systemInfo.hasPython && systemInfo.pythonVersion) {
                // If UV is installed, prefer it
                if (systemInfo.hasUv) {
                    return 'uv';
                }
                return 'python';
            }
            
            // Check for Node.js installation
            if (systemInfo.hasNode && systemInfo.nodeVersion) {
                // If NPX is available, use it
                if (systemInfo.hasNpx) {
                    return 'npx';
                }
                // Fall back to direct npm install
                return 'npm';
            }
        } catch (error) {
            console.error('Error determining method ID:', error);
        }
    }
    
    // Default to npx if we can't determine capabilities
    return 'npx';
}

// Export functions for use in other modules
window.InstallerUIUtils = {
    detectOS,
    formatPathForOS,
    getPathSeparator,
    joinPath,
    getDefaultInstallPath,
    getUserHomeDirectory,
    pathExists,
    generateUniqueId,
    formatDate,
    formatFileSize,
    isValidUrl,
    isValidGitHubUrl,
    extractGitHubRepoInfo,
    isValidInstallPath,
    sanitizeFilename,
    deepClone,
    debounce,
    throttle,
    logMessage,
    clearLog,
    showNotification,
    loadConfig,
    saveConfig,
    getUrlParameter,
    setUrlParameter,
    removeUrlParameter,
    isEmpty,
    getFileExtension,
    getFilename,
    getDirectoryPath,
    delay,
    retryWithBackoff,
    determineMethodId
};
