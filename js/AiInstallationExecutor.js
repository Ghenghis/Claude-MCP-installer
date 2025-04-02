/**
 * AiInstallationExecutor.js
 * Executes installation steps and handles error recovery
 */

import aiInstallerState from './AiInstallerState.js';
import aiInstallerUI from './AiInstallerUI.js';
import aiInstallerUtils from './AiInstallerUtils.js';

class AiInstallationExecutor {
    /**
     * Execute installation steps
     * @param {Object} installPlan - Installation plan
     * @param {Object} options - Installation options
     * @param {Function} log - Optional custom logging function
     * @returns {Promise<boolean>} Promise resolving to true if installation was successful
     */
    async executeInstallation(installPlan, options, log = null) {
        const logger = log || ((msg, level) => aiInstallerUI.logMessage(msg, level));
        const state = aiInstallerState.getState();
        
        try {
            logger('Starting installation...', 'info');
            
            // Reset current step
            aiInstallerState.setCurrentStep(0);
            
            // Execute each step in sequence
            for (let i = 0; i < installPlan.steps.length; i++) {
                const step = installPlan.steps[i];
                
                // Update current step
                aiInstallerState.setCurrentStep(i + 1);
                
                // Update progress in UI
                aiInstallerUI.updateProgress(i + 1, installPlan.steps.length);
                
                // Log step
                logger(`Step ${i + 1}/${installPlan.steps.length}: ${step.description}`, 'info');
                
                try {
                    // Execute step
                    await this.executeStep(step, options, logger);
                    
                    // Log step completion
                    logger(`Completed step ${i + 1}: ${step.description}`, 'success');
                } catch (error) {
                    // Attempt error recovery
                    const recovered = await this.attemptErrorRecovery(error, step, options, logger);
                    
                    if (!recovered) {
                        // If recovery failed, throw error
                        throw error;
                    }
                }
                
                // Add small delay between steps for UI updates
                await aiInstallerUtils.simulateDelay(500);
            }
            
            logger('Installation completed successfully', 'success');
            return true;
        } catch (error) {
            logger(`Installation failed: ${error.message}`, 'error');
            aiInstallerState.addError(error);
            throw error;
        }
    }
    
    /**
     * Execute a single installation step
     * @param {Object} step - Installation step
     * @param {Object} options - Installation options
     * @param {Function} log - Logging function
     * @returns {Promise<void>} Promise that resolves when step is complete
     */
    async executeStep(step, options, log) {
        // Check if execution module is available
        if (!window.AiInstallerExecution || !window.AiInstallerExecution.executeStep) {
            throw new Error('Installation execution module not available');
        }
        
        // Execute step
        return window.AiInstallerExecution.executeStep(step, options, log);
    }
    
    /**
     * Attempt error recovery
     * @param {Error} error - Error that occurred
     * @param {Object} step - Step that failed
     * @param {Object} options - Installation options
     * @param {Function} log - Logging function
     * @returns {Promise<boolean>} Promise resolving to true if recovery was successful
     */
    async attemptErrorRecovery(error, step, options, log) {
        log(`Error during step "${step.description}": ${error.message}`, 'error');
        log('Attempting to recover...', 'warning');
        
        // Check if recovery module is available
        if (window.AiInstallerRecovery && window.AiInstallerRecovery.recoverFromError) {
            try {
                const recoveryResult = await window.AiInstallerRecovery.recoverFromError(error, step, options);
                
                if (recoveryResult.success) {
                    log(`Recovery successful: ${recoveryResult.message}`, 'success');
                    return true;
                } else {
                    log(`Recovery failed: ${recoveryResult.message}`, 'error');
                    return false;
                }
            } catch (recoveryError) {
                log(`Error during recovery attempt: ${recoveryError.message}`, 'error');
                return false;
            }
        } else {
            log('Error recovery module not available', 'warning');
            return false;
        }
    }
    
    /**
     * Verify installation
     * @param {Object} installPlan - Installation plan
     * @param {Object} options - Installation options
     * @param {Function} log - Optional custom logging function
     * @returns {Promise<boolean>} Promise resolving to true if verification was successful
     */
    async verifyInstallation(installPlan, options, log = null) {
        const logger = log || ((msg, level) => aiInstallerUI.logMessage(msg, level));
        
        try {
            logger('Verifying installation...', 'info');
            
            // Check if verification module is available
            if (window.AiInstallerVerification && window.AiInstallerVerification.verifyInstallation) {
                const verificationResult = await window.AiInstallerVerification.verifyInstallation(
                    installPlan, options
                );
                
                if (verificationResult.success) {
                    logger('Installation verification successful', 'success');
                    return true;
                } else {
                    logger(`Installation verification failed: ${verificationResult.message}`, 'error');
                    
                    if (verificationResult.issues && verificationResult.issues.length > 0) {
                        logger('Issues found:', 'warning');
                        verificationResult.issues.forEach(issue => {
                            logger(`- ${issue.message}`, 'warning');
                        });
                    }
                    
                    return false;
                }
            } else {
                // If verification module is not available, assume installation is successful
                logger('Installation verification module not available, skipping verification', 'warning');
                return true;
            }
        } catch (error) {
            logger(`Installation verification failed: ${error.message}`, 'error');
            aiInstallerState.addError(error);
            return false;
        }
    }
    
    /**
     * Update Claude Desktop configuration
     * @param {string} repoUrl - Repository URL
     * @param {string} installPath - Installation path
     * @param {string} methodId - Installation method
     * @param {Function} log - Optional custom logging function
     * @returns {Promise<void>} Promise that resolves when configuration is updated
     */
    async updateClaudeConfig(repoUrl, installPath, methodId, log = null) {
        const logger = log || ((msg, level) => aiInstallerUI.logMessage(msg, level));
        
        try {
            logger('Updating Claude Desktop configuration...', 'info');
            
            // Check if config module is available
            if (window.ClaudeConfigManager && window.ClaudeConfigManager.updateServerConfig) {
                const configResult = await window.ClaudeConfigManager.updateServerConfig({
                    repoUrl,
                    installPath,
                    installMethod: methodId
                });
                
                if (configResult.success) {
                    logger('Claude Desktop configuration updated successfully', 'success');
                } else {
                    logger(`Failed to update configuration: ${configResult.message}`, 'error');
                }
            } else {
                logger('Configuration module not available, skipping config update', 'warning');
            }
        } catch (error) {
            logger(`Error updating configuration: ${error.message}`, 'error');
            aiInstallerState.addError(error);
        }
    }
}

// Create a singleton instance
const aiInstallationExecutor = new AiInstallationExecutor();

// Export the singleton
export default aiInstallationExecutor;
