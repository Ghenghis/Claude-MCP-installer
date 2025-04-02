/**
 * AdvancedConfigManager.js - Main module for advanced configuration management
 * Integrates templates, validation, and version control for MCP server configurations
 */

import logger from './logger.js';
import configTemplateManager from './ConfigTemplateManager.js';
import configValidator from './ConfigValidator.js';
import configVersionManager from './ConfigVersionManager.js';

class AdvancedConfigManager {
    constructor() {
        this.configTemplateManager = configTemplateManager;
        this.configValidator = configValidator;
        this.configVersionManager = configVersionManager;
        
        this.configs = {};
        
        // Initialize advanced config manager
        this.initializeManager();
    }
    
    /**
     * Initialize advanced config manager
     */
    initializeManager() {
        try {
            // Load configurations from localStorage
            this.loadConfigs();
            
            logger.info('Advanced configuration manager initialized');
        } catch (error) {
            logger.error('Error initializing advanced configuration manager:', error);
        }
    }
    
    /**
     * Load configurations from localStorage
     */
    loadConfigs() {
        try {
            const storedConfigs = localStorage.getItem('mcp_server_configs');
            
            if (storedConfigs) {
                this.configs = JSON.parse(storedConfigs);
            }
        } catch (error) {
            logger.error('Error loading configurations:', error);
        }
    }
    
    /**
     * Save configurations to localStorage
     */
    saveConfigs() {
        try {
            localStorage.setItem('mcp_server_configs', JSON.stringify(this.configs));
        } catch (error) {
            logger.error('Error saving configurations:', error);
        }
    }
    
    /**
     * Get all configurations
     * @returns {Object} All configurations
     */
    getAllConfigs() {
        return { ...this.configs };
    }
    
    /**
     * Get a configuration by ID
     * @param {string} configId - Configuration ID
     * @returns {Object|null} Configuration object or null if not found
     */
    getConfig(configId) {
        return this.configs[configId] || null;
    }
    
    /**
     * Create a new configuration
     * @param {string} templateId - Template ID
     * @param {Object} configData - Configuration data
     * @param {string} name - Configuration name
     * @returns {Object|null} Created configuration or null if failed
     */
    createConfig(templateId, configData, name) {
        try {
            // Get template
            const template = this.configTemplateManager.getTemplate(templateId);
            
            if (!template) {
                logger.error(`Template with ID ${templateId} not found`);
                return null;
            }
            
            // Generate configuration
            const config = this.configTemplateManager.generateConfig(templateId, configData);
            
            if (!config) {
                logger.error(`Error generating configuration from template ${templateId}`);
                return null;
            }
            
            // Add metadata
            const configId = `config_${Date.now()}`;
            config._id = configId;
            config._name = name || `${template.name} Configuration`;
            config._created = Date.now();
            config._updated = Date.now();
            
            // Validate configuration
            const validationResult = this.configValidator.validateConfigAgainstTemplate(
                config,
                templateId
            );
            
            if (!validationResult.valid) {
                logger.error(`Invalid configuration for template ${templateId}:`, validationResult.errors);
                return null;
            }
            
            // Save configuration
            this.configs[configId] = config;
            this.saveConfigs();
            
            // Add initial version
            this.configVersionManager.addVersion(
                configId,
                config,
                'Initial configuration'
            );
            
            logger.info(`Configuration ${configId} created from template ${templateId}`);
            
            return config;
        } catch (error) {
            logger.error(`Error creating configuration from template ${templateId}:`, error);
            return null;
        }
    }
    
