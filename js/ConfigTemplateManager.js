/**
 * ConfigTemplateManager.js - Manages configuration templates for different server types
 * Provides predefined templates for common MCP server configurations
 */

import logger from './logger.js';

class ConfigTemplateManager {
    constructor() {
        this.templates = {};
        this.defaultTemplates = {};
        // Centralized definitions for cleaner registration
        this._templateDefinitions = {
            'brave-search': {
                name: 'Brave Search MCP Server',
                description: 'Configuration for the Brave Search MCP server, providing web and local search capabilities.'
            },
            'filesystem': {
                name: 'Filesystem MCP Server',
                description: 'Configuration for the Filesystem MCP server, enabling file operations.'
            },
            'github': {
                name: 'GitHub MCP Server',
                description: 'Configuration for the GitHub MCP server, interacting with GitHub repositories.'
            },
            'memory': {
                name: 'Memory MCP Server',
                description: 'Configuration for the Memory MCP server (Knowledge Graph).'
            },
            'sequential-thinking': {
                name: 'Sequential Thinking MCP Server',
                description: 'Configuration for the Sequential Thinking MCP server.'
            },
            'claude': {
                name: 'Claude Context MCP Server',
                description: 'Configuration for the Claude Context MCP server.'
            },
            'process-monitor': {
                name: 'Process Monitor MCP Server',
                description: 'Configuration for the Process Monitor MCP server.'
            },
            'generic': {
                name: 'Generic MCP Server',
                description: 'A generic template suitable for basic MCP servers.'
            }
        };
        
        // Initialize template manager
        this.initializeTemplates();
    }
    
    /**
     * Initialize configuration templates
     */
    initializeTemplates() {
        try {
            // Load templates from localStorage
            this.loadTemplates();
            
            // Initialize default templates if no templates are loaded
            if (Object.keys(this.templates).length === 0) {
                this.initializeDefaultTemplates();
                this.templates = JSON.parse(JSON.stringify(this.defaultTemplates));
                this.saveTemplates();
            }
            
            logger.info('Configuration templates initialized');
        } catch (error) {
            logger.error('Error initializing configuration templates:', error);
        }
    }
    
    /**
     * Load templates from localStorage
     */
    loadTemplates() {
        try {
            const storedTemplates = localStorage.getItem('mcp_config_templates');
            
            if (storedTemplates) {
                this.templates = JSON.parse(storedTemplates);
            }
        } catch (error) {
            logger.error('Error loading configuration templates:', error);
        }
    }
    
    /**
     * Save templates to localStorage
     */
    saveTemplates() {
        try {
            localStorage.setItem('mcp_config_templates', JSON.stringify(this.templates));
        } catch (error) {
            logger.error('Error saving configuration templates:', error);
        }
    }
    
    /**
     * Initialize default templates
     * These are the built-in templates that come with the application
     */
    initializeDefaultTemplates() {
        // Register templates using the new helper
        Object.keys(this._templateDefinitions).forEach(id => {
            try {
                this._registerTemplate(id);
            } catch (error) {
                logger.error(`Failed to register template for ${id}:`, error);
            }
        });
    }
    
    /**
     * Dynamically registers a template based on its ID.
     * @private
     * @param {string} id - The template ID (e.g., 'brave-search', 'filesystem').
     */
    _registerTemplate(id) {
        const definition = this._templateDefinitions[id];
        if (!definition) {
            logger.error(`No definition found for template ID: ${id}`);
            return;
        }

        // Construct getter method names (e.g., _getBraveSearchDefaultConfig)
        const pascalCaseId = id.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
        const defaultConfigGetter = `_get${pascalCaseId}DefaultConfig`;
        const uniqueSchemaGetter = `_get${pascalCaseId}UniqueSchema`;

        // Check if getter methods exist
        const hasDefaultGetter = typeof this[defaultConfigGetter] === 'function';
        const hasSchemaGetter = typeof this[uniqueSchemaGetter] === 'function';

        if (!hasDefaultGetter || !hasSchemaGetter) {
            logger.error(`Missing getter methods for template ID: ${id}. Expected ${defaultConfigGetter} (found: ${hasDefaultGetter}) and ${uniqueSchemaGetter} (found: ${hasSchemaGetter})`);
            return;
        }

        // Get configurations by calling the dynamically determined methods
        const uniqueDefaultConfig = this[defaultConfigGetter]();
        const uniqueSchemaConfig = this[uniqueSchemaGetter]();

        // Group metadata
        const metadata = {
            id,
            name: definition.name,
            description: definition.description
        };

        // Call the main define function
        this._defineTemplate(metadata, uniqueSchemaConfig, uniqueDefaultConfig);
    }
    
