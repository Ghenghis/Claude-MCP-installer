/**
 * ConfigValidator.js - Validates MCP server configurations against schemas
 * Provides configuration error checking and validation functionality
 */

import logger from './logger.js';
import configTemplateManager from './ConfigTemplateManager.js';

class ConfigValidator {
    constructor() {
        this.customValidators = {};
        
        // Map types to their constraint validation methods
        this._constraintValidators = {
            string: this._validateStringConstraints.bind(this),
            number: this._validateNumberConstraints.bind(this),
            integer: this._validateNumberConstraints.bind(this), // Reuse number validator
            array: this._validateArrayConstraints.bind(this),
            object: this._validateObjectConstraints.bind(this)
        };
        
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
        const basicValidation = this._validateBasicInputs(config, schema);
        if (!basicValidation.valid) {
            return basicValidation;
        }
        
        try {
            const result = {
                valid: true,
                errors: [],
                warnings: []
            };

            this._runCoreValidations(config, schema, options, result);
            this._checkAdditionalProperties(config, schema, result);
            
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
     * Validates basic inputs (config and schema existence).
     * @private
     */
    _validateBasicInputs(config, schema) {
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
        return { valid: true }; // Inputs are valid
    }

    /**
     * Runs the core validation steps: required, types, custom.
     * @private
     */
    _runCoreValidations(config, schema, options, result) {
        const requiredErrors = this.validateRequired(config, schema);
        if (requiredErrors.length > 0) {
            result.valid = false;
            result.errors.push(...requiredErrors);
        }
        
        const typeErrors = this.validateTypes(config, schema);
        if (typeErrors.length > 0) {
            result.valid = false;
            result.errors.push(...typeErrors);
        }
        
        const customErrors = this.applyCustomValidators(config, schema, options);
        if (customErrors.length > 0) {
            result.valid = false;
            result.errors.push(...customErrors);
        }
    }

    /**
     * Checks for unknown properties based on schema.additionalProperties.
     * @private
     */
    _checkAdditionalProperties(config, schema, result) {
        if (schema.additionalProperties === false) {
            const knownProps = new Set(Object.keys(schema.properties || {}));
            const unknownProps = Object.keys(config).filter(key => 
                !knownProps.has(key) && !key.startsWith('_')
            );
            
            if (unknownProps.length > 0) {
                // Add as warnings, not errors, as per standard JSON schema validation behavior
                result.warnings.push(`Unknown properties found: ${unknownProps.join(', ')}`);
                // Note: Depending on strictness requirements, this could set result.valid = false
            }
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
        
        for (const [key, value] of Object.entries(config)) {
            this._validateSingleProperty(key, value, properties, errors);
        }
        
        return errors;
    }
    
    /**
     * Validates a single property's type and constraints.
     * @param {string} key - Property key
     * @param {*} value - Property value
     * @param {Object} properties - Schema properties definition
     * @param {Array} errors - Array to push errors into
     * @private
     */
    _validateSingleProperty(key, value, properties, errors) {
        // Skip metadata fields
        if (key.startsWith('_')) {
            return;
        }
        
        const propSchema = properties[key];
        
        // Skip if no schema for this property or if type validation fails
        if (!propSchema || !this._validatePropertyType(key, value, propSchema, errors)) {
            return;
        }
        
        // Validate constraints only if type validation passed
        this._validatePropertyConstraints(key, value, propSchema, errors);
    }
    
    /**
     * Validates the type of a single property.
     * @returns {boolean} - True if type is valid, false otherwise.
     * @private
     */
    _validatePropertyType(key, value, propSchema, errors) {
        // Skip type validation if no type is specified
        if (!propSchema.type) {
            return true;
        }
        
        // Perform type validation
        const typeError = this.validateType(value, propSchema.type, key);
        
        // Handle validation result
        if (typeError) {
            errors.push(typeError);
            return false; // Type validation failed
        }
        
        return true; // Type validation passed
    }
    
    /**
     * Validate a value against a type
     * @param {*} value - Value to validate
     * @param {string} type - Type to validate against
     * @param {string} path - Path to the value
     * @returns {string|null} Validation error or null if valid
     */
    validateType(value, type, path) {
        // Use type-specific validation methods
        const typeValidators = {
            'string': this._validateStringType,
            'number': this._validateNumberType,
            'integer': this._validateIntegerType,
            'boolean': this._validateBooleanType,
            'array': this._validateArrayType,
            'object': this._validateObjectType,
            'null': this._validateNullType
        };
        
        // Use the appropriate validator or return null for unknown types
        const validator = typeValidators[type];
        return validator ? validator.call(this, value, path) : null;
    }
    
    /**
     * Validate string type
     * @private
     */
    _validateStringType(value, path) {
        return typeof value !== 'string' ? `Field "${path}" should be a string` : null;
    }
    
    /**
     * Validate number type
     * @private
     */
    _validateNumberType(value, path) {
        return typeof value !== 'number' ? `Field "${path}" should be a number` : null;
    }
    
    /**
     * Validate integer type
     * @private
     */
    _validateIntegerType(value, path) {
        return typeof value !== 'number' || !Number.isInteger(value) ? 
            `Field "${path}" should be an integer` : null;
    }
    
    /**
     * Validate boolean type
     * @private
     */
    _validateBooleanType(value, path) {
        return typeof value !== 'boolean' ? `Field "${path}" should be a boolean` : null;
    }
    
    /**
     * Validate array type
     * @private
     */
    _validateArrayType(value, path) {
        return !Array.isArray(value) ? `Field "${path}" should be an array` : null;
    }
    
    /**
     * Validate object type
     * @private
     */
    _validateObjectType(value, path) {
        return typeof value !== 'object' || value === null || Array.isArray(value) ? 
            `Field "${path}" should be an object` : null;
    }
    
    /**
     * Validate null type
     * @private
     */
    _validateNullType(value, path) {
        return value !== null ? `Field "${path}" should be null` : null;
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
        
        // Look up the validator based on schema type
        const validator = this._constraintValidators[schema.type];
        if (validator) {
            return validator(value, schema, path); // Call the appropriate validator
        }

        // No constraint validation for other types or if validator not found
        return errors;
    }
    
    /**
     * Validate string-specific constraints
     * @param {string} value - String value to validate
     * @param {Object} schema - Schema containing string constraints
     * @param {string} path - Path to the value
     * @returns {Array} Validation errors
     * @private
     */
    _validateStringConstraints(value, schema, path) {
        const errors = [];

        // Use helper functions for each constraint check
        this._checkMinLength(value, schema, path, errors);
        this._checkMaxLength(value, schema, path, errors);
        this._checkPattern(value, schema, path, errors);
        this._checkFormat(value, schema, path, errors);
        this._checkEnum(value, schema, path, errors);
        
        return errors;
    }
    
    /**
     * Checks the minLength constraint
     * @private
     */
    _checkMinLength(value, schema, path, errors) {
        if (schema.minLength !== undefined && value.length < schema.minLength) {
            errors.push(`Field "${path}" should have at least ${schema.minLength} characters`);
        }
    }
    
    /**
     * Checks the maxLength constraint
     * @private
     */
    _checkMaxLength(value, schema, path, errors) {
        if (schema.maxLength !== undefined && value.length > schema.maxLength) {
            errors.push(`Field "${path}" should have at most ${schema.maxLength} characters`);
        }
    }
    
    /**
     * Checks the pattern constraint
     * @private
     */
    _checkPattern(value, schema, path, errors) {
        if (schema.pattern !== undefined) {
            try {
                const regex = new RegExp(schema.pattern);
                if (!regex.test(value)) {
                    errors.push(`Field "${path}" should match the pattern ${schema.pattern}`);
                }
            } catch (e) {
                logger.error(`Invalid regex pattern ${schema.pattern} in schema for ${path}: ${e.message}`);
                errors.push(`Internal validation error: Invalid regex pattern for ${path}`);
            }
        }
    }
    
    /**
     * Checks the format constraint
     * @private
     */
    _checkFormat(value, schema, path, errors) {
        if (schema.format !== undefined) {
            if (typeof this.customValidators[schema.format] === 'function') {
                const formatErrors = this.customValidators[schema.format](value, path);
                if (formatErrors && formatErrors.length > 0) {
                    errors.push(...formatErrors);
                }
            } else {
                logger.warn(`Unknown format ${schema.format} for field "${path}"`);
            }
        }
    }
    
    /**
     * Checks the enum constraint
     * @private
     */
    _checkEnum(value, schema, path, errors) {
        if (schema.enum !== undefined && !schema.enum.includes(value)) {
            errors.push(`Field "${path}" should be one of [${schema.enum.join(', ')}]`);
        }
    }
    
    /**
     * Validate number-specific constraints
     * @param {number} value - Number value to validate
     * @param {Object} schema - Schema containing number constraints
     * @param {string} path - Path to the value
     * @returns {Array} Validation errors
     * @private
     */
    _validateNumberConstraints(value, schema, path) {
        const errors = [];
        
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
        
        return errors;
    }
    
    /**
     * Validate array-specific constraints
     * @param {Array} value - Array value to validate
     * @param {Object} schema - Schema containing array constraints
     * @param {string} path - Path to the value
     * @returns {Array} Validation errors
     * @private
     */
    _validateArrayConstraints(value, schema, path) {
        const errors = [];
        
        this._checkArraySizeConstraints(value, schema, path, errors);
        this._checkArrayUniqueness(value, schema, path, errors);
        this._validateArrayItems(value, schema, path, errors);
        
        return errors;
    }
    
    /**
     * Checks array size constraints (minItems, maxItems)
     * @private
     */
    _checkArraySizeConstraints(value, schema, path, errors) {
        if (schema.minItems !== undefined && value.length < schema.minItems) {
            errors.push(`Field "${path}" should have at least ${schema.minItems} items`);
        }
        
        if (schema.maxItems !== undefined && value.length > schema.maxItems) {
            errors.push(`Field "${path}" should have at most ${schema.maxItems} items`);
        }
    }
    
    /**
     * Checks array uniqueness constraint
     * @private
     */
    _checkArrayUniqueness(value, schema, path, errors) {
        if (schema.uniqueItems === true) {
            // Use Set for efficient uniqueness check, handle complex objects via stringify
            const uniqueItems = new Set(value.map(item => 
                typeof item === 'object' && item !== null ? JSON.stringify(item) : item
            ));
            if (uniqueItems.size !== value.length) {
                errors.push(`Field "${path}" should have unique items`);
            }
        }
    }
    
    /**
     * Validates each item in the array against the items schema
     * @private
     */
    _validateArrayItems(value, schema, path, errors) {
        if (!schema.items) {
            return; // No items schema to validate against
        }
        
        // Assuming single schema for all items for now
        const itemSchema = schema.items;
        
        for (let i = 0; i < value.length; i++) {
            this._validateSingleArrayItem({ item: value[i], index: i, basePath: path, itemSchema, errors });
        }
    }
    
    /**
     * Validate a single item in an array against its schema
     * @param {Object} context - Validation context object
     * @param {*} context.item - The array item to validate
     * @param {number} context.index - Index of the item in the array
     * @param {string} context.basePath - Base path for error reporting
     * @param {Object} context.itemSchema - Schema for the array items
     * @param {Array} context.errors - Array to push errors into
     * @private
     */
    _validateSingleArrayItem(context) {
        const { item, index, basePath, itemSchema, errors } = context;
        const itemPath = `${basePath}[${index}]`;
        const itemErrors = this.validateConstraints(item, itemSchema, itemPath);
        errors.push(...itemErrors);
    }
    
    /**
     * Validate object-specific constraints
     * @param {Object} value - Object value to validate
     * @param {Object} schema - Schema containing object constraints
     * @param {string} path - Path to the value
     * @returns {Array} Validation errors
     * @private
     */
    _validateObjectConstraints(value, schema, path) {
        const errors = [];
        
        this._checkObjectSizeConstraints(value, schema, path, errors);
        this._validateObjectProperties(value, schema, path, errors);
        
        return errors;
    }
    
    /**
     * Checks object size constraints (minProperties, maxProperties)
     * @private
     */
    _checkObjectSizeConstraints(value, schema, path, errors) {
        const numProperties = Object.keys(value).length;
        if (schema.minProperties !== undefined && numProperties < schema.minProperties) {
            errors.push(`Field "${path}" should have at least ${schema.minProperties} properties`);
        }
        
        if (schema.maxProperties !== undefined && numProperties > schema.maxProperties) {
            errors.push(`Field "${path}" should have at most ${schema.maxProperties} properties`);
        }
    }
    
    /**
     * Validates properties of an object against a schema.
     * @param {Object} value - Object value to validate
     * @param {Object} schema - Schema to validate against
     * @param {string} path - Path to the value
     * @param {Array} errors - Array to push errors into
     * @private
     */
    _validateObjectProperties(value, schema, path, errors) {
        // Validate known properties defined in schema.properties
        this._validateKnownObjectProperties(value, schema, path, errors);
        
        // Validate properties matching patterns in schema.patternProperties
        this._validatePatternProperties(value, schema, path, errors);
    }
    
    /**
     * Validates properties explicitly defined in schema.properties.
     * @private
     */
    _validateKnownObjectProperties(value, schema, path, errors) {
        if (!schema.properties) {
            return; // No known properties defined
        }
        
        // Filter keys: exclude metadata keys and include only keys defined in schema.properties
        const relevantKeys = Object.keys(value).filter(key =>
            !key.startsWith('_') && schema.properties[key]
        );

        // Validate properties for the filtered keys
        for (const key of relevantKeys) {
            const propValue = value[key];
            const propSchema = schema.properties[key]; // Schema is guaranteed to exist due to filtering
            const currentPath = path ? `${path}.${key}` : key;
            this._validatePropertyAgainstSchema(propValue, propSchema, currentPath, errors);
        }
    }
    
    /**
     * Validates properties matching patterns in schema.patternProperties.
     * @private
     */
    _validatePatternProperties(value, schema, path, errors) {
        if (!schema.patternProperties) {
            return; // No pattern properties defined
        }

        for (const [key, propValue] of Object.entries(value)) {
            // Skip metadata fields
            if (key.startsWith('_')) {
                continue;
            }

            // Create context object for pattern validation
            const context = {
                key,
                propValue,
                patternProperties: schema.patternProperties,
                path,
                errors
            };
            
            // Validate property against patterns
            this._validatePropertyAgainstPatterns(context);
        }
    }
    
    /**
     * Validates a property against pattern properties
     * @param {Object} context - Validation context object
     * @param {string} context.key - The property key
     * @param {*} context.propValue - The property value
     * @param {Object} context.patternProperties - The pattern properties object
     * @param {string} context.path - The base path
     * @param {Array} context.errors - Array to collect errors
     * @private
     */
    _validatePropertyAgainstPatterns(context) {
        const { key, propValue, patternProperties, path, errors } = context;
        
        for (const pattern in patternProperties) {
            // Create context object for pattern matching
            const matchContext = {
                key,
                pattern,
                path,
                errors
            };
            
            if (!this._isKeyMatchingPattern(matchContext)) {
                continue;
            }
            
            const patternSchema = patternProperties[pattern];
            const currentPath = path ? `${path}.${key}` : key;
            
            this._validatePropertyAgainstSchema(propValue, patternSchema, currentPath, errors);
        }
    }
    
    /**
     * Validates a property against a schema
     * @param {*} propValue - The property value
     * @param {Object} propSchema - The property schema
     * @param {string} currentPath - The current property path
     * @param {Array} errors - Array to collect errors
     * @private
     */
    _validatePropertyAgainstSchema(propValue, propSchema, currentPath, errors) {
        // Validate type
        const typeError = this.validateType(propValue, propSchema.type, currentPath);
        if (typeError) {
            errors.push(typeError);
            return; // Skip constraint validation if type is incorrect
        }
        
        // Validate constraints
        const constraintErrors = this.validateConstraints(propValue, propSchema, currentPath);
        errors.push(...constraintErrors);
    }
    
    /**
     * Checks if a key matches a pattern
     * @param {Object} context - Pattern matching context
     * @param {string} context.key - The property key
     * @param {string} context.pattern - The regex pattern
     * @param {string} context.path - The base path (for error reporting)
     * @param {Array} context.errors - Array to collect errors
     * @returns {boolean} True if the key matches the pattern
     * @private
     */
    _isKeyMatchingPattern(context) {
        const { key, pattern, path, errors } = context;
        
        try {
            const regex = new RegExp(pattern);
            return regex.test(key);
        } catch (e) {
            logger.error(`Invalid regex pattern ${pattern} in schema for ${path}: ${e.message}`);
            errors.push(`Internal validation error: Invalid regex pattern for ${path}`);
            return false;
        }
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
            
            // Apply different fixes in sequence
            this._applyDefaultValues(fixedConfig, schema);
            this._applyTypeConversions(fixedConfig, schema);
            this._applyConstraintCorrections(fixedConfig, schema);
            
            return fixedConfig;
        } catch (error) {
            logger.error(`Error auto-fixing configuration for template ${templateId}:`, error);
            return config;
        }
    }
    
    /**
     * Apply default values for missing fields
     * @param {Object} config - Configuration to modify
     * @param {Object} schema - JSON Schema containing defaults
     * @private
     */
    _applyDefaultValues(config, schema) {
        if (!schema.properties) {
            return;
        }
        
        for (const [propName, propSchema] of Object.entries(schema.properties)) {
            if (config[propName] === undefined && propSchema.default !== undefined) {
                config[propName] = propSchema.default;
                logger.info(`Auto-fixed: Applied default value for ${propName}: ${propSchema.default}`);
            }
        }
    }
    
    /**
     * Apply type conversions to fix type issues
     * @param {Object} config - Configuration to modify
     * @param {Object} schema - JSON Schema containing type information
     * @private
     */
    _applyTypeConversions(config, schema) {
        if (!schema.properties) {
            return;
        }
        
        for (const [propName, propValue] of Object.entries(config)) {
            // Skip metadata fields or apply conversion
            if (!propName.startsWith('_')) {
                 this._applySingleTypeConversion(config, schema, propName, propValue);
            }
        }
    }

    /**
     * Applies type conversion for a single property based on its schema.
     * @param {Object} config - Configuration object being modified.
     * @param {Object} schema - The full schema object.
     * @param {string} propName - The name of the property to convert.
     * @param {*} propValue - The current value of the property.
     * @private
     */
    _applySingleTypeConversion(config, schema, propName, propValue) {
        const propSchema = schema.properties && schema.properties[propName];
            
        if (!propSchema || propSchema.type === undefined) {
            // No schema definition or type for this property, skip conversion
            return;
        }
        
        // Apply appropriate type conversion based on schema type
        switch (propSchema.type) {
            case 'string':
                this._convertToString(config, propName, propValue);
                break;
                
            case 'number':
                this._convertToNumber(config, propName, propValue);
                break;
                
            case 'boolean':
                this._convertToBoolean(config, propName, propValue);
                break;
                
            case 'array':
                this._convertToArray(config, propName, propValue);
                break;
        }
    }
    
    /**
     * Convert a value to string type
     * @param {Object} config - Configuration to modify
     * @param {string} propName - Property name
     * @param {*} propValue - Property value
     * @private
     */
    _convertToString(config, propName, propValue) {
        if (typeof propValue !== 'string') {
            config[propName] = String(propValue);
            logger.info(`Auto-fixed: Converted ${propName} to string: ${config[propName]}`);
        }
    }
    
    /**
     * Convert a value to number type
     * @param {Object} config - Configuration to modify
     * @param {string} propName - Property name
     * @param {*} propValue - Property value
     * @private
     */
    _convertToNumber(config, propName, propValue) {
        if (typeof propValue !== 'number') {
            const converted = Number(propValue);
            if (!isNaN(converted)) {
                config[propName] = converted;
                logger.info(`Auto-fixed: Converted ${propName} to number: ${config[propName]}`);
            }
        }
    }
    
    /**
     * Convert a value to boolean type
     * @param {Object} config - Configuration to modify
     * @param {string} propName - Property name
     * @param {*} propValue - Property value
     * @private
     */
    _convertToBoolean(config, propName, propValue) {
        if (typeof propValue !== 'boolean') {
            if (propValue === 'true' || propValue === 1) {
                config[propName] = true;
                logger.info(`Auto-fixed: Converted ${propName} to boolean: true`);
            } else if (propValue === 'false' || propValue === 0) {
                config[propName] = false;
                logger.info(`Auto-fixed: Converted ${propName} to boolean: false`);
            }
        }
    }
    
    /**
     * Convert a value to array type
     * @param {Object} config - Configuration to modify
     * @param {string} propName - Property name
     * @param {*} propValue - Property value
     * @private
     */
    _convertToArray(config, propName, propValue) {
        if (!Array.isArray(propValue)) {
            // Try to convert string to array if it looks like a JSON array
            if (typeof propValue === 'string' && propValue.startsWith('[') && propValue.endsWith(']')) {
                try {
                    config[propName] = JSON.parse(propValue);
                    logger.info(`Auto-fixed: Converted ${propName} to array`);
                } catch (e) {
                    // Keep original if parsing fails
                }
            } else if (propValue !== undefined && propValue !== null) {
                // Convert single value to array with that value
                config[propName] = [propValue];
                logger.info(`Auto-fixed: Converted ${propName} to array: [${propValue}]`);
            }
        }
    }
    
    /**
     * Apply constraint corrections (min/max values)
     * @param {Object} config - Configuration to modify
     * @param {Object} schema - JSON Schema containing constraint information
     * @private
     */
    _applyConstraintCorrections(config, schema) {
        if (!schema.properties) {
            return;
        }
        
        for (const [propName, propValue] of Object.entries(config)) {
            const propSchema = schema.properties && schema.properties[propName];
            
            if (!propSchema) {
                continue;
            }
            
            // Fix numeric constraints
            if (propSchema.type === 'number' || propSchema.type === 'integer') {
                this._applyNumericConstraints(config, propName, propValue, propSchema);
            }
        }
    }
    
    /**
     * Apply numeric constraints (min/max)
     * @param {Object} config - Configuration to modify
     * @param {string} propName - Property name
     * @param {number} propValue - Property value
     * @param {Object} propSchema - Property schema
     * @private
     */
    _applyNumericConstraints(config, propName, propValue, propSchema) {
        if (propSchema.minimum !== undefined && propValue < propSchema.minimum) {
            config[propName] = propSchema.minimum;
            logger.info(`Auto-fixed: Set ${propName} to minimum value: ${propSchema.minimum}`);
        }
        
        if (propSchema.maximum !== undefined && propValue > propSchema.maximum) {
            config[propName] = propSchema.maximum;
            logger.info(`Auto-fixed: Set ${propName} to maximum value: ${propSchema.maximum}`);
        }
    }
    
    /**
     * Validate all configurations
     * @param {Array} configs - Configurations to validate
     * @returns {Object} Validation results
     */
    validateAllConfigs(configs) {
        try {
            // Initial input validation
            const inputError = this._validateConfigsInput(configs);
            if (inputError) {
                return inputError;
            }
            
            // Process and aggregate results
            return this._aggregateValidationResults(configs);
        } catch (error) {
            logger.error('Error validating all configurations:', error);
            return {
                valid: false,
                errors: [`Validation error: ${error.message}`]
            };
        }
    }
    
    /**
     * Validates an input array to ensure it's a proper array of configurations.
     * @param {Array} configs - Configurations to validate
     * @returns {Object|null} Error result object if invalid, null if valid
     * @private
     */
    _validateConfigsInput(configs) {
        if (!configs || !Array.isArray(configs)) {
            return {
                valid: false,
                errors: ['Configurations must be an array']
            };
        }
        return null;
    }

    /**
     * Validates a single configuration within a collection.
     * @param {Object} config - Configuration to validate
     * @param {Array} allConfigs - All configurations (for cross-reference)
     * @returns {Object} Validation result
     * @private
     */
    _validateSingleConfig(config, allConfigs) {
        // Skip configs without ID
        if (!config._id) {
            return null; // Skip this config
        }
        
        // Check if template is specified
        const templateId = config._template;
        if (!templateId) {
            return {
                valid: false,
                errors: ['No template specified for configuration']
            };
        }
        
        // Validate against template
        return this.validateConfigAgainstTemplate(config, templateId, { configs: allConfigs });
    }

    /**
     * Aggregates validation results for each configuration.
     * @param {Array} configs - Configurations to validate
     * @returns {Object} Aggregated results
     * @private
     */
    _aggregateValidationResults(configs) {
        const results = {};
        let allValid = true;
        
        for (const config of configs) {
            // Skip configs without ID
            if (!config._id) {
                continue;
            }
            
            // Validate and store result
            const result = this._validateSingleConfig(config, configs);
            
            // Skip null results (happens when config is invalid but doesn't need reporting)
            if (result === null) {
                continue;
            }
            
            // Store the result
            results[config._id] = result;
            
            // Track if all are valid
            if (!result.valid) {
                allValid = false;
            }
        }
        
        return {
            valid: allValid,
            results
        };
    }
}

// Create singleton instance
const configValidator = new ConfigValidator();

// Export for use in other modules
export default configValidator;
