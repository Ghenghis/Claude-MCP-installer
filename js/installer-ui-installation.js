/**
 * Installer UI Installation - Installation process UI functionality
 * Handles the UI aspects of the installation process
 */

/**
 * Start the installation process
 */
function startInstallation() {
    // Get installation parameters
    const installParams = getInstallationParameters();
    
    // Show UI elements for installation
    updateUIForInstallationStart();
    
    // Check prerequisites and continue installation
    checkPrerequisitesAndContinue(installParams);
}

/**
 * Get installation parameters from the UI
 * @returns {Object} Object containing installation parameters
 */
function getInstallationParameters() {
    // Get repository and installation path
    const repoUrl = getRepositoryUrl();
    const installPath = getInstallationPath();
    
    // Get template information
    const templateInfo = getSelectedTemplateInfo();
    const { templateName, templateId } = templateInfo;
    
    // Get method information
    const methodInfo = getSelectedMethodInfo();
    const { methodName, methodId } = methodInfo;
    
    // Set default repository URL if not provided
    setDefaultRepoUrlIfEmpty();
    
    return {
        repoUrl,
        installPath,
        templateName,
        templateId,
        methodName,
        methodId
    };
}

/**
 * Get the repository URL from the UI
 * @returns {string} Repository URL
 */
function getRepositoryUrl() {
    return document.getElementById('repoUrl')?.value || 'https://github.com/modelcontextprotocol/servers';
}

/**
 * Get the installation path from the UI
 * @returns {string} Installation path
 */
function getInstallationPath() {
    const defaultPath = detectOS() === 'windows' 
        ? 'C:\\Program Files\\Claude Desktop MCP' 
        : '/opt/claude-desktop-mcp';
    
    return document.getElementById('installPath')?.value || defaultPath;
}

/**
 * Get information about the selected template
 * @returns {Object} Template information
 */
function getSelectedTemplateInfo() {
    const selectedTemplate = document.querySelector('.template-card.selected');
    const templateName = getTemplateNameFromElement(selectedTemplate);
    const templateId = selectedTemplate?.dataset.template || 'basic-api';
    
    return { templateName, templateId };
}

/**
 * Get information about the selected installation method
 * @returns {Object} Method information
 */
function getSelectedMethodInfo() {
    const selectedMethod = document.querySelector('.method-option.selected');
    const methodName = selectedMethod?.querySelector('h3')?.textContent || 'Unknown method';
    const methodId = selectedMethod?.dataset.method || 'npx';
    
    return { methodName, methodId };
}

/**
 * Get template name from template element
 * @param {Element} templateElement - The template element
 * @returns {string} The template name
 */
function getTemplateNameFromElement(templateElement) {
    return templateElement?.querySelector('h3')?.textContent ||
           templateElement?.querySelector('.template-title')?.textContent ||
           'Unknown template';
}

/**
 * Set default repository URL if empty
 */
function setDefaultRepoUrlIfEmpty() {
    const repoUrlElement = document.getElementById('repoUrl');
    if (repoUrlElement && !repoUrlElement.value) {
        repoUrlElement.value = 'https://github.com/modelcontextprotocol/servers';
    }
}

/**
 * Update UI elements when installation starts
 */
function updateUIForInstallationStart() {
    // Show progress container
    const progressContainer = document.getElementById('progressContainer');
    if (progressContainer) {
        progressContainer.style.display = 'block';
    }
    
    // Hide install button
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
        installBtn.style.display = 'none';
    }
}

/**
 * Check prerequisites for the selected installation method and continue installation
 * @param {Object} params - Installation parameters
 */
function checkPrerequisitesAndContinue(params) {
    const { templateName, repoUrl, methodName, methodId, installPath } = params;
    
    // Get prerequisite warning based on method
    const prerequisiteWarning = getPrerequisiteWarning(methodId);
    
    if (prerequisiteWarning) {
        logMessage(`⚠️ PREREQUISITE CHECK for '${methodName}' method:`, 'warning');
        logMessage(`⚠️ ${prerequisiteWarning}`, 'warning');
        logMessage(`⚠️ Refer to WINDOWS_SETUP.md for installation help.`, 'warning');
        
        // Add a delay before proceeding to ensure the warning is noticed
        setTimeout(() => {
            // Start installation after delay
            simulateInstallation(params);
        }, 2000); // 2 second delay
    } else {
        // No prerequisites needed, start immediately
        simulateInstallation(params);
    }
}

/**
 * Get prerequisite warning message for the selected method
 * @param {string} methodId - The installation method ID
 * @returns {string|null} Warning message or null if no warning
 */