    /**
     * Update a configuration
     * @param {string} configId - Configuration ID
     * @param {Object} configData - Updated configuration data
     * @param {string} comment - Comment describing the changes
     * @returns {Object|null} Updated configuration or null if failed
     */
    updateConfig(configId, configData, comment = '') {
        try {
            // Check if configuration exists
            if (!this.configs[configId]) {
                logger.error(`Configuration with ID ${configId} not found`);
                return null;
            }
            
            // Get existing configuration
            const existingConfig = this.configs[configId];
            
            // Get template ID
            const templateId = existingConfig._template;
            
            if (!templateId) {
                logger.error(`No template specified for configuration ${configId}`);
                return null;
            }
            
            // Create updated configuration
            const updatedConfig = {
                ...existingConfig,
                ...configData,
                _updated: Date.now()
            };
            
            // Preserve metadata
            for (const key of ['_id', '_name', '_template', '_created', '_generated', '_version']) {
                if (existingConfig[key]) {
                    updatedConfig[key] = existingConfig[key];
                }
            }
            
            // Validate updated configuration
            const validationResult = this.configValidator.validateConfigAgainstTemplate(
                updatedConfig,
                templateId
            );
            
            if (!validationResult.valid) {
                logger.error(`Invalid configuration for template ${templateId}:`, validationResult.errors);
                return null;
            }
            
            // Save configuration
            this.configs[configId] = updatedConfig;
            this.saveConfigs();
            
            // Add new version
            this.configVersionManager.addVersion(
                configId,
                updatedConfig,
                comment || 'Configuration update'
            );
            
            logger.info(`Configuration ${configId} updated`);
            
            return updatedConfig;
        } catch (error) {
            logger.error(`Error updating configuration ${configId}:`, error);
            return null;
        }
    }
    
    /**
     * Delete a configuration
     * @param {string} configId - Configuration ID
     * @returns {boolean} Success status
     */
    deleteConfig(configId) {
        try {
            // Check if configuration exists
            const config = this._getConfigOrLogError(configId);
            if (!config) {
                return false; // Error logged in helper
            }
            
            // Delete configuration
            delete this.configs[configId];
            this.saveConfigs();
            
            logger.info(`Configuration ${configId} deleted`);
            
            return true;
        } catch (error) {
            logger.error(`Error deleting configuration ${configId}:`, error);
            return false;
        }
    }
    
    /**
     * Validate a configuration
     * @param {string} configId - Configuration ID
     * @returns {Object} Validation result
     */
    validateConfig(configId) {
        try {
            // Check if configuration exists
            if (!this.configs[configId]) {
                logger.error(`Configuration with ID ${configId} not found`);
                return { valid: false, errors: [`Configuration with ID ${configId} not found`] };
            }
            
            // Get configuration
            const config = this.configs[configId];
            
            // Get template ID
            const templateId = config._template;
            
            if (!templateId) {
                logger.error(`No template specified for configuration ${configId}`);
                return { valid: false, errors: ['No template specified for configuration'] };
            }
            
            // Validate configuration
            return this.configValidator.validateConfigAgainstTemplate(
                config,
                templateId
            );
        } catch (error) {
            logger.error(`Error validating configuration ${configId}:`, error);
            return { valid: false, errors: [`Validation error: ${error.message}`] };
        }
    }
    
    /**
     * Validate all configurations
     * @returns {Object} Validation results
     */
    validateAllConfigs() {
        try {
            return this.configValidator.validateAllConfigs(Object.values(this.configs));
        } catch (error) {
            logger.error('Error validating all configurations:', error);
            return { valid: false, errors: [`Validation error: ${error.message}`] };
        }
    }
    
    /**
     * Clone a configuration
     * @param {string} configId - Configuration ID
     * @param {string} newName - Name for the cloned configuration
     * @returns {Object|null} Cloned configuration or null if failed
     */
    cloneConfig(configId, newName) {
        try {
            // Check if configuration exists
            if (!this.configs[configId]) {
                logger.error(`Configuration with ID ${configId} not found`);
                return null;
            }
            
            // Get configuration to clone
            const config = this.configs[configId];
            
            // Create clone data (exclude metadata)
            const cloneData = { ...config };
            
            for (const key of Object.keys(cloneData)) {
                if (key.startsWith('_')) {
                    delete cloneData[key];
                }
            }
            
            // Create new configuration
            const newConfig = this.createConfig(
                config._template,
                cloneData,
                newName || `${config._name} (Clone)`
            );
            
            if (!newConfig) {
                logger.error(`Error cloning configuration ${configId}`);
                return null;
            }
            
            logger.info(`Configuration ${configId} cloned to ${newConfig._id}`);
            
            return newConfig;
        } catch (error) {
            logger.error(`Error cloning configuration ${configId}:`, error);
            return null;
        }
    }
    
