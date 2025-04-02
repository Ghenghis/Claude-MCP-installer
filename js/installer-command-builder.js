/**
 * Installer Command Builder - Command construction and execution
 */

/**
 * Get installation command based on method
 * @param {string} methodId - The installation method ID
 * @param {string} repoUrl - The repository URL
 * @param {string} templateId - The template ID
 * @param {string} installPath - The installation path
 * @returns {string} The installation command
 */
function getInstallationCommand(methodId, repoUrl, templateId, installPath) {
    const commands = {
        npx: `npx @modelcontextprotocol/mcp-installer --repo=${repoUrl} --template=${templateId} --path="${installPath}"`,
        uv: `uv install @modelcontextprotocol/mcp --repo=${repoUrl} --template=${templateId} --path="${installPath}"`,
        python: `pip install modelcontextprotocol-mcp --repo=${repoUrl} --template=${templateId} --path="${installPath}"`
    };
    
    return commands[methodId] || commands.npx;
}

/**
 * Install MCP servers based on the selected method
 * @param {string} methodId - The installation method ID
 */
function installMcpServers(methodId) {
    try {
        // Get the appropriate installation command
        const command = getMcpInstallCommand(methodId);
        
        // Log the command
        InstallerLogger.logMessage(`Executing: ${command}`, 'info');
        
        // In a real implementation, this would execute the command
        // For our simulation, we'll just log the steps
        logInstallationSteps(methodId);
    } catch (error) {
        InstallerLogger.logMessage(`Error installing MCP servers: ${error.message}`, 'error');
    }
}

/**
 * Get the MCP installation command based on the method
 * @param {string} methodId - The installation method ID
 * @returns {string} The installation command
 */
function getMcpInstallCommand(methodId) {
    const commands = {
        npx: 'npx @modelcontextprotocol/mcp-installer --all',
        uv: 'uv install @modelcontextprotocol/mcp --all',
        python: 'pip install modelcontextprotocol-mcp --all'
    };
    
    return commands[methodId] || commands.npx;
}

/**
 * Log the installation steps
 * @param {string} methodId - The installation method ID
 */
function logInstallationSteps(methodId) {
    // Simulate installation steps
    const steps = [
        'Installing @modelcontextprotocol/server-github...',
        'Installing @modelcontextprotocol/server-redis...',
        'Installing @modelcontextprotocol/server-time...',
        'Installing @modelcontextprotocol/server-aws-kb-retrieval...',
        'Installing @modelcontextprotocol/server-everart...',
        'Installing @modelcontextprotocol/server-everything...',
        'Installing @modelcontextprotocol/server-gdrive...',
        'Installing @modelcontextprotocol/server-git...',
        'Installing @modelcontextprotocol/server-gitlab...',
        'Installing @modelcontextprotocol/server-google-maps...',
        'Installing @modelcontextprotocol/server-postgres...',
        'Installing @modelcontextprotocol/server-sentry...',
        'Installing @modelcontextprotocol/server-sequentialthinking...',
        'Installing @modelcontextprotocol/server-slack...',
        'Installing @modelcontextprotocol/server-sqlite...'
    ];
    
    // Log each step with a delay
    steps.forEach((step, index) => {
        setTimeout(() => {
            InstallerLogger.logMessage(step, 'info');
            
            // Log completion for each step
            setTimeout(() => {
                InstallerLogger.logMessage(`${step.replace('Installing', 'Installed')}`, 'success');
            }, 300);
        }, index * 600);
    });
}

/**
 * Install from a GitHub repository URL
 * @param {string} repoUrl - The repository URL
 * @param {Object} options - Installation options
 * @returns {Promise<boolean>} Whether the installation was successful
 */
async function installFromUrl(repoUrl, options = {}) {
    const log = options.logCallback || ((msg, level) => InstallerLogger.logMessage(`[InstallQueue] ${msg}`, level));
    
    try {
        // Validate the URL
        const validatedUrl = validateAndNormalizeUrl(repoUrl, log);
        if (!validatedUrl) {
            return false;
        }
        
        // Determine installation path
        const installPath = determineInstallPath(options);
        
        // Determine installation method
        const methodId = determineMethodId(options);
        
        // Construct the installation command
        const command = constructInstallCommand(methodId, validatedUrl);
        
        // Log the command
        log(`Executing: ${command}`, 'info');
        
        // Execute the command
        await executeInstallCommand(command, installPath);
        
        // Return success
        return true;
    } catch (error) {
        handleInstallError(error, repoUrl, log);
        return false;
    }
}