    /**
     * Helper method to define a template with standardized structure
     * @private
     * @param {Object} metadata - Template metadata (id, name, description)
     * @param {Object} uniqueSchemaConfig - Object with unique schema parts (port, required, properties)
     * @param {Object} uniqueDefaultConfig - Object with unique default config values
     */
    _defineTemplate(metadata, uniqueSchemaConfig, uniqueDefaultConfig) {
        try {
            const { id, name, description } = metadata;
            
            // Validate inputs first
            if (!this._validateDefineTemplateInputs(metadata, uniqueSchemaConfig, uniqueDefaultConfig)) {
                return;
            }

            const commonProperties = this._createCommonSchemaProperties();
            
            // --- Construct Default Config --- 
            const finalDefaultConfig = this._constructFinalDefaultConfig(uniqueSchemaConfig, uniqueDefaultConfig, commonProperties);
            
            // --- Construct Schema --- 
            const finalSchema = this._constructFinalSchema(uniqueSchemaConfig, commonProperties);
            
            this.defaultTemplates[id] = {
                id,
                name,
                version: '1.0.0',
                serverType: id,
                description,
                configSchema: finalSchema,
                defaultConfig: finalDefaultConfig // Use the constructed default config
            };
        } catch (error) {
            logger.error('Error defining template:', error);
        }
    }
    
    /**
     * Validates the inputs required for defining a template.
     * @private
     * @param {Object} metadata - Template metadata (id, name, description).
     * @param {Object} uniqueSchemaConfig - Unique schema parts.
     * @param {Object} uniqueDefaultConfig - Unique default config values.
     * @returns {boolean} True if inputs are valid, false otherwise.
     */
    _validateDefineTemplateInputs(metadata, uniqueSchemaConfig, uniqueDefaultConfig) {
        const { id, name, description } = metadata || {}; // Destructure safely

        const isIdValid = !!id;
        const isNameValid = !!name;
        const isDescriptionValid = !!description;
        const isSchemaConfigValid = !!uniqueSchemaConfig;
        const isDefaultConfigValid = !!uniqueDefaultConfig;

        const allInputsValid = isIdValid && isNameValid && isDescriptionValid &&
                               isSchemaConfigValid && isDefaultConfigValid;

        if (!allInputsValid) {
            logger.error('Invalid template definition: Missing one or more required inputs.');
            // Optionally log which specific inputs are missing if needed for debugging
        }

        return allInputsValid;
    }
    
    /**
     * Constructs the final default configuration object by merging base defaults with unique ones.
     * @private
     * @param {Object} uniqueSchemaConfig - Unique schema parts (used for default port).
     * @param {Object} uniqueDefaultConfig - Unique default config values.
     * @param {Object} commonProperties - Common schema properties (used for base defaults).
     * @returns {Object} The final default configuration object.
     */
    _constructFinalDefaultConfig(uniqueSchemaConfig, uniqueDefaultConfig, commonProperties) {
        const baseDefaultConfig = {
            port: uniqueSchemaConfig.port || commonProperties.port.default, // Use specific port or common default
            host: commonProperties.host.default,
            timeout: commonProperties.timeout.default,
            log_level: commonProperties.log_level.default,
        };
        return {
            ...baseDefaultConfig,
            ...uniqueDefaultConfig // Merge unique defaults
        };
    }
    
    /**
     * Creates a base set of common configuration schema properties.
     * @private
     * @returns {Object} Object containing common schema properties.
     */
    _createCommonSchemaProperties() {
        return {
            port: {
                type: 'number',
                minimum: 1024,
                maximum: 65535,
                default: 3000, // Generic default, override in specific templates
                description: 'Port number for the server'
            },
            host: {
                type: 'string',
                default: 'localhost',
                description: 'Host address for the server'
            },
            timeout: {
                type: 'number',
                minimum: 1000,
                default: 30000,
                description: 'Request timeout in milliseconds'
            },
            log_level: {
                type: 'string',
                enum: ['error', 'warn', 'info', 'debug'],
                default: 'info',
                description: 'Logging level'
            }
        };
    }
    
