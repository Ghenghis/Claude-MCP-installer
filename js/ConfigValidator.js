/**
 * ConfigValidator.js - Validates MCP server configurations against schemas
 * Provides configuration error checking and validation functionality
 */

import logger from './logger.js';
import configTemplateManager from './ConfigTemplateManager.js';

class ConfigValidator {
    constructor() {
        this.customValidators = {};
        
        // Initialize validator
        this.initializeValidator();
    }
    
    /**
     * Initialize validator
     */
    initializeValidator() {
        try {
            // Register custom validators
            this.registerCustomValidators();
            
            logger.info('Configuration validator initialized');
        } catch (error) {
            logger.error('Error initializing configuration validator:', error);
        }
    }
    
    /**
     * Register custom validators
     */
    registerCustomValidators() {
        // Register port availability validator
        this.registerCustomValidator('portAvailable', (value, schema, path) => {
            // In a real implementation, this would check if the port is available
            // For this demo, we'll just return true
            return { valid: true };
        });
        
        // Register path existence validator
        this.registerCustomValidator('pathExists', (value, schema, path) => {
            // In a real implementation, this would check if the path exists
            // For this demo, we'll just return true if the path is not empty
            return { 
                valid: !!value,
                errors: !value ? [`Path "${path}" does not exist`] : []
            };
        });
        
        // Register unique port validator
        this.registerCustomValidator('uniquePort', (value, schema, path, configs) => {
            if (!configs || !Array.isArray(configs)) {
                return { valid: true };
            }
            
            // Check if port is used in any other configuration
            const portConflicts = configs.filter(config => 
                config.port === value && config._id !== schema._id
            );
            
            return {
                valid: portConflicts.length === 0,
                errors: portConflicts.length > 0 ? 
                    [`Port ${value} is already in use by another server`] : []
            };
        });
    }
    
    /**
     * Register a custom validator
     * @param {string} name - Validator name
     * @param {Function} validator - Validator function
     */
    registerCustomValidator(name, validator) {
        if (typeof validator !== 'function') {
            logger.error(`Invalid validator function for ${name}`);
            return;
        }
        
        this.customValidators[name] = validator;
        logger.debug(`Registered custom validator: ${name}`);
    }
    
    /**
     * Validate a configuration against a schema
     * @param {Object} config - Configuration to validate
     * @param {Object} schema - JSON Schema to validate against
     * @param {Object} options - Validation options
     * @returns {Object} Validation result
     */
    validateConfig(config, schema, options = {}) {
        try {
            if (!config) {
                return {
                    valid: false,
                    errors: ['Configuration is empty or undefined']
                };
            }
            
            if (!schema) {
                return {
                    valid: false,
                    errors: ['Schema is empty or undefined']
                };
            }
            
            // Basic validation result structure
            const result = {
                valid: true,
                errors: [],
                warnings: []
            };
            
            // Validate required fields
            const requiredErrors = this.validateRequired(config, schema);
            if (requiredErrors.length > 0) {
                result.valid = false;
                result.errors.push(...requiredErrors);
            }
            
            // Validate types and constraints
            const typeErrors = this.validateTypes(config, schema);
            if (typeErrors.length > 0) {
                result.valid = false;
                result.errors.push(...typeErrors);
            }
            
            // Apply custom validators if specified in schema
            const customErrors = this.applyCustomValidators(config, schema, options);
            if (customErrors.length > 0) {
                result.valid = false;
                result.errors.push(...customErrors);
            }
            
            // Check for unknown properties if additionalProperties is false
            if (schema.additionalProperties === false) {
                const knownProps = Object.keys(schema.properties || {});
                const unknownProps = Object.keys(config).filter(key => !knownProps.includes(key) && !key.startsWith('_'));
                
                if (unknownProps.length > 0) {
                    result.warnings.push(`Unknown properties found: ${unknownProps.join(', ')}`);
                }
            }
            
            return result;
        } catch (error) {
            logger.error('Error validating configuration:', error);
            return {
                valid: false,
                errors: [`Validation error: ${error.message}`]
            };
        }
    }
    
    /**
     * Validate required fields
     * @param {Object} config - Configuration to validate
     * @param {Object} schema - JSON Schema to validate against
     * @returns {Array} Validation errors
     */
    validateRequired(config, schema) {
        const errors = [];
        
        // Check required fields
        if (schema.required && Array.isArray(schema.required)) {
            for (const field of schema.required) {
                if (config[field] === undefined) {
                    errors.push(`Required field "${field}" is missing`);
                }
            }
        }
        
        return errors;
    }
    