/**
 * Validate and normalize GitHub URL
 * @param {string} repoUrl - Repository URL
 * @param {Function} log - Logging function
 * @returns {string|null} Validated and normalized URL
 */
function validateAndNormalizeUrl(repoUrl, log) {
    if (!repoUrl) {
        log('Repository URL is required', 'error');
        return null;
    }
    
    // Check if the URL is a GitHub URL
    if (!InstallerUtils.isValidGitHubUrl(repoUrl)) {
        log(`Invalid GitHub URL: ${repoUrl}`, 'error');
        return null;
    }
    
    // Normalize URL (remove trailing slash, .git, etc.)
    let normalizedUrl = repoUrl.trim();
    
    // Remove .git extension if present
    normalizedUrl = normalizedUrl.replace(/\.git$/, '');
    
    // Remove trailing slash if present
    normalizedUrl = normalizedUrl.replace(/\/$/, '');
    
    return normalizedUrl;
}

/**
 * Determine installation path
 * @param {Object} options - Installation options
 * @returns {string} Installation path
 */
function determineInstallPath(options) {
    // Get the installation path from options or use default
    return options.installPath || 
           (InstallerUtils.detectOS() === 'windows' ? 
            'C:\\Program Files\\Claude Desktop MCP' : 
            '/opt/claude-desktop-mcp');
}

/**
 * Determine installation method
 * @param {Object} options - Installation options
 * @returns {string} Installation method ID
 */
function determineMethodId(options) {
    // Get the installation method from options or use default
    return options.methodId || 'npx';
}

/**
 * Construct installation command
 * @param {string} methodId - Installation method ID
 * @param {string} gitUrl - Git URL
 * @returns {string} Installation command
 */
function constructInstallCommand(methodId, gitUrl) {
    // Construct the command based on the method
    const commands = {
        npx: `npx @modelcontextprotocol/mcp-installer --repo=${gitUrl}`,
        uv: `uv install @modelcontextprotocol/mcp --repo=${gitUrl}`,
        python: `pip install modelcontextprotocol-mcp --repo=${gitUrl}`
    };
    
    return commands[methodId] || commands.npx;
}

/**
 * Execute installation command
 * @param {string} command - Installation command
 * @param {string} installPath - Installation path
 * @returns {Promise<void>} Promise that resolves when command completes
 */
async function executeInstallCommand(command, installPath) {
    // In a real implementation, this would use runCommandAsync
    // For our simulation, we'll just log the steps
    InstallerLogger.logMessage('Starting installation...', 'info');
    
    // Simulate command execution
    await new Promise(resolve => {
        setTimeout(() => {
            InstallerLogger.logMessage('Cloning repository...', 'info');
            setTimeout(() => {
                InstallerLogger.logMessage('Installing dependencies...', 'info');
                setTimeout(() => {
                    InstallerLogger.logMessage('Building server...', 'info');
                    setTimeout(() => {
                        InstallerLogger.logMessage('Configuring server...', 'info');
                        setTimeout(() => {
                            InstallerLogger.logMessage('Starting server...', 'info');
                            setTimeout(() => {
                                InstallerLogger.logMessage('Verifying installation...', 'info');
                                InstallerLogger.logMessage('Installation completed successfully', 'success');
                                resolve();
                            }, 1000);
                        }, 1000);
                    }, 1000);
                }, 1000);
            }, 1000);
        }, 1000);
    });
}

/**
 * Handle installation error
 * @param {Error} error - Error object
 * @param {string} repoUrl - Repository URL
 * @param {Function} log - Logging function
 */
function handleInstallError(error, repoUrl, log) {
    log(`Installation failed for ${repoUrl}: ${error.message}`, 'error');
    
    // Provide more specific error messages based on error type
    if (error.message.includes('network')) {
        log('Network error: Check your internet connection', 'error');
    } else if (error.message.includes('permission')) {
        log('Permission error: Try running with administrator privileges', 'error');
    } else if (error.message.includes('not found')) {
        log('Repository not found: Check the URL and try again', 'error');
    }
}

// Export functions for use in other modules
window.InstallerCommandBuilder = {
    getInstallationCommand,
    installMcpServers,
    getMcpInstallCommand,
    logInstallationSteps,
    installFromUrl,
    validateAndNormalizeUrl,
    determineInstallPath,
    determineMethodId,
    constructInstallCommand,
    executeInstallCommand,
    handleInstallError
};

// Make installFromUrl globally accessible if needed by other scripts
window.installFromUrl = installFromUrl;
