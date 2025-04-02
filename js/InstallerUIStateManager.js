/**
 * InstallerUIStateManager.js - Handles state management for the installer UI
 * Responsible for loading, saving, and updating state
 */

import installerUIState from './InstallerUIState.js';
import installerUICore from './InstallerUICore.js';
import installerUIDisplay from './InstallerUIDisplay.js';

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

/**
 * Reset state to defaults
 */
function resetState() {
    installerUIState.resetState();
    saveStateToStorage();
    updateUIFromState();
    installerUICore.logMessage('State reset to defaults', 'info');
}

export default {
    updateUIFromState,
    loadStateFromStorage,
    saveStateToStorage,
    resetState
};
