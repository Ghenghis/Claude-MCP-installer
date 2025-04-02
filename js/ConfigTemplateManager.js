/**
 * ConfigTemplateManager.js - Manages configuration templates for different server types
 * Provides predefined templates for common MCP server configurations
 */

import logger from './logger.js';

class ConfigTemplateManager {
    constructor() {
        this.templates = {};
        this.defaultTemplates = {};
        
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
        // Initialize each server type template using helper methods
        this._initBraveSearchTemplate();
        this._initFilesystemTemplate();
        this._initGithubTemplate();
        this._initSequentialThinkingTemplate();
        this._initMemoryTemplate();
        this._initCustomTemplate();
        
        // Continue with other templates as needed
        logger.info('Default templates initialized successfully');
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
     * Initialize the Brave Search MCP server template
     * @private
     */
    _initBraveSearchTemplate() {
        this.defaultTemplates['brave-search'] = {
            id: 'brave-search',
            name: 'Brave Search MCP Server',
            description: 'Template for Brave Search MCP server configuration',
            version: '1.0.0',
            serverType: 'brave-search',
            configSchema: {
                type: 'object',
                required: ['port', 'host', 'api_key'],
                properties: {
                    ...this._createCommonSchemaProperties(), // Include common properties
                    port: { // Override default port
                        type: 'number',
                        minimum: 1024,
                        maximum: 65535,
                        default: 3000,
                        description: 'Port number for the server'
                    },
                    api_key: {
                        type: 'string',
                        description: 'Brave Search API key'
                    },
                    timeout: {
                        type: 'number',
                        minimum: 1000,
                        default: 30000,
                        description: 'Request timeout in milliseconds'
                    },
                    max_requests_per_minute: {
                        type: 'number',
                        minimum: 1,
                        default: 60,
                        description: 'Maximum number of requests per minute'
                    },
                    cache_enabled: {
                        type: 'boolean',
                        default: true,
                        description: 'Enable response caching'
                    },
                    cache_ttl: {
                        type: 'number',
                        minimum: 60,
                        default: 3600,
                        description: 'Cache TTL in seconds'
                    },
                    search_settings: {
                        type: 'object',
                        properties: {
                            default_search_type: {
                                type: 'string',
                                enum: ['web', 'news', 'local'],
                                default: 'web',
                                description: 'Default search type'
                            },
                            default_results_count: {
                                type: 'number',
                                minimum: 1,
                                maximum: 20,
                                default: 10,
                                description: 'Default number of results to return'
                            },
                            content_filter: {
                                type: 'string',
                                enum: ['strict', 'moderate', 'off'],
                                default: 'moderate',
                                description: 'Content filter setting'
                            }
                        }
                    }
                }
            },
            defaultConfig: {
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
            }
        };
    }
    
    /**
     * Initialize the Filesystem MCP server template
     * @private
     */
    _initFilesystemTemplate() {
        this.defaultTemplates['filesystem'] = {
            id: 'filesystem',
            name: 'Filesystem MCP Server',
            description: 'Template for Filesystem MCP server configuration',
            version: '1.0.0',
            serverType: 'filesystem',
            configSchema: {
                type: 'object',
                required: ['port', 'host', 'allowed_directories'],
                properties: {
                    ...this._createCommonSchemaProperties(), // Include common properties
                    port: { // Override default port
                        type: 'number',
                        minimum: 1024,
                        maximum: 65535,
                        default: 3001,
                        description: 'Port number for the server'
                    },
                    allowed_directories: {
                        type: 'array',
                        items: {
                            type: 'string'
                        },
                        description: 'List of directories that can be accessed'
                    },
                    timeout: {
                        type: 'number',
                        minimum: 1000,
                        default: 30000,
                        description: 'File operation timeout in milliseconds'
                    },
                    max_file_size: {
                        type: 'number',
                        minimum: 1,
                        default: 10485760, // 10MB
                        description: 'Maximum file size in bytes'
                    },
                    cache_enabled: {
                        type: 'boolean',
                        default: true,
                        description: 'Enable file caching'
                    },
                    operation_timeout: {
                        type: 'number',
                        minimum: 1000,
                        default: 5000,
                        description: 'Timeout for file operations in milliseconds'
                    }
                }
            },
            defaultConfig: {
                port: 3001,
                host: 'localhost',
                allowed_directories: [],
                timeout: 30000,
                max_file_size: 10485760,
                log_level: 'info',
                cache_enabled: true,
                operation_timeout: 5000
            }
        };
    }
    
    /**
     * Initialize the GitHub MCP server template
     * @private
     */
    _initGithubTemplate() {
        this.defaultTemplates['github'] = {
            id: 'github',
            name: 'GitHub MCP Server',
            description: 'Template for GitHub MCP server configuration',
            version: '1.0.0',
            serverType: 'github',
            configSchema: {
                type: 'object',
                required: ['port', 'host', 'auth_token'],
                properties: {
                    ...this._createCommonSchemaProperties(), // Include common properties
                    port: { // Override default port
                        type: 'number',
                        minimum: 1024,
                        maximum: 65535,
                        default: 3002,
                        description: 'Port number for the server'
                    },
                    auth_token: {
                        type: 'string',
                        description: 'GitHub Personal Access Token'
                    },
                    api_base_url: {
                        type: 'string',
                        default: 'https://api.github.com',
                        description: 'GitHub API base URL'
                    },
                    timeout: {
                        type: 'number',
                        minimum: 1000,
                        default: 30000,
                        description: 'API request timeout in milliseconds'
                    },
                    cache_enabled: {
                        type: 'boolean',
                        default: true,
                        description: 'Enable response caching'
                    },
                    cache_ttl: {
                        type: 'number',
                        minimum: 60,
                        default: 300,
                        description: 'Cache TTL in seconds'
                    },
                    rate_limit_handling: {
                        type: 'boolean',
                        default: true,
                        description: 'Enable automatic handling of rate limits'
                    }
                }
            },
            defaultConfig: {
                port: 3002,
                host: 'localhost',
                api_base_url: 'https://api.github.com',
                timeout: 30000,
                cache_enabled: true,
                cache_ttl: 300,
                rate_limit_handling: true,
                log_level: 'info'
            }
        };
    }
    
    /**
     * Initialize the Sequential Thinking MCP server template
     * @private
     */
    _initSequentialThinkingTemplate() {
        this.defaultTemplates['sequential-thinking'] = {
            id: 'sequential-thinking',
            name: 'Sequential Thinking MCP Server',
            description: 'Template for Sequential Thinking MCP server configuration',
            version: '1.0.0',
            serverType: 'sequential-thinking',
            configSchema: {
                type: 'object',
                required: ['port', 'host'],
                properties: {
                    ...this._createCommonSchemaProperties(), // Include common properties
                    port: { // Override default port
                        type: 'number',
                        minimum: 1024,
                        maximum: 65535,
                        default: 3003,
                        description: 'Port number for the server'
                    },
                    max_thoughts: {
                        type: 'number',
                        minimum: 1,
                        maximum: 100,
                        default: 20,
                        description: 'Maximum number of thoughts per session'
                    },
                    default_total_thoughts: {
                        type: 'number',
                        minimum: 1,
                        maximum: 50,
                        default: 5,
                        description: 'Default number of total thoughts'
                    },
                    thought_validation: {
                        type: 'boolean',
                        default: true,
                        description: 'Enable thought validation'
                    },
                    timeout: {
                        type: 'number',
                        minimum: 1000,
                        default: 60000,
                        description: 'Session timeout in milliseconds'
                    }
                }
            },
            defaultConfig: {
                port: 3003,
                host: 'localhost',
                max_thoughts: 20,
                default_total_thoughts: 5,
                thought_validation: true,
                timeout: 60000,
                log_level: 'info'
            }
        };
    }
    
    /**
     * Initialize the Memory MCP server template
     * @private
     */
    _initMemoryTemplate() {
        this.defaultTemplates['memory'] = {
            id: 'memory',
            name: 'Memory MCP Server',
            description: 'Template for Memory MCP server configuration',
            version: '1.0.0',
            serverType: 'memory',
            configSchema: {
                type: 'object',
                required: ['port', 'host'],
                properties: {
                    ...this._createCommonSchemaProperties(), // Include common properties
                    port: { // Override default port
                        type: 'number',
                        minimum: 1024,
                        maximum: 65535,
                        default: 3004,
                        description: 'Port number for the server'
                    },
                    storage_type: {
                        type: 'string',
                        enum: ['memory', 'file', 'database'],
                        default: 'memory',
                        description: 'Storage type for the memory server'
                    },
                    storage_path: {
                        type: 'string',
                        description: 'Path for file-based storage (if storage_type is file)'
                    },
                    database_connection: {
                        type: 'object',
                        properties: {
                            url: {
                                type: 'string',
                                description: 'Database connection URL'
                            },
                            auth_required: {
                                type: 'boolean',
                                default: false,
                                description: 'Whether authentication is required'
                            },
                            username: {
                                type: 'string',
                                description: 'Database username'
                            },
                            password: {
                                type: 'string',
                                description: 'Database password'
                            }
                        },
                        description: 'Database connection details (if storage_type is database)'
                    },
                    max_entity_count: {
                        type: 'number',
                        minimum: 100,
                        default: 10000,
                        description: 'Maximum number of entities to store'
                    },
                    backup_enabled: {
                        type: 'boolean',
                        default: true,
                        description: 'Enable automatic backups'
                    },
                    backup_interval: {
                        type: 'number',
                        minimum: 60,
                        default: 3600,
                        description: 'Backup interval in seconds'
                    }
                }
            },
            defaultConfig: {
                port: 3004,
                host: 'localhost',
                storage_type: 'memory',
                max_entity_count: 10000,
                backup_enabled: true,
                backup_interval: 3600,
                log_level: 'info'
            }
        };
    }
    
    /**
     * Initialize the Custom MCP server template
     * @private
     */
    _initCustomTemplate() {
        this.defaultTemplates['custom'] = {
            id: 'custom',
            name: 'Custom MCP Server',
            description: 'Template for custom MCP server configuration',
            version: '1.0.0',
            serverType: 'custom',
            configSchema: {
                type: 'object',
                required: ['port', 'server_name', 'command'],
                properties: {
                    ...this._createCommonSchemaProperties(), // Include common properties
                    port: { // Override default port
                        type: 'number',
                        minimum: 1024,
                        maximum: 65535,
                        default: 3010,
                        description: 'Port number for the server'
                    },
                    server_name: {
                        type: 'string',
                        description: 'Name of the custom server'
                    },
                    command: {
                        type: 'string',
                        description: 'Command to start the server'
                    },
                    working_directory: {
                        type: 'string',
                        description: 'Working directory for the server'
                    },
                    environment_variables: {
                        type: 'object',
                        additionalProperties: {
                            type: 'string'
                        },
                        description: 'Environment variables for the server'
                    },
                    startup_args: {
                        type: 'array',
                        items: {
                            type: 'string'
                        },
                        description: 'Command line arguments to pass to the server on startup'
                    },
                    health_check_endpoint: {
                        type: 'string',
                        description: 'Endpoint for server health checks'
                    },
                    health_check_interval: {
                        type: 'number',
                        minimum: 1000,
                        default: 30000,
                        description: 'Interval for health checks in milliseconds'
                    }
                }
            },
            defaultConfig: {
                port: 3010,
                host: 'localhost',
                environment_variables: {},
                startup_args: [],
                health_check_interval: 30000,
                log_level: 'info'
            }
        };
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
