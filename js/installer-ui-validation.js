/**
 * Installer UI Validation - Installation parameter validation
 * Handles validating installation parameters and showing errors
 */

/**
 * Validate installation parameters
 * @param {Object} params - Installation parameters
 * @returns {boolean} Whether the parameters are valid
 */
function validateInstallationParameters(params) {
    // Check for required parameters
    if (!validateRequiredParameters(params)) {
        return false;
    }
    
    // Validate installation path
    if (!validateInstallationPath(params)) {
        return false;
    }
    
    // Method-specific validation
    if (!validateMethodSpecificRequirements(params)) {
        return false;
    }
    
    return true;
}

/**
 * Validate required parameters
 * @param {Object} params - Installation parameters
 * @returns {boolean} Whether the required parameters are valid
 */
function validateRequiredParameters(params) {
    if (!params.methodId) {
        showError('Please select an installation method.');
        return false;
    }
    
    if (!params.templateId) {
        showError('Please select a template.');
        return false;
    }
    
    return true;
}

/**
 * Validate installation path
 * @param {Object} params - Installation parameters
 * @returns {boolean} Whether the installation path is valid
 */
function validateInstallationPath(params) {
    if (!params.installPath) {
        showError('Please specify an installation path.');
        return false;
    }
    
    // Check if path exists and is writable
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.isPathWritable) {
        try {
            const isWritable = window.electronAPI.isPathWritable(params.installPath);
            if (!isWritable) {
                showError(`Installation path ${params.installPath} is not writable. Please choose a different path.`);
                return false;
            }
        } catch (error) {
            console.warn('Error checking path writability:', error);
        }
    }
    
    return true;
}

/**
 * Validate method-specific requirements
 * @param {Object} params - Installation parameters
 * @returns {boolean} Whether the method-specific requirements are met
 */
function validateMethodSpecificRequirements(params) {
    switch (params.methodId) {
        case 'docker':
            return validateDockerRequirements();
        case 'python':
            return validatePythonRequirements();
        case 'npx':
            return validateNpxRequirements();
        default:
            return true;
    }
}

/**
 * Validate Docker requirements
 * @returns {boolean} Whether Docker requirements are met
 */
function validateDockerRequirements() {
    // Check Docker availability
    if (window.InstallerUIDocker && window.InstallerUIDocker.isDockerAvailable) {
        if (!window.InstallerUIDocker.isDockerAvailable()) {
            showError('Docker is not available. Please install Docker or choose a different installation method.');
            return false;
        }
    }
    
    return true;
}

/**
 * Validate Python requirements
 * @returns {boolean} Whether Python requirements are met
 */
function validatePythonRequirements() {
    // Check Python availability
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.isPythonAvailable) {
        if (!window.electronAPI.isPythonAvailable()) {
            showError('Python is not available. Please install Python or choose a different installation method.');
            return false;
        }
    }
    
    return true;
}

/**
 * Validate NPX requirements
 * @returns {boolean} Whether NPX requirements are met
 */
function validateNpxRequirements() {
    // Check NPX availability
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.isNpxAvailable) {
        if (!window.electronAPI.isNpxAvailable()) {
            showError('NPX is not available. Please install Node.js with NPM or choose a different installation method.');
            return false;
        }
    }
    
    return true;
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

// Export functions for use in other modules
window.InstallerUIValidation = {
    validateInstallationParameters,
    validateRequiredParameters,
    validateInstallationPath,
    validateMethodSpecificRequirements,
    validateDockerRequirements,
    validatePythonRequirements,
    validateNpxRequirements,
    showError
};
