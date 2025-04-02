/**
 * Installer UI Display - UI display and state management
 * Handles showing/hiding UI elements and managing display state
 */

/**
 * Show the installation UI
 */
function showInstallationUI() {
    // Hide setup UI
    const setupContainer = document.getElementById('setupContainer');
    if (setupContainer) {
        setupContainer.style.display = 'none';
    }
    
    // Show installation UI
    const installationContainer = document.getElementById('installationContainer');
    if (installationContainer) {
        installationContainer.style.display = 'block';
    }
    
    // Log UI change
    if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
        window.InstallerUIUtils.logMessage('Showing installation UI', 'info');
    } else {
        console.log('Showing installation UI');
    }
}

/**
 * Show requirements not met message
 * @param {Array} missingRequirements - List of missing requirements
 */
function showRequirementsNotMet(missingRequirements) {
    // Show error
    if (window.InstallerUIValidation && window.InstallerUIValidation.showError) {
        window.InstallerUIValidation.showError(`System requirements not met: ${missingRequirements.join(', ')}`);
    } else {
        showError(`System requirements not met: ${missingRequirements.join(', ')}`);
    }
    
    // Show setup UI again
    const setupContainer = document.getElementById('setupContainer');
    if (setupContainer) {
        setupContainer.style.display = 'block';
    }
    
    // Hide installation UI
    const installationContainer = document.getElementById('installationContainer');
    if (installationContainer) {
        installationContainer.style.display = 'none';
    }
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
    // Show error in UI
    const errorElement = document.getElementById('errorMessage');
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    
    // Log error
    if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
        window.InstallerUIUtils.logMessage(message, 'error');
    } else {
        console.error(message);
    }
}

/**
 * Update UI based on selected installation method
 * @param {string} methodId - The selected installation method ID
 */
function updateUIForMethod(methodId) {
    // Get UI elements
    const dockerOptions = document.getElementById('dockerOptions');
    const localOptions = document.getElementById('localOptions');
    const npxOptions = document.getElementById('npxOptions');
    
    // Hide all options first
    hideAllMethodOptions(dockerOptions, localOptions, npxOptions);
    
    // Show options for selected method
    showOptionsForMethod(methodId, dockerOptions, localOptions, npxOptions);
}

/**
 * Hide all method options
 * @param {Element} dockerOptions - Docker options element
 * @param {Element} localOptions - Local options element
 * @param {Element} npxOptions - NPX options element
 */
function hideAllMethodOptions(dockerOptions, localOptions, npxOptions) {
    if (dockerOptions) dockerOptions.style.display = 'none';
    if (localOptions) localOptions.style.display = 'none';
    if (npxOptions) npxOptions.style.display = 'none';
}

/**
 * Show options for selected method
 * @param {string} methodId - The selected installation method ID
 * @param {Element} dockerOptions - Docker options element
 * @param {Element} localOptions - Local options element
 * @param {Element} npxOptions - NPX options element
 */
function showOptionsForMethod(methodId, dockerOptions, localOptions, npxOptions) {
    switch (methodId) {
        case 'docker':
            if (dockerOptions) dockerOptions.style.display = 'block';
            break;
        case 'local':
            if (localOptions) localOptions.style.display = 'block';
            break;
        case 'npx':
            if (npxOptions) npxOptions.style.display = 'block';
            break;
    }
    
    // Log UI update
    if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
        window.InstallerUIUtils.logMessage(`UI updated for method: ${methodId}`, 'info');
    } else {
        console.log(`UI updated for method: ${methodId}`);
    }
}

/**
 * Update UI based on selected template
 * @param {string} templateId - The selected template ID
 */
function updateUIForTemplate(templateId) {
    // Get template details
    const templateDetails = getTemplateDetails(templateId);
    
    // Update UI with template details
    if (templateDetails) {
        updateTemplateUI(templateDetails);
    }
}

/**
 * Update template UI with template details
 * @param {Object} templateDetails - Template details
 */
function updateTemplateUI(templateDetails) {
    const templateDescription = document.getElementById('templateDescription');
    const templateRequirements = document.getElementById('templateRequirements');
    
    if (templateDescription) {
        templateDescription.textContent = templateDetails.description;
    }
    
    if (templateRequirements) {
        templateRequirements.textContent = templateDetails.requirements.join(', ');
    }
}

/**
 * Get template details by ID
 * @param {string} templateId - The template ID
 * @returns {Object|null} Template details or null if not found
 */
function getTemplateDetails(templateId) {
    // Get templates from the template module
    if (window.InstallerUITemplates && window.InstallerUITemplates.getTemplates) {
        const templates = window.InstallerUITemplates.getTemplates();
        return templates.find(template => template.id === templateId) || null;
    }
    
    // Fallback to a simple template list
    return getDefaultTemplateDetails(templateId);
}

/**
 * Get default template details
 * @param {string} templateId - The template ID
 * @returns {Object|null} Template details or null if not found
 */
function getDefaultTemplateDetails(templateId) {
    const templates = [
        {
            id: 'basic',
            name: 'Basic MCP Server',
            description: 'A basic MCP server with essential functionality',
            requirements: ['Node.js 14+']
        },
        {
            id: 'full',
            name: 'Full MCP Server Suite',
            description: 'Complete suite of MCP servers with all available functionality',
            requirements: ['Node.js 14+', '4GB RAM', '2GB Disk Space']
        },
        {
            id: 'minimal',
            name: 'Minimal MCP Server',
            description: 'Lightweight MCP server with minimal dependencies',
            requirements: ['Node.js 14+', '1GB RAM']
        }
    ];
    
    return templates.find(template => template.id === templateId) || null;
}

/**
 * Toggle advanced options visibility
 * @param {boolean} show - Whether to show or hide advanced options
 */
function toggleAdvancedOptions(show) {
    const advancedOptions = document.getElementById('advancedOptions');
    const advancedToggle = document.getElementById('advancedToggle');
    
    if (advancedOptions) {
        advancedOptions.style.display = show ? 'block' : 'none';
    }
    
    if (advancedToggle) {
        advancedToggle.textContent = show ? 'Hide Advanced Options' : 'Show Advanced Options';
    }
    
    // Log toggle
    if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
        window.InstallerUIUtils.logMessage(show ? 'Advanced options shown' : 'Advanced options hidden', 'info');
    } else {
        console.log(show ? 'Advanced options shown' : 'Advanced options hidden');
    }
}

// Export functions for use in other modules
window.InstallerUIDisplay = {
    showInstallationUI,
    showRequirementsNotMet,
    showError,
    updateUIForMethod,
    updateUIForTemplate,
    getTemplateDetails,
    toggleAdvancedOptions
};