    /**
     * Constructs the final schema object by merging common and unique schema parts.
     * @private
     * @param {Object} uniqueSchemaConfig - Unique schema parts.
     * @param {Object} commonProperties - Common schema properties.
     * @returns {Object} The final schema object.
     */
    _constructFinalSchema(uniqueSchemaConfig, commonProperties) {
        // Clone common properties to avoid modifying the original object
        const localCommonProperties = JSON.parse(JSON.stringify(commonProperties));

        // Override the port in common properties if specified in unique schema
        if (uniqueSchemaConfig.port) {
            localCommonProperties.port = {
                ...localCommonProperties.port,
                default: uniqueSchemaConfig.port
            };
        }

        // Combine required fields: common ones + unique ones
        const commonRequired = ['port', 'host']; // Base required fields
        const uniqueRequired = uniqueSchemaConfig.required || [];
        const finalRequired = [...new Set([...commonRequired, ...uniqueRequired])];

        return {
            type: 'object',
            required: finalRequired,
            properties: {
                ...localCommonProperties,
                ...uniqueSchemaConfig.properties // Merge unique properties
            }
        };
    }
    
    /**
     * Helper to create a schema definition for a nested object property.
     * @private
     * @param {Object} properties - The schema definitions for the nested properties.
     * @param {Object} defaultObject - The default configuration object for this nested level.
     * @returns {Object} The complete schema definition for the nested object.
     */
    _createNestedObjectSchema(properties, defaultObject) {
        return {
            type: 'object',
            properties: properties,
            default: defaultObject
        };
    }
    
    /**
     * Gets the default configuration for the Brave Search MCP server template.
     * @private
     * @returns {Object} Default configuration object.
     */
    _getBraveSearchDefaultConfig() {
        return {
            port: 3000,
            host: 'localhost',
            timeout: 30000,
            max_requests_per_minute: 60,
            cache_enabled: true,
            cache_ttl: 3600,
            log_level: 'info',
            search_settings: {
                default_search_type: 'web',
                default_results_count: 10,
                content_filter: 'moderate'
            }
        };
    }

    /**
     * Gets the unique schema configuration for the Brave Search MCP server template.
     * @private
     * @returns {Object} Unique schema configuration object.
     */
    _getBraveSearchUniqueSchema() {
        const defaultConfig = this._getBraveSearchDefaultConfig(); // Needed for default values in schema
        return {
            port: 3000, // Specific default port for this template
            required: ['api_key'], // Only fields beyond common [port, host]
            properties: {
                api_key: { type: 'string', description: 'Brave Search API key' },
                max_requests_per_minute: { type: 'number', minimum: 1, default: defaultConfig.max_requests_per_minute, description: 'Maximum requests per minute' },
                cache_enabled: { type: 'boolean', default: defaultConfig.cache_enabled, description: 'Enable response caching' },
                cache_ttl: { type: 'number', minimum: 60, default: defaultConfig.cache_ttl, description: 'Cache TTL in seconds' },
                search_settings: this._createNestedObjectSchema(
                    { // Properties for search_settings
                        default_search_type: { type: 'string', enum: ['web', 'local'], default: defaultConfig.search_settings.default_search_type, description: 'Default search type' },
                        default_results_count: { type: 'number', minimum: 1, maximum: 20, default: defaultConfig.search_settings.default_results_count, description: 'Default number of results' },
                        content_filter: { type: 'string', enum: ['off', 'moderate', 'strict'], default: defaultConfig.search_settings.content_filter, description: 'Content filter level' }
                    },
                    defaultConfig.search_settings // Default object for search_settings
                )
            }
        };
    }
    
    /**
     * Gets the default configuration for the Filesystem MCP server template.
     * @private
     * @returns {Object} Default configuration object.
     */
    _getFilesystemDefaultConfig() {
        return {
            port: 3001,
            host: 'localhost',
            timeout: 30000,
            log_level: 'info',
            allowed_directories: [],
            max_file_size: 10485760, // 10MB
            cache_enabled: true,
            operation_timeout: 5000
        };
    }

    /**
     * Gets the unique schema configuration for the Filesystem MCP server template.
     * @private
     * @returns {Object} Unique schema configuration object.
     */
    _getFilesystemUniqueSchema() {
        const defaultConfig = this._getFilesystemDefaultConfig(); // Needed for defaults in schema
        return {
            port: 3001,
            required: ['allowed_directories'],
            properties: {
                allowed_directories: { type: 'array', items: { type: 'string' }, description: 'List of directories that can be accessed', default: defaultConfig.allowed_directories },
                max_file_size: { type: 'number', minimum: 1, default: defaultConfig.max_file_size, description: 'Maximum file size in bytes' },
                cache_enabled: { type: 'boolean', default: defaultConfig.cache_enabled, description: 'Enable file caching' },
                operation_timeout: { type: 'number', minimum: 1000, default: defaultConfig.operation_timeout, description: 'Timeout for file operations in milliseconds' }
            }
        };
    }
    
