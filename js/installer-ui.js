/**
 * Installer UI - Main entry point for the installer UI
 * Coordinates between various modular components
 */

// Import modules
import installerUICore from './InstallerUICore.js';
import installerUIEvents from './InstallerUIEvents.js';
import installerUIStateManager from './InstallerUIStateManager.js';
import installerUISystemRequirements from './InstallerUISystemRequirements.js';

/**
 * Initialize the installer UI
 */
function initInstallerUI() {
    // Initialize UI components
    installerUICore.initUI();
    
    // Set up event listeners
    installerUIEvents.setupEventListeners();
    
    // Check system requirements
    installerUISystemRequirements.checkSystemRequirements();
    
    // Log initialization
    installerUICore.logMessage('Installer UI initialized', 'info');
    
    // Load state from storage
    installerUIStateManager.loadStateFromStorage();
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', initInstallerUI);

// Export functions for use in other modules
window.InstallerUI = {
    initInstallerUI,
    updateUIFromState: installerUIStateManager.updateUIFromState,
    loadStateFromStorage: installerUIStateManager.loadStateFromStorage,
    saveStateToStorage: installerUIStateManager.saveStateToStorage
};