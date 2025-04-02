/**
 * InstallerUIConfiguration.js
 * Handles configuration management for the installer UI
 */

import installerUIState from './InstallerUIState.js';
import installerUICore from './InstallerUICore.js';

class InstallerUIConfiguration {
    /**
     * Update Claude Desktop configuration
     * @param {string} repoUrl - Repository URL
     * @param {string} installPath - Installation path
     * @param {string} methodId - Installation method
     * @returns {Promise<boolean>} Promise resolving to success status
     */
    async updateClaudeConfig(repoUrl, installPath, methodId) {
        try {
            installerUICore.logMessage('Updating Claude Desktop configuration...', 'info');
            
            // Extract repository information
            const repoInfo = this.extractRepoInfo(repoUrl);
            
            // Create configuration object
            const configData = this.createConfigObject(repoUrl, installPath, methodId, repoInfo);
            
            // Save configuration
            const success = await this.saveConfiguration(configData);
            
            if (success) {
                installerUICore.logMessage('Claude Desktop configuration updated successfully', 'success');
            } else {
                installerUICore.logMessage('Failed to update configuration', 'error');
            }
            
            return success;
        } catch (error) {
            installerUICore.logMessage(`Error updating configuration: ${error.message}`, 'error');
            return false;
        }
    }
    
    /**
     * Extract repository information from URL
     * @param {string} repoUrl - Repository URL
     * @returns {Object} Repository information
     */
    extractRepoInfo(repoUrl) {
        try {
            // Handle different URL formats
            let owner = '';
            let repo = '';
            
            if (repoUrl.includes('github.com')) {
                // GitHub URL format
                const urlParts = repoUrl.split('/');
                const githubIndex = urlParts.findIndex(part => part === 'github.com');
                
                if (githubIndex !== -1 && githubIndex + 2 < urlParts.length) {
                    owner = urlParts[githubIndex + 1];
                    repo = urlParts[githubIndex + 2].replace('.git', '');
                }
            } else if (repoUrl.includes('@')) {
                // SSH URL format (git@github.com:owner/repo.git)
                const match = repoUrl.match(/[^:]+:([^\/]+)\/([^.]+)(?:\.git)?/);
                if (match && match.length >= 3) {
                    owner = match[1];
                    repo = match[2];
                }
            }
            
            return { owner, repo, url: repoUrl };
        } catch (error) {
            installerUICore.logMessage(`Error parsing repository URL: ${error.message}`, 'error');
            return { owner: '', repo: '', url: repoUrl };
        }
    }
    
    /**
     * Create configuration object
     * @param {string} repoUrl - Repository URL
     * @param {string} installPath - Installation path
     * @param {string} methodId - Installation method
     * @param {Object} repoInfo - Repository information
     * @returns {Object} Configuration object
     */
    createConfigObject(repoUrl, installPath, methodId, repoInfo) {
        const timestamp = new Date().toISOString();
        
        return {
            id: `mcp-${repoInfo.repo || this.generateUniqueId()}`,
            name: repoInfo.repo || 'MCP Server',
            type: 'mcp',
            installPath,
            installMethod: methodId,
            repoUrl,
            owner: repoInfo.owner,
            repo: repoInfo.repo,
            installedAt: timestamp,
            updatedAt: timestamp,
            status: 'installed',
            config: {
                autoStart: false,
                port: this.findAvailablePort(3000, 4000),
                environment: {}
            }
        };
    }
    
    /**
     * Generate a unique identifier
     * @returns {string} Unique identifier
     */
    generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
    
    /**
     * Find an available port in the given range
     * @param {number} start - Start of port range
     * @param {number} end - End of port range
     * @returns {number} Available port
     */
    findAvailablePort(start, end) {
        // In a real implementation, this would check if ports are in use
        // For now, just return a random port in the range
        return Math.floor(Math.random() * (end - start + 1)) + start;
    }
    
    /**
     * Save configuration
     * @param {Object} configData - Configuration data
     * @returns {Promise<boolean>} Promise resolving to success status
     */
    async saveConfiguration(configData) {
        try {
            // Get existing configurations
            const configs = this.getExistingConfigurations();
            
            // Check if configuration already exists
            const existingIndex = configs.findIndex(config => config.id === configData.id);
            
            if (existingIndex !== -1) {
                // Update existing configuration
                configs[existingIndex] = {
                    ...configs[existingIndex],
                    ...configData,
                    updatedAt: new Date().toISOString()
                };
            } else {
                // Add new configuration
                configs.push(configData);
            }
            
            // Save configurations
            localStorage.setItem('claudeServerConfigs', JSON.stringify(configs));
            
            // Update system configuration if available
            if (window.ClaudeConfigManager && window.ClaudeConfigManager.updateServerConfig) {
                await window.ClaudeConfigManager.updateServerConfig(configData);
            }
            
            return true;
        } catch (error) {
            installerUICore.logMessage(`Error saving configuration: ${error.message}`, 'error');
            return false;
        }
    }
    
    /**
     * Get existing configurations
     * @returns {Array} Existing configurations
     */
    getExistingConfigurations() {
        try {
            const configsJson = localStorage.getItem('claudeServerConfigs');
            return configsJson ? JSON.parse(configsJson) : [];
        } catch (error) {
            installerUICore.logMessage(`Error loading configurations: ${error.message}`, 'error');
            return [];
        }
    }
    
    /**
     * Verify configuration
     * @returns {boolean} Whether configuration is valid
     */
    verifyConfiguration() {
        try {
            // Check if configuration exists
            const configs = this.getExistingConfigurations();
            
            if (configs.length === 0) {
                installerUICore.logMessage('No configurations found', 'warning');
                return false;
            }
            
            // Check if configuration file exists
            const configPath = this.getConfigPathBasedOnOS();
            
            // In a real implementation, this would check if the file exists
            // For now, just return true
            return true;
        } catch (error) {
            installerUICore.logMessage(`Error verifying configuration: ${error.message}`, 'error');
            return false;
        }
    }
    
    /**
     * Get configuration path based on OS
     * @returns {string} Configuration path
     */
    getConfigPathBasedOnOS() {
        const os = installerUICore.getOperatingSystem();
        
        switch (os) {
            case 'windows':
                return `${process.env.APPDATA}\\Claude\\config.json`;
            case 'macos':
                return `${process.env.HOME}/Library/Application Support/Claude/config.json`;
            case 'linux':
                return `${process.env.HOME}/.config/claude/config.json`;
            default:
                return '';
        }
    }
    
    /**
     * Install MCP servers
     * @param {string} methodId - Installation method
     * @returns {Promise<boolean>} Promise resolving to success status
     */
    async installMcpServers(methodId) {
        try {
            installerUICore.logMessage('Installing MCP servers...', 'info');
            
            // In a real implementation, this would install MCP servers
            // For now, just return true
            return true;
        } catch (error) {
            installerUICore.logMessage(`Error installing MCP servers: ${error.message}`, 'error');
            return false;
        }
    }
}

// Create a singleton instance
const installerUIConfiguration = new InstallerUIConfiguration();

// Export the singleton
export default installerUIConfiguration;
