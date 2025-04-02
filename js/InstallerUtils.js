/**
 * InstallerUtils.js
 * Provides utility functions for the installer
 */

class InstallerUtils {
    /**
     * Detect the operating system
     * @returns {string} The detected operating system (windows, macos, linux)
     */
    detectOS() {
        const userAgent = window.navigator.userAgent.toLowerCase();
        
        if (userAgent.indexOf('windows') !== -1) {
            return 'windows';
        } else if (userAgent.indexOf('mac') !== -1) {
            return 'macos';
        } else if (userAgent.indexOf('linux') !== -1) {
            return 'linux';
        } else {
            return 'unknown';
        }
    }
    
    /**
     * Format a path according to the operating system
     * @param {string} path - The path to format
     * @returns {string} The formatted path
     */
    formatPath(path) {
        if (!path) return '';
        
        const os = this.detectOS();
        let formattedPath = path.trim();
        
        // Replace backslashes with forward slashes for consistency
        formattedPath = formattedPath.replace(/\\/g, '/');
        
        // For Windows, convert back to backslashes
        if (os === 'windows') {
            formattedPath = formattedPath.replace(/\//g, '\\');
        }
        
        return formattedPath;
    }
    
    /**
     * Generate a random ID
     * @param {number} length - The length of the ID
     * @returns {string} The generated ID
     */
    generateRandomId(length = 8) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * chars.length);
            result += chars.charAt(randomIndex);
        }
        
        return result;
    }
    
    /**
     * Validate a URL
     * @param {string} url - The URL to validate
     * @returns {boolean} Whether the URL is valid
     */
    isValidUrl(url) {
        if (!url) return false;
        
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
    escapeCommandString(str) {
        if (!str) return '';
        
        // Escape special characters based on OS
        const os = this.detectOS();
        
        if (os === 'windows') {
            // For Windows, escape with double quotes and handle internal quotes
            return `"${str.replace(/"/g, '\\"')}"`;
        } else {
            // For Unix-like systems, escape with single quotes
            return `'${str.replace(/'/g, "'\\''")}'`;
        }
    }
    
    /**
     * Get the user's home directory path
     * @returns {string} The home directory path
     */
    getHomeDirPath() {
        const os = this.detectOS();
        
        if (os === 'windows') {
            return process.env.USERPROFILE || 'C:\\Users\\User';
        } else {
            return process.env.HOME || '/home/user';
        }
    }
    
    /**
     * Get the Claude Desktop configuration path
     * @returns {string} The configuration path
     */
    getClaudeConfigPath() {
        const homeDir = this.getHomeDirPath();
        const os = this.detectOS();
        
        if (os === 'windows') {
            return `${homeDir}\\AppData\\Roaming\\Claude Desktop\\config`;
        } else if (os === 'macos') {
            return `${homeDir}/Library/Application Support/Claude Desktop/config`;
        } else {
            return `${homeDir}/.config/claude-desktop/config`;
        }
    }
    
    /**
     * Format a date string
     * @param {Date} date - The date to format
     * @param {string} format - The format string
     * @returns {string} The formatted date string
     */
    formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
        if (!date) return '';
        
        const d = new Date(date);
        
        // If invalid date, return empty string
        if (isNaN(d.getTime())) return '';
        
        // Replace format tokens with actual values
        return format
            .replace('YYYY', d.getFullYear())
            .replace('MM', String(d.getMonth() + 1).padStart(2, '0'))
            .replace('DD', String(d.getDate()).padStart(2, '0'))
            .replace('HH', String(d.getHours()).padStart(2, '0'))
            .replace('mm', String(d.getMinutes()).padStart(2, '0'))
            .replace('ss', String(d.getSeconds()).padStart(2, '0'));
    }
    
    /**
     * Debounce a function call
     * @param {Function} func - The function to debounce
     * @param {number} wait - The debounce wait time in milliseconds
     * @returns {Function} The debounced function
     */
    debounce(func, wait = 300) {
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
    throttle(func, limit = 300) {
        let inThrottle = false;
        
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
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    
    /**
     * Check if a value is null or undefined
     * @param {*} value - The value to check
     * @returns {boolean} Whether the value is null or undefined
     */
    isNullOrUndefined(value) {
        return value === null || value === undefined;
    }
    
    /**
     * Check if a value is an empty string
     * @param {*} value - The value to check
     * @returns {boolean} Whether the value is an empty string
     */
    isEmptyString(value) {
        return typeof value === 'string' && value.trim() === '';
    }
    
    /**
     * Check if a value is an empty array
     * @param {*} value - The value to check
     * @returns {boolean} Whether the value is an empty array
     */
    isEmptyArray(value) {
        return Array.isArray(value) && value.length === 0;
    }
    
    /**
     * Check if a value is an empty object
     * @param {*} value - The value to check
     * @returns {boolean} Whether the value is an empty object
     */
    isEmptyObject(value) {
        return typeof value === 'object' && 
               !Array.isArray(value) && 
               value !== null && 
               Object.keys(value).length === 0;
    }
    
    /**
     * Check if a value is empty (null, undefined, empty string, empty array, or empty object)
     * @param {*} value - The value to check
     * @returns {boolean} Whether the value is empty
     */
    isEmpty(value) {
        // Check for null or undefined
        if (this.isNullOrUndefined(value)) {
            return true;
        }
        
        // Check for empty string
        if (this.isEmptyString(value)) {
            return true;
        }
        
        // Check for empty array
        if (this.isEmptyArray(value)) {
            return true;
        }
        
        // Check for empty object
        if (this.isEmptyObject(value)) {
            return true;
        }
        
        return false;
    }
}

// Create a singleton instance
const installerUtils = new InstallerUtils();

// Export the singleton
export default installerUtils;
