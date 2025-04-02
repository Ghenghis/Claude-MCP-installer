/**
 * Installer UI Events - Event listeners and UI interaction handlers
 */

/**
 * Add event listeners to UI elements
 */
function addEventListeners() {
    // Add listeners by category
    addUIControlListeners();
    addTemplateListeners();
    addNavigationListeners();
    addActionListeners();
}

/**
 * Add UI control listeners (mode toggle, etc.)
 */
function addUIControlListeners() {
    // Mode toggle
    addModeToggleListener();
}

/**
 * Add template-related listeners
 */
function addTemplateListeners() {
    // Template search
    addTemplateSearchListener();
    
    // Template cards
    addTemplateCardListeners();
}

/**
 * Add navigation-related listeners
 */
function addNavigationListeners() {
    // Method options
    addMethodOptionListeners();
    
    // Tab buttons
    addTabButtonListeners();
}

/**
 * Add action button listeners
 */
function addActionListeners() {
    // Action buttons
    addActionButtonListeners();
    
    // Generate secret button
    addGenerateSecretButtonListener();
    
    // Install button
    addInstallButtonListener();
    
    // Configuration buttons
    addConfigurationButtonListeners();
}

/**
 * Add mode toggle listener
 */
function addModeToggleListener() {
    const modeToggle = document.getElementById('modeToggle');
    if (modeToggle) {
        modeToggle.addEventListener('change', function() {
            InstallerUICore.toggleAdvancedMode(this.checked);
        });
    }
}

/**
 * Add template search listener
 */
function addTemplateSearchListener() {
    const templateSearch = document.getElementById('templateSearch');
    if (templateSearch) {
        templateSearch.addEventListener('input', function() {
            InstallerUITemplates.filterTemplates(this.value);
        });
    }
}

/**
 * Add template card listeners
 */
function addTemplateCardListeners() {
    const templateCards = document.querySelectorAll('.template-card');
    templateCards.forEach(card => {
        card.addEventListener('click', function() {
            InstallerUITemplates.selectTemplate(this);
        });
    });
}

/**
 * Add method option listeners
 */
function addMethodOptionListeners() {
    const methodOptions = document.querySelectorAll('.method-option');
    methodOptions.forEach(option => {
        option.addEventListener('click', function() {
            InstallerUITemplates.selectMethod(this);
        });
    });
}

/**
 * Add tab button listeners
 */
function addTabButtonListeners() {
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            InstallerUICore.switchTab(this);
        });
    });
}

/**
 * Add action button listeners
 */
function addActionButtonListeners() {
    // Generate secret button
    addGenerateSecretButtonListener();
    
    // Install button
    addInstallButtonListener();
    
    // Configuration buttons
    addConfigurationButtonListeners();
}

/**
 * Add generate secret button listener
 */
function addGenerateSecretButtonListener() {
    const generateSecretBtn = document.getElementById('generateSecretBtn');
    if (generateSecretBtn) {
        generateSecretBtn.addEventListener('click', InstallerUITemplates.generateSecret);
    }
}

/**
 * Add install button listener
 */
function addInstallButtonListener() {
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
        installBtn.addEventListener('click', InstallerUIInstallation.startInstallation);
    }
}

/**
 * Add configuration button listeners
 */
function addConfigurationButtonListeners() {
    // Verify button
    const verifyBtn = document.getElementById('verifyBtn');
    if (verifyBtn) {
        verifyBtn.addEventListener('click', ClaudeConfigManager.verifyJsonConfiguration);
    }
    
    // Backup button
    const backupBtn = document.getElementById('backupBtn');
    if (backupBtn) {
        backupBtn.addEventListener('click', ClaudeConfigManager.backupJsonConfiguration);
    }
    
    // Fix button
    const fixBtn = document.getElementById('fixBtn');
    if (fixBtn) {
        fixBtn.addEventListener('click', ClaudeConfigManager.fixJsonConfiguration);
    }
}

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
    return {
        repoUrl: getRepositoryUrl(),
        installPath: getInstallationPath(),
        ...getTemplateInfo(),
        ...getMethodInfo()
    };
}

/**
 * Get repository URL from the UI
 * @returns {string} Repository URL
 */
function getRepositoryUrl() {
    return document.getElementById('repoUrl')?.value || 'https://github.com/modelcontextprotocol/servers';
}

/**
 * Get installation path from the UI
 * @returns {string} Installation path
 */
function getInstallationPath() {
    return document.getElementById('installPath')?.value ||
           (InstallerUtils.detectOS() === 'windows' ? 'C:\\Program Files\\Claude Desktop MCP' : '/opt/claude-desktop-mcp');
}

/**
 * Get template information from the UI
 * @returns {Object} Template information
 */
function getTemplateInfo() {
    const selectedTemplate = document.querySelector('.template-card.selected');
    const templateName = InstallerUITemplates.getElementText(selectedTemplate, 'h3') || 
                         InstallerUITemplates.getElementText(selectedTemplate, '.template-title') || 
                         'Unknown template';
    const templateId = selectedTemplate?.dataset.template || 'basic-api';
    
    return { templateName, templateId };
}

/**
 * Get method information from the UI
 * @returns {Object} Method information
 */
function getMethodInfo() {
    const selectedMethod = document.querySelector('.method-option.selected');
    const methodName = InstallerUITemplates.getElementText(selectedMethod, 'h3') || 'Unknown method';
    const methodId = selectedMethod?.dataset.method || 'npx';
    
    return { methodName, methodId };
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
    // Extract only the needed parameters
    const { methodName, methodId } = params;
    
    // Get prerequisite warning based on method
    const prerequisiteWarning = getPrerequisiteWarning(methodId);
    
    if (prerequisiteWarning) {
        InstallerLogger.logMessage(`⚠️ PREREQUISITE CHECK for '${methodName}' method:`, 'warning');
        InstallerLogger.logMessage(`⚠️ ${prerequisiteWarning}`, 'warning');
        InstallerLogger.logMessage(`⚠️ Refer to WINDOWS_SETUP.md for installation help.`, 'warning');
        
        // Add a delay before proceeding to ensure the warning is noticed
        setTimeout(() => {
            // Start installation after delay
            InstallerUIProgress.simulateInstallation(params);
        }, 2000); // 2 second delay
    } else {
        // No prerequisites needed, start immediately
        InstallerUIProgress.simulateInstallation(params);
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

// Export functions for use in other modules
window.InstallerUIEvents = {
    addEventListeners,
    addModeToggleListener,
    addTemplateSearchListener,
    addTemplateCardListeners,
    addMethodOptionListeners,
    addTabButtonListeners,
    addActionButtonListeners,
    addGenerateSecretButtonListener,
    addInstallButtonListener,
    addConfigurationButtonListeners,
    startInstallation,
    getInstallationParameters,
    setDefaultRepoUrlIfEmpty,
    updateUIForInstallationStart,
    checkPrerequisitesAndContinue,
    getPrerequisiteWarning
};
