/**
 * AiInstallerUtils.js
 * Utility functions for the AI-assisted installation process
 */

class AiInstallerUtils {
    /**
     * Simulate a delay (for development/testing or UI transitions)
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>} Promise that resolves after the delay
     */
    simulateDelay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Check if running on Windows
     * @returns {boolean} True if running on Windows
     */
    isWindows() {
        return navigator.platform.indexOf('Win') > -1;
    }
    
    /**
     * Format a file path according to the current OS
     * @param {string} path - File path to format
     * @returns {string} Formatted file path
     */
    formatPath(path) {
        if (this.isWindows()) {
            // Ensure Windows-style paths
            return path.replace(/\//g, '\\');
        } else {
            // Ensure Unix-style paths
            return path.replace(/\\/g, '/');
        }
    }
    
    /**
     * Get the base name of a file path
     * @param {string} path - File path
     * @returns {string} Base name (file name without directory)
     */
    getBaseName(path) {
        const parts = path.split(/[\\/]/);
        return parts[parts.length - 1];
    }
    
    /**
     * Get the directory name of a file path
     * @param {string} path - File path
     * @returns {string} Directory name
     */
    getDirName(path) {
        const parts = path.split(/[\\/]/);
        parts.pop();
        return parts.join(this.isWindows() ? '\\' : '/');
    }
    
    /**
     * Join path segments
     * @param {...string} segments - Path segments to join
     * @returns {string} Joined path
     */
    joinPath(...segments) {
        const separator = this.isWindows() ? '\\' : '/';
        return segments.join(separator);
    }
    
    /**
     * Parse a repository URL to extract owner and repo name
     * @param {string} repoUrl - Repository URL
     * @returns {Object} Object with owner and repo properties
     */
    parseRepoUrl(repoUrl) {
        try {
            // Handle different URL formats
            let owner, repo;
            
            if (repoUrl.includes('github.com')) {
                // GitHub URL format
                const urlParts = repoUrl.split('/');
                const githubIndex = urlParts.findIndex(part => part === 'github.com');
                
                if (githubIndex !== -1 && githubIndex + 2 < urlParts.length) {
                    owner = urlParts[githubIndex + 1];
                    repo = urlParts[githubIndex + 2].replace('.git', '');
                }
            } else if (repoUrl.includes('@')) {
                // SSH URL format (git@github.com:owner/repo.git)
                const match = repoUrl.match(/[^:]+:([^\/]+)\/([^.]+)(?:\.git)?/);
                if (match && match.length >= 3) {
                    owner = match[1];
                    repo = match[2];
                }
            }
            
            return { owner, repo };
        } catch (error) {
            console.error('Error parsing repository URL:', error);
            return { owner: null, repo: null };
        }
    }
    
    /**
     * Generate a unique identifier
     * @returns {string} Unique identifier
     */
    generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
}

// Create a singleton instance
const aiInstallerUtils = new AiInstallerUtils();

// Export the singleton
export default aiInstallerUtils;
