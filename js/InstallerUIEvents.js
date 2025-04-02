/**
 * InstallerUIEvents.js
 * Handles event listeners and event handling for the installer UI
 */

import installerUIState from './InstallerUIState.js';
import installerUICore from './InstallerUICore.js';

class InstallerUIEvents {
    /**
     * Set up all event listeners for UI interactions
     */
    setupEventListeners() {
        // Set up installation method selection
        this.setupInstallationMethodSelection();
        
        // Set up template selection
        this.setupTemplateSelection();
        
        // Set up installation path selection
        this.setupInstallationPathSelection();
        
        // Set up installation button
        this.setupInstallButton();
        
        // Set up URL installation
        this.setupUrlInstallation();
        
        // Set up advanced options
        this.setupAdvancedOptions();
    }
    
    /**
     * Set up installation method selection
     */
    setupInstallationMethodSelection() {
        const methodRadios = document.querySelectorAll('input[name="installMethod"]');
        
        methodRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                this.handleMethodSelection(radio.value);
            });
        });
    }
    
    /**
     * Handle method selection
     * @param {string} methodValue - The selected method value
     */
    handleMethodSelection(methodValue) {
        // Update UI based on selected method
        installerUICore.updateUIForMethod(methodValue);
    }
    
    /**
     * Set up template selection
     */
    setupTemplateSelection() {
        const templateSelect = document.getElementById('templateSelect');
        
        if (templateSelect) {
            templateSelect.addEventListener('change', () => {
                this.handleTemplateSelection(templateSelect.value);
            });
        }
    }
    
    /**
     * Handle template selection
     * @param {string} templateId - The selected template ID
     */
    handleTemplateSelection(templateId) {
        // Update UI based on selected template
        installerUICore.updateUIForTemplate(templateId);
    }
    
    /**
     * Set up installation path selection
     */
    setupInstallationPathSelection() {
        const pathInput = document.getElementById('installPath');
        const browseButton = document.getElementById('browsePath');
        
        if (browseButton && pathInput) {
            browseButton.addEventListener('click', () => {
                this.handleBrowseButtonClick(pathInput);
            });
            
            // Update state when path is changed manually
            pathInput.addEventListener('change', () => {
                installerUIState.setInstallationPath(pathInput.value);
            });
        }
    }
    
    /**
     * Handle browse button click
     * @param {Element} pathInput - The path input element
     */
    handleBrowseButtonClick(pathInput) {
        // Open file browser if available
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.openDirectoryPicker) {
            this.openDirectoryPicker(pathInput);
        } else {
            // Fallback for browsers without file system access
            installerUICore.logMessage('Directory selection is not available in this environment.', 'warning');
        }
    }
    
    /**
     * Open directory picker
     * @param {Element} pathInput - The path input element
     */
    async openDirectoryPicker(pathInput) {
        try {
            const path = await window.electronAPI.openDirectoryPicker();
            if (path) {
                this.handleDirectorySelection(path, pathInput);
            }
        } catch (error) {
            this.handleDirectorySelectionError(error);
        }
    }
    
    /**
     * Handle directory selection
     * @param {string} path - The selected path
     * @param {Element} pathInput - The path input element
     */
    handleDirectorySelection(path, pathInput) {
        // Update input value
        pathInput.value = path;
        
        // Update state
        installerUIState.setInstallationPath(path);
        
        // Log selection
        installerUICore.logMessage(`Installation path selected: ${path}`, 'info');
    }
    
    /**
     * Handle directory selection error
     * @param {Error} error - The error object
     */
    handleDirectorySelectionError(error) {
        installerUICore.logMessage(`Error selecting directory: ${error.message}`, 'error');
    }
    
    /**
     * Set up installation button
     */
    setupInstallButton() {
        const installButton = document.getElementById('installButton');
        
        if (installButton) {
            installButton.addEventListener('click', () => {
                this.handleInstallButtonClick();
            });
        }
    }
    
    /**
     * Handle install button click
     */
    handleInstallButtonClick() {
        // Get installation parameters
        const params = this.getInstallationParameters();
        
        // Validate and start installation
        this.validateAndStartInstallation(params);
    }
    
    /**
     * Validate parameters and start installation
     * @param {Object} params - Installation parameters
     */
    validateAndStartInstallation(params) {
        // Validate parameters
        if (this.validateParameters(params)) {
            // Start installation
            this.startInstallation(params);
        } else {
            installerUICore.logMessage('Invalid installation parameters. Please check your inputs.', 'error');
        }
    }
    
    /**
     * Validate parameters
     * @param {Object} params - Installation parameters
     * @returns {boolean} Whether the parameters are valid
     */
    validateParameters(params) {
        // Basic validation
        if (!params.method) {
            installerUICore.logMessage('Please select an installation method.', 'error');
            return false;
        }
        
        if (!params.path) {
            installerUICore.logMessage('Please select an installation path.', 'error');
            return false;
        }
        
        // Use validation module if available
        if (window.InstallerUIValidation && window.InstallerUIValidation.validateParameters) {
            return window.InstallerUIValidation.validateParameters(params);
        }
        
        return true;
    }
    
    /**
     * Get installation parameters from UI
     * @returns {Object} Installation parameters
     */
    getInstallationParameters() {
        return {
            method: this.getSelectedMethod(),
            template: this.getSelectedTemplate(),
            path: this.getInstallationPath(),
            advancedOptions: this.getAdvancedOptions()
        };
    }
    
    /**
     * Get selected installation method
     * @returns {string} Selected method ID
     */
    getSelectedMethod() {
        return installerUIState.getSelectedMethod() || document.querySelector('input[name="installMethod"]:checked')?.value;
    }
    
    /**
     * Get selected template
     * @returns {string} Selected template ID
     */
    getSelectedTemplate() {
        return installerUIState.getSelectedTemplate() || document.getElementById('templateSelect')?.value;
    }
    
    /**
     * Get installation path
     * @returns {string} Installation path
     */
    getInstallationPath() {
        return installerUIState.getInstallationPath() || document.getElementById('installPath')?.value;
    }
    
    /**
     * Get advanced installation options
     * @returns {Object} Advanced options
     */
    getAdvancedOptions() {
        // First try to get options from state
        const stateOptions = installerUIState.getAdvancedOptions();
        if (stateOptions) {
            return stateOptions;
        }
        
        // Otherwise, build options from UI elements
        return this.buildAdvancedOptionsFromUI();
    }
    
    /**
     * Build advanced options object from UI elements
     * @returns {Object} Advanced options
     */
    buildAdvancedOptionsFromUI() {
        return {
            skipDependencies: this.getCheckboxValue('skipDependencies'),
            forceReinstall: this.getCheckboxValue('forceReinstall'),
            debugMode: this.getCheckboxValue('debugMode'),
            customArgs: this.getInputValue('customArgs')
        };
    }
    
    /**
     * Get checkbox value
     * @param {string} id - Checkbox ID
     * @returns {boolean} Checkbox value
     */
    getCheckboxValue(id) {
        const checkbox = document.getElementById(id);
        return checkbox ? checkbox.checked : false;
    }
    
    /**
     * Get input value
     * @param {string} id - Input ID
     * @returns {string} Input value
     */
    getInputValue(id) {
        const input = document.getElementById(id);
        return input ? input.value : '';
    }
    
    /**
     * Start the installation process
     * @param {Object} params - Installation parameters
     */
    startInstallation(params) {
        // Show installation UI
        this.showInstallationUI();
        
        // Check requirements and start installation
        this.checkRequirementsAndStartInstallation(params);
    }
    
    /**
     * Show installation UI
     */
    showInstallationUI() {
        // Update state
        installerUIState.setInstallationStatus(true, 0, 'Starting installation...');
        
        // Show installation UI using the appropriate module
        if (window.InstallerUIDisplay && window.InstallerUIDisplay.showInstallationUI) {
            window.InstallerUIDisplay.showInstallationUI();
        }
    }
    
    /**
     * Check requirements and start installation
     * @param {Object} params - Installation parameters
     */
    checkRequirementsAndStartInstallation(params) {
        // Get system requirements check
        this.getSystemRequirementsCheck()
            .then(requirements => {
                this.handleRequirementsCheckResult(requirements, params);
            })
            .catch(error => {
                this.handleRequirementsCheckError(error);
            });
    }
    
    /**
     * Get system requirements check
     * @returns {Promise} Promise resolving to requirements status
     */
    getSystemRequirementsCheck() {
        if (window.InstallerUISystemCheck && window.InstallerUISystemCheck.checkRequirements) {
            return window.InstallerUISystemCheck.checkRequirements();
        } else {
            // Fallback to simple check
            return Promise.resolve({ allMet: true, missing: [] });
        }
    }
    
    /**
     * Handle requirements check result
     * @param {Object} requirements - Requirements check result
     * @param {Object} params - Installation parameters
     */
    handleRequirementsCheckResult(requirements, params) {
        if (requirements.allMet) {
            // Start installation process
            this.startInstallationProcess(params);
        } else {
            // Show requirements not met
            this.showRequirementsNotMet(requirements.missing);
        }
    }
    
    /**
     * Start installation process
     * @param {Object} params - Installation parameters
     */
    startInstallationProcess(params) {
        // Use installation module if available
        if (window.InstallerUIInstallation && window.InstallerUIInstallation.startInstallation) {
            window.InstallerUIInstallation.startInstallation(params);
        } else {
            // Fallback to simulation
            this.simulateInstallation(params);
        }
    }
    
    /**
     * Show requirements not met
     * @param {Array} missingRequirements - List of missing requirements
     */
    showRequirementsNotMet(missingRequirements) {
        installerUIState.setInstallationStatus(false, 0, 'Requirements not met');
        
        // Show requirements not met using the appropriate module
        if (window.InstallerUIDisplay && window.InstallerUIDisplay.showRequirementsNotMet) {
            window.InstallerUIDisplay.showRequirementsNotMet(missingRequirements);
        } else {
            // Fallback to simple message
            installerUICore.logMessage('System requirements not met. Please install missing requirements.', 'error');
            missingRequirements.forEach(req => {
                installerUICore.logMessage(`- ${req.name}: ${req.message}`, 'error');
            });
        }
    }
    
    /**
     * Handle requirements check error
     * @param {Error} error - The error object
     */
    handleRequirementsCheckError(error) {
        installerUIState.setInstallationStatus(false, 0, 'Error checking requirements');
        installerUICore.logMessage(`Error checking system requirements: ${error.message}`, 'error');
    }
    
    /**
     * Simulate the installation process
     * @param {Object} params - Installation parameters
     */
    simulateInstallation(params) {
        installerUICore.logMessage('Starting installation (simulation)...', 'info');
        installerUICore.logMessage(`Method: ${params.method}`, 'info');
        installerUICore.logMessage(`Template: ${params.template || 'None'}`, 'info');
        installerUICore.logMessage(`Path: ${params.path}`, 'info');
        
        // Simulate progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            installerUIState.setInstallationStatus(true, progress, `Installing... ${progress}%`);
            
            if (progress >= 100) {
                clearInterval(interval);
                installerUIState.setInstallationStatus(false, 100, 'Installation completed');
                installerUICore.logMessage('Installation completed successfully (simulation)', 'success');
            }
        }, 500);
    }
    
    /**
     * Set up URL installation
     */
    setupUrlInstallation() {
        const urlInput = document.getElementById('repoUrl');
        const urlInstallButton = document.getElementById('urlInstallButton');
        
        if (urlInstallButton && urlInput) {
            urlInstallButton.addEventListener('click', () => {
                this.handleUrlInstallButtonClick(urlInput);
            });
        }
    }
    
    /**
     * Handle URL install button click
     * @param {Element} urlInput - The URL input element
     */
    handleUrlInstallButtonClick(urlInput) {
        const url = urlInput.value.trim();
        
        if (url) {
            this.installFromUrl(url);
        } else {
            this.showUrlInputError();
        }
    }
    
    /**
     * Install from URL
     * @param {string} url - The repository URL
     */
    installFromUrl(url) {
        // Use URL installation module if available
        if (window.InstallerUIUrlInstallation && window.InstallerUIUrlInstallation.installFromUrl) {
            window.InstallerUIUrlInstallation.installFromUrl(url);
        } else {
            // Fallback to simple installation
            installerUICore.logMessage(`Installing from URL: ${url}`, 'info');
            
            // Get default installation path
            const path = this.getInstallationPath() || 'C:\\MCP';
            
            // Start installation with default parameters
            this.startInstallation({
                method: 'git',
                path,
                url,
                advancedOptions: this.getAdvancedOptions()
            });
        }
    }
    
    /**
     * Show URL input error
     */
    showUrlInputError() {
        installerUICore.logMessage('Please enter a valid repository URL.', 'error');
    }
    
    /**
     * Set up advanced options
     */
    setupAdvancedOptions() {
        const advancedToggle = document.getElementById('advancedToggle');
        const advancedOptions = document.getElementById('advancedOptions');
        
        if (advancedToggle && advancedOptions) {
            advancedToggle.addEventListener('click', () => {
                this.handleAdvancedToggleClick(advancedOptions, advancedToggle);
            });
            
            // Set up advanced option change listeners
            this.setupAdvancedOptionChangeListeners();
        }
    }
    
    /**
     * Set up advanced option change listeners
     */
    setupAdvancedOptionChangeListeners() {
        const advancedOptions = {
            skipDependencies: document.getElementById('skipDependencies'),
            forceReinstall: document.getElementById('forceReinstall'),
            debugMode: document.getElementById('debugMode'),
            customArgs: document.getElementById('customArgs')
        };
        
        // Add change listeners to checkboxes
        Object.entries(advancedOptions).forEach(([key, element]) => {
            if (element && key !== 'customArgs') {
                element.addEventListener('change', () => {
                    this.handleAdvancedOptionChange(key, element.checked);
                });
            } else if (element) {
                element.addEventListener('change', () => {
                    this.handleAdvancedOptionChange(key, element.value);
                });
            }
        });
    }
    
    /**
     * Handle advanced option change
     * @param {string} option - Option name
     * @param {any} value - Option value
     */
    handleAdvancedOptionChange(option, value) {
        const advancedOptions = installerUIState.getAdvancedOptions();
        advancedOptions[option] = value;
        installerUIState.setAdvancedOptions(advancedOptions);
    }
    
    /**
     * Handle advanced toggle click
     * @param {Element} advancedOptions - The advanced options element
     * @param {Element} advancedToggle - The advanced toggle element
     */
    handleAdvancedToggleClick(advancedOptions, advancedToggle) {
        const isVisible = advancedOptions.style.display !== 'none';
        
        // Toggle visibility
        advancedOptions.style.display = isVisible ? 'none' : 'block';
        
        // Update toggle text
        advancedToggle.textContent = isVisible ? 'Show Advanced Options' : 'Hide Advanced Options';
    }
}

// Create a singleton instance
const installerUIEvents = new InstallerUIEvents();

// Export the singleton
export default installerUIEvents;