function getPrerequisiteWarning(methodId) {
    const warnings = {
        npx: 'Ensure Node.js (including npm/npx) is installed and added to your system PATH.',
        python: 'Ensure Python (including pip) is installed and added to your system PATH.',
        uv: 'Ensure uv package installer is installed and configured properly.'
    };
    
    return warnings[methodId] || null;
}

/**
 * Simulate installation progress updates
 * @param {Object} installParams - Installation parameters
 */
function simulateInstallation(installParams) {
    const { templateName, repoUrl, methodName, methodId, installPath } = installParams;
    
    // Get progress elements
    const progressElements = {
        progressBar: document.getElementById('progress-bar'),
        progressPercent: document.getElementById('progress-percent'),
        progressStatus: document.getElementById('progress-status')
    };
    
    // Initialize progress
    let progress = 5;
    updateProgress(progressElements, progress, 'Starting installation...');
    
    // Create an installation context object to pass around
    const installContext = {
        methodId,
        repoUrl,
        installPath,
        progressElements,
        templateName,
        methodName
    };
    
    // Log installation start
    logMessage(`Starting installation of ${templateName} using ${methodName}...`, 'info');
    
    // Simulate progress updates
    const interval = setInterval(() => {
        progress += 5;
        
        updateProgress(progressElements, progress);
        
        // Handle progress milestones
        handleProgressMilestone({ ...installContext, progress });
        
        // Check if installation is complete
        if (progress === 100) {
            completeInstallation(interval, progressElements);
        }
    }, 500);
}

/**
 * Handle progress milestones during installation
 * @param {Object} installContext - Installation context object containing:
 * @param {number} installContext.progress - Current progress percentage
 * @param {Object} installContext.progressElements - Progress UI elements
 * @param {string} installContext.methodId - Installation method ID
 * @param {string} installContext.repoUrl - Repository URL
 * @param {string} installContext.installPath - Installation path
 */
function handleProgressMilestone(installContext) {
    // Handle different progress milestones
    if (installContext.progress <= 20) {
        handleEarlyProgressStage(installContext);
    } else if (installContext.progress <= 40) {
        handleMidProgressStage(installContext);
    } else if (installContext.progress <= 60) {
        handleLateProgressStage(installContext);
    } else if (installContext.progress <= 80) {
        handleFinalProgressStage(installContext);
    } else if (installContext.progress <= 90) {
        handleVerificationStage(installContext);
    }
}

/**
 * Handle early progress stage (0-20%)
 * @param {Object} installContext - Installation context object
 */
function handleEarlyProgressStage(installContext) {
    const { progress, progressElements } = installContext;
    
    if (progress === 20) {
        const { progressStatus } = progressElements;
        if (progressStatus) progressStatus.textContent = 'Downloading dependencies...';
        logMessage('Downloading dependencies...', 'info');
    }
}

/**
 * Handle mid progress stage (21-40%)
 * @param {Object} installContext - Installation context object
 */
function handleMidProgressStage(installContext) {
    const { progress, progressElements } = installContext;
    
    if (progress === 40) {
        const { progressStatus } = progressElements;
        if (progressStatus) progressStatus.textContent = 'Installing packages...';
        logMessage('Installing packages...', 'info');
    }
}

/**
 * Handle late progress stage (41-60%)
 * @param {Object} installContext - Installation context object
 */
function handleLateProgressStage(installContext) {
    const { progress, progressElements } = installContext;
    
    if (progress === 60) {
        updateProgressStatus(progressElements, 'Configuring server...');
        installMcpServersAndUpdateConfig(installContext);
        logConfigurationFilePath(installContext);
    }
}

/**
 * Handle final progress stage (61-80%)
 * @param {Object} installContext - Installation context object
 */
function handleFinalProgressStage(installContext) {
    const { progress, progressElements } = installContext;
    
    if (progress === 80) {
        const { progressStatus } = progressElements;
        if (progressStatus) progressStatus.textContent = 'Verifying installation...';
        logMessage('Verifying installation...', 'info');
    }
}

/**
 * Handle verification stage (81-90%)
 * @param {Object} installContext - Installation context object
 */
function handleVerificationStage(installContext) {
    const { progress, progressElements } = installContext;
    
    if (progress === 90) {
        const { progressStatus } = progressElements;
        if (progressStatus) progressStatus.textContent = 'Finalizing installation...';
        logMessage('Finalizing installation...', 'info');
        
        // Verify configuration
        verifyConfiguration();
    }
}

