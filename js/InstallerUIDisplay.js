/**
 * InstallerUIDisplay.js
 * Handles UI display and rendering for the installer UI
 */

import installerUIState from './InstallerUIState.js';
import installerUICore from './InstallerUICore.js';

class InstallerUIDisplay {
    /**
     * Show installation UI
     */
    showInstallationUI() {
        // Show installation progress section
        this.showElement('installationProgress');
        
        // Hide installation form
        this.hideElement('installationForm');
        
        // Update progress bar
        this.updateProgressBar(0);
        
        // Show installation log
        this.showElement('installationLog');
        
        // Clear previous log messages
        this.clearLogMessages();
        
        // Log start message
        installerUICore.logMessage('Starting installation...', 'info');
    }
    
    /**
     * Show element by ID
     * @param {string} id - Element ID
     */
    showElement(id) {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'block';
        }
    }
    
    /**
     * Hide element by ID
     * @param {string} id - Element ID
     */
    hideElement(id) {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
        }
    }
    
    /**
     * Update progress bar
     * @param {number} progress - Progress percentage (0-100)
     */
    updateProgressBar(progress) {
        const progressBar = document.getElementById('installProgress');
        const progressText = document.getElementById('progressText');
        
        if (progressBar) {
            progressBar.value = progress;
            progressBar.setAttribute('aria-valuenow', progress);
        }
        
        if (progressText) {
            progressText.textContent = `${progress}%`;
        }
    }
    
    /**
     * Clear log messages
     */
    clearLogMessages() {
        const logContainer = document.getElementById('logMessages');
        if (logContainer) {
            logContainer.innerHTML = '';
        }
    }
    
    /**
     * Show installation complete UI
     */
    showInstallationComplete() {
        // Update progress to 100%
        this.updateProgressBar(100);
        
        // Show complete message
        installerUICore.logMessage('Installation completed successfully!', 'success');
        
        // Show restart button if needed
        this.showRestartButtonIfNeeded();
    }
    
    /**
     * Show restart button if needed
     */
    showRestartButtonIfNeeded() {
        const restartButton = document.getElementById('restartButton');
        if (restartButton) {
            restartButton.style.display = 'inline-block';
            
            // Add event listener
            restartButton.addEventListener('click', () => {
                this.handleRestartButtonClick();
            });
        }
    }
    
    /**
     * Handle restart button click
     */
    handleRestartButtonClick() {
        // Check if electron API is available
        if (typeof window.electronAPI !== 'undefined' && window.electronAPI.restartApp) {
            window.electronAPI.restartApp();
        } else {
            // Fallback to page reload
            window.location.reload();
        }
    }
    
    /**
     * Show installation error UI
     * @param {Error} error - Error object
     */
    showInstallationError(error) {
        // Log error message
        installerUICore.logMessage(`Installation failed: ${error.message}`, 'error');
        
        // Show retry button
        this.showRetryButton();
    }
    
    /**
     * Show retry button
     */
    showRetryButton() {
        const retryButton = document.getElementById('retryButton');
        if (retryButton) {
            retryButton.style.display = 'inline-block';
            
            // Add event listener
            retryButton.addEventListener('click', () => {
                this.handleRetryButtonClick();
            });
        }
    }
    
    /**
     * Handle retry button click
     */
    handleRetryButtonClick() {
        // Hide retry button
        const retryButton = document.getElementById('retryButton');
        if (retryButton) {
            retryButton.style.display = 'none';
        }
        
        // Get installation parameters from state
        const params = {
            method: installerUIState.getSelectedMethod(),
            template: installerUIState.getSelectedTemplate(),
            path: installerUIState.getInstallationPath(),
            advancedOptions: installerUIState.getAdvancedOptions()
        };
        
        // Restart installation
        if (window.InstallerUIEvents && window.InstallerUIEvents.startInstallation) {
            window.InstallerUIEvents.startInstallation(params);
        }
    }
    
    /**
     * Show requirements not met UI
     * @param {Array} missingRequirements - List of missing requirements
     */
    showRequirementsNotMet(missingRequirements) {
        // Show requirements section
        this.showElement('requirementsSection');
        
        // Hide installation progress
        this.hideElement('installationProgress');
        
        // Populate requirements list
        this.populateRequirementsList(missingRequirements);
    }
    
    /**
     * Populate requirements list
     * @param {Array} missingRequirements - List of missing requirements
     */
    populateRequirementsList(missingRequirements) {
        const requirementsList = document.getElementById('requirementsList');
        if (requirementsList) {
            // Clear previous items
            requirementsList.innerHTML = '';
            
            // Add missing requirements
            missingRequirements.forEach(req => {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item list-group-item-danger';
                listItem.innerHTML = `
                    <strong>${req.name}</strong>: ${req.message}
                    ${req.installUrl ? `<a href="${req.installUrl}" target="_blank" class="btn btn-sm btn-outline-primary float-end">Install</a>` : ''}
                `;
                requirementsList.appendChild(listItem);
            });
        }
    }
    
    /**
     * Update UI from state
     */
    updateUIFromState() {
        // Update method selection
        this.updateMethodSelection();
        
        // Update template selection
        this.updateTemplateSelection();
        
        // Update installation path
        this.updateInstallationPath();
        
        // Update advanced options
        this.updateAdvancedOptions();
        
        // Update installation status
        this.updateInstallationStatus();
    }
    
    /**
     * Update method selection
     */
    updateMethodSelection() {
        const selectedMethod = installerUIState.getSelectedMethod();
        if (selectedMethod) {
            const methodRadio = document.querySelector(`input[name="installMethod"][value="${selectedMethod}"]`);
            if (methodRadio) {
                methodRadio.checked = true;
            }
        }
    }
    
    /**
     * Update template selection
     */
    updateTemplateSelection() {
        const selectedTemplate = installerUIState.getSelectedTemplate();
        if (selectedTemplate) {
            const templateSelect = document.getElementById('templateSelect');
            if (templateSelect) {
                templateSelect.value = selectedTemplate;
            }
        }
    }
    
    /**
     * Update installation path
     */
    updateInstallationPath() {
        const installationPath = installerUIState.getInstallationPath();
        if (installationPath) {
            const pathInput = document.getElementById('installPath');
            if (pathInput) {
                pathInput.value = installationPath;
            }
        }
    }
    
    /**
     * Update advanced options
     */
    updateAdvancedOptions() {
        const advancedOptions = installerUIState.getAdvancedOptions();
        if (advancedOptions) {
            // Update checkboxes
            this.updateCheckbox('skipDependencies', advancedOptions.skipDependencies);
            this.updateCheckbox('forceReinstall', advancedOptions.forceReinstall);
            this.updateCheckbox('debugMode', advancedOptions.debugMode);
            
            // Update custom args
            this.updateInputValue('customArgs', advancedOptions.customArgs);
        }
    }
    
    /**
     * Update checkbox
     * @param {string} id - Checkbox ID
     * @param {boolean} checked - Checkbox state
     */
    updateCheckbox(id, checked) {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.checked = checked;
        }
    }
    
    /**
     * Update input value
     * @param {string} id - Input ID
     * @param {string} value - Input value
     */
    updateInputValue(id, value) {
        const input = document.getElementById(id);
        if (input) {
            input.value = value;
        }
    }
    
    /**
     * Update installation status
     */
    updateInstallationStatus() {
        const status = installerUIState.getInstallationStatus();
        if (status) {
            // Show/hide installation progress
            if (status.active) {
                this.showElement('installationProgress');
                this.hideElement('installationForm');
            } else {
                this.hideElement('installationProgress');
                this.showElement('installationForm');
            }
            
            // Update progress
            this.updateProgressBar(status.progress);
        }
    }
    
    /**
     * Show template details
     * @param {Object} template - Template object
     */
    showTemplateDetails(template) {
        if (!template) {
            return;
        }
        
        // Update template details section
        const detailsSection = document.getElementById('templateDetails');
        if (detailsSection) {
            detailsSection.innerHTML = `
                <div class="card mb-3">
                    <div class="card-header">
                        <h5 class="card-title">${template.name}</h5>
                    </div>
                    <div class="card-body">
                        <p class="card-text">${template.description}</p>
                        <div class="mb-3">
                            <strong>Repository:</strong> <a href="${template.repoUrl}" target="_blank">${template.repoUrl}</a>
                        </div>
                        <div class="mb-3">
                            <strong>Author:</strong> ${template.author}
                        </div>
                        <div class="mb-3">
                            <strong>Requirements:</strong>
                            <ul class="list-group">
                                ${template.requirements.map(req => `<li class="list-group-item">${req}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            `;
            
            // Show details section
            detailsSection.style.display = 'block';
        }
    }
    
    /**
     * Hide template details
     */
    hideTemplateDetails() {
        const detailsSection = document.getElementById('templateDetails');
        if (detailsSection) {
            detailsSection.style.display = 'none';
        }
    }
}

// Create a singleton instance
const installerUIDisplay = new InstallerUIDisplay();

// Export the singleton
export default installerUIDisplay;
