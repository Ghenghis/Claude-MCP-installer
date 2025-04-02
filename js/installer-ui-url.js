/**
 * Installer UI URL - Handles installation from URLs
 * Provides functionality for installing MCP servers from repository URLs
 */

/**
 * Install MCP servers from a URL
 * @param {string} repoUrl - The repository URL
 * @param {object} options - Installation options
 * @returns {Promise<void>} Promise that resolves when installation is complete
 */
async function installFromUrl(repoUrl, options = {}) {
    // Use the logger from utils module if available
    const logFn = window.InstallerUIUtils && window.InstallerUIUtils.logMessage ? 
        window.InstallerUIUtils.logMessage : 
        (msg, type) => console.log(`[${type}] ${msg}`);
        
    try {
        // Validate and normalize URL
        const validatedUrl = validateAndNormalizeUrl(repoUrl, logFn);
        
        // Determine installation path
        const installPath = determineInstallPath(options);
        
        // Determine installation method
        const methodId = window.InstallerUIUtils && window.InstallerUIUtils.determineMethodId ? 
            window.InstallerUIUtils.determineMethodId(options) : 
            'npx';
        
        // Log the installation parameters
        logFn(`Installing from ${validatedUrl} using ${methodId} method to ${installPath}`, 'info');
        
        // Construct installation command
        const command = window.InstallerUICommand && window.InstallerUICommand.constructInstallCommand ? 
            window.InstallerUICommand.constructInstallCommand(methodId, validatedUrl, installPath) : 
            `npm install ${validatedUrl}`;
        
        // Execute the installation command
        if (window.InstallerUICommand && window.InstallerUICommand.executeInstallCommand) {
            await window.InstallerUICommand.executeInstallCommand(command, installPath, logFn);
        } else {
            logFn(`Would execute: ${command} in ${installPath}`, 'info');
        }
        
        // Update Claude Desktop configuration
        if (window.InstallerUIConfig && window.InstallerUIConfig.updateClaudeConfig) {
            await window.InstallerUIConfig.updateClaudeConfig(validatedUrl, installPath, methodId);
        } else {
            logFn('Claude Desktop configuration update skipped (module not available)', 'warning');
        }
        
        logFn('Installation completed successfully!', 'success');
        return true;
    } catch (error) {
        if (window.InstallerUICommand && window.InstallerUICommand.handleInstallError) {
            window.InstallerUICommand.handleInstallError(error, repoUrl, logFn);
        } else {
            logFn(`Installation failed: ${error.message || error}`, 'error');
        }
        return false;
    }
}

/**
 * Validate and normalize GitHub URL
 * @param {string} repoUrl - Repository URL
 * @param {Function} log - Logging function
 * @returns {string} Validated and normalized URL
 */
function validateAndNormalizeUrl(repoUrl, log) {
    if (!repoUrl) {
        throw new Error('Repository URL is required');
    }
    
    // Normalize URL
    let normalizedUrl = repoUrl.trim();
    
    // Add https:// if not present
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
    }
    
    // Validate URL
    if (window.InstallerUIUtils && window.InstallerUIUtils.isValidGitHubUrl) {
        if (!window.InstallerUIUtils.isValidGitHubUrl(normalizedUrl)) {
            throw new Error('Invalid GitHub repository URL');
        }
    } else {
        // Basic validation if utils module not available
        if (!normalizedUrl.includes('github.com')) {
            log('URL does not appear to be a GitHub repository', 'warning');
        }
    }
    
    return normalizedUrl;
}

/**
 * Determine installation path
 * @param {Object} options - Installation options
 * @returns {string} Installation path
 */
function determineInstallPath(options) {
    // Use specified path if provided
    if (options.installPath) {
        return options.installPath;
    }
    
    // Otherwise use default path based on OS
    return window.InstallerUIUtils && window.InstallerUIUtils.getDefaultInstallPath ? 
        window.InstallerUIUtils.getDefaultInstallPath() : 
        '/opt/claude-desktop-mcp';
}

// Export functions for use in other modules
window.InstallerUIUrl = {
    installFromUrl,
    validateAndNormalizeUrl,
    determineInstallPath
};
