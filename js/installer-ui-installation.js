/**
 * Installer UI Installation - Installation process UI functionality
 * Handles the UI aspects of the installation process
 */

/**
 * Start the installation process
 */
function startInstallation(params) {
    // If params not provided, get them from the UI
    if (!params) {
        params = getInstallationParameters();
    }
    
    // Show UI elements for installation
    updateUIForInstallationStart();
    
    // Check prerequisites and continue installation
    checkPrerequisitesAndContinue(params);
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
    const progressElements = getProgressElements();
    
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
        methodName,
        progress
    };
    
    // Log installation start
    logInstallationStart(installParams.templateId);
    
    // Simulate installation command
    const installCommand = getInstallationCommand(methodId, repoUrl, installParams.templateId, installPath);
    logMessage(`Executing: ${installCommand}`, 'command');
    
    // Start progress simulation
    const interval = setInterval(() => {
        // Increment progress
        installContext.progress += 1;
        
        // Handle progress milestones
        handleProgressMilestone(installContext);
        
        // Update UI
        updateProgress(
            progressElements, 
            installContext.progress, 
            progressElements.progressStatus.textContent
        );
        
        // Complete installation when done
        if (installContext.progress >= 100) {
            completeInstallation(interval, progressElements);
        }
    }, 100);
}

/**
 * Handle progress milestones during installation
 * @param {Object} installContext - Installation context object
 */
function handleProgressMilestone(installContext) {
    const { progress } = installContext;
    
    // Handle different stages of installation
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
    } else {
        // Final stage - no specific updates needed
    }
}

/**
 * Handle early progress stage (0-20%)
 * @param {Object} installContext - Installation context object
 */
function handleEarlyProgressStage(installContext) {
    const { progress, progressElements } = installContext;
    
    if (progress === 10) {
        updateProgressStatus(progressElements, 'Downloading MCP server components...');
    } else if (progress === 15) {
        updateProgressStatus(progressElements, 'Preparing installation environment...');
    } else if (progress === 20) {
        updateProgressStatus(progressElements, 'Setting up directory structure...');
    }
}

/**
 * Handle mid progress stage (21-40%)
 * @param {Object} installContext - Installation context object
 */
function handleMidProgressStage(installContext) {
    const { progress, progressElements } = installContext;
    
    if (progress === 25) {
        updateProgressStatus(progressElements, 'Installing core MCP server components...');
    } else if (progress === 30) {
        updateProgressStatus(progressElements, 'Configuring server settings...');
    } else if (progress === 40) {
        updateProgressStatus(progressElements, 'Installing dependencies...');
    }
}

/**
 * Handle late progress stage (41-60%)
 * @param {Object} installContext - Installation context object
 */
function handleLateProgressStage(installContext) {
    const { progress, progressElements, methodId } = installContext;
    
    if (progress === 45) {
        updateProgressStatus(progressElements, 'Setting up server configuration...');
    } else if (progress === 50) {
        updateProgressStatus(progressElements, 'Installing MCP server modules...');
    } else if (progress === 55) {
        // Method-specific messages
        if (methodId === 'docker') {
            updateProgressStatus(progressElements, 'Building Docker containers...');
        } else if (methodId === 'python') {
            updateProgressStatus(progressElements, 'Setting up Python environment...');
        } else {
            updateProgressStatus(progressElements, 'Configuring Node.js environment...');
        }
    } else if (progress === 60) {
        updateProgressStatus(progressElements, 'Finalizing server installation...');
    }
}

/**
 * Handle final progress stage (61-80%)
 * @param {Object} installContext - Installation context object
 */
function handleFinalProgressStage(installContext) {
    const { progress, progressElements, repoUrl, installPath, methodId } = installContext;
    
    if (progress === 65) {
        updateProgressStatus(progressElements, 'Setting up server configuration...');
    } else if (progress === 70) {
        updateProgressStatus(progressElements, 'Updating Claude Desktop configuration...');
        installMcpServersAndUpdateConfig(installContext);
    } else if (progress === 80) {
        updateProgressStatus(progressElements, 'Verifying installation...');
    }
}

/**
 * Handle verification stage (81-90%)
 * @param {Object} installContext - Installation context object
 */
