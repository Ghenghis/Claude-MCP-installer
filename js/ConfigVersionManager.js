/**
 * ConfigVersionManager.js - Manages version control for MCP server configurations
 * Tracks configuration changes and maintains version history
 */

import logger from './logger.js';

class ConfigVersionManager {
    constructor() {
        this.configHistory = {};
        this.maxHistoryLength = 20; // Maximum number of versions to keep per config
        
        // Initialize version manager
        this.initializeVersionManager();
    }
    
    /**
     * Initialize version manager
     */
    initializeVersionManager() {
        try {
            // Load configuration history from localStorage
            this.loadConfigHistory();
            
            logger.info('Configuration version manager initialized');
        } catch (error) {
            logger.error('Error initializing configuration version manager:', error);
        }
    }
    
    /**
     * Load configuration history from localStorage
     */
    loadConfigHistory() {
        try {
            const storedHistory = localStorage.getItem('mcp_config_history');
            
            if (storedHistory) {
                this.configHistory = JSON.parse(storedHistory);
            }
        } catch (error) {
            logger.error('Error loading configuration history:', error);
        }
    }
    
    /**
     * Save configuration history to localStorage
     */
    saveConfigHistory() {
        try {
            localStorage.setItem('mcp_config_history', JSON.stringify(this.configHistory));
        } catch (error) {
            logger.error('Error saving configuration history:', error);
        }
    }
    
    /**
     * Add a new version of a configuration
     * @param {string} configId - Configuration ID
     * @param {Object} config - Configuration object
     * @param {string} comment - Comment describing the changes
     * @returns {Object} Version info
     */
    addVersion(configId, config, comment = '') {
        try {
            if (!configId) {
                logger.error('Configuration ID is required');
                return null;
            }
            
            if (!config) {
                logger.error('Configuration object is required');
                return null;
            }
            
            // Initialize history for this config if it doesn't exist
            if (!this.configHistory[configId]) {
                this.configHistory[configId] = [];
            }
            
            // Check if this version is different from the latest
            const latestVersion = this.getLatestVersion(configId);
            if (latestVersion && JSON.stringify(latestVersion.config) === JSON.stringify(config)) {
                logger.debug(`No changes detected for configuration ${configId}`);
                return latestVersion;
            }
            
            // Create version info
            const versionInfo = {
                version: this.configHistory[configId].length + 1,
                timestamp: Date.now(),
                config: JSON.parse(JSON.stringify(config)), // Deep clone config
                comment: comment || `Configuration update ${new Date().toISOString()}`,
                author: 'User', // In a real app, this would be the current user
                changes: this.calculateChanges(latestVersion?.config, config)
            };
            
            // Add version to history
            this.configHistory[configId].push(versionInfo);
            
            // Trim history if needed
            if (this.configHistory[configId].length > this.maxHistoryLength) {
                this.configHistory[configId] = this.configHistory[configId].slice(
                    this.configHistory[configId].length - this.maxHistoryLength
                );
            }
            
            // Save history
            this.saveConfigHistory();
            
            logger.info(`Added version ${versionInfo.version} for configuration ${configId}`);
            
            return versionInfo;
        } catch (error) {
            logger.error(`Error adding version for configuration ${configId}:`, error);
            return null;
        }
    }
    
    /**
     * Calculate changes between two configurations
     * @param {Object} oldConfig - Old configuration
     * @param {Object} newConfig - New configuration
     * @returns {Object} Changes object
     */
    calculateChanges(oldConfig, newConfig) {
        if (!oldConfig) {
            return { added: Object.keys(newConfig), modified: [], removed: [] };
        }
        
        if (!newConfig) {
            return { added: [], modified: [], removed: Object.keys(oldConfig) };
        }
        
        const changes = {
            added: [],
            modified: [],
            removed: []
        };
        
        // Find added and modified properties
        for (const key of Object.keys(newConfig)) {
            if (!(key in oldConfig)) {
                changes.added.push(key);
            } else if (JSON.stringify(oldConfig[key]) !== JSON.stringify(newConfig[key])) {
                changes.modified.push(key);
            }
        }
        
        // Find removed properties
        for (const key of Object.keys(oldConfig)) {
            if (!(key in newConfig)) {
                changes.removed.push(key);
            }
        }
        
        return changes;
    }
    
    /**
     * Get all versions of a configuration
     * @param {string} configId - Configuration ID
     * @returns {Array} Version history
     */
    getVersionHistory(configId) {
        try {
            if (!configId) {
                logger.error('Configuration ID is required');
                return [];
            }
            
            return this.configHistory[configId] || [];
        } catch (error) {
            logger.error(`Error getting version history for configuration ${configId}:`, error);
            return [];
        }
    }
    