    /**
     * Gets the default configuration for the GitHub MCP server template.
     * @private
     * @returns {Object} Default configuration object.
     */
    _getGitHubDefaultConfig() {
        return {
            port: 3002,
            host: 'localhost',
            timeout: 60000,
            log_level: 'info',
            base_url: 'https://api.github.com',
            per_page: 30,
            max_retries: 3,
            retry_delay: 1000
        };
    }

    /**
     * Gets the unique schema configuration for the GitHub MCP server template.
     * @private
     * @returns {Object} Unique schema configuration object.
     */
    _getGitHubUniqueSchema() {
        const defaultConfig = this._getGitHubDefaultConfig(); // Needed for defaults in schema
        return {
            port: 3002,
            required: ['auth_token'],
            properties: {
                auth_token: { type: 'string', description: 'GitHub Personal Access Token (PAT)' },
                base_url: { type: 'string', format: 'url', default: defaultConfig.base_url, description: 'GitHub API base URL (for Enterprise)' },
                per_page: { type: 'number', minimum: 1, maximum: 100, default: defaultConfig.per_page, description: 'Default results per page' },
                max_retries: { type: 'number', minimum: 0, default: defaultConfig.max_retries, description: 'Maximum retries for failed requests' },
                retry_delay: { type: 'number', minimum: 500, default: defaultConfig.retry_delay, description: 'Delay between retries in milliseconds' }
            }
        };
    }
    
    /**
     * Gets the default configuration for the Sequential Thinking MCP server template.
     * @private
     * @returns {Object} Default configuration object.
     */
    _getSequentialThinkingDefaultConfig() {
        return {
            port: 3003,
            host: 'localhost',
            timeout: 45000,
            log_level: 'info',
            max_depth: 10,
            allow_branching: true,
            pruning_enabled: false
        };
    }

    /**
     * Gets the unique schema configuration for the Sequential Thinking MCP server template.
     * @private
     * @returns {Object} Unique schema configuration object.
     */
    _getSequentialThinkingUniqueSchema() {
        const defaultConfig = this._getSequentialThinkingDefaultConfig(); // Needed for defaults
        return {
            port: 3003,
            required: [], // No unique required fields besides common ones
            properties: {
                max_depth: { type: 'number', minimum: 1, default: defaultConfig.max_depth, description: 'Maximum depth of sequential thoughts' },
                allow_branching: { type: 'boolean', default: defaultConfig.allow_branching, description: 'Allow branching of thought processes' },
                pruning_enabled: { type: 'boolean', default: defaultConfig.pruning_enabled, description: 'Enable automatic pruning of old thoughts' }
            }
        };
    }
    
    /**
     * Gets the default configuration for the Memory MCP server template.
     * @private
     * @returns {Object} Default configuration object.
     */
    _getMemoryDefaultConfig() {
        return {
            port: 3004,
            host: 'localhost',
            timeout: 30000,
            log_level: 'info',
            database_path: './memory_db.json',
            autosave_interval: 60000 // 1 minute
        };
    }

    /**
     * Gets the unique schema configuration for the Memory MCP server template.
     * @private
     * @returns {Object} Unique schema configuration object.
     */
    _getMemoryUniqueSchema() {
        const defaultConfig = this._getMemoryDefaultConfig(); // Needed for defaults
        return {
            port: 3004,
            required: ['database_path'],
            properties: {
                database_path: { type: 'string', description: 'Path to the memory database file', default: defaultConfig.database_path },
                autosave_interval: { type: 'number', minimum: 10000, default: defaultConfig.autosave_interval, description: 'Autosave interval in milliseconds' }
            }
        };
    }
    
    /**
     * Gets the default configuration for the Generic MCP server template.
     * @private
     * @returns {Object} Default configuration object.
     */
    _getGenericMCPDefaultConfig() {
        return {
            port: 3000, // Default generic port
            host: 'localhost',
            timeout: 15000,
            log_level: 'info'
            // No other unique defaults for the most basic template
        };
    }

    /**
     * Gets the unique schema configuration for the Generic MCP server template.
     * @private
     * @returns {Object} Unique schema configuration object.
     */
    _getGenericMCPUniqueSchema() {
        // const defaultConfig = this._getGenericMCPDefaultConfig(); // Needed if schema had defaults
        return {
            port: 3000,
            required: [], // No unique required properties
            properties: {
                // No unique properties for the most basic template
            }
        };
    }
    
    /**
     * Register any custom templates
     * This method can be extended to add more templates
     * @private
     */
    _registerCustomTemplates() {
        // Register custom templates here
        // Example:
        // this._registerCustomApiTemplate();
    }
    
    /**
     * Get all available templates
     * @returns {Object} All available templates
     */
    getAllTemplates() {
        return { ...this.templates };
    }
    