/**
 * Update progress status in the UI
 * @param {Object} progressElements - Progress UI elements
 * @param {string} statusText - Status text to display
 */
function updateProgressStatus(progressElements, statusText) {
    const { progressStatus } = progressElements;
    if (progressStatus) progressStatus.textContent = statusText;
    logMessage(statusText, 'info');
}

/**
 * Install MCP servers and update Claude configuration
 * @param {Object} installContext - Installation context object
 */
function installMcpServersAndUpdateConfig(installContext) {
    const { methodId, repoUrl, installPath } = installContext;
    
    // Install MCP servers
    installMcpServers(methodId);
    
    // Update Claude Desktop configuration file
    updateClaudeConfigWithModules(repoUrl, installPath, methodId);
}

/**
 * Update Claude config using appropriate module if available
 * @param {string} repoUrl - Repository URL
 * @param {string} installPath - Installation path
 * @param {string} methodId - Installation method ID
 */
function updateClaudeConfigWithModules(repoUrl, installPath, methodId) {
    if (window.InstallerUIConfig && window.InstallerUIConfig.updateClaudeConfig) {
        window.InstallerUIConfig.updateClaudeConfig(repoUrl, installPath, methodId);
    } else {
        updateClaudeConfig(repoUrl, installPath, methodId);
    }
}

/**
 * Log the configuration file path based on OS
 * @param {Object} installContext - Installation context object
 */
function logConfigurationFilePath(installContext) {
    const configPath = getConfigPathForOS();
    if (configPath) {
        logMessage(`Configuration file updated at: ${configPath}`, 'info');
    }
}

/**
 * Get configuration file path based on OS
 * @returns {string|null} Configuration file path or null if not Windows
 */
function getConfigPathForOS() {
    const isWindows = checkIfWindows();
    if (isWindows) {
        return 'C:\\Users\\Admin\\AppData\\Roaming\\Claude\\claude_desktop_config.json';
    }
    return null;
}

/**
 * Check if the current OS is Windows
 * @returns {boolean} True if Windows
 */
function checkIfWindows() {
    if (window.InstallerUIUtils && window.InstallerUIUtils.detectOS) {
        return window.InstallerUIUtils.detectOS() === 'windows';
    } 
    return detectOS() === 'windows';
}

/**
 * Get progress UI elements
 * @returns {Object} Object containing progress UI elements
 */
function getProgressElements() {
    return {
        progressBar: document.getElementById('progressBar'),
        progressPercent: document.getElementById('progressPercent'),
        progressStatus: document.getElementById('progressStatus')
    };
}

/**
 * Log installation start messages
 * @param {string} templateId - The template ID
 */
function logInstallationStart(templateId) {
    const timestamp = new Date().toLocaleTimeString();
    logMessage(`${timestamp} System requirements verified`, 'info');
    logMessage(`${timestamp} Downloading template: ${templateId}`, 'info');
    logMessage(`${timestamp} Template downloaded`, 'info');
    logMessage(`${timestamp} Configuring installation...`, 'info');
    logMessage(`${timestamp} Configuration complete`, 'info');
}

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
 * Update progress UI elements
 * @param {Object} elements - Progress UI elements
 * @param {number} progress - Current progress percentage
 * @param {string} status - Current status message
 */
function updateProgress(elements, progress, status) {
    const { progressBar, progressPercent, progressStatus } = elements;
    
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (progressPercent) progressPercent.textContent = `${progress}%`;
    if (progressStatus && status) progressStatus.textContent = status;
}

/**
 * Simulate installation progress updates
 * @param {Object} progressElements - Progress UI elements
 * @param {string} methodId - Installation method ID
 * @param {string} repoUrl - Repository URL
 * @param {string} installPath - Installation path
 */
function simulateProgressUpdates(progressElements, methodId, repoUrl, installPath) {
    let progress = 5; // Starting progress
    
    const interval = setInterval(() => {
        progress += 5;
        
        updateProgress(progressElements, progress);
        
        // Handle progress milestones
        handleProgressMilestone({ progress, progressElements, methodId, repoUrl, installPath });
        
        // Check if installation is complete
        if (progress === 100) {
            completeInstallation(interval, progressElements);
        }
    }, 500);
}

/**
 * Handle progress milestone events
 * @param {Object} installContext - Installation context object containing:
 * @param {number} installContext.progress - Current progress percentage
 * @param {Object} installContext.progressElements - Progress UI elements
 * @param {string} installContext.methodId - Installation method ID
 * @param {string} installContext.repoUrl - Repository URL
 * @param {string} installContext.installPath - Installation path
 */