    /**
     * Reset a configuration to template defaults
     * @param {string} configId - Configuration ID
     * @returns {Object|null} Reset configuration or null if failed
     */
    resetConfig(configId) {
        try {
            // Get configuration or log error
            const config = this._getConfigOrLogError(configId);
            if (!config) {
                return null; // Error logged in helper
            }
            
            // Get template ID
            const templateId = config._template;
            
            if (!templateId) {
                logger.error(`No template specified for configuration ${configId}`);
                return null;
            }
            
            // Get template
            const template = this.configTemplateManager.getTemplate(templateId);
            
            if (!template) {
                logger.error(`Template with ID ${templateId} not found`);
                return null;
            }
            
            // Create reset configuration
            return this.updateConfig(
                configId,
                template.defaultConfig,
                'Reset to template defaults'
            );
        } catch (error) {
            logger.error(`Error resetting configuration ${configId}:`, error);
            return null;
        }
    }
    
    /**
     * Import a configuration
     * @param {Object} config - Configuration object to import
     * @returns {Object|null} Imported configuration or null if failed
     */
    importConfig(config) {
        try {
            if (!config || !config._template) {
                logger.error('Invalid configuration: missing required fields');
                return null;
            }
            
            // Check if template exists
            const template = this.configTemplateManager.getTemplate(config._template);
            
            if (!template) {
                logger.error(`Template with ID ${config._template} not found`);
                return null;
            }
            
            // Create configuration ID if not provided
            const configId = config._id || `config_${Date.now()}`;
            
            // Create configuration with metadata
            const importedConfig = {
                ...config,
                _id: configId,
                _name: config._name || `${template.name} Configuration`,
                _imported: Date.now(),
                _updated: Date.now()
            };
            
            // Validate configuration
            const validationResult = this.configValidator.validateConfigAgainstTemplate(
                importedConfig,
                config._template
            );
            
            if (!validationResult.valid) {
                logger.error(`Invalid imported configuration:`, validationResult.errors);
                return null;
            }
            
            // Save configuration
            this.configs[configId] = importedConfig;
            this.saveConfigs();
            
            // Add initial version
            this.configVersionManager.addVersion(
                configId,
                importedConfig,
                'Imported configuration'
            );
            
            logger.info(`Configuration ${configId} imported`);
            
            return importedConfig;
        } catch (error) {
            logger.error('Error importing configuration:', error);
            return null;
        }
    }
    
    /**
     * Export a configuration
     * @param {string} configId - Configuration ID
     * @returns {Object|null} Exported configuration or null if failed
     */
    exportConfig(configId) {
        try {
            // Check if configuration exists
            if (!this.configs[configId]) {
                logger.error(`Configuration with ID ${configId} not found`);
                return null;
            }
            
            // Get configuration
            const config = this.configs[configId];
            
            // Create export object
            const exportObj = {
                ...config,
                _exported: Date.now()
            };
            
            logger.info(`Configuration ${configId} exported`);
            
            return exportObj;
        } catch (error) {
            logger.error(`Error exporting configuration ${configId}:`, error);
            return null;
        }
    }
    
    /**
     * Get version history for a configuration
     * @param {string} configId - Configuration ID
     * @returns {Array} Version history
     */
    getVersionHistory(configId) {
        return this.configVersionManager.getVersionHistory(configId);
    }
    
    /**
     * Get a specific version of a configuration
     * @param {string} configId - Configuration ID
     * @param {number} version - Version number
     * @returns {Object|null} Version info or null if not found
     */
    getVersion(configId, version) {
        return this.configVersionManager.getVersion(configId, version);
    }
    