    /**
     * Validate types and constraints
     * @param {Object} config - Configuration to validate
     * @param {Object} schema - JSON Schema to validate against
     * @returns {Array} Validation errors
     */
    validateTypes(config, schema) {
        const errors = [];
        const properties = schema.properties || {};
        
        // Check each property against its schema definition
        for (const [key, value] of Object.entries(config)) {
            // Skip metadata fields
            if (key.startsWith('_')) {
                continue;
            }
            
            const propSchema = properties[key];
            
            // Skip if no schema for this property
            if (!propSchema) {
                continue;
            }
            
            // Validate type
            if (propSchema.type) {
                const typeError = this.validateType(value, propSchema.type, key);
                if (typeError) {
                    errors.push(typeError);
                    continue; // Skip further validation if type is wrong
                }
            }
            
            // Validate constraints based on type
            const constraintErrors = this.validateConstraints(value, propSchema, key);
            if (constraintErrors.length > 0) {
                errors.push(...constraintErrors);
            }
        }
        
        return errors;
    }
    
    /**
     * Validate a value against a type
     * @param {*} value - Value to validate
     * @param {string} type - Type to validate against
     * @param {string} path - Path to the value
     * @returns {string|null} Validation error or null if valid
     */
    validateType(value, type, path) {
        switch (type) {
            case 'string':
                if (typeof value !== 'string') {
                    return `Field "${path}" should be a string`;
                }
                break;
                
            case 'number':
                if (typeof value !== 'number') {
                    return `Field "${path}" should be a number`;
                }
                break;
                
            case 'integer':
                if (typeof value !== 'number' || !Number.isInteger(value)) {
                    return `Field "${path}" should be an integer`;
                }
                break;
                
            case 'boolean':
                if (typeof value !== 'boolean') {
                    return `Field "${path}" should be a boolean`;
                }
                break;
                
            case 'array':
                if (!Array.isArray(value)) {
                    return `Field "${path}" should be an array`;
                }
                break;
                
            case 'object':
                if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                    return `Field "${path}" should be an object`;
                }
                break;
                
            case 'null':
                if (value !== null) {
                    return `Field "${path}" should be null`;
                }
                break;
                
            default:
                // No type validation for unknown types
                break;
        }
        
