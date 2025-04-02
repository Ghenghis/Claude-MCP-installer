/**
 * Installer Utils - Utility functions for the installer
 * Provides common utility functions used across the installer
 */

/**
 * Detect the operating system
 * @returns {string} The detected operating system (windows, macos, linux)
 */
function detectOS() {
    const platform = navigator.platform.toLowerCase();
    
    if (platform.includes('win')) {
        return 'windows';
    } else if (platform.includes('mac')) {
        return 'macos';
    } else if (platform.includes('linux') || platform.includes('x11')) {
        return 'linux';
    } else {
        // Default to windows if unable to detect
        return 'windows';
    }
}

/**
 * Format a path according to the operating system
 * @param {string} path - The path to format
 * @returns {string} The formatted path
 */
function formatPath(path) {
    const os = detectOS();
    
    if (os === 'windows') {
        // Ensure backslashes for Windows
        return path.replace(/\//g, '\\');
    } else {
        // Ensure forward slashes for macOS and Linux
        return path.replace(/\\/g, '/');
    }
}

/**
 * Generate a random ID
 * @param {number} length - The length of the ID
 * @returns {string} The generated ID
 */
function generateRandomId(length = 8) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
}

/**
 * Validate a URL
 * @param {string} url - The URL to validate
 * @returns {boolean} Whether the URL is valid
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
 * Escape special characters in a string for use in a command
 * @param {string} str - The string to escape
 * @returns {string} The escaped string
 */
function escapeCommandString(str) {
    const os = detectOS();
    
    if (os === 'windows') {
        // Escape double quotes and special characters for Windows
        return str.replace(/"/g, '\\"');
    } else {
        // Escape single quotes and special characters for macOS and Linux
        return str.replace(/'/g, "\\'");
    }
}

/**
 * Get the user's home directory path
 * @returns {string} The home directory path
 */
function getHomeDirPath() {
    const os = detectOS();
    
    if (os === 'windows') {
        return process.env.USERPROFILE || 'C:\\Users\\Admin';
    } else {
        return process.env.HOME || '/home/user';
    }
}

/**
 * Get the Claude Desktop configuration path
 * @returns {string} The configuration path
 */
function getClaudeConfigPath() {
    const os = detectOS();
    const homeDir = getHomeDirPath();
    
    if (os === 'windows') {
        return `${homeDir}\\AppData\\Roaming\\Claude\\claude_desktop_config.json`;
    } else if (os === 'macos') {
        return `${homeDir}/Library/Application Support/Claude/claude_desktop_config.json`;
    } else {
        return `${homeDir}/.config/claude/claude_desktop_config.json`;
    }
}

/**
 * Format a date string
 * @param {Date} date - The date to format
 * @param {string} format - The format string
 * @returns {string} The formatted date string
 */
function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
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
 * Debounce a function call
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce wait time in milliseconds
 * @returns {Function} The debounced function
 */
function debounce(func, wait = 300) {
    let timeout;
    
    return function(...args) {
        const context = this;
        
        clearTimeout(timeout);
        
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

/**
 * Throttle a function call
 * @param {Function} func - The function to throttle
 * @param {number} limit - The throttle limit in milliseconds
 * @returns {Function} The throttled function
 */
function throttle(func, limit = 300) {
    let inThrottle;
    
    return function(...args) {
        const context = this;
        
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}

/**
 * Deep clone an object
 * @param {Object} obj - The object to clone
 * @returns {Object} The cloned object
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if a value is null or undefined
 * @param {*} value - The value to check
 * @returns {boolean} Whether the value is null or undefined
 */
function isNullOrUndefined(value) {
    return value === null || value === undefined;
}

/**
 * Check if a value is an empty string
 * @param {*} value - The value to check
 * @returns {boolean} Whether the value is an empty string
 */
function isEmptyString(value) {
    return typeof value === 'string' && value.trim() === '';
}

/**
 * Check if a value is an empty array
 * @param {*} value - The value to check
 * @returns {boolean} Whether the value is an empty array
 */
function isEmptyArray(value) {
    return Array.isArray(value) && value.length === 0;
}

/**
 * Check if a value is an empty object
 * @param {*} value - The value to check
 * @returns {boolean} Whether the value is an empty object
 */
function isEmptyObject(value) {
    return typeof value === 'object' && !Array.isArray(value) && value !== null && Object.keys(value).length === 0;
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, or empty object)
 * @param {*} value - The value to check
 * @returns {boolean} Whether the value is empty
 */
function isEmpty(value) {
    // Check for null or undefined
    if (isNullOrUndefined(value)) {
        return true;
    }
    
    // Check for empty string
    if (isEmptyString(value)) {
        return true;
    }
    
    // Check for empty array
    if (isEmptyArray(value)) {
        return true;
    }
    
    // Check for empty object
    if (isEmptyObject(value)) {
        return true;
    }
    
    return false;
}

// Export functions for use in other modules
window.InstallerUtils = {
    detectOS,
    formatPath,
    generateRandomId,
    isValidUrl,
    escapeCommandString,
    getHomeDirPath,
    getClaudeConfigPath,
    formatDate,
    debounce,
    throttle,
    deepClone,
    isEmpty
};