    /**
     * Get a specific version of a configuration
     * @param {string} configId - Configuration ID
     * @param {number} version - Version number
     * @returns {Object|null} Version info or null if not found
     */
    getVersion(configId, version) {
        try {
            if (!configId) {
                logger.error('Configuration ID is required');
                return null;
            }
            
            if (!version) {
                logger.error('Version number is required');
                return null;
            }
            
            const history = this.configHistory[configId] || [];
            return history.find(v => v.version === version) || null;
        } catch (error) {
            logger.error(`Error getting version ${version} for configuration ${configId}:`, error);
            return null;
        }
    }
    
    /**
     * Get the latest version of a configuration
     * @param {string} configId - Configuration ID
     * @returns {Object|null} Latest version info or null if not found
     */
    getLatestVersion(configId) {
        try {
            if (!configId) {
                logger.error('Configuration ID is required');
                return null;
            }
            
            const history = this.configHistory[configId] || [];
            
            if (history.length === 0) {
                return null;
            }
            
            return history[history.length - 1];
        } catch (error) {
            logger.error(`Error getting latest version for configuration ${configId}:`, error);
            return null;
        }
    }
    
    /**
     * Restore a configuration to a specific version
     * @param {string} configId - Configuration ID
     * @param {number} version - Version number
     * @returns {Object|null} Restored configuration or null if not found
     */
    restoreVersion(configId, version) {
        try {
            if (!configId) {
                logger.error('Configuration ID is required');
                return null;
            }
            
            if (!version) {
                logger.error('Version number is required');
                return null;
            }
            
            // Get the version to restore
            const versionInfo = this.getVersion(configId, version);
            
            if (!versionInfo) {
                logger.error(`Version ${version} not found for configuration ${configId}`);
                return null;
            }
            
            // Create a comment for the new version
            const comment = `Restored from version ${version} (${new Date(versionInfo.timestamp).toISOString()})`;
            
            // Add a new version with the restored configuration
            this.addVersion(configId, versionInfo.config, comment);
            
            logger.info(`Restored configuration ${configId} to version ${version}`);
            
            return JSON.parse(JSON.stringify(versionInfo.config)); // Return a deep clone
        } catch (error) {
            logger.error(`Error restoring version ${version} for configuration ${configId}:`, error);
            return null;
        }
    }
    
    /**
     * Compare two versions of a configuration
     * @param {string} configId - Configuration ID
     * @param {number} version1 - First version number
     * @param {number} version2 - Second version number
     * @returns {Object|null} Comparison result or null if error
     */
    compareVersions(configId, version1, version2) {
        try {
            if (!configId) {
                logger.error('Configuration ID is required');
                return null;
            }
            
            if (!version1 || !version2) {
                logger.error('Both version numbers are required');
                return null;
            }
            
            // Get the versions to compare
            const versionInfo1 = this.getVersion(configId, version1);
            const versionInfo2 = this.getVersion(configId, version2);
            
            if (!versionInfo1) {
                logger.error(`Version ${version1} not found for configuration ${configId}`);
                return null;
            }
            
            if (!versionInfo2) {
                logger.error(`Version ${version2} not found for configuration ${configId}`);
                return null;
            }
            
            // Compare configurations
            const changes = this.calculateChanges(versionInfo1.config, versionInfo2.config);
            
            // Create comparison result
            const comparison = {
                configId,
                version1: {
                    version: versionInfo1.version,
                    timestamp: versionInfo1.timestamp,
                    comment: versionInfo1.comment,
                    author: versionInfo1.author
                },
                version2: {
                    version: versionInfo2.version,
                    timestamp: versionInfo2.timestamp,
                    comment: versionInfo2.comment,
                    author: versionInfo2.author
                },
                changes,
                details: []
            };
            
            // Add detailed changes
            for (const key of changes.added) {
                comparison.details.push({
                    key,
                    changeType: 'added',
                    newValue: versionInfo2.config[key]
                });
            }
            
            for (const key of changes.modified) {
                comparison.details.push({
                    key,
                    changeType: 'modified',
                    oldValue: versionInfo1.config[key],
                    newValue: versionInfo2.config[key]
                });
            }
            
            for (const key of changes.removed) {
                comparison.details.push({
                    key,
                    changeType: 'removed',
                    oldValue: versionInfo1.config[key]
                });
            }
            
            return comparison;
        } catch (error) {
            logger.error(`Error comparing versions ${version1} and ${version2} for configuration ${configId}:`, error);
            return null;
        }
    }
    
