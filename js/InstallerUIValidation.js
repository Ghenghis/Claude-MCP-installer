/**
 * InstallerUIValidation.js
 * Handles validation functions for the installer UI
 */

import installerUICore from './InstallerUICore.js';

class InstallerUIValidation {
    /**
     * Validate installation parameters
     * @param {Object} params - Installation parameters
     * @returns {boolean} Whether the parameters are valid
     */
    validateParameters(params) {
        // Validate method
        if (!this.validateMethod(params.method)) {
            return false;
        }
        
        // Validate path
        if (!this.validatePath(params.path)) {
            return false;
        }
        
        // Validate template if applicable
        if (params.method === 'template' && !this.validateTemplate(params.template)) {
            return false;
        }
        
        // Validate URL if applicable
        if (params.method === 'url' && !this.validateUrl(params.url)) {
            return false;
        }
        
        // Validate advanced options
        if (params.advancedOptions && !this.validateAdvancedOptions(params.advancedOptions)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Validate installation method
     * @param {string} method - Installation method
     * @returns {boolean} Whether the method is valid
     */
    validateMethod(method) {
        const validMethods = ['template', 'url', 'git', 'local'];
        
        if (!method) {
            installerUICore.logMessage('Please select an installation method.', 'error');
            return false;
        }
        
        if (!validMethods.includes(method)) {
            installerUICore.logMessage(`Invalid installation method: ${method}`, 'error');
            return false;
        }
        
        return true;
    }
    
    /**
     * Validate installation path
     * @param {string} path - Installation path
     * @returns {boolean} Whether the path is valid
     */
    validatePath(path) {
        if (!path) {
            installerUICore.logMessage('Please select an installation path.', 'error');
            return false;
        }
        
        // Check if path is absolute
        if (!this.isAbsolutePath(path)) {
            installerUICore.logMessage('Installation path must be an absolute path.', 'error');
            return false;
        }
        
        // Check if path contains invalid characters
        if (this.containsInvalidPathCharacters(path)) {
            installerUICore.logMessage('Installation path contains invalid characters.', 'error');
            return false;
        }
        
        return true;
    }
    
    /**
     * Check if path is absolute
     * @param {string} path - Path to check
     * @returns {boolean} Whether the path is absolute
     */
    isAbsolutePath(path) {
        // Windows absolute path (e.g., C:\path\to\dir)
        if (/^[A-Za-z]:\\/.test(path)) {
            return true;
        }
        
        // Unix absolute path (e.g., /path/to/dir)
        if (/^\//.test(path)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Check if path contains invalid characters
     * @param {string} path - Path to check
     * @returns {boolean} Whether the path contains invalid characters
     */
    containsInvalidPathCharacters(path) {
        // Check for invalid characters in Windows paths
        if (/[<>:"|?*]/.test(path)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Validate template
     * @param {string} templateId - Template ID
     * @returns {boolean} Whether the template is valid
     */
    validateTemplate(templateId) {
        if (!templateId) {
            installerUICore.logMessage('Please select a template.', 'error');
            return false;
        }
        
        // Check if template exists
        if (!this.templateExists(templateId)) {
            installerUICore.logMessage(`Template not found: ${templateId}`, 'error');
            return false;
        }
        
        return true;
    }
    
    /**
     * Check if template exists
     * @param {string} templateId - Template ID
     * @returns {boolean} Whether the template exists
     */
    templateExists(templateId) {
        // In a real implementation, this would check if the template exists
        // For now, just return true
        return true;
    }
    
    /**
     * Validate URL
     * @param {string} url - URL to validate
     * @returns {boolean} Whether the URL is valid
     */
    validateUrl(url) {
        if (!url) {
            installerUICore.logMessage('Please enter a URL.', 'error');
            return false;
        }
        
        // Check if URL is valid
        if (!this.isValidUrl(url)) {
            installerUICore.logMessage('Please enter a valid URL.', 'error');
            return false;
        }
        
        return true;
    }
    
    /**
     * Check if URL is valid
     * @param {string} url - URL to check
     * @returns {boolean} Whether the URL is valid
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Validate advanced options
     * @param {Object} options - Advanced options
     * @returns {boolean} Whether the options are valid
     */
    validateAdvancedOptions(options) {
        // Validate custom arguments if provided
        if (options.customArgs && !this.validateCustomArgs(options.customArgs)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Validate custom arguments
     * @param {string} args - Custom arguments
     * @returns {boolean} Whether the arguments are valid
     */
    validateCustomArgs(args) {
        // Check for potentially dangerous commands
        if (this.containsDangerousCommands(args)) {
            installerUICore.logMessage('Custom arguments contain potentially dangerous commands.', 'error');
            return false;
        }
        
        return true;
    }
    
    /**
     * Check if string contains dangerous commands
     * @param {string} str - String to check
     * @returns {boolean} Whether the string contains dangerous commands
     */
    containsDangerousCommands(str) {
        const dangerousPatterns = [
            /rm\s+-rf/i,
            /format/i,
            /del\s+\/[a-z]/i,
            /mkfs/i
        ];
        
        return dangerousPatterns.some(pattern => pattern.test(str));
    }
    
    /**
     * Validate system requirements
     * @returns {Promise<Object>} Promise resolving to requirements status
     */
    async validateSystemRequirements() {
        try {
            // Check for required software
            const requiredSoftware = await this.checkRequiredSoftware();
            
            // Check for disk space
            const diskSpace = await this.checkDiskSpace();
            
            // Check for permissions
            const permissions = await this.checkPermissions();
            
            // Combine results
            const allMet = requiredSoftware.met && diskSpace.met && permissions.met;
            const missing = [
                ...(!requiredSoftware.met ? requiredSoftware.missing : []),
                ...(!diskSpace.met ? [diskSpace.missing] : []),
                ...(!permissions.met ? [permissions.missing] : [])
            ];
            
            return { allMet, missing };
        } catch (error) {
            installerUICore.logMessage(`Error validating system requirements: ${error.message}`, 'error');
            return { allMet: false, missing: [{ name: 'Unknown', message: error.message }] };
        }
    }
    
    /**
     * Check for required software
     * @returns {Promise<Object>} Promise resolving to requirements status
     */
    async checkRequiredSoftware() {
        // In a real implementation, this would check for required software
        // For now, just return success
        return { met: true, missing: [] };
    }
    
    /**
     * Check for disk space
     * @returns {Promise<Object>} Promise resolving to requirements status
     */
    async checkDiskSpace() {
        // In a real implementation, this would check for disk space
        // For now, just return success
        return { met: true, missing: { name: 'Disk Space', message: 'Sufficient disk space available' } };
    }
    
    /**
     * Check for permissions
     * @returns {Promise<Object>} Promise resolving to requirements status
     */
    async checkPermissions() {
        // In a real implementation, this would check for permissions
        // For now, just return success
        return { met: true, missing: { name: 'Permissions', message: 'Required permissions available' } };
    }
}

// Create a singleton instance
const installerUIValidation = new InstallerUIValidation();

// Export the singleton
export default installerUIValidation;