        return null;
    }
    
    /**
     * Validate constraints on a value
     * @param {*} value - Value to validate
     * @param {Object} schema - Schema to validate against
     * @param {string} path - Path to the value
     * @returns {Array} Validation errors
     */
    validateConstraints(value, schema, path) {
        const errors = [];
        
        // Skip constraint validation if value is undefined or null
        if (value === undefined || value === null) {
            return errors;
        }
        
        switch (schema.type) {
            case 'string':
                // Validate string constraints
                if (schema.minLength !== undefined && value.length < schema.minLength) {
                    errors.push(`Field "${path}" should have a minimum length of ${schema.minLength}`);
                }
                
                if (schema.maxLength !== undefined && value.length > schema.maxLength) {
                    errors.push(`Field "${path}" should have a maximum length of ${schema.maxLength}`);
                }
                
                if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
                    errors.push(`Field "${path}" should match pattern "${schema.pattern}"`);
                }
                
                if (schema.enum && !schema.enum.includes(value)) {
                    errors.push(`Field "${path}" should be one of: ${schema.enum.join(', ')}`);
                }
                break;
                
            case 'number':
            case 'integer':
                // Validate number constraints
                if (schema.minimum !== undefined && value < schema.minimum) {
                    errors.push(`Field "${path}" should be >= ${schema.minimum}`);
                }
                
                if (schema.maximum !== undefined && value > schema.maximum) {
                    errors.push(`Field "${path}" should be <= ${schema.maximum}`);
                }
                
                if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) {
                    errors.push(`Field "${path}" should be > ${schema.exclusiveMinimum}`);
                }
                
                if (schema.exclusiveMaximum !== undefined && value >= schema.exclusiveMaximum) {
                    errors.push(`Field "${path}" should be < ${schema.exclusiveMaximum}`);
                }
                
                if (schema.multipleOf !== undefined && value % schema.multipleOf !== 0) {
                    errors.push(`Field "${path}" should be a multiple of ${schema.multipleOf}`);
                }
                break;
                
            case 'array':
                // Validate array constraints
                if (schema.minItems !== undefined && value.length < schema.minItems) {
                    errors.push(`Field "${path}" should have at least ${schema.minItems} items`);
                }
                
                if (schema.maxItems !== undefined && value.length > schema.maxItems) {
                    errors.push(`Field "${path}" should have at most ${schema.maxItems} items`);
                }
                
                if (schema.uniqueItems === true) {
                    const uniqueItems = new Set(value.map(JSON.stringify));
                    if (uniqueItems.size !== value.length) {
                        errors.push(`Field "${path}" should have unique items`);
                    }
                }
                
                // Validate array items
                if (schema.items && value.length > 0) {
                    for (let i = 0; i < value.length; i++) {
                        const itemPath = `${path}[${i}]`;
                        
                        // Validate item type
                        if (schema.items.type) {
                            const typeError = this.validateType(value[i], schema.items.type, itemPath);
                            if (typeError) {
                                errors.push(typeError);
                                continue; // Skip further validation if type is wrong
                            }
                        }
                        
                        // Validate item constraints
                        const constraintErrors = this.validateConstraints(value[i], schema.items, itemPath);
                        if (constraintErrors.length > 0) {
                            errors.push(...constraintErrors);
                        }
                    }
                }
                break;
                
            case 'object':
                // Validate object constraints
                if (schema.minProperties !== undefined && Object.keys(value).length < schema.minProperties) {
                    errors.push(`Field "${path}" should have at least ${schema.minProperties} properties`);
                }
                
                if (schema.maxProperties !== undefined && Object.keys(value).length > schema.maxProperties) {
                    errors.push(`Field "${path}" should have at most ${schema.maxProperties} properties`);
                }
                
                // Validate object properties (recursive validation)
                if (schema.properties) {
                    for (const [propKey, propValue] of Object.entries(value)) {
                        const propPath = `${path}.${propKey}`;
                        const propSchema = schema.properties[propKey];
                        
                        if (propSchema) {
                            // Validate property type
                            if (propSchema.type) {
                                const typeError = this.validateType(propValue, propSchema.type, propPath);
                                if (typeError) {
                                    errors.push(typeError);
                                    continue; // Skip further validation if type is wrong
                                }
                            }
                            
                            // Validate property constraints
                            const constraintErrors = this.validateConstraints(propValue, propSchema, propPath);
                            if (constraintErrors.length > 0) {
                                errors.push(...constraintErrors);
                            }
                        }
                    }
                }
                break;
                
            default:
                // No constraint validation for other types
                break;
        }
        
        return errors;
    }
    
    /**
     * Apply custom validators
     * @param {Object} config - Configuration to validate
     * @param {Object} schema - Schema to validate against
     * @param {Object} options - Validation options
     * @returns {Array} Validation errors
     */
    applyCustomValidators(config, schema, options) {
        const errors = [];
        
        // Skip if no custom validators
        if (!schema.customValidators || !Array.isArray(schema.customValidators)) {
            return errors;
        }
        
        // Apply each custom validator
        for (const validatorInfo of schema.customValidators) {
            const { name, path, args } = validatorInfo;
            
            // Skip if validator doesn't exist
            if (!this.customValidators[name]) {
                logger.warn(`Custom validator "${name}" not found`);
                continue;
            }
            
            // Get value to validate
            const value = path ? this.getValueByPath(config, path) : config;
            
            // Apply validator
            const result = this.customValidators[name](value, schema, path || '', args);
            
            // Add errors if validation failed
            if (!result.valid && result.errors) {
                errors.push(...result.errors);
            }
        }
        
        return errors;
    }
    
    /**
     * Get a value by path
     * @param {Object} obj - Object to get value from
     * @param {string} path - Path to the value
     * @returns {*} Value at the path
     */
    getValueByPath(obj, path) {
        const keys = path.split('.');
        let value = obj;
        
        for (const key of keys) {
            if (value === undefined || value === null) {
                return undefined;
            }
            
            value = value[key];
        }
        
        return value;
    }
    
    /**
     * Validate a configuration against a template
     * @param {Object} config - Configuration to validate
     * @param {string} templateId - Template ID
     * @param {Object} options - Validation options
     * @returns {Object} Validation result
     */
    validateConfigAgainstTemplate(config, templateId, options = {}) {
        try {
            // Get template
            const template = configTemplateManager.getTemplate(templateId);
            
            if (!template) {
                return {
                    valid: false,
                    errors: [`Template with ID ${templateId} not found`]
                };
            }
            
            // Validate against schema
            return this.validateConfig(config, template.configSchema, options);
        } catch (error) {
            logger.error(`Error validating configuration against template ${templateId}:`, error);
            return {
                valid: false,
                errors: [`Validation error: ${error.message}`]
            };
        }
    }
    
    /**
     * Validate all configurations
     * @param {Array} configs - Configurations to validate
     * @returns {Object} Validation results
     */
    validateAllConfigs(configs) {
        try {
            if (!configs || !Array.isArray(configs)) {
                return {
                    valid: false,
                    errors: ['Configurations must be an array']
                };
            }
            
            const results = {};
            let allValid = true;
            
            // Validate each configuration
            for (const config of configs) {
                if (!config._id) {
                    continue;
                }
                
                // Get template ID
                const templateId = config._template;
                
                if (!templateId) {
                    results[config._id] = {
                        valid: false,
                        errors: ['No template specified for configuration']
                    };
                    allValid = false;
                    continue;
                }
                
                // Validate configuration
                const result = this.validateConfigAgainstTemplate(config, templateId, { configs });
                
                results[config._id] = result;
                
                if (!result.valid) {
                    allValid = false;
                }
            }
            
            return {
                valid: allValid,
                results
            };
        } catch (error) {
            logger.error('Error validating all configurations:', error);
            return {
                valid: false,
                errors: [`Validation error: ${error.message}`]
            };
        }
    }
    
    /**
     * Fix configuration issues automatically when possible
     * @param {Object} config - Configuration to fix
     * @param {string} templateId - Template ID
     * @returns {Object} Fixed configuration
     */
    autoFixConfig(config, templateId) {
        try {
            // Get template
            const template = configTemplateManager.getTemplate(templateId);
            
            if (!template) {
                logger.error(`Template with ID ${templateId} not found`);
                return config;
            }
            
            const fixedConfig = { ...config };
            const schema = template.configSchema;
            
            // Apply default values for missing fields
            if (schema.properties) {
                for (const [propName, propSchema] of Object.entries(schema.properties)) {
                    if (fixedConfig[propName] === undefined && propSchema.default !== undefined) {
                        fixedConfig[propName] = propSchema.default;
                        logger.info(`Auto-fixed: Applied default value for ${propName}: ${propSchema.default}`);
                    }
                }
            }
            
            // Fix type issues
            for (const [propName, propValue] of Object.entries(fixedConfig)) {
                // Skip metadata fields
                if (propName.startsWith('_')) {
                    continue;
                }
                
                const propSchema = schema.properties && schema.properties[propName];
                
                if (!propSchema || propSchema.type === undefined) {
                    continue;
                }
                
                // Type conversion
                switch (propSchema.type) {
                    case 'string':
                        if (typeof propValue !== 'string') {
                            fixedConfig[propName] = String(propValue);
                            logger.info(`Auto-fixed: Converted ${propName} to string: ${fixedConfig[propName]}`);
                        }
                        break;
                        
                    case 'number':
                        if (typeof propValue !== 'number') {
                            const converted = Number(propValue);
                            if (!isNaN(converted)) {
                                fixedConfig[propName] = converted;
                                logger.info(`Auto-fixed: Converted ${propName} to number: ${fixedConfig[propName]}`);
                            }
                        }
                        break;
                        
                    case 'boolean':
                        if (typeof propValue !== 'boolean') {
                            if (propValue === 'true' || propValue === 1) {
                                fixedConfig[propName] = true;
                                logger.info(`Auto-fixed: Converted ${propName} to boolean: true`);
                            } else if (propValue === 'false' || propValue === 0) {
                                fixedConfig[propName] = false;
                                logger.info(`Auto-fixed: Converted ${propName} to boolean: false`);
                            }
                        }
                        break;
                        
                    case 'array':
                        if (!Array.isArray(propValue)) {
                            // Try to convert string to array if it looks like a JSON array
                            if (typeof propValue === 'string' && propValue.startsWith('[') && propValue.endsWith(']')) {
                                try {
                                    fixedConfig[propName] = JSON.parse(propValue);
                                    logger.info(`Auto-fixed: Converted ${propName} to array`);
                                } catch (e) {
                                    // Keep original if parsing fails
                                }
                            } else if (propValue !== undefined && propValue !== null) {
                                // Convert single value to array with that value
                                fixedConfig[propName] = [propValue];
                                logger.info(`Auto-fixed: Converted ${propName} to array: [${propValue}]`);
                            }
                        }
                        break;
                }
                
                // Fix constraint issues
                if (propSchema.type === 'number' || propSchema.type === 'integer') {
                    if (propSchema.minimum !== undefined && propValue < propSchema.minimum) {
                        fixedConfig[propName] = propSchema.minimum;
                        logger.info(`Auto-fixed: Set ${propName} to minimum value: ${propSchema.minimum}`);
                    }
                    
                    if (propSchema.maximum !== undefined && propValue > propSchema.maximum) {
                        fixedConfig[propName] = propSchema.maximum;
                        logger.info(`Auto-fixed: Set ${propName} to maximum value: ${propSchema.maximum}`);
                    }
                }
            }
            
            return fixedConfig;
        } catch (error) {
            logger.error(`Error auto-fixing configuration for template ${templateId}:`, error);
            return config;
        }
    }
}

// Create singleton instance
const configValidator = new ConfigValidator();

// Export for use in other modules
export default configValidator;