    /**
     * Get default templates
     * @returns {Object} Default templates
     */
    getDefaultTemplates() {
        return { ...this.defaultTemplates };
    }
    
    /**
     * Get a template by ID
     * @param {string} templateId - Template ID
     * @returns {Object|null} Template object or null if not found
     */
    getTemplate(templateId) {
        return this.templates[templateId] || null;
    }
    
    /**
     * Create a new template
     * @param {Object} template - Template object
     * @returns {boolean} Success status
     */
    createTemplate(template) {
        try {
            // Validate template
            if (!template.id || !template.name || !template.serverType) {
                logger.error('Invalid template: missing required fields');
                return false;
            }
            
            // Check if template already exists
            if (this.templates[template.id]) {
                logger.error(`Template with ID ${template.id} already exists`);
                return false;
            }
            
            // Add template
            this.templates[template.id] = { ...template };
            
            // Save templates
            this.saveTemplates();
            
            logger.info(`Template ${template.id} created`);
            
            return true;
        } catch (error) {
            logger.error(`Error creating template ${template.id}:`, error);
            return false;
        }
    }
    
    /**
     * Update an existing template
     * @param {string} templateId - Template ID
     * @param {Object} template - Updated template object
     * @returns {boolean} Success status
     */
    updateTemplate(templateId, template) {
        try {
            // Check if template exists
            if (!this.templates[templateId]) {
                logger.error(`Template with ID ${templateId} not found`);
                return false;
            }
            
            // Update template
            this.templates[templateId] = { ...template };
            
            // Save templates
            this.saveTemplates();
            
            logger.info(`Template ${templateId} updated`);
            
            return true;
        } catch (error) {
            logger.error(`Error updating template ${templateId}:`, error);
            return false;
        }
    }
    
    /**
     * Delete a template
     * @param {string} templateId - Template ID
     * @returns {boolean} Success status
     */
    deleteTemplate(templateId) {
        try {
            // Check if template exists
            if (!this.templates[templateId]) {
                logger.error(`Template with ID ${templateId} not found`);
                return false;
            }
            
            // Check if it's a default template
            if (this.defaultTemplates[templateId]) {
                logger.error(`Cannot delete default template ${templateId}`);
                return false;
            }
            
            // Delete template
            delete this.templates[templateId];
            
            // Save templates
            this.saveTemplates();
            
            logger.info(`Template ${templateId} deleted`);
            
            return true;
        } catch (error) {
            logger.error(`Error deleting template ${templateId}:`, error);
            return false;
        }
    }
    
    /**
     * Reset a template to its default values
     * @param {string} templateId - Template ID
     * @returns {boolean} Success status
     */
    resetTemplate(templateId) {
        try {
            // Check if it's a default template
            if (!this.defaultTemplates[templateId]) {
                logger.error(`No default template found for ${templateId}`);
                return false;
            }
            
            // Reset template to default
            this.templates[templateId] = JSON.parse(JSON.stringify(this.defaultTemplates[templateId]));
            
            // Save templates
            this.saveTemplates();
            
            logger.info(`Template ${templateId} reset to default`);
            
            return true;
        } catch (error) {
            logger.error(`Error resetting template ${templateId}:`, error);
            return false;
        }
    }
    
    /**
     * Reset all templates to their default values
     * @returns {boolean} Success status
     */
    resetAllTemplates() {
        try {
            // Reset all templates to defaults
            this.templates = JSON.parse(JSON.stringify(this.defaultTemplates));
            
            // Save templates
            this.saveTemplates();
            
            logger.info('All templates reset to defaults');
            
            return true;
        } catch (error) {
            logger.error('Error resetting all templates:', error);
            return false;
        }
    }
    
    /**
     * Generate a configuration from a template
     * @param {string} templateId - Template ID
     * @param {Object} overrides - Configuration overrides
     * @returns {Object|null} Generated configuration or null if failed
     */
    generateConfig(templateId, overrides = {}) {
        try {
            // Get template
            const template = this.getTemplate(templateId);
            
            if (!template) {
                logger.error(`Template with ID ${templateId} not found`);
                return null;
            }
            
            // Create configuration from default and overrides
            const config = {
                ...template.defaultConfig,
                ...overrides
            };
            
            // Add metadata
            config._template = templateId;
            config._generated = Date.now();
            config._version = template.version;
            
            return config;
        } catch (error) {
            logger.error(`Error generating configuration from template ${templateId}:`, error);
            return null;
        }
    }
}

// Create singleton instance
const configTemplateManager = new ConfigTemplateManager();

// Export for use in other modules
export default configTemplateManager;
