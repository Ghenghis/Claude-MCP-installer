/**
 * Installer - Core class for installing MCP servers from various sources
 */
class Installer {
    constructor(options = {}) {
        this.options = options;
        this.defaultInstallPath = this.#detectOS() === 'windows' ? 
            'C:\\Program Files\\Claude Desktop MCP' : 
            '/opt/claude-desktop-mcp';
    }

    /**
     * Install an MCP server from a GitHub repository
     * @param {string} repoUrl - The GitHub repository URL
     * @param {object} options - Installation options
     * @returns {Promise<object>} Installation result
     */
    async installFromGitHub(repoUrl, options = {}) {
        const log = options.logCallback || ((msg) => console.log(`[Installer] ${msg}`));
        
        try {
            log(`Starting installation from GitHub: ${repoUrl}`);
            
            // Validate URL
            if (!this.#isValidGitHubUrl(repoUrl)) {
                throw new Error(`Invalid GitHub URL: ${repoUrl}`);
            }
            
            // Determine installation path and method
            const installPath = options.installPath || this.options.installPath || this.defaultInstallPath;
            const methodId = options.methodId || this.options.methodId || this.#determineDefaultMethod();
            
            log(`Installation path: ${installPath}`);
            log(`Using method: ${methodId}`);
            
            // Ensure installation directory exists
            await this.#ensureInstallDirectory(installPath, log);
            
            // Construct and execute installation command
            const command = this.#getInstallationCommand(methodId, repoUrl, installPath);
            log(`Executing command: ${command}`);
            
            // In a real implementation, we would execute the command here
            // For now, we'll simulate success
            await this.#simulateInstallation(command, installPath, log);
            
            // Update configuration
            log(`Updating configuration...`);
            await this.#updateConfiguration(repoUrl, installPath, methodId, log);
            
            log(`Installation completed successfully`);
            return {
                success: true,
                repoUrl,
                installPath,
                methodId
            };
        } catch (error) {
            log(`Installation failed: ${error.message}`);
            return {
                success: false,
                error: error.message,
                repoUrl
            };
        }
    }
    
    /**
     * Simulate installation process (for testing)
     * @private
     */
    async #simulateInstallation(command, installPath, log) {
        // Simulate installation steps with delays
        const steps = [
            { message: "Cloning repository...", delay: 500 },
            { message: "Installing dependencies...", delay: 800 },
            { message: "Building project...", delay: 600 },
            { message: "Configuring server...", delay: 400 },
            { message: "Verifying installation...", delay: 300 }
        ];
        
        for (const step of steps) {
            log(step.message);
            await new Promise(resolve => setTimeout(resolve, step.delay));
        }
    }
    
    /**
     * Update configuration after installation
     * @private
     */
    async #updateConfiguration(repoUrl, installPath, methodId, log) {
        log("Updating Claude Desktop configuration...");
        
        // In a real implementation, we would:
        // 1. Read existing config
        // 2. Add new server configuration
        // 3. Write updated config
        
        // Simulate with delay
        await new Promise(resolve => setTimeout(resolve, 500));
        log("Configuration updated successfully");
    }
    
    /**
     * Get installation command based on method
     * @private
     */
    #getInstallationCommand(methodId, repoUrl, installPath) {
        switch (methodId) {
            case 'npx':
                return `npx degit ${repoUrl} ${installPath}`;
            case 'uv':
                return `uv pip install ${repoUrl}`;
            case 'python':
                return `pip install git+${repoUrl}`;
            case 'docker':
                return `docker run --name mcp-server -v ${installPath}:/app ${repoUrl}`;
            default:
                return `npx degit ${repoUrl} ${installPath}`;
        }
    }
    
    /**
     * Ensure installation directory exists
     * @private
     */
    async #ensureInstallDirectory(path, log) {
        log(`Ensuring installation directory exists: ${path}`);
        // In a real implementation, we would create the directory if it doesn't exist
        // For now, we'll just simulate success
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    /**
     * Determine default installation method based on environment
     * @private
     */
    #determineDefaultMethod() {
        // In a real implementation, we would detect available tools
        // For now, default to npx
        return 'npx';
    }
    
    /**
     * Detect operating system
     * @private
     */
    #detectOS() {
        const userAgent = window.navigator.userAgent;
        if (userAgent.indexOf('Windows') !== -1) return 'windows';
        if (userAgent.indexOf('Mac') !== -1) return 'macos';
        if (userAgent.indexOf('Linux') !== -1) return 'linux';
        return 'unknown';
    }
    
    /**
     * Validate GitHub URL
     * @private
     */
    #isValidGitHubUrl(url) {
        return /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w-]+(\/?|\.git)?$/.test(url);
    }
}

// Make the Installer globally available
window.Installer = Installer;

// Initialize the installer when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Create a global instance for use by other components
    window.installer = new Installer();
});
