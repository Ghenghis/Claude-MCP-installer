/**
 * Utility functions for the MCP Installer
 */
const Utils = {
    /**
     * Validate a GitHub repository URL
     * @param {string} url - The URL to validate
     * @returns {boolean} Whether the URL is valid
     */
    isValidGitHubUrl(url) {
        return /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+(\.git)?$/i.test(url);
    },
    
    /**
     * Generate a random string
     * @param {number} length - The length of the string to generate
     * @returns {string} The generated string
     */
    generateRandomString(length = 32) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    },
    
    /**
     * Format a timestamp as a human-readable string
     * @param {Date} date - The date to format
     * @returns {string} The formatted date
     */
    formatTimestamp(date) {
        return date.toLocaleTimeString();
    },
    
    /**
     * Format a duration in milliseconds as a human-readable string
     * @param {number} ms - The duration in milliseconds
     * @returns {string} The formatted duration
     */
    formatDuration(ms) {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        
        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
        
        return parts.join(' ');
    },
    
    /**
     * Format bytes as a human-readable string
     * @param {number} bytes - The number of bytes
     * @returns {string} The formatted size
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    /**
     * Check if a command is available in the system
     * @param {string} command - The command to check
     * @returns {Promise<boolean>} Whether the command is available
     */
    async isCommandAvailable(command) {
        // This is a simulation since we can't actually check the system
        const commonCommands = ['node', 'npm', 'python', 'pip', 'git'];
        return Promise.resolve(commonCommands.includes(command.toLowerCase()));
    },
    
    /**
     * Check system requirements for MCP installation
     * @param {Object} requirements - The requirements to check
     * @returns {Promise<Object>} The results of the checks
     */
    async checkSystemRequirements(requirements) {
        // Simulate system checks
        return new Promise(resolve => {
            setTimeout(() => {
                const results = {
                    node: true,
                    npm: true,
                    memory: Math.random() > 0.1, // 90% chance of success
                    disk: Math.random() > 0.1,   // 90% chance of success
                    os: true
                };
                
                resolve(results);
            }, 1000);
        });
    },
    
    /**
     * Parse and validate JSON
     * @param {string} jsonString - The JSON string to parse
     * @returns {Object|null} The parsed object or null if invalid
     */
    parseJSON(jsonString) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            return null;
        }
    },
    
    /**
     * Detect the operating system
     * @returns {string} The detected OS ('windows', 'macos', 'linux', or 'unknown')
     */
    detectOS() {
        const userAgent = window.navigator.userAgent;
        if (userAgent.indexOf('Windows') !== -1) return 'windows';
        if (userAgent.indexOf('Mac') !== -1) return 'macos';
        if (userAgent.indexOf('Linux') !== -1) return 'linux';
        return 'unknown';
    },
    
    /**
     * Get the default installation path based on the OS
     * @returns {string} The default installation path
     */
    getDefaultInstallPath() {
        const os = this.detectOS();
        switch (os) {
            case 'windows':
                return 'C:\\Program Files\\Claude Desktop MCP';
            case 'macos':
                return '/Applications/Claude Desktop MCP';
            case 'linux':
                return '/opt/claude-desktop-mcp';
            default:
                return './claude-desktop-mcp';
        }
    },
    
    /**
     * Check if a port is available
     * @param {number} port - The port to check
     * @returns {Promise<boolean>} Whether the port is available
     */
    async isPortAvailable(port) {
        // Simulate port check
        return new Promise(resolve => {
            setTimeout(() => {
                // 80% chance the port is available
                resolve(Math.random() > 0.2);
            }, 500);
        });
    },
    
    /**
     * Find an available port starting from the given port
     * @param {number} startPort - The port to start checking from
     * @returns {Promise<number>} An available port
     */
    async findAvailablePort(startPort) {
        let port = startPort;
        while (!(await this.isPortAvailable(port))) {
            port++;
        }
        return port;
    },
    
    /**
     * Create a deep copy of an object
     * @param {Object} obj - The object to copy
     * @returns {Object} The copied object
     */
    deepCopy(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    
    /**
     * Merge two objects deeply
     * @param {Object} target - The target object
     * @param {Object} source - The source object
     * @returns {Object} The merged object
     */
    deepMerge(target, source) {
        const output = { ...target };
        
        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this.isObject(source[key])) {
                    if (!(key in target)) {
                        Object.assign(output, { [key]: source[key] });
                    } else {
                        output[key] = this.deepMerge(target[key], source[key]);
                    }
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        
        return output;
    },
    
    /**
     * Check if a value is an object
     * @param {*} item - The value to check
     * @returns {boolean} Whether the value is an object
     */
    isObject(item) {
        return (item && typeof item === 'object' && !Array.isArray(item));
    },
    
    /**
     * Escape HTML special characters
     * @param {string} html - The HTML string to escape
     * @returns {string} The escaped string
     */
    escapeHTML(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    },
    
    /**
     * Debounce a function
     * @param {Function} func - The function to debounce
     * @param {number} wait - The debounce delay in milliseconds
     * @returns {Function} The debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
};