function handleVerificationStage(installContext) {
    const { progress, progressElements } = installContext;
    
    if (progress === 85) {
        updateProgressStatus(progressElements, 'Testing server connections...');
    } else if (progress === 90) {
        updateProgressStatus(progressElements, 'Finalizing installation...');
        
        // Verify configuration if possible
        if (window.InstallerUIConfigVerification && window.InstallerUIConfigVerification.verifyConfiguration) {
            window.InstallerUIConfigVerification.verifyConfiguration();
        }
    }
}

/**
 * Update progress status in the UI
 * @param {Object} progressElements - Progress UI elements
 * @param {string} statusText - Status text to display
 */
function updateProgressStatus(progressElements, statusText) {
    if (progressElements.progressStatus) {
        progressElements.progressStatus.textContent = statusText;
    }
    
    // Log status update
    logMessage(statusText, 'info');
}

/**
 * Install MCP servers and update Claude configuration
 * @param {Object} installContext - Installation context object
 */
function installMcpServersAndUpdateConfig(installContext) {
    const { repoUrl, installPath, methodId } = installContext;
    
    // Update Claude config
    updateClaudeConfigWithModules(repoUrl, installPath, methodId);
    
    // Log configuration file path
    logConfigurationFilePath(installContext);
}

/**
 * Update Claude config using appropriate module if available
 * @param {string} repoUrl - Repository URL
 * @param {string} installPath - Installation path
 * @param {string} methodId - Installation method ID
 */
function updateClaudeConfigWithModules(repoUrl, installPath, methodId) {
    // Use the config module if available
    if (window.InstallerUIConfig && window.InstallerUIConfig.updateClaudeConfig) {
        window.InstallerUIConfig.updateClaudeConfig(repoUrl, installPath, methodId);
    } else if (window.InstallerUI && window.InstallerUI.updateClaudeConfig) {
        window.InstallerUI.updateClaudeConfig(repoUrl, installPath, methodId);
    } else {
        logMessage('Configuration update simulated', 'info');
    }
}

/**
 * Log the configuration file path based on OS
 * @param {Object} installContext - Installation context object
 */
function logConfigurationFilePath(installContext) {
    const configPath = getConfigPathForOS();
    
    if (configPath) {
        logMessage(`Configuration updated at: ${configPath}`, 'info');
    }
}

/**
 * Get configuration file path based on OS
 * @returns {string|null} Configuration file path or null if not Windows
 */
function getConfigPathForOS() {
    if (checkIfWindows()) {
        return 'C:\\Users\\[username]\\AppData\\Roaming\\Claude\\claude_desktop_config.json';
    } else {
        // For non-Windows, we'd return the appropriate path
        return null;
    }
}

/**
 * Check if the current OS is Windows
 * @returns {boolean} True if Windows
 */
function checkIfWindows() {
    if (window.InstallerUIUtils && window.InstallerUIUtils.detectOS) {
        return window.InstallerUIUtils.detectOS() === 'windows';
    }
    
    return window.navigator.userAgent.indexOf('Windows') !== -1;
}

/**
 * Get progress UI elements
 * @returns {Object} Object containing progress UI elements
 */
function getProgressElements() {
    return {
        progressBar: document.getElementById('progress-bar'),
        progressPercent: document.getElementById('progress-percent'),
        progressStatus: document.getElementById('progress-status')
    };
}

/**
 * Log installation start messages
 * @param {string} templateId - The template ID
 */
function logInstallationStart(templateId) {
    logMessage('Starting installation...', 'info');
    logMessage(`Template: ${templateId}`, 'info');
    
    // Log additional information if available
    if (window.InstallerUIUtils && window.InstallerUIUtils.getSystemInfo) {
        const systemInfo = window.InstallerUIUtils.getSystemInfo();
        logMessage(`System: ${systemInfo.os} (${systemInfo.arch})`, 'info');
    }
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
    switch (methodId) {
        case 'npx':
            return `npx @modelcontextprotocol/installer --repo ${repoUrl} --template ${templateId} --path "${installPath}"`;
        case 'docker':
            return `docker run --rm -v "${installPath}:/app" modelcontextprotocol/installer --repo ${repoUrl} --template ${templateId}`;
        case 'python':
            return `python -m mcp_installer --repo ${repoUrl} --template ${templateId} --path "${installPath}"`;
        default:
            return `npx @modelcontextprotocol/installer --repo ${repoUrl} --template ${templateId} --path "${installPath}"`;
    }
}

/**
 * Update progress UI elements
 * @param {Object} elements - Progress UI elements
 * @param {number} progress - Current progress percentage
 * @param {string} status - Current status message
 */
