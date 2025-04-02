/**
 * Installer UI Progress - Progress tracking and milestone handling
 */

/**
 * Continue the installation process after prerequisite check
 * @param {Object} params - Installation parameters
 */
function simulateInstallation(params) {
    const { repoUrl, installPath, templateId, methodId } = params;
    
    // Initialize progress tracking
    const progressElements = getProgressElements();
    
    // Log installation start
    logInstallationStart(templateId);
    
    // Update initial progress
    updateProgress(progressElements, 5, 'Preparing installation...');
    
    // Get installation command
    const command = InstallerCommandBuilder.getInstallationCommand(methodId, repoUrl, templateId, installPath);
    InstallerLogger.logMessage(`Executing: ${command}`, 'info');
    
    // Start progress simulation
    simulateProgressUpdates(progressElements, methodId, repoUrl, installPath);
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
    InstallerLogger.logMessage(`${timestamp} System requirements verified`, 'info');
    InstallerLogger.logMessage(`${timestamp} Downloading template: ${templateId}`, 'info');
    InstallerLogger.logMessage(`${timestamp} Template downloaded`, 'info');
    InstallerLogger.logMessage(`${timestamp} Configuring installation...`, 'info');
    InstallerLogger.logMessage(`${timestamp} Configuration complete`, 'info');
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
    
    // Create an installation context object to pass around
    const installContext = {
        methodId,
        repoUrl,
        installPath,
        progressElements
    };
    
    const interval = setInterval(() => {
        progress += 5;
        
        updateProgress(progressElements, progress);
        
        // Handle progress milestones
        handleProgressMilestone(progress, installContext);
        
        // Check if installation is complete
        if (progress === 100) {
            completeInstallation(interval, progressElements);
        }
    }, 500);
}

/**
 * Handle progress milestone events
 * @param {number} progress - Current progress percentage
 * @param {Object} installContext - Installation context object
 */
function handleProgressMilestone(progress, installContext) {
    // Handle different progress milestones
    if (progress <= 20) {
        handleEarlyProgressStage(progress, installContext.progressElements);
    } else if (progress <= 40) {
        handleMidProgressStage(progress, installContext.progressElements);
    } else if (progress <= 60) {
        handleLateProgressStage(progress, installContext);
    } else if (progress <= 80) {
        handleFinalProgressStage(progress, installContext.progressElements);
    } else if (progress <= 90) {
        handleVerificationStage(progress, installContext.progressElements);
    }
}

/**
 * Handle early progress stage (0-20%)
 * @param {number} progress - Current progress percentage
 * @param {Object} progressElements - Progress UI elements
 */
function handleEarlyProgressStage(progress, progressElements) {
    if (progress === 20) {
        const { progressStatus } = progressElements;
        if (progressStatus) progressStatus.textContent = 'Downloading dependencies...';
        InstallerLogger.logMessage('Downloading dependencies...', 'info');
    }
}

/**
 * Handle mid progress stage (21-40%)
 * @param {number} progress - Current progress percentage
 * @param {Object} progressElements - Progress UI elements
 */
function handleMidProgressStage(progress, progressElements) {
    if (progress === 40) {
        const { progressStatus } = progressElements;
        if (progressStatus) progressStatus.textContent = 'Installing packages...';
        InstallerLogger.logMessage('Installing packages...', 'info');
    }
}

/**
 * Handle late progress stage (41-60%)
 * @param {number} progress - Current progress percentage
 * @param {Object} installContext - Installation context object
 */
function handleLateProgressStage(progress, installContext) {
    const { progressElements, methodId, repoUrl, installPath } = installContext;
    
    if (progress === 60) {
        updateProgress(progressElements, progress, 'Installing MCP servers...');
        InstallerLogger.logMessage('Installing MCP servers...', 'info');
        
        // Actually install the MCP servers
        InstallerCommandBuilder.installMcpServers(methodId);
        
        // Update Claude Desktop configuration file
        ClaudeConfigManager.updateClaudeConfig(repoUrl, installPath, methodId);
    }
}

/**
 * Handle final progress stage (61-80%)
 * @param {number} progress - Current progress percentage
 * @param {Object} progressElements - Progress UI elements
 */
function handleFinalProgressStage(progress, progressElements) {
    if (progress === 80) {
        const { progressStatus } = progressElements;
        if (progressStatus) progressStatus.textContent = 'Starting server...';
        InstallerLogger.logMessage('Starting server...', 'info');
    }
}

/**
 * Handle verification stage (81-90%)
 * @param {number} progress - Current progress percentage
 * @param {Object} progressElements - Progress UI elements
 */
function handleVerificationStage(progress, progressElements) {
    if (progress === 90) {
        const { progressStatus } = progressElements;
        if (progressStatus) progressStatus.textContent = 'Verifying configuration...';
        InstallerLogger.logMessage('Verifying configuration...', 'info');
        
        ClaudeConfigManager.verifyConfiguration();
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
    InstallerLogger.logMessage('Installation complete!', 'success');
    InstallerLogger.logMessage(`Successfully installed MCP server`, 'success');
    
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
 * Update the server status indicator
 * @param {string} status - The server status (running, stopped, error)
 */
function updateServerStatus(status) {
    const statusIndicator = document.getElementById('serverStatus');
    if (!statusIndicator) return;
    
    // Remove all status classes
    statusIndicator.classList.remove('running', 'stopped', 'error');
    
    // Add the appropriate status class
    statusIndicator.classList.add(status);
    
    // Update the status text
    const statusText = document.getElementById('serverStatusText');
    if (statusText) {
        statusText.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }
}

// Export functions for use in other modules
window.InstallerUIProgress = {
    simulateInstallation,
    getProgressElements,
    logInstallationStart,
    updateProgress,
    simulateProgressUpdates,
    handleProgressMilestone,
    handleEarlyProgressStage,
    handleMidProgressStage,
    handleLateProgressStage,
    handleFinalProgressStage,
    handleVerificationStage,
    completeInstallation,
    updateServerStatus
};
