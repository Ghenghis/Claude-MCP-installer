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
        // Brave Search Server Template
        this.defaultTemplates['brave-search'] = {
            id: 'brave-search',
            name: 'Brave Search MCP Server',
            description: 'Template for Brave Search MCP server configuration',
            version: '1.0.0',
            serverType: 'brave-search',
            configSchema: {
                type: 'object',
                required: ['api_key', 'port', 'host'],
                properties: {
                    api_key: {
                        type: 'string',
                        description: 'Brave Search API key'
                    },
                    port: {
                        type: 'number',
                        minimum: 1024,
                        maximum: 65535,
                        default: 3000,
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
                    log_level: {
                        type: 'string',
                        enum: ['error', 'warn', 'info', 'debug'],
                        default: 'info',
                        description: 'Logging level'
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
                log_level: 'info'
            }
        };
        
        // Filesystem Server Template
        this.defaultTemplates['filesystem'] = {
            id: 'filesystem',
            name: 'Filesystem MCP Server',
            description: 'Template for Filesystem MCP server configuration',
            version: '1.0.0',
            serverType: 'filesystem',
            configSchema: {
                type: 'object',
                required: ['port', 'root_directories'],
                properties: {
                    port: {
                        type: 'number',
                        minimum: 1024,
                        maximum: 65535,
                        default: 3001,
                        description: 'Port number for the server'
                    },
                    host: {
                        type: 'string',
                        default: 'localhost',
                        description: 'Host address for the server'
                    },
                    root_directories: {
                        type: 'array',
                        items: {
                            type: 'string'
                        },
                        description: 'Root directories the server has access to'
                    },
                    allowed_extensions: {
                        type: 'array',
                        items: {
                            type: 'string'
                        },
                        description: 'List of allowed file extensions'
                    },
                    max_file_size: {
                        type: 'number',
                        minimum: 1024,
                        default: 10485760, // 10MB
                        description: 'Maximum file size in bytes'
                    },
                    read_only: {
                        type: 'boolean',
                        default: false,
                        description: 'Run server in read-only mode'
                    },
                    log_level: {
                        type: 'string',
                        enum: ['error', 'warn', 'info', 'debug'],
                        default: 'info',
                        description: 'Logging level'
                    }
                }
            },
            defaultConfig: {
                port: 3001,
                host: 'localhost',
                root_directories: [],
                max_file_size: 10485760,
                read_only: false,
                log_level: 'info'
            }
        };
        
        // GitHub MCP Server Template
        this.defaultTemplates['github'] = {
            id: 'github',
            name: 'GitHub MCP Server',
            description: 'Template for GitHub MCP server configuration',
            version: '1.0.0',
            serverType: 'github',
            configSchema: {
                type: 'object',
                required: ['access_token', 'port'],
                properties: {
                    access_token: {
                        type: 'string',
                        description: 'GitHub Personal Access Token'
                    },
                    port: {
                        type: 'number',
                        minimum: 1024,
                        maximum: 65535,
                        default: 3002,
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
                    rate_limit_enabled: {
                        type: 'boolean',
                        default: true,
                        description: 'Enable GitHub API rate limit handling'
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
                    log_level: {
                        type: 'string',
                        enum: ['error', 'warn', 'info', 'debug'],
                        default: 'info',
                        description: 'Logging level'
                    }
                }
            },
            defaultConfig: {
                port: 3002,
                host: 'localhost',
                timeout: 30000,
                rate_limit_enabled: true,
                cache_enabled: true,
                cache_ttl: 300,
                log_level: 'info'
            }
        };
        
        // Sequential Thinking Server Template
        this.defaultTemplates['sequential-thinking'] = {
            id: 'sequential-thinking',
            name: 'Sequential Thinking MCP Server',
            description: 'Template for Sequential Thinking MCP server configuration',
            version: '1.0.0',
            serverType: 'sequential-thinking',
            configSchema: {
                type: 'object',
                required: ['port'],
                properties: {
                    port: {
                        type: 'number',
                        minimum: 1024,
                        maximum: 65535,
                        default: 3003,
                        description: 'Port number for the server'
                    },
                    host: {
                        type: 'string',
                        default: 'localhost',
                        description: 'Host address for the server'
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
                    log_level: {
                        type: 'string',
                        enum: ['error', 'warn', 'info', 'debug'],
                        default: 'info',
                        description: 'Logging level'
                    }
                }
            },
            defaultConfig: {
                port: 3003,
                host: 'localhost',
                max_thoughts: 20,
                default_total_thoughts: 5,
                log_level: 'info'
            }
        };
        
        // Memory MCP Server Template
        this.defaultTemplates['memory'] = {
            id: 'memory',
            name: 'Memory MCP Server',
            description: 'Template for Memory MCP server configuration',
            version: '1.0.0',
            serverType: 'memory',
            configSchema: {
                type: 'object',
                required: ['port', 'storage_type'],
                properties: {
                    port: {
                        type: 'number',
                        minimum: 1024,
                        maximum: 65535,
                        default: 3004,
                        description: 'Port number for the server'
                    },
                    host: {
                        type: 'string',
                        default: 'localhost',
                        description: 'Host address for the server'
                    },
                    storage_type: {
                        type: 'string',
                        enum: ['memory', 'file', 'database'],
                        default: 'file',
                        description: 'Type of storage for the memory graph'
                    },
                    storage_path: {
                        type: 'string',
                        default: './memory_data',
                        description: 'Path for file-based storage'
                    },
                    backup_enabled: {
                        type: 'boolean',
                        default: true,
                        description: 'Enable automatic backups'
                    },
                    backup_interval: {
                        type: 'number',
                        minimum: 300,
                        default: 3600,
                        description: 'Backup interval in seconds'
                    },
                    log_level: {
                        type: 'string',
                        enum: ['error', 'warn', 'info', 'debug'],
                        default: 'info',
                        description: 'Logging level'
                    }
                }
            },
            defaultConfig: {
                port: 3004,
                host: 'localhost',
                storage_type: 'file',
                storage_path: './memory_data',
                backup_enabled: true,
                backup_interval: 3600,
                log_level: 'info'
            }
        };
        
        // Custom Server Template
        this.defaultTemplates['custom'] = {
            id: 'custom',
            name: 'Custom MCP Server',
            description: 'Template for custom MCP server configuration',
            version: '1.0.0',
            serverType: 'custom',
            configSchema: {
                type: 'object',
                required: ['port', 'server_name'],
                properties: {
                    server_name: {
                        type: 'string',
                        description: 'Name of the custom server'
                    },
                    port: {
                        type: 'number',
                        minimum: 1024,
                        maximum: 65535,
                        default: 3010,
                        description: 'Port number for the server'
                    },
                    host: {
                        type: 'string',
                        default: 'localhost',
                        description: 'Host address for the server'
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
                    log_level: {
                        type: 'string',
                        enum: ['error', 'warn', 'info', 'debug'],
                        default: 'info',
                        description: 'Logging level'
                    }
                }
            },
            defaultConfig: {
                port: 3010,
                host: 'localhost',
                environment_variables: {},
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