function updateProgress(elements, progress, status) {
    // Update progress bar
    if (elements.progressBar) {
        elements.progressBar.style.width = `${progress}%`;
        elements.progressBar.setAttribute('aria-valuenow', progress);
    }
    
    // Update percentage text
    if (elements.progressPercent) {
        elements.progressPercent.textContent = `${progress}%`;
    }
    
    // Update status text if provided
    if (status && elements.progressStatus) {
        elements.progressStatus.textContent = status;
    }
}

/**
 * Complete the installation process
 * @param {number} interval - Interval ID for progress updates
 * @param {Object} progressElements - Progress UI elements
 */
function completeInstallation(interval, progressElements) {
    // Stop progress updates
    clearInterval(interval);
    
    // Update UI
    updateProgress(progressElements, 100, 'Installation complete!');
    
    // Show completion message
    logMessage('✅ Installation completed successfully!', 'success');
    
    // Show next steps
    logMessage('Next steps:', 'info');
    logMessage('1. Start Claude Desktop', 'info');
    logMessage('2. Open Settings > MCP Servers', 'info');
    logMessage('3. Verify installed servers are enabled', 'info');
    
    // Show restart button
    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
        restartBtn.style.display = 'block';
    }
    
    // Verify configuration
    verifyConfiguration();
}

/**
 * Verify the configuration was updated correctly
 */
function verifyConfiguration() {
    // Get Claude config path
    const configPath = getClaudeConfigPath();
    
    // Process verification
    if (configPath) {
        processConfigurationVerification(configPath);
    }
}

/**
 * Get the Claude configuration file path
 * @returns {string} Path to Claude configuration file
 */
function getClaudeConfigPath() {
    return window.InstallerUIConfigVerification && window.InstallerUIConfigVerification.getClaudeConfigPath ?
        window.InstallerUIConfigVerification.getClaudeConfigPath() :
        'C:\\Users\\[username]\\AppData\\Roaming\\Claude\\claude_desktop_config.json';
}

/**
 * Process configuration verification
 * @param {string} configPath - Path to configuration file
 */
function processConfigurationVerification(configPath) {
    // Use the config verification module if available
    if (window.InstallerUIConfigVerification && window.InstallerUIConfigVerification.verifyConfiguration) {
        window.InstallerUIConfigVerification.verifyConfiguration(configPath);
    } else {
        logMessage(`Configuration verification simulated for: ${configPath}`, 'info');
    }
}

/**
 * Log a message to the UI
 * @param {string} message - Message to log
 * @param {string} type - Message type (info, warning, error, success, command)
 */
function logMessage(message, type = 'info') {
    // Use the logger module if available
    if (window.InstallerUILogger && window.InstallerUILogger.logMessage) {
        window.InstallerUILogger.logMessage(message, type);
    } else {
        // Fallback to console
        switch (type) {
            case 'error':
                console.error(message);
                break;
            case 'warning':
                console.warn(message);
                break;
            case 'success':
                console.log(`%c${message}`, 'color: green; font-weight: bold');
                break;
            case 'command':
                console.log(`%c${message}`, 'color: blue; font-family: monospace');
                break;
            default:
                console.log(message);
        }
    }
}

/**
 * Detect operating system
 * @returns {string} Operating system ('windows', 'macos', 'linux', or 'unknown')
 */
function detectOS() {
    // Use the utils module if available
    if (window.InstallerUIUtils && window.InstallerUIUtils.detectOS) {
        return window.InstallerUIUtils.detectOS();
    }
    
    // Fallback detection
    const userAgent = window.navigator.userAgent;
    
    if (userAgent.indexOf('Windows') !== -1) return 'windows';
    if (userAgent.indexOf('Mac') !== -1) return 'macos';
    if (userAgent.indexOf('Linux') !== -1) return 'linux';
    
    return 'unknown';
}

// Export functions for use in other modules
window.InstallerUIInstallation = {
    startInstallation,
    getInstallationParameters,
    getRepositoryUrl,
    getInstallationPath,
    getSelectedTemplateInfo,
    getSelectedMethodInfo,
    updateUIForInstallationStart,
    checkPrerequisitesAndContinue,
    simulateInstallation,
    handleProgressMilestone,
    updateProgress,
    updateProgressStatus,
    completeInstallation,
    verifyConfiguration,
    logMessage,
    detectOS
};
