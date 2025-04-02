/**
 * InstallerUIState.js
 * Manages state for the installer UI
 */

class InstallerUIState {
    constructor() {
        this.state = {
            selectedMethod: null,
            selectedTemplate: null,
            installationPath: '',
            advancedOptions: {
                skipDependencies: false,
                forceReinstall: false,
                debugMode: false,
                customArgs: ''
            },
            isInstalling: false,
            installationProgress: 0,
            installationStatus: null,
            errors: []
        };
        
        // Load saved state from localStorage if available
        this.loadState();
    }
    
    /**
     * Load state from localStorage
     */
    loadState() {
        try {
            const savedState = localStorage.getItem('installerUIState');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                // Merge saved state with default state
                this.state = { ...this.state, ...parsedState };
            }
        } catch (error) {
            console.error('Error loading installer UI state:', error);
        }
    }
    
    /**
     * Save state to localStorage
     */
    saveState() {
        try {
            localStorage.setItem('installerUIState', JSON.stringify(this.state));
        } catch (error) {
            console.error('Error saving installer UI state:', error);
        }
    }
    
    /**
     * Set selected installation method
     * @param {string} methodId - The selected method ID
     */
    setSelectedMethod(methodId) {
        this.state.selectedMethod = methodId;
        this.saveState();
    }
    
    /**
     * Get selected installation method
     * @returns {string} Selected method ID
     */
    getSelectedMethod() {
        return this.state.selectedMethod;
    }
    
    /**
     * Set selected template
     * @param {string} templateId - The selected template ID
     */
    setSelectedTemplate(templateId) {
        this.state.selectedTemplate = templateId;
        this.saveState();
    }
    
    /**
     * Get selected template
     * @returns {string} Selected template ID
     */
    getSelectedTemplate() {
        return this.state.selectedTemplate;
    }
    
    /**
     * Set installation path
     * @param {string} path - Installation path
     */
    setInstallationPath(path) {
        this.state.installationPath = path;
        this.saveState();
    }
    
    /**
     * Get installation path
     * @returns {string} Installation path
     */
    getInstallationPath() {
        return this.state.installationPath;
    }
    
    /**
     * Set advanced options
     * @param {Object} options - Advanced options
     */
    setAdvancedOptions(options) {
        this.state.advancedOptions = { ...this.state.advancedOptions, ...options };
        this.saveState();
    }
    
    /**
     * Get advanced options
     * @returns {Object} Advanced options
     */
    getAdvancedOptions() {
        return this.state.advancedOptions;
    }
    
    /**
     * Set installation status
     * @param {boolean} isInstalling - Whether installation is in progress
     * @param {number} progress - Installation progress (0-100)
     * @param {string} status - Installation status message
     */
    setInstallationStatus(isInstalling, progress = 0, status = null) {
        this.state.isInstalling = isInstalling;
        this.state.installationProgress = progress;
        this.state.installationStatus = status;
        this.saveState();
    }
    
    /**
     * Get installation status
     * @returns {Object} Installation status
     */
    getInstallationStatus() {
        return {
            isInstalling: this.state.isInstalling,
            progress: this.state.installationProgress,
            status: this.state.installationStatus
        };
    }
    
    /**
     * Add error
     * @param {Error} error - Error object
     */
    addError(error) {
        this.state.errors.push({
            message: error.message,
            timestamp: new Date().toISOString()
        });
        this.saveState();
    }
    
    /**
     * Get errors
     * @returns {Array} Errors
     */
    getErrors() {
        return this.state.errors;
    }
    
    /**
     * Clear errors
     */
    clearErrors() {
        this.state.errors = [];
        this.saveState();
    }
    
    /**
     * Get complete state
     * @returns {Object} Complete state
     */
    getState() {
        return this.state;
    }
}

// Create a singleton instance
const installerUIState = new InstallerUIState();

// Export the singleton
export default installerUIState;