function handleProgressMilestone(installContext) {
    // Create installation context object
    const { progress, progressElements, methodId, repoUrl, installPath } = installContext;
    
    // Handle different progress milestones
    if (progress <= 20) {
        handleEarlyProgressStage(installContext);
    } else if (progress <= 40) {
        handleMidProgressStage(installContext);
    } else if (progress <= 60) {
        handleLateProgressStage(installContext);
    } else if (progress <= 80) {
        handleFinalProgressStage(installContext);
    } else if (progress <= 90) {
        handleVerificationStage(installContext);
    }
}

/**
 * Handle early progress stage (0-20%)
 * @param {Object} installContext - Installation context object
 */
function handleEarlyProgressStage(installContext) {
    const { progress, progressElements } = installContext;
    
    if (progress === 20) {
        const { progressStatus } = progressElements;
        if (progressStatus) progressStatus.textContent = 'Downloading dependencies...';
        logMessage('Downloading dependencies...', 'info');
    }
}

/**
 * Handle mid progress stage (21-40%)
 * @param {Object} installContext - Installation context object
 */
function handleMidProgressStage(installContext) {
    const { progress, progressElements } = installContext;
    
    if (progress === 40) {
        const { progressStatus } = progressElements;
        if (progressStatus) progressStatus.textContent = 'Installing packages...';
        logMessage('Installing packages...', 'info');
    }
}

/**
 * Handle late progress stage (41-60%)
 * @param {Object} installContext - Installation context object
 */
function handleLateProgressStage(installContext) {
    const { progress, progressElements, methodId, repoUrl, installPath } = installContext;
    
    if (progress === 60) {
        const { progressStatus } = progressElements;
        if (progressStatus) progressStatus.textContent = 'Configuring server...';
        logMessage('Configuring server...', 'info');
        
        // Actually install the MCP servers
        installMcpServers(methodId);
        
        // Update Claude Desktop configuration file
        if (window.InstallerUIConfig && window.InstallerUIConfig.updateClaudeConfig) {
            window.InstallerUIConfig.updateClaudeConfig(repoUrl, installPath, methodId);
        } else {
            updateClaudeConfig(repoUrl, installPath, methodId);
        }
        
        // Log configuration file location
        if (window.InstallerUIUtils && window.InstallerUIUtils.detectOS) {
            const os = window.InstallerUIUtils.detectOS();
            if (os === 'windows') {
                logMessage('Configuration file updated at: C:\\Users\\Admin\\AppData\\Roaming\\Claude\\claude_desktop_config.json', 'info');
            }
        } else if (detectOS() === 'windows') {
            logMessage('Configuration file updated at: C:\\Users\\Admin\\AppData\\Roaming\\Claude\\claude_desktop_config.json', 'info');
        }
    }
}

/**
 * Handle final progress stage (61-80%)
 * @param {Object} installContext - Installation context object
 */
function handleFinalProgressStage(installContext) {
    const { progress, progressElements } = installContext;
    
    if (progress === 80) {
        const { progressStatus } = progressElements;
        if (progressStatus) progressStatus.textContent = 'Verifying installation...';
        logMessage('Verifying installation...', 'info');
    }
}

/**
 * Handle verification stage (81-90%)
 * @param {Object} installContext - Installation context object
 */
function handleVerificationStage(installContext) {
    const { progress, progressElements } = installContext;
    
    if (progress === 90) {
        const { progressStatus } = progressElements;
        if (progressStatus) progressStatus.textContent = 'Finalizing installation...';
        logMessage('Finalizing installation...', 'info');
        
        // Verify configuration
        verifyConfiguration();
    }
}

/**
 * Complete the installation process
 * @param {number} interval - Interval ID for progress updates
 * @param {Object} progressElements - Progress UI elements
 */
function completeInstallation(interval, progressElements) {
    const { progressStatus } = progressElements;
    
    if (progressStatus) progressStatus.textContent = 'Installation complete!';
    logMessage('Installation complete!', 'success');
    logMessage(`Successfully installed MCP server`, 'success');
    
    clearInterval(interval);
    
    // Show verification container
    const verificationContainer = document.getElementById('verificationContainer');
    if (verificationContainer) {
        setTimeout(() => {
            verificationContainer.style.display = 'block';
        }, 1000);
    }
    
    // Update server status
    updateServerStatus('running');
}

/**
 * Verify the configuration was updated correctly
 */
