/**
 * InstallerUICore.js
 * Core initialization and coordination functions for the installer UI
 */

import installerUIState from './InstallerUIState.js';

class InstallerUICore {
    /**
     * Initialize the installer UI
     */
    initialize() {
        // Initialize UI components
        this.initUIComponents();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Check system requirements
        this.checkSystemRequirements();
        
        // Log initialization
        this.logInitializationMessage();
    }
    
    /**
     * Initialize UI components
     */
    initUIComponents() {
        // Set initial UI state based on saved state
        this.updateUIFromState();
    }
    
    /**
     * Update UI elements based on current state
     */
    updateUIFromState() {
        const state = installerUIState.getState();
        
        // Update each UI section separately
        this.updateMethodSelectionUI(state.selectedMethod);
        this.updateTemplateSelectionUI(state.selectedTemplate);
        this.updateInstallationPathUI(state.installationPath);
        this.updateAdvancedOptionsUI(state.advancedOptions);
    }
    
    /**
     * Update method selection UI
     * @param {string} selectedMethod - Selected method ID
     */
    updateMethodSelectionUI(selectedMethod) {
        if (!selectedMethod) return;
        
        const methodRadio = document.querySelector(`input[name="installMethod"][value="${selectedMethod}"]`);
        if (methodRadio) {
            methodRadio.checked = true;
            this.updateUIForMethod(selectedMethod);
        }
    }
    
    /**
     * Update template selection UI
     * @param {string} selectedTemplate - Selected template ID
     */
    updateTemplateSelectionUI(selectedTemplate) {
        if (!selectedTemplate) return;
        
        const templateSelect = document.getElementById('templateSelect');
        if (templateSelect) {
            templateSelect.value = selectedTemplate;
            this.updateUIForTemplate(selectedTemplate);
        }
    }
    
    /**
     * Update installation path UI
     * @param {string} installationPath - Installation path
     */
    updateInstallationPathUI(installationPath) {
        if (!installationPath) return;
        
        const pathInput = document.getElementById('installPath');
        if (pathInput) {
            pathInput.value = installationPath;
        }
    }
    
    /**
     * Update advanced options UI
     * @param {Object} advancedOptions - Advanced options
     */
    updateAdvancedOptionsUI(advancedOptions) {
        if (!advancedOptions) return;
        
        this.updateCheckboxOption('skipDependencies', advancedOptions.skipDependencies);
        this.updateCheckboxOption('forceReinstall', advancedOptions.forceReinstall);
        this.updateCheckboxOption('debugMode', advancedOptions.debugMode);
        
        const customArgsInput = document.getElementById('customArgs');
        if (customArgsInput) {
            customArgsInput.value = advancedOptions.customArgs || '';
        }
    }
    
    /**
     * Update checkbox option
     * @param {string} id - Checkbox ID
     * @param {boolean} checked - Whether checkbox should be checked
     */
    updateCheckboxOption(id, checked) {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.checked = !!checked;
        }
    }
    
    /**
     * Set up event listeners
     * This is a placeholder that will be implemented by the Events module
     */
    setupEventListeners() {
        // This will be handled by the InstallerUIEvents module
        if (window.InstallerUIEvents && window.InstallerUIEvents.setupEventListeners) {
            window.InstallerUIEvents.setupEventListeners();
        }
    }
    
    /**
     * Check system requirements
     */
    checkSystemRequirements() {
        if (window.InstallerUISystemCheck && window.InstallerUISystemCheck.checkSystemRequirements) {
            window.InstallerUISystemCheck.checkSystemRequirements();
        }
    }
    
    /**
     * Log initialization message
     */
    logInitializationMessage() {
        this.logMessage('Installer UI initialized', 'info');
    }
    
    /**
     * Log a message
     * @param {string} message - Message to log
     * @param {string} type - Message type (info, success, warning, error)
     */
    logMessage(message, type = 'info') {
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
                default:
                    console.log(message);
            }
        }
    }
    
    /**
     * Update UI for selected method
     * @param {string} methodId - The selected method ID
     */
    updateUIForMethod(methodId) {
        // Update state
        installerUIState.setSelectedMethod(methodId);
        
        // Update UI based on selected method
        const methodSpecificSections = document.querySelectorAll('.method-specific');
        methodSpecificSections.forEach(section => {
            section.style.display = 'none';
        });
        
        const selectedMethodSection = document.getElementById(`${methodId}Options`);
        if (selectedMethodSection) {
            selectedMethodSection.style.display = 'block';
        }
        
        // Log method selection
        this.logMessage(`Installation method selected: ${methodId}`, 'info');
    }
    
    /**
     * Update UI for selected template
     * @param {string} templateId - The selected template ID
     */
    updateUIForTemplate(templateId) {
        // Update state
        installerUIState.setSelectedTemplate(templateId);
        
        // Update UI based on selected template
        // This would be implemented based on specific template requirements
        
        // Log template selection
        this.logMessage(`Template selected: ${templateId}`, 'info');
    }
    
    /**
     * Get operating system
     * @returns {string} Operating system
     */
    getOperatingSystem() {
        const platform = navigator.platform.toLowerCase();
        
        if (platform.includes('win')) {
            return 'windows';
        } else if (platform.includes('mac')) {
            return 'macos';
        } else if (platform.includes('linux')) {
            return 'linux';
        } else {
            return 'unknown';
        }
    }
}

// Create a singleton instance
const installerUICore = new InstallerUICore();

// Export the singleton
export default installerUICore;
