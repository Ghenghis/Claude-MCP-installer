/**
 * Installer UI - Main entry point for the installer UI
 * Coordinates between various modular components
 */

// Import modules
import installerUIState from './InstallerUIState.js';
import installerUICore from './InstallerUICore.js';
import installerUIEvents from './InstallerUIEvents.js';
import installerUIDisplay from './InstallerUIDisplay.js';
import installerUIValidation from './InstallerUIValidation.js';
import installerUIInstallation from './InstallerUIInstallation.js';
import installerUIConfiguration from './InstallerUIConfiguration.js';

/**
 * Initialize the installer UI
 */
function initInstallerUI() {
    // Initialize UI components
    installerUICore.initUI();
    
    // Set up event listeners
    installerUIEvents.setupEventListeners();
    
    // Check system requirements
    checkSystemRequirements();
    
    // Log initialization
    installerUICore.logMessage('Installer UI initialized', 'info');
    
    // Load state from storage
    loadStateFromStorage();
}

/**
 * Check system requirements
 */
async function checkSystemRequirements() {
    try {
        const requirements = await installerUIValidation.validateSystemRequirements();
        
        if (!requirements.allMet) {
            installerUICore.logMessage('System requirements not met. Some features may not work correctly.', 'warning');
            
            // Show requirements not met if there are missing requirements
            if (requirements.missing && requirements.missing.length > 0) {
                installerUIDisplay.showRequirementsNotMet(requirements.missing);
            }
        } else {
            installerUICore.logMessage('System requirements met.', 'success');
        }
    } catch (error) {
        installerUICore.logMessage(`Error checking system requirements: ${error.message}`, 'error');
    }
}

/**
 * Update UI from state
 */
function updateUIFromState() {
    installerUIDisplay.updateUIFromState();
}

/**
 * Load state from storage
 */
function loadStateFromStorage() {
    const savedState = localStorage.getItem('installerUIState');
    
    if (savedState) {
        try {
            const parsedState = JSON.parse(savedState);
            installerUIState.setState(parsedState);
            updateUIFromState();
        } catch (error) {
            installerUICore.logMessage(`Error loading state: ${error.message}`, 'error');
        }
    }
}

/**
 * Save state to storage
 */
function saveStateToStorage() {
    try {
        const state = installerUIState.getState();
        localStorage.setItem('installerUIState', JSON.stringify(state));
    } catch (error) {
        installerUICore.logMessage(`Error saving state: ${error.message}`, 'error');
    }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', initInstallerUI);

// Export functions for use in other modules
window.InstallerUI = {
    initInstallerUI,
    updateUIFromState,
    loadStateFromStorage,
    saveStateToStorage
};
