/**
 * Installer UI Events - Event listeners and UI interaction handlers
 * This file is maintained for backward compatibility
 * New code should use the InstallerUIEvents module directly
 */

import installerUIEvents from './InstallerUIEvents.js';

/**
 * Add event listeners to UI elements
 */
function addEventListeners() {
    installerUIEvents.setupEventListeners();
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
        installBtn.addEventListener('click', startInstallation);
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
        template: getTemplateInfo(),
        method: getMethodInfo()
    };
}

/**
 * Get repository URL from the UI
 * @returns {string} Repository URL
 */
function getRepositoryUrl() {
    return document.getElementById('repoUrl')?.value || '';
}

/**
 * Get installation path from the UI
 * @returns {string} Installation path
 */
function getInstallationPath() {
    const path = document.getElementById('installPath')?.value || '';
    return path.trim();
}

/**
 * Get template information from the UI
 * @returns {Object} Template information
 */
function getTemplateInfo() {
    const selectedTemplate = document.querySelector('.template-card.selected');
    
    if (selectedTemplate) {
        return {
            id: selectedTemplate.dataset.templateId,
            name: selectedTemplate.querySelector('.template-name')?.textContent || ''
        };
    }
    
    return null;
}

/**
 * Get method information from the UI
 * @returns {Object} Method information
 */
function getMethodInfo() {
    const selectedMethod = document.querySelector('.method-option.selected');
    
    if (selectedMethod) {
        return {
            id: selectedMethod.dataset.methodId,
            name: selectedMethod.querySelector('.method-name')?.textContent || ''
        };
    }
    
    return null;
}

/**
 * Set default repository URL if empty
 */
function setDefaultRepoUrlIfEmpty() {
    const repoUrlInput = document.getElementById('repoUrl');
    if (repoUrlInput && !repoUrlInput.value) {
        repoUrlInput.value = 'https://github.com/modelcontextprotocol/servers';
    }
}

/**
 * Update UI elements when installation starts
 */
function updateUIForInstallationStart() {
    // Hide installation form
    const installForm = document.getElementById('installForm');
    if (installForm) {
        installForm.style.display = 'none';
    }
    
    // Show installation progress
    const installProgress = document.getElementById('installProgress');
    if (installProgress) {
        installProgress.style.display = 'block';
    }
}

/**
 * Check prerequisites for the selected installation method and continue installation
 * @param {Object} params - Installation parameters
 */
function checkPrerequisitesAndContinue(params) {
    // Get method ID
    const methodId = params.method?.id || '';
    
    // Check for prerequisites warning
    const warning = getPrerequisiteWarning(methodId);
    
    if (warning) {
        // Show warning and ask for confirmation
        if (confirm(`${warning}\n\nDo you want to continue anyway?`)) {
            // Continue with installation
            InstallerUIInstallation.performInstallation(params);
        } else {
            // Cancel installation
            updateUIForInstallationCancel();
        }
    } else {
        // No warning, continue with installation
        InstallerUIInstallation.performInstallation(params);
    }
}

/**
 * Get prerequisite warning message for the selected method
 * @param {string} methodId - The installation method ID
 * @returns {string|null} Warning message or null if no warning
 */
function getPrerequisiteWarning(methodId) {
    // Check method-specific prerequisites
    switch (methodId) {
        case 'git':
            return 'Git must be installed and available in your PATH.';
        case 'docker':
            return 'Docker must be installed and running.';
        case 'npm':
            return 'Node.js and npm must be installed.';
        default:
            return null;
    }
}

/**
 * Update UI elements when installation is cancelled
 */
function updateUIForInstallationCancel() {
    // Show installation form
    const installForm = document.getElementById('installForm');
    if (installForm) {
        installForm.style.display = 'block';
    }
    
    // Hide installation progress
    const installProgress = document.getElementById('installProgress');
    if (installProgress) {
        installProgress.style.display = 'none';
    }
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
    getRepositoryUrl,
    getInstallationPath,
    getTemplateInfo,
    getMethodInfo,
    setDefaultRepoUrlIfEmpty,
    updateUIForInstallationStart,
    checkPrerequisitesAndContinue,
    getPrerequisiteWarning,
    updateUIForInstallationCancel
};
