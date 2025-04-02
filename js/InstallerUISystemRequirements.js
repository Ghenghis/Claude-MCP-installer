/**
 * InstallerUISystemRequirements.js - Handles system requirements checking for the installer UI
 * Responsible for validating system requirements and displaying results
 */

import installerUICore from './InstallerUICore.js';
import installerUIDisplay from './InstallerUIDisplay.js';
import installerUIValidation from './InstallerUIValidation.js';

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
        
        return requirements;
    } catch (error) {
        installerUICore.logMessage(`Error checking system requirements: ${error.message}`, 'error');
        return { allMet: false, error: error.message };
    }
}

export default {
    checkSystemRequirements
};
