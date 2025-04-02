/**
 * Installer GitHub - GitHub repository handling
 */

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
        const validatedUrl = validateGitHubUrl(repoUrl, log);
        if (!validatedUrl) {
            return false;
        }
        
        // Determine installation path
        const installPath = determineInstallPath(options);
        
        // Construct the installation command
        const command = constructInstallCommand(repoUrl, installPath, options);
        
        // Log the command
        log(`Executing: ${command}`, 'info');
        
        // Execute the command
        const success = await executeInstallCommand(command, log);
        
        // Return whether the installation was successful
        return success;
    } catch (error) {
        handleInstallError(error, repoUrl, log);
        return false;
    }
}

/**
 * Validate a GitHub repository URL
 * @param {string} url - The URL to validate
 * @param {Function} log - Logging function
 * @returns {string|null} The validated URL or null if invalid
 */
function validateGitHubUrl(url, log) {
    if (!url) {
        log('Repository URL is required', 'error');
        return null;
    }
    
    // Check if the URL is a GitHub URL
    if (!InstallerUtils.isValidGitHubUrl(url)) {
        log(`Invalid GitHub URL: ${url}`, 'error');
        return null;
    }
    
    // Normalize URL (remove trailing slash, .git, etc.)
    let normalizedUrl = url.trim();
    
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
    const installPath = options.installPath || 
                      (InstallerUtils.detectOS() === 'windows' ? 
                       'C:\\Program Files\\Claude Desktop MCP' : 
                       '/opt/claude-desktop-mcp');
    
    return installPath;
}

/**
 * Construct the installation command
 * @param {string} repoUrl - The repository URL
 * @param {string} installPath - The installation path
 * @param {Object} options - Installation options
 * @returns {string} The installation command
 */
function constructInstallCommand(repoUrl, installPath, options) {
    // Get the installation method
    const methodId = options.methodId || 'npx';
    
    // Get the template ID
    const templateId = options.templateId || 'basic-api';
    
    // Construct the command based on the method
    const commands = {
        npx: `npx @modelcontextprotocol/mcp-installer --repo=${repoUrl} --template=${templateId} --path="${installPath}"`,
        uv: `uv install @modelcontextprotocol/mcp --repo=${repoUrl} --template=${templateId} --path="${installPath}"`,
        python: `pip install modelcontextprotocol-mcp --repo=${repoUrl} --template=${templateId} --path="${installPath}"`
    };
    
    return commands[methodId] || commands.npx;
}

/**
 * Execute the installation command
 * @param {string} command - The command to execute
 * @param {Function} log - The logging function
 * @returns {Promise<boolean>} Whether the command execution was successful
 */
async function executeInstallCommand(command, log) {
    try {
        // In a real implementation, this would use runCommandAsync
        // For our simulation, we'll just log the steps
        log('Starting installation...', 'info');
        
        // Simulate command execution
        await simulateCommandExecution(log);
        
        // Log success
        log('Installation completed successfully', 'success');
        
        return true;
    } catch (error) {
        log(`Command execution failed: ${error.message}`, 'error');
        return false;
    }
}

/**
 * Simulate command execution
 * @param {Function} log - The logging function
 * @returns {Promise<void>} A promise that resolves when the simulation is complete
 */
async function simulateCommandExecution(log) {
    return new Promise(resolve => {
        // Simulate installation steps
        const steps = [
            'Cloning repository...',
            'Installing dependencies...',
            'Building server...',
            'Configuring server...',
            'Starting server...',
            'Verifying installation...'
        ];
        
        // Log each step with a delay
        steps.forEach((step, index) => {
            setTimeout(() => {
                log(step, 'info');
                
                // Resolve the promise after the last step
                if (index === steps.length - 1) {
                    resolve();
                }
            }, index * 1000);
        });
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

/**
 * Parse GitHub repository information from URL
 * @param {string} url - GitHub repository URL
 * @returns {Object|null} Repository information or null if invalid
 */
function parseRepositoryInfo(url) {
    try {
        // Validate URL
        if (!InstallerUtils.isValidGitHubUrl(url)) {
            return null;
        }
        
        // Parse URL
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        
        if (pathParts.length < 2) {
            return null;
        }
        
        return {
            owner: pathParts[0],
            repo: pathParts[1],
            branch: pathParts.length > 3 && pathParts[2] === 'tree' ? pathParts[3] : 'main',
            isValid: true
        };
    } catch (error) {
        return null;
    }
}

/**
 * Get repository metadata from GitHub API
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<Object|null>} Repository metadata or null if error
 */
async function getRepositoryMetadata(owner, repo) {
    try {
        // In a real implementation, this would fetch from GitHub API
        // For our simulation, we'll return mock data
        return {
            name: repo,
            owner: {
                login: owner
            },
            description: `MCP server for ${repo}`,
            stargazers_count: Math.floor(Math.random() * 1000),
            forks_count: Math.floor(Math.random() * 500),
            open_issues_count: Math.floor(Math.random() * 50),
            updated_at: new Date().toISOString(),
            license: {
                name: 'MIT'
            }
        };
    } catch (error) {
        InstallerLogger.logMessage(`Error fetching repository metadata: ${error.message}`, 'error');
        return null;
    }
}

// Export functions for use in other modules
window.InstallerGitHub = {
    installFromUrl,
    validateGitHubUrl,
    determineInstallPath,
    constructInstallCommand,
    executeInstallCommand,
    simulateCommandExecution,
    handleInstallError,
    parseRepositoryInfo,
    getRepositoryMetadata
};

// Make the function globally accessible if needed by other scripts
window.installFromUrl = installFromUrl;