    /**
     * Create a diff between two versions of a configuration
     * @param {string} configId - Configuration ID
     * @param {number} version1 - First version number
     * @param {number} version2 - Second version number
     * @returns {string|null} Diff string or null if error
     */
    createDiff(configId, version1, version2) {
        try {
            // Get comparison result
            const comparison = this.compareVersions(configId, version1, version2);
            
            if (!comparison) {
                return null;
            }
            
            // Create a readable diff
            let diff = `Diff between version ${version1} and ${version2} for configuration ${configId}\n`;
            diff += `Version ${version1}: ${new Date(comparison.version1.timestamp).toISOString()}\n`;
            diff += `Version ${version2}: ${new Date(comparison.version2.timestamp).toISOString()}\n\n`;
            
            // Added properties
            if (comparison.changes.added.length > 0) {
                diff += `Added properties:\n`;
                
                for (const detail of comparison.details.filter(d => d.changeType === 'added')) {
                    diff += `+ ${detail.key}: ${JSON.stringify(detail.newValue)}\n`;
                }
                
                diff += '\n';
            }
            
            // Modified properties
            if (comparison.changes.modified.length > 0) {
                diff += `Modified properties:\n`;
                
                for (const detail of comparison.details.filter(d => d.changeType === 'modified')) {
                    diff += `~ ${detail.key}:\n`;
                    diff += `  - ${JSON.stringify(detail.oldValue)}\n`;
                    diff += `  + ${JSON.stringify(detail.newValue)}\n`;
                }
                
                diff += '\n';
            }
            
            // Removed properties
            if (comparison.changes.removed.length > 0) {
                diff += `Removed properties:\n`;
                
                for (const detail of comparison.details.filter(d => d.changeType === 'removed')) {
                    diff += `- ${detail.key}: ${JSON.stringify(detail.oldValue)}\n`;
                }
                
                diff += '\n';
            }
            
            return diff;
        } catch (error) {
            logger.error(`Error creating diff between versions ${version1} and ${version2} for configuration ${configId}:`, error);
            return null;
        }
    }
    
    /**
     * Export configuration version history to JSON
     * @param {string} configId - Configuration ID
     * @returns {string|null} JSON string or null if error
     */
    exportVersionHistory(configId) {
        try {
            if (!configId) {
                logger.error('Configuration ID is required');
                return null;
            }
            
            const history = this.configHistory[configId] || [];
            
            if (history.length === 0) {
                logger.warn(`No version history found for configuration ${configId}`);
                return null;
            }
            
            // Create export object
            const exportObj = {
                configId,
                exportDate: new Date().toISOString(),
                versions: history
            };
            
            return JSON.stringify(exportObj, null, 2);
        } catch (error) {
            logger.error(`Error exporting version history for configuration ${configId}:`, error);
            return null;
        }
    }
    
    /**
     * Import configuration version history from JSON
     * @param {string} json - JSON string to import
     * @returns {boolean} Success status
     */
    importVersionHistory(json) {
        try {
            if (!json) {
                logger.error('JSON string is required');
                return false;
            }
            
            // Parse JSON
            const importObj = JSON.parse(json);
            
            if (!importObj.configId || !Array.isArray(importObj.versions)) {
                logger.error('Invalid import format');
                return false;
            }
            
            // Import version history
            this.configHistory[importObj.configId] = importObj.versions;
            
            // Save history
            this.saveConfigHistory();
            
            logger.info(`Imported version history for configuration ${importObj.configId}`);
            
            return true;
        } catch (error) {
            logger.error('Error importing version history:', error);
            return false;
        }
    }
    
    /**
     * Delete version history for a configuration
     * @param {string} configId - Configuration ID
     * @returns {boolean} Success status
     */
    deleteVersionHistory(configId) {
        try {
            if (!configId) {
                logger.error('Configuration ID is required');
                return false;
            }
            
            // Check if history exists
            if (!this.configHistory[configId]) {
                logger.warn(`No version history found for configuration ${configId}`);
                return true;
            }
            
            // Delete history
            delete this.configHistory[configId];
            
            // Save history
            this.saveConfigHistory();
            
            logger.info(`Deleted version history for configuration ${configId}`);
            
            return true;
        } catch (error) {
            logger.error(`Error deleting version history for configuration ${configId}:`, error);
            return false;
        }
    }
    
    /**
     * Clear all configuration version history
     * @returns {boolean} Success status
     */
    clearAllVersionHistory() {
        try {
            // Clear history
            this.configHistory = {};
            
            // Save history
            this.saveConfigHistory();
            
            logger.info('Cleared all configuration version history');
            
            return true;
        } catch (error) {
            logger.error('Error clearing all configuration version history:', error);
            return false;
        }
    }
}

// Create singleton instance
const configVersionManager = new ConfigVersionManager();

// Export for use in other modules
export default configVersionManager;
