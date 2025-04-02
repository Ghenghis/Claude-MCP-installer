/**
 * AiInstallationPlanner.js
 * Creates and manages installation plans based on repository analysis
 */

import aiInstallerState from './AiInstallerState.js';
import aiInstallerUI from './AiInstallerUI.js';

class AiInstallationPlanner {
    /**
     * Create installation plan with appropriate module
     * @param {Object} repoAnalysis - Repository analysis
     * @param {Object} options - Installation options
     * @param {Function} log - Optional custom logging function
     * @returns {Promise<Object>} Promise resolving to installation plan
     */
    async createInstallationPlan(repoAnalysis, options, log = null) {
        const logger = log || ((msg, level) => aiInstallerUI.logMessage(msg, level));
        
        try {
            // Check if planning module is available
            if (!this.isPlanningModuleAvailable()) {
                throw new Error('Installation planning module not available');
            }
            
            // Log start of planning
            logger('Creating installation plan...', 'info');
            
            // Create installation plan
            const installPlan = window.AiInstallerPlanning.createInstallationPlan(repoAnalysis, options);
            
            // Update state with installation plan
            aiInstallerState.setInstallPlan(installPlan);
            
            // Log installation plan
            this.logInstallationPlan(installPlan, logger);
            
            return installPlan;
        } catch (error) {
            logger(`Installation planning failed: ${error.message}`, 'error');
            aiInstallerState.addError(error);
            throw error;
        }
    }
    
    /**
     * Check if planning module is available
     * @returns {boolean} Whether planning module is available
     */
    isPlanningModuleAvailable() {
        return !!(window.AiInstallerPlanning && window.AiInstallerPlanning.createInstallationPlan);
    }
    
    /**
     * Log installation plan
     * @param {Object} installPlan - Installation plan
     * @param {Function} log - Logging function
     */
    logInstallationPlan(installPlan, log) {
        log('Installation plan:', 'info');
        
        if (installPlan.recommendedMethod) {
            log(`Recommended method: ${installPlan.recommendedMethod}`, 'info');
        }
        
        if (installPlan.prerequisites && installPlan.prerequisites.length > 0) {
            log('Prerequisites:', 'info');
            installPlan.prerequisites.forEach(prereq => {
                log(`- ${prereq.name}${prereq.version ? ` (${prereq.version})` : ''}`, 'info');
            });
        }
        
        log('Installation steps:', 'info');
        installPlan.steps.forEach((step, index) => {
            log(`${index + 1}. ${step.description}`, 'info');
        });
    }
    
    /**
     * Verify prerequisites for installation
     * @param {Object} installPlan - Installation plan
     * @param {Function} log - Optional custom logging function
     * @returns {Promise<boolean>} Promise resolving to true if prerequisites are met
     */
    async verifyPrerequisites(installPlan, log = null) {
        const logger = log || ((msg, level) => aiInstallerUI.logMessage(msg, level));
        
        try {
            // Check if verification module is available
            if (window.AiInstallerVerification && window.AiInstallerVerification.verifyPrerequisites) {
                logger('Verifying prerequisites...', 'info');
                
                const verificationResult = await window.AiInstallerVerification.verifyPrerequisites(
                    installPlan.prerequisites || []
                );
                
                if (verificationResult.success) {
                    logger('All prerequisites are met', 'success');
                    return true;
                } else {
                    logger('Missing prerequisites:', 'warning');
                    verificationResult.missing.forEach(item => {
                        logger(`- ${item.name}${item.version ? ` (${item.version})` : ''}`, 'warning');
                    });
                    
                    if (verificationResult.canProceed) {
                        logger('Installation can proceed, but some features may not work correctly', 'warning');
                        return true;
                    } else {
                        throw new Error('Required prerequisites are missing');
                    }
                }
            } else {
                // If verification module is not available, assume prerequisites are met
                logger('Prerequisite verification module not available, skipping check', 'warning');
                return true;
            }
        } catch (error) {
            logger(`Prerequisite verification failed: ${error.message}`, 'error');
            aiInstallerState.addError(error);
            throw error;
        }
    }
}

// Create a singleton instance
const aiInstallationPlanner = new AiInstallationPlanner();

// Export the singleton
export default aiInstallationPlanner;