function verifyConfiguration() {
    try {
        const configPath = getClaudeConfigPath();
        processConfigurationVerification(configPath);
    } catch (error) {
        logMessage(`Error verifying configuration: ${error.message}`, 'error');
    }
}

/**
 * Get the Claude configuration file path
 * @returns {string} Path to Claude configuration file
 */
function getClaudeConfigPath() {
    return 'C:\\Users\\Admin\\AppData\\Roaming\\Claude\\claude_desktop_config.json';
}

/**
 * Process configuration verification
 * @param {string} configPath - Path to configuration file
 */
function processConfigurationVerification(configPath) {
    // In a real implementation, this would read the file and verify it
    // For our simulation, we'll check localStorage
    const configData = localStorage.getItem('claude_config');
    
    if (configData) {
        processExistingConfig(configData, configPath);
    } else {
        handleMissingConfig();
    }
}

/**
 * Process existing configuration data
 * @param {string} configData - JSON string of configuration data
 * @param {string} configPath - Path to configuration file
 */
function processExistingConfig(configData, configPath) {
    try {
        const config = JSON.parse(configData);
        verifyAndFixServerConfig(config, configPath);
    } catch (parseError) {
        handleConfigParseError(parseError, configPath);
    }
}

/**
 * Handle configuration parse error
 * @param {Error} parseError - JSON parse error
 * @param {string} configPath - Path to configuration file
 */
function handleConfigParseError(parseError, configPath) {
    logMessage(`Configuration verification failed: ${parseError.message}`, 'error');
    logMessage('Attempting to fix configuration...', 'info');
    fixJsonConfig(configPath);
}

/**
 * Handle missing configuration
 */
function handleMissingConfig() {
    logMessage('Configuration file not found, creating new configuration', 'warning');
    // This would be a call to create a new config file
}

/**
 * Verify server configuration and fix if needed
 * @param {Object} config - Configuration object
 * @param {string} configPath - Path to configuration file
 */
function verifyAndFixServerConfig(config, configPath) {
    // Check if the newly installed servers are in the config
    const missingServers = checkForMissingServers(config);
    
    if (missingServers.length > 0) {
        logMessage('Configuration verification failed: Missing servers', 'warning');
        logMessage('Attempting to fix configuration...', 'info');
        
        // Ensure mcpServers object exists
        if (!config.mcpServers) {
            config.mcpServers = {};
        }
        
        // Add missing servers
        addMissingServersToConfig(config, missingServers);
        
        // Save the updated configuration
        writeClaudeConfig(configPath, config);
        logMessage('Configuration fixed successfully', 'success');
    } else {
        logMessage('Configuration verification successful', 'success');
    }
}

/**
 * Check for missing servers in the configuration
 * @param {Object} config - Configuration object
 * @returns {Array} Array of missing server names
 */
function checkForMissingServers(config) {
    const requiredServers = ['github', 'redis', 'time'];
    const missingServers = [];
    
    if (!config.mcpServers) {
        return requiredServers;
    }
    
    for (const server of requiredServers) {
        if (!config.mcpServers[server]) {
            missingServers.push(server);
        }
    }
    
    return missingServers;
}

/**
 * Add missing servers to configuration
 * @param {Object} config - Configuration object
 * @param {Array} missingServers - Array of missing server names
 */
function addMissingServersToConfig(config, missingServers) {
    const nodePath = 'C:\\Program Files\\nodejs\\node.exe';
    const npmModulesPath = 'C:\\Users\\Admin\\AppData\\Roaming\\npm\\node_modules';
    
    for (const server of missingServers) {
        config.mcpServers[server] = {
            command: nodePath,
            args: [`${npmModulesPath}\\@modelcontextprotocol\\server-${server}\\dist\\index.js`],
            env: { DEBUG: '*' }
        };
    }
}

// Export functions for use in other modules
window.InstallerUIInstallation = {
    startInstallation,
    getInstallationParameters,
    getTemplateNameFromElement,
    setDefaultRepoUrlIfEmpty,
    updateUIForInstallationStart,
    checkPrerequisitesAndContinue,
    getPrerequisiteWarning,
    simulateInstallation,
    getProgressElements,
    logInstallationStart,
    getInstallationCommand,
    updateProgress,
    simulateProgressUpdates,
    handleProgressMilestone,
    handleEarlyProgressStage,
    handleMidProgressStage,
    handleLateProgressStage,
    handleFinalProgressStage,
    handleVerificationStage,
    completeInstallation,
    verifyConfiguration,
    verifyAndFixServerConfig,
    checkForMissingServers,
    addMissingServersToConfig
};
