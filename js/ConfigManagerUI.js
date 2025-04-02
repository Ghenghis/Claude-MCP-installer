/**
 * ConfigManagerUI.js - UI component for advanced configuration management
 * Provides user interface for managing MCP server configurations
 */

import advancedConfigManager from './AdvancedConfigManager.js';
import logger from './logger.js';

class ConfigManagerUI {
    constructor() {
        this.containerId = 'config-manager-container';
        this.configListId = 'config-manager-config-list';
        this.configEditorId = 'config-manager-config-editor';
        this.templateListId = 'config-manager-template-list';
        this.versionHistoryId = 'config-manager-version-history';
        
        // Initialize UI
        this.initializeUI();
    }
    
    /**
     * Initialize UI
     */
    initializeUI() {
        try {
            // Create UI container if it doesn't exist
            this.createUIContainer();
            
            // Initialize event listeners
            this.initializeEventListeners();
            
            logger.info('Configuration manager UI initialized');
        } catch (error) {
            logger.error('Error initializing configuration manager UI:', error);
        }
    }
    
    /**
     * Create UI container
     */
    createUIContainer() {
        try {
            // Check if container already exists
            let container = document.getElementById(this.containerId);
            
            if (!container) {
                // Create container
                container = document.createElement('div');
                container.id = this.containerId;
                container.className = 'config-manager-container';
                
                // Create container structure
                container.innerHTML = `
                    <div class="config-manager">
                        <div class="row">
                            <div class="col-md-3">
                                <div class="card">
                                    <div class="card-header d-flex justify-content-between align-items-center">
                                        <h5 class="mb-0">Server Configurations</h5>
                                        <button id="create-config-btn" class="btn btn-sm btn-primary">New</button>
                                    </div>
                                    <div class="card-body">
                                        <div id="${this.configListId}" class="config-list"></div>
                                    </div>
                                </div>
                                
                                <div class="card mt-3">
                                    <div class="card-header">
                                        <h5 class="mb-0">Configuration Templates</h5>
                                    </div>
                                    <div class="card-body">
                                        <div id="${this.templateListId}" class="template-list"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-9">
                                <div class="card">
                                    <div class="card-header d-flex justify-content-between align-items-center">
                                        <h5 class="config-editor-title mb-0">Configuration Editor</h5>
                                        <div class="btn-group">
                                            <button id="save-config-btn" class="btn btn-sm btn-success" disabled>Save</button>
                                            <button id="validate-config-btn" class="btn btn-sm btn-info" disabled>Validate</button>
                                            <button id="reset-config-btn" class="btn btn-sm btn-warning" disabled>Reset</button>
                                            <button id="delete-config-btn" class="btn btn-sm btn-danger" disabled>Delete</button>
                                        </div>
                                    </div>
                                    <div class="card-body">
                                        <div id="${this.configEditorId}" class="config-editor">
                                            <div class="select-config-message">
                                                <p>Select a configuration to edit or create a new one</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="card mt-3">
                                    <div class="card-header">
                                        <h5 class="mb-0">Version History</h5>
                                    </div>
                                    <div class="card-body">
                                        <div id="${this.versionHistoryId}" class="version-history"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Add container to document
                document.body.appendChild(container);
            }
            
            // Refresh UI
            this.refreshConfigList();
            this.refreshTemplateList();
        } catch (error) {
            logger.error('Error creating UI container:', error);
        }
    }
    
    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        try {
            // Create config button
            const createConfigBtn = document.getElementById('create-config-btn');
            if (createConfigBtn) {
                createConfigBtn.addEventListener('click', () => {
                    this.showCreateConfigModal();
                });
            }
            
            // Save config button
            const saveConfigBtn = document.getElementById('save-config-btn');
            if (saveConfigBtn) {
                saveConfigBtn.addEventListener('click', () => {
                    this.saveCurrentConfig();
                });
            }
            
            // Validate config button
            const validateConfigBtn = document.getElementById('validate-config-btn');
            if (validateConfigBtn) {
                validateConfigBtn.addEventListener('click', () => {
                    this.validateCurrentConfig();
                });
            }
            
            // Reset config button
            const resetConfigBtn = document.getElementById('reset-config-btn');
            if (resetConfigBtn) {
                resetConfigBtn.addEventListener('click', () => {
                    this.resetCurrentConfig();
                });
            }
            
            // Delete config button
            const deleteConfigBtn = document.getElementById('delete-config-btn');
            if (deleteConfigBtn) {
                deleteConfigBtn.addEventListener('click', () => {
                    this.deleteCurrentConfig();
                });
            }
        } catch (error) {
            logger.error('Error initializing event listeners:', error);
        }
    }
    
    /**
     * Refresh configuration list
     */
    refreshConfigList() {
        try {
            // Get config list container
            const configList = document.getElementById(this.configListId);
            
            if (!configList) {
                logger.error('Configuration list container not found');
                return;
            }
            
            // Get all configurations
            const configs = advancedConfigManager.getAllConfigs();
            
            // Create config list HTML
            let configListHtml = '';
            
            if (Object.keys(configs).length === 0) {
                configListHtml = '<div class="no-configs">No configurations found</div>';
            } else {
                configListHtml = '<div class="list-group">';
                
                for (const [configId, config] of Object.entries(configs)) {
                    configListHtml += `
                        <a href="#" class="list-group-item list-group-item-action config-item" data-config-id="${configId}">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-0">${config._name || 'Unnamed Configuration'}</h6>
                                    <small class="text-muted">${config._template || 'No Template'}</small>
                                </div>
                                <span class="badge ${this.getValidationBadgeClass(configId)}">
                                    ${this.getValidationStatus(configId)}
                                </span>
                            </div>
                        </a>
                    `;
                }
                
                configListHtml += '</div>';
            }
            
            // Set config list HTML
            configList.innerHTML = configListHtml;
            
            // Add event listeners to config items
            const configItems = configList.querySelectorAll('.config-item');
            
            for (const item of configItems) {
                item.addEventListener('click', (event) => {
                    event.preventDefault();
                    
                    const configId = item.dataset.configId;
                    this.loadConfig(configId);
                    
                    // Highlight selected item
                    configItems.forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                });
            }
        } catch (error) {
            logger.error('Error refreshing configuration list:', error);
        }
    }
    
    /**
     * Refresh template list
     */
    refreshTemplateList() {
        try {
            // Get template list container
            const templateList = document.getElementById(this.templateListId);
            
            if (!templateList) {
                logger.error('Template list container not found');
                return;
            }
            
            // Get all templates
            const templates = advancedConfigManager.configTemplateManager.getAllTemplates();
            
            // Create template list HTML
            let templateListHtml = '';
            
            if (Object.keys(templates).length === 0) {
                templateListHtml = '<div class="no-templates">No templates found</div>';
            } else {
                templateListHtml = '<div class="list-group">';
                
                for (const [templateId, template] of Object.entries(templates)) {
                    templateListHtml += `
                        <a href="#" class="list-group-item list-group-item-action template-item" data-template-id="${templateId}">
                            <div>
                                <h6 class="mb-0">${template.name}</h6>
                                <small class="text-muted">${template.description || ''}</small>
                            </div>
                        </a>
                    `;
                }
                
                templateListHtml += '</div>';
            }
            
            // Set template list HTML
            templateList.innerHTML = templateListHtml;
            
            // Add event listeners to template items
            const templateItems = templateList.querySelectorAll('.template-item');
            
            for (const item of templateItems) {
                item.addEventListener('click', (event) => {
                    event.preventDefault();
                    
                    const templateId = item.dataset.templateId;
                    this.showCreateConfigFromTemplateModal(templateId);
                });
            }
        } catch (error) {
            logger.error('Error refreshing template list:', error);
        }
    }
    
    /**
     * Get validation badge class for a configuration
     * @param {string} configId - Configuration ID
     * @returns {string} Badge class
     */
    getValidationBadgeClass(configId) {
        try {
            // Validate configuration
            const result = advancedConfigManager.validateConfig(configId);
            
            if (!result.valid) {
                return 'bg-danger';
            }
            
            if (result.warnings && result.warnings.length > 0) {
                return 'bg-warning text-dark';
            }
            
            return 'bg-success';
        } catch (error) {
            logger.error(`Error getting validation badge class for configuration ${configId}:`, error);
            return 'bg-secondary';
        }
    }
    
    /**
     * Get validation status for a configuration
     * @param {string} configId - Configuration ID
     * @returns {string} Validation status
     */
    getValidationStatus(configId) {
        try {
            // Validate configuration
            const result = advancedConfigManager.validateConfig(configId);
            
            if (!result.valid) {
                return 'Invalid';
            }
            
            if (result.warnings && result.warnings.length > 0) {
                return 'Warning';
            }
            
            return 'Valid';
        } catch (error) {
            logger.error(`Error getting validation status for configuration ${configId}:`, error);
            return 'Unknown';
        }
    }
    
    /**
     * Load a configuration into the editor
     * @param {string} configId - Configuration ID
     */
    loadConfig(configId) {
        try {
            // Get configuration
            const config = advancedConfigManager.getConfig(configId);
            
            if (!config) {
                logger.error(`Configuration with ID ${configId} not found`);
                return;
            }
            
            // Get config editor container
            const configEditor = document.getElementById(this.configEditorId);
            
            if (!configEditor) {
                logger.error('Configuration editor container not found');
                return;
            }
            
            // Get template
            const template = advancedConfigManager.configTemplateManager.getTemplate(config._template);
            
            if (!template) {
                logger.error(`Template with ID ${config._template} not found`);
                return;
            }
            
            // Update editor title
            const editorTitle = document.querySelector('.config-editor-title');
            if (editorTitle) {
                editorTitle.textContent = `Editing: ${config._name}`;
            }
            
            // Enable editor buttons
            document.getElementById('save-config-btn').disabled = false;
            document.getElementById('validate-config-btn').disabled = false;
            document.getElementById('reset-config-btn').disabled = false;
            document.getElementById('delete-config-btn').disabled = false;
            
            // Create editor form
            let editorHtml = `
                <form id="config-edit-form" data-config-id="${configId}">
                    <div class="mb-3">
                        <label for="config-name" class="form-label">Configuration Name</label>
                        <input type="text" class="form-control" id="config-name" value="${config._name || ''}">
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Template</label>
                        <input type="text" class="form-control" value="${template.name}" disabled>
                    </div>
                    
                    <h5 class="mt-4">Configuration Properties</h5>
                    <div class="config-properties">
            `;
            
            // Add properties from schema
            const schema = template.configSchema;
            
            if (schema && schema.properties) {
                for (const [propName, propSchema] of Object.entries(schema.properties)) {
                    // Skip metadata properties
                    if (propName.startsWith('_')) {
                        continue;
                    }
                    
                    const isRequired = schema.required && schema.required.includes(propName);
                    const propValue = config[propName];
                    
                    editorHtml += `
                        <div class="mb-3">
                            <label for="prop-${propName}" class="form-label">
                                ${propName} ${isRequired ? '<span class="text-danger">*</span>' : ''}
                            </label>
                    `;
                    
                    // Add input field based on property type
                    if (propSchema.enum && Array.isArray(propSchema.enum)) {
                        // Enum property (select)
                        editorHtml += `
                            <select class="form-select" id="prop-${propName}" name="${propName}" ${isRequired ? 'required' : ''}>
                        `;
                        
                        for (const option of propSchema.enum) {
                            editorHtml += `
                                <option value="${option}" ${propValue === option ? 'selected' : ''}>
                                    ${option}
                                </option>
                            `;
                        }
                        
                        editorHtml += `</select>`;
                    } else if (propSchema.type === 'boolean') {
                        // Boolean property (checkbox)
                        editorHtml += `
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="prop-${propName}" name="${propName}" ${propValue ? 'checked' : ''}>
                            </div>
                        `;
                    } else if (propSchema.type === 'number' || propSchema.type === 'integer') {
                        // Number property (number input)
                        editorHtml += `
                            <input type="number" class="form-control" id="prop-${propName}" name="${propName}" 
                                value="${propValue !== undefined ? propValue : ''}"
                                ${propSchema.minimum !== undefined ? `min="${propSchema.minimum}"` : ''}
                                ${propSchema.maximum !== undefined ? `max="${propSchema.maximum}"` : ''}
                                ${isRequired ? 'required' : ''}>
                        `;
                    } else if (propSchema.type === 'array') {
                        // Array property (textarea, one item per line)
                        const arrayValue = Array.isArray(propValue) ? propValue.join('\n') : '';
                        
                        editorHtml += `
                            <textarea class="form-control" id="prop-${propName}" name="${propName}" rows="3" 
                                ${isRequired ? 'required' : ''}>${arrayValue}</textarea>
                            <small class="form-text text-muted">One item per line</small>
                        `;
                    } else if (propSchema.type === 'object') {
                        // Object property (textarea, JSON)
                        const objectValue = propValue ? JSON.stringify(propValue, null, 2) : '';
                        
                        editorHtml += `
                            <textarea class="form-control" id="prop-${propName}" name="${propName}" rows="5" 
                                ${isRequired ? 'required' : ''}>${objectValue}</textarea>
                            <small class="form-text text-muted">JSON format</small>
                        `;
                    } else {
                        // Default to text input
                        editorHtml += `
                            <input type="text" class="form-control" id="prop-${propName}" name="${propName}" 
                                value="${propValue !== undefined ? propValue : ''}"
                                ${propSchema.pattern ? `pattern="${propSchema.pattern}"` : ''}
                                ${propSchema.minLength !== undefined ? `minlength="${propSchema.minLength}"` : ''}
                                ${propSchema.maxLength !== undefined ? `maxlength="${propSchema.maxLength}"` : ''}
                                ${isRequired ? 'required' : ''}>
                        `;
                    }
                    
                    // Add description if available
                    if (propSchema.description) {
                        editorHtml += `<small class="form-text text-muted">${propSchema.description}</small>`;
                    }
                    
                    editorHtml += `</div>`;
                }
            }
            
            editorHtml += `
                    </div>
                </form>
            `;
            
            // Set editor HTML
            configEditor.innerHTML = editorHtml;
            
            // Load version history
            this.loadVersionHistory(configId);
        } catch (error) {
            logger.error(`Error loading configuration ${configId}:`, error);
        }
    }
    
    /**
     * Load version history for a configuration
     * @param {string} configId - Configuration ID
     */
    loadVersionHistory(configId) {
        try {
            // Get version history container
            const versionHistory = document.getElementById(this.versionHistoryId);
            
            if (!versionHistory) {
                logger.error('Version history container not found');
                return;
            }
            
            // Get version history
            const history = advancedConfigManager.getVersionHistory(configId);
            
            // Create version history HTML
            let historyHtml = '';
            
            if (history.length === 0) {
                historyHtml = '<div class="no-history">No version history found</div>';
            } else {
                historyHtml = '<div class="list-group">';
                
                // Reverse array to show newest versions first
                const reversedHistory = [...history].reverse();
                
                for (const version of reversedHistory) {
                    const date = new Date(version.timestamp).toLocaleString();
                    
                    historyHtml += `
                        <div class="list-group-item version-item">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-0">Version ${version.version}</h6>
                                    <small class="text-muted">${date}</small>
                                </div>
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-outline-primary view-version-btn" data-config-id="${configId}" data-version="${version.version}">View</button>
                                    <button class="btn btn-outline-success restore-version-btn" data-config-id="${configId}" data-version="${version.version}">Restore</button>
                                </div>
                            </div>
                            <p class="mb-0 mt-2">${version.comment}</p>
                            ${version.changes ? this.renderChanges(version.changes) : ''}
                        </div>
                    `;
                }
                
                historyHtml += '</div>';
            }
            
            // Set version history HTML
            versionHistory.innerHTML = historyHtml;
            
            // Add event listeners to version buttons
            const viewButtons = versionHistory.querySelectorAll('.view-version-btn');
            const restoreButtons = versionHistory.querySelectorAll('.restore-version-btn');
            
            for (const button of viewButtons) {
                button.addEventListener('click', () => {
                    const configId = button.dataset.configId;
                    const version = parseInt(button.dataset.version);
                    this.viewVersion(configId, version);
                });
            }
            
            for (const button of restoreButtons) {
                button.addEventListener('click', () => {
                    const configId = button.dataset.configId;
                    const version = parseInt(button.dataset.version);
                    this.restoreVersion(configId, version);
                });
            }
        } catch (error) {
            logger.error(`Error loading version history for configuration ${configId}:`, error);
        }
    }
    
    /**
     * Render changes for a version
     * @param {Object} changes - Changes object
     * @returns {string} HTML for changes
     */
    renderChanges(changes) {
        if (!changes) {
            return '';
        }
        
        const { added, modified, removed } = changes;
        let html = '<div class="version-changes mt-2">';
        
        if (added && added.length > 0) {
            html += `<div class="text-success">Added: ${added.join(', ')}</div>`;
        }
        
        if (modified && modified.length > 0) {
            html += `<div class="text-primary">Modified: ${modified.join(', ')}</div>`;
        }
        
        if (removed && removed.length > 0) {
            html += `<div class="text-danger">Removed: ${removed.join(', ')}</div>`;
        }
        
        html += '</div>';
        
        return html;
    }
}

// Add CSS styles for the config manager UI
const addConfigManagerStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        .config-manager-container {
            padding: 20px;
        }
        
        .config-editor {
            min-height: 400px;
        }
        
        .select-config-message {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 300px;
            background-color: #f8f9fa;
            border-radius: 5px;
            color: #6c757d;
        }
        
        .version-item {
            margin-bottom: 8px;
        }
        
        .version-changes {
            font-size: 0.8rem;
        }
    `;
    document.head.appendChild(style);
};

// Create singleton instance
const configManagerUI = new ConfigManagerUI();

// Add styles
addConfigManagerStyles();

// Export for use in other modules
export default configManagerUI;