    /**
     * Restore a configuration to a specific version
     * @param {string} configId - Configuration ID
     * @param {number} version - Version number
     * @returns {Object|null} Restored configuration or null if failed
     */
    restoreVersion(configId, version) {
        try {
            // Check if configuration exists
            if (!this.configs[configId]) {
                logger.error(`Configuration with ID ${configId} not found`);
                return null;
            }
            
            // Restore version
            const restoredConfig = this.configVersionManager.restoreVersion(configId, version);
            
            if (!restoredConfig) {
                logger.error(`Error restoring version ${version} for configuration ${configId}`);
                return null;
            }
            
            // Update configuration
            this.configs[configId] = {
                ...restoredConfig,
                _updated: Date.now()
            };
            
            // Save configurations
            this.saveConfigs();
            
            logger.info(`Configuration ${configId} restored to version ${version}`);
            
            return this.configs[configId];
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
     * @returns {Object|null} Comparison result or null if failed
     */
    compareVersions(configId, version1, version2) {
        return this.configVersionManager.compareVersions(configId, version1, version2);
    }
    
    /**
     * Auto-fix a configuration
     * @param {string} configId - Configuration ID
     * @returns {Object|null} Fixed configuration or null if failed
     */
    autoFixConfig(configId) {
        try {
            // Check if configuration exists
            if (!this.configs[configId]) {
                logger.error(`Configuration with ID ${configId} not found`);
                return null;
            }
            
            // Get configuration
            const config = this.configs[configId];
            
            // Get template ID
            const templateId = config._template;
            
            if (!templateId) {
                logger.error(`No template specified for configuration ${configId}`);
                return null;
            }
            
            // Auto-fix configuration
            const fixedConfig = this.configValidator.autoFixConfig(config, templateId);
            
            // Update configuration
            return this.updateConfig(
                configId,
                fixedConfig,
                'Auto-fixed configuration'
            );
        } catch (error) {
            logger.error(`Error auto-fixing configuration ${configId}:`, error);
            return null;
        }
    }
    
    /**
     * Generate a configuration report
     * @param {string} configId - Configuration ID
     * @returns {Object|null} Configuration report or null if failed
     */
    generateConfigReport(configId) {
        try {
            // Check if configuration exists
            if (!this.configs[configId]) {
                logger.error(`Configuration with ID ${configId} not found`);
                return null;
            }
            
            // Get configuration
            const config = this.configs[configId];
            
            // Get template
            const template = this.configTemplateManager.getTemplate(config._template);
            
            if (!template) {
                logger.error(`Template with ID ${config._template} not found`);
                return null;
            }
            
            // Get validation result
            const validationResult = this.validateConfig(configId);
            
            // Get version history
            const versionHistory = this.getVersionHistory(configId);
            
            // Create report
            const report = {
                configId,
                name: config._name,
                template: {
                    id: template.id,
                    name: template.name,
                    description: template.description,
                    version: template.version
                },
                validation: validationResult,
                created: config._created,
                updated: config._updated,
                versions: versionHistory.length,
                latestVersion: versionHistory.length > 0 ? versionHistory[versionHistory.length - 1].version : null,
                properties: {}
            };
            
            // Add property details from schema
            if (template.configSchema && template.configSchema.properties) {
                for (const [propName, propSchema] of Object.entries(template.configSchema.properties)) {
                    report.properties[propName] = {
                        description: propSchema.description || '',
                        required: template.configSchema.required && template.configSchema.required.includes(propName),
                        type: propSchema.type || 'unknown',
                        value: config[propName],
                        default: propSchema.default,
                        constraints: {}
                    };
                    
                    // Add constraints
                    for (const constraint of ['minimum', 'maximum', 'minLength', 'maxLength', 'pattern', 'enum']) {
                        if (propSchema[constraint] !== undefined) {
                            report.properties[propName].constraints[constraint] = propSchema[constraint];
                        }
                    }
                }
            }
            
            return report;
        } catch (error) {
            logger.error(`Error generating configuration report for ${configId}:`, error);
            return null;
        }
    }
    
    // --- Private Helper Methods ---
    
    /**
     * Retrieves a configuration by ID, logging an error if not found.
     * @param {string} configId - Configuration ID
     * @returns {Object|null} Configuration object or null if not found
     * @private
     */
    _getConfigOrLogError(configId) {
        const config = this.configs[configId];
        if (!config) {
            logger.error(`Configuration with ID ${configId} not found`);
            return null;
        }
        return config;
    }
}

// Create singleton instance
const advancedConfigManager = new AdvancedConfigManager();

// Export for use in other modules
export default advancedConfigManager;
