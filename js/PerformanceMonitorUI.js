/**
 * PerformanceMonitorUI.js - UI component for performance monitoring
 * Provides user interface for monitoring server performance
 */

import performanceMonitor from './PerformanceMonitor.js';
import logger from './logger.js';

class PerformanceMonitorUI {
    constructor() {
        this.containerId = 'performance-monitor-container';
        this.serverListId = 'performance-monitor-server-list';
        this.dashboardId = 'performance-monitor-dashboard';
        this.settingsId = 'performance-monitor-settings';
        
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
            
            logger.info('Performance monitor UI initialized');
        } catch (error) {
            logger.error('Error initializing performance monitor UI:', error);
        }
    }
    
    /**
     * Builds the HTML for the server list panel.
     * @returns {string} HTML string for the server list panel.
     * @private
     */
    _buildServerListPanelHTML() {
        return `
            <div class="col-md-3">
                <div class="card h-100">
                    <div class="card-header">
                        <h5>Monitored Servers</h5>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <div id="${this.serverListId}" class="server-list flex-grow-1"></div>
                        <div class="mt-3">
                            <button id="refresh-server-list" class="btn btn-sm btn-primary">Refresh</button>
                            <button id="show-settings" class="btn btn-sm btn-secondary">Settings</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Builds the HTML for the main dashboard panel.
     * @returns {string} HTML string for the dashboard panel.
     * @private
     */
    _buildDashboardPanelHTML() {
        return `
            <div class="col-md-9">
                <div id="${this.dashboardId}" class="dashboard-container card h-100">
                    <div class="card-body">
                        <div class="select-server-message">
                            <h4>Select a server to view performance dashboard</h4>
                        </div>
                    </div>
                 </div>
            </div>
        `;
    }

    /**
     * Builds the HTML for the settings panel.
     * @returns {string} HTML string for the settings panel.
     * @private
     */
    _buildSettingsPanelHTML() {
        return `
            <div id="${this.settingsId}" class="settings-container" style="display: none;">
                <div class="card mt-3">
                    <div class="card-header">
                        <h5>Performance Monitor Settings</h5>
                    </div>
                    <div class="card-body">
                        <form id="performance-settings-form">
                            <div class="form-group mb-3">
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" id="auto-optimize-toggle">
                                    <label class="form-check-label" for="auto-optimize-toggle">Auto-Optimize Servers</label>
                                </div>
                                <small class="form-text text-muted">Automatically apply optimizations for high-priority issues</small>
                            </div>
                            
                            <h6>Alert Thresholds</h6>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="cpu-threshold" class="form-label">CPU Threshold (%)</label>
                                    <input type="number" class="form-control" id="cpu-threshold" min="0" max="100">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="memory-threshold" class="form-label">Memory Threshold (%)</label>
                                    <input type="number" class="form-control" id="memory-threshold" min="0" max="100">
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="disk-threshold" class="form-label">Disk Threshold (%)</label>
                                    <input type="number" class="form-control" id="disk-threshold" min="0" max="100">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="network-threshold" class="form-label">Network Threshold (%)</label>
                                    <input type="number" class="form-control" id="network-threshold" min="0" max="100">
                                </div>
                            </div>
                            
                            <div class="d-flex justify-content-end">
                                <button type="button" id="cancel-settings" class="btn btn-secondary me-2">Cancel</button>
                                <button type="submit" class="btn btn-primary">Save Settings</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Builds the HTML for a single server item in the list.
     * @param {object} server - The server object.
     * @returns {string} HTML string for the server list item.
     * @private
     */
    _buildServerListItemHTML(server) {
        return `
            <li class="list-group-item server-item" data-server-id="${server.id}">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="server-name">${server.name}</div>
                        <div class="server-type">${server.type}</div>
                    </div>
                    <div class="server-status" id="server-status-${server.id}">
                        ${this.getServerStatusBadge(server.id)}
                    </div>
                </div>
                <div class="server-actions mt-2">
                    <button class="btn btn-sm btn-primary view-dashboard" data-server-id="${server.id}">Dashboard</button>
                    <button class="btn btn-sm btn-info view-report" data-server-id="${server.id}">Report</button>
                    <button class="btn btn-sm btn-danger stop-monitoring" data-server-id="${server.id}">Stop</button>
                </div>
            </li>
        `;
    }

    /**
     * Builds the HTML for the entire server list.
     * @param {object} servers - Object containing monitored servers.
     * @returns {string} HTML string for the server list.
     * @private
     */
    _buildServerListHTML(servers) {
        if (Object.keys(servers).length === 0) {
            return '<div class="no-servers">No servers being monitored</div>';
        }
        const itemsHTML = Object.values(servers)
            .map(server => this._buildServerListItemHTML(server))
            .join('');
        return `<ul class="list-group">${itemsHTML}</ul>`;
    }

    /**
     * Builds the HTML for the "Start Monitoring" form.
     * @returns {string} HTML string for the form.
     * @private
     */
    _buildStartMonitoringFormHTML() {
        return `
            <div class="start-monitoring mt-3">
                <h6>Start New Monitoring</h6>
                <form id="start-monitoring-form">
                    <div class="mb-2">
                        <label for="server-id" class="form-label">Server ID</label>
                        <input type="text" class="form-control form-control-sm" id="server-id" required>
                    </div>
                    <div class="mb-2">
                        <label for="server-name" class="form-label">Server Name (Optional)</label>
                        <input type="text" class="form-control form-control-sm" id="server-name">
                    </div>
                    <div class="mb-2">
                        <label for="server-type" class="form-label">Server Type (Optional)</label>
                        <input type="text" class="form-control form-control-sm" id="server-type">
                    </div>
                    <button type="submit" class="btn btn-sm btn-success">Start</button>
                </form>
            </div>
        `;
    }

    /**
     * Helper to attach event listeners to buttons within server list items.
     * @param {HTMLElement} containerElement - The parent element containing the items.
     * @param {string} selector - The CSS selector for the buttons.
     * @param {function(string)} actionCallback - The callback function to execute on click, receives serverId.
     * @private
     */
    _attachServerItemListener(containerElement, selector, actionCallback) {
        const buttons = containerElement.querySelectorAll(selector);
        buttons.forEach(button => {
            button.addEventListener('click', (event) => {
                try {
                    // Use currentTarget to ensure we get the element the listener was attached to
                    const serverItem = event.currentTarget.closest('.server-item');
                    if (serverItem && serverItem.dataset.serverId) {
                        const serverId = serverItem.dataset.serverId;
                        actionCallback(serverId);
                    } else {
                        logger.warn(`Could not find serverId for clicked element with selector: ${selector}`);
                    }
                } catch (error) {
                     logger.error(`Error in event listener for selector ${selector}:`, error);
                }
            });
        });
    }

    /**
     * Adds event listeners to buttons within the server list.
     * @param {HTMLElement} serverListElement - The container element for the server list.
     * @private
     */
    _addServerListEventListeners(serverListElement) {
        try {
            // Use the helper to attach listeners
            this._attachServerItemListener(serverListElement, '.view-dashboard', (serverId) => {
                this.showDashboard(serverId);
            });

            this._attachServerItemListener(serverListElement, '.view-report', (serverId) => {
                // TODO: Define how/where the report is displayed (e.g., modal, dedicated panel)
                const reportOutputAreaId = 'performance-monitor-dashboard'; // Render in dashboard for now
                const reportHtml = performanceVisualizer.renderPerformanceReport(serverId);
                const dashboardElement = document.getElementById(this.dashboardId);
                if (dashboardElement) {
                    // Replace dashboard content with report - consider a modal or separate view later
                    dashboardElement.innerHTML = reportHtml;
                    this.showAlert(`Generated report for ${serverId}. Displayed in dashboard area.`);
                } else {
                     this.showAlert(`Dashboard area not found to display report for ${serverId}.`, 'warning');
                }
            });

            this._attachServerItemListener(serverListElement, '.stop-monitoring', (serverId) => {
                performanceMonitor.stopMonitoring(serverId);
                 // UI update (removing item/changing status) is handled by 'monitoring-stopped' event listener
            });

        } catch (error) {
            logger.error('Error adding server list event listeners:', error);
        }
    }

    /**
     * Adds the submit event listener to the "Start Monitoring" form.
     * @param {HTMLElement} serverListElement - The container element where the form resides.
     * @private
     */
    _addStartMonitoringFormListener(serverListElement) {
        const startMonitoringForm = serverListElement.querySelector('#start-monitoring-form');
        
        if (!startMonitoringForm) {
            logger.warn('Start monitoring form not found in the server list element');
            return;
        }
        
        startMonitoringForm.addEventListener('submit', (event) => {
            event.preventDefault();
            
            // Get and validate inputs
            const formInputs = this._getMonitoringFormInputs(serverListElement);
            
            if (this._validateMonitoringInputs(formInputs)) {
                this._registerServerForMonitoring(formInputs);
            }
        });
    }
    
    /**
     * Gets a value from a DOM element within a container, providing a default if not found.
     * @param {HTMLElement} container - The parent element to search within.
     * @param {string} selector - The CSS selector for the target element.
     * @param {*} [defaultValue=''] - The default value to return if the element or value is not found.
     * @returns {*} The element's value or the default value.
     * @private
     */
    _getValueOrDefault(container, selector, defaultValue = '') {
        return container.querySelector(selector)?.value || defaultValue;
    }

    /**
     * Gets the input values from the monitoring form
     * @param {HTMLElement} containerElement - The container element where the form resides
     * @returns {Object} Object containing the form input values
     * @private
     */
    _getMonitoringFormInputs(containerElement) {
        return {
            serverId: this._getValueOrDefault(containerElement, '#server-id'),
            serverName: this._getValueOrDefault(containerElement, '#server-name'),
            serverType: this._getValueOrDefault(containerElement, '#server-type', 'unknown')
        };
    }
    
    /**
     * Validates the monitoring form inputs
     * @param {Object} formInputs - Object containing form input values
     * @returns {boolean} True if inputs are valid, false otherwise
     * @private
     */
    _validateMonitoringInputs({ serverId }) {
        if (!serverId) {
            this.showAlert('Server ID is required', 'warning');
            return false;
        }
        return true;
    }
    
    /**
     * Registers a server for monitoring with the performance monitor
     * @param {Object} serverData - Object containing server data
     * @private
     */
    _registerServerForMonitoring({ serverId, serverName, serverType }) {
        // Use serverId as name if not provided
        const name = serverName || serverId;
        
        // Start monitoring the server
        performanceMonitor.startMonitoring(serverId, { 
            name, 
            type: serverType 
        });
        
        // Refresh the server list to show the new server
        this.refreshServerList();
    }

    /**
     * Create UI container
     */
    createUIContainer() {
        try {
            // Check if container already exists
            let uiContainer = document.getElementById(this.containerId);

            if (!uiContainer) {
                // Create container using helper method
                uiContainer = this._initializeMainUI();
                
            } else {
                logger.warn('UI container already exists.');
            }
            return uiContainer;
        } catch (error) {
            logger.error('Error creating performance monitor UI container:', error);
            this.showAlert(`Failed to initialize UI: ${error.message}`, 'danger');
            return null; // Return null on failure
        }
    }

    /**
     * Creates the main UI container element with the correct ID and classes.
     * @returns {HTMLElement} The created container element.
     * @private
     */
    _createContainerElement() {
        const uiContainer = document.createElement('div');
        uiContainer.id = this.containerId;
        uiContainer.className = 'performance-monitor-container hidden'; // Start hidden
        return uiContainer;
    }

    /**
     * Builds the inner HTML content for the main UI container.
     * @returns {string} The HTML content string.
     * @private
     */
    _buildContainerContent() {
        return `
            ${this._buildServerListPanelHTML()}
            ${this._buildDashboardPanelHTML()}
            ${this._buildSettingsPanelHTML()}
        `;
    }

    /**
     * Initializes the main UI by creating the container, content, appending it, and adding listeners.
     * @returns {HTMLElement} The newly created and initialized UI container.
     * @throws {Error} If appending the container fails.
     * @private
     */
    _initializeMainUI() {
        logger.debug('Initializing main Performance Monitor UI container.');
        const uiContainer = this._createContainerElement();
        uiContainer.innerHTML = this._buildContainerContent();

        // Append to body or a specific target element
        document.body.appendChild(uiContainer);
        if (!document.body.contains(uiContainer)) {
            throw new Error('Failed to append Performance Monitor UI container to the document body.');
        }

        // Add event listeners after the container is in the DOM
        this.initializeEventListeners();
        return uiContainer;
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        try {
            this._initButtonListeners();
            this._initFormListeners();
            this._initCustomEventListeners();
        } catch (error) {
            logger.error('Error initializing event listeners:', error);
        }
    }

    /**
     * Initializes event listeners for standard buttons.
     * @private
     */
    _initButtonListeners() {
        // Helper to add listener if element exists
        const addListener = (id, event, handler) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener(event, handler);
            } else {
                logger.warn(`Element with ID '${id}' not found for event listener.`);
            }
        };

        // Refresh server list button
        addListener('refresh-server-list', 'click', () => this.refreshServerList());

        // Show settings button
        addListener('show-settings', 'click', () => this.showSettings());

        // Cancel settings button
        addListener('cancel-settings', 'click', () => this.hideSettings());
    }

    /**
     * Initializes event listeners for forms.
     * @private
     */
    _initFormListeners() {
        const settingsForm = document.getElementById('performance-settings-form');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (event) => {
                event.preventDefault();
                this.saveSettings();
            });
        } else {
             logger.warn('Settings form element not found for event listener.');
        }
        // Note: The start-monitoring-form listener is attached dynamically in _addStartMonitoringFormListener
    }

    /**
     * Initializes event listeners for custom window events.
     * @private
     */
    _initCustomEventListeners() {
        window.addEventListener('resource-alert', (event) => {
            const { serverId, message } = event.detail;
            this.showAlert(message, 'warning');
            this.updateServerStatus(serverId);
        });

        window.addEventListener('auto-optimize', (event) => {
            const { serverId, suggestions } = event.detail;
            this.showAlert(`Auto-optimized server ${serverId} for ${suggestions.length} high priority issues`, 'info');
            this.updateServerStatus(serverId);
        });

        window.addEventListener('monitoring-started', (event) => {
            const { serverId } = event.detail;
            this.refreshServerList();
            this.showAlert(`Started monitoring server ${serverId}`, 'success');
        });

        window.addEventListener('monitoring-stopped', (event) => {
            const { serverId } = event.detail;
            this.refreshServerList();
            this.showAlert(`Stopped monitoring server ${serverId}`, 'info');
        });
    }

    /**
     * Helper to safely set the value of an input element if it exists.
     * @param {string} elementId - The ID of the input element.
     * @param {string|number|boolean} value - The value to set.
     * @param {string} property - The property to set ('value' or 'checked'). Defaults to 'value'.
     * @private
     */
    _setInputValueIfExists(elementId, value, property = 'value') {
        const element = document.getElementById(elementId);
        if (element) {
            element[property] = value;
        } else {
            logger.warn(`Settings element not found: ${elementId}`);
        }
    }

    /**
     * Initialize settings form
     */
    initializeSettingsForm() {
        try {
            // Set auto-optimize toggle
            this._setInputValueIfExists('auto-optimize-toggle', performanceMonitor.autoOptimizeEnabled, 'checked');

            // Define threshold element IDs
            const thresholdElements = {
                cpu: 'cpu-threshold',
                memory: 'memory-threshold',
                disk: 'disk-threshold',
                network: 'network-threshold'
            };

            // Set threshold input values using the helper
            for (const [resourceType, elementId] of Object.entries(thresholdElements)) {
                if (performanceMonitor.alertThresholds.hasOwnProperty(resourceType)) {
                    this._setInputValueIfExists(elementId, performanceMonitor.alertThresholds[resourceType]);
                } else {
                    logger.warn(`Alert threshold not defined for resource type: ${resourceType}`);
                }
            }
        } catch (error) {
            logger.error('Error initializing settings form:', error);
        }
    }

    /**
     * Show settings
     */
    showSettings() {
        try {
            // Hide dashboard
            const dashboard = document.getElementById(this.dashboardId);
            if (dashboard) {
                dashboard.style.display = 'none';
            }

            // Show settings
            const settings = document.getElementById(this.settingsId);
            if (settings) {
                settings.style.display = 'block';
            }

            // Initialize settings form
            this.initializeSettingsForm();
        } catch (error) {
            logger.error('Error showing settings:', error);
        }
    }

    /**
     * Hide settings
     */
    hideSettings() {
        try {
            // Hide settings
            const settings = document.getElementById(this.settingsId);
            if (settings) {
                settings.style.display = 'none';
            }

            // Show dashboard
            const dashboard = document.getElementById(this.dashboardId);
            if (dashboard) {
                dashboard.style.display = 'block';
            }
        } catch (error) {
            logger.error('Error hiding settings:', error);
        }
    }

    /**
     * Save settings
     */
    saveSettings() {
        try {
            // Get auto-optimize toggle
            const autoOptimizeToggle = document.getElementById('auto-optimize-toggle');
            if (autoOptimizeToggle) {
                performanceMonitor.setAutoOptimize(autoOptimizeToggle.checked);
            }

            // Get threshold inputs
            const cpuThreshold = document.getElementById('cpu-threshold');
            const memoryThreshold = document.getElementById('memory-threshold');
            const diskThreshold = document.getElementById('disk-threshold');
            const networkThreshold = document.getElementById('network-threshold');

            // Create thresholds object
            const thresholds = {};

            if (cpuThreshold && cpuThreshold.value) {
                thresholds.cpu = parseInt(cpuThreshold.value);
            }

            if (memoryThreshold && memoryThreshold.value) {
                thresholds.memory = parseInt(memoryThreshold.value);
            }

            if (diskThreshold && diskThreshold.value) {
                thresholds.disk = parseInt(diskThreshold.value);
            }

            if (networkThreshold && networkThreshold.value) {
                thresholds.network = parseInt(networkThreshold.value);
            }

            // Update thresholds
            performanceMonitor.updateAlertThresholds(thresholds);

            // Hide settings
            this.hideSettings();

            // Show success message
            this.showAlert('Settings saved successfully', 'success');
        } catch (error) {
            logger.error('Error saving settings:', error);
            this.showAlert('Error saving settings', 'danger');
        }
    }

    /**
     * Refresh server list
     */
    refreshServerList() {
        try {
            // Get server list container
            const serverListElement = document.getElementById(this.serverListId);

            if (!serverListElement) {
                logger.error('Server list container not found');
                return;
            }

            // Build HTML parts
            const serverListHTML = this._buildServerListHTML(performanceMonitor.getMonitoredServers());
            const startFormHTML = this._buildStartMonitoringFormHTML();

            // Update container content
            serverListElement.innerHTML = serverListHTML + startFormHTML;

            // Add event listeners
            this._addServerListEventListeners(serverListElement);
            this._addStartMonitoringFormListener(serverListElement);
        } catch (error) {
            logger.error('Error refreshing server list:', error);
        }
    }

    /**
     * Show dashboard for a server
     * @param {string} serverId - Server ID
     */
    showDashboard(serverId) {
        try {
            // Get dashboard element
            const dashboard = document.getElementById(this.dashboardId);

            if (!dashboard) {
                logger.error('Performance monitor dashboard element not found');
                return;
            }

            // Show dashboard
            dashboard.style.display = 'block';

            // Render performance dashboard
            this.renderDashboard(serverId);
        } catch (error) {
            logger.error(`Error showing dashboard for server ${serverId}:`, error);
        }
    }

    /**
     * Get server status badge
     * @param {string} serverId - Server ID
     * @returns {string} HTML string for the status badge.
     */
    getServerStatusBadge(serverId) {
        const status = this.performanceMonitor.getServerOverallStatus(serverId);
        return `<span class="badge ${status.class}">${status.text}</span>`;
    }

    /**
     * Update server status
     * @param {string} serverId - Server ID
     */
    updateServerStatus(serverId) {
        try {
            // Get server status container
            const serverStatus = document.getElementById(`server-status-${serverId}`);

            if (!serverStatus) {
                return;
            }

            // Update server status
            serverStatus.innerHTML = this.getServerStatusBadge(serverId);
        } catch (error) {
            logger.error(`Error updating server status for server ${serverId}:`, error);
        }
    }

    /**
     * Show alert
     * @param {string} message - Alert message
     * @param {string} type - Alert type (success, info, warning, danger)
     */
    showAlert(message, type = 'info') {
        try {
            // Create alert element
            const alert = document.createElement('div');
            alert.className = `alert alert-${type} alert-dismissible fade show`;
            alert.role = 'alert';

            alert.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;

            // Add alert to document
            document.body.appendChild(alert);

            // Position alert
            alert.style.position = 'fixed';
            alert.style.top = '20px';
            alert.style.right = '20px';
            alert.style.zIndex = '9999';
            alert.style.maxWidth = '400px';

            // Auto-dismiss after 5 seconds
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.parentNode.removeChild(alert);
                }
            }, 5000);
        } catch (error) {
            logger.error('Error showing alert:', error);
        }
    }

    /**
     * Show performance monitor UI
     */
    show() {
        try {
            // Get container
            const container = document.getElementById(this.containerId);

            if (!container) {
                logger.error('Performance monitor container not found');
                return;
            }

            // Show container
            container.style.display = 'block';

            // Refresh server list
            this.refreshServerList();
        } catch (error) {
            logger.error('Error showing performance monitor UI:', error);
        }
    }

    /**
     * Hide performance monitor UI
     */
    hide() {
        try {
            // Get container
            const container = document.getElementById(this.containerId);

            if (!container) {
                logger.error('Performance monitor container not found');
                return;
            }

            // Hide container
            container.style.display = 'none';
        } catch (error) {
            logger.error('Error hiding performance monitor UI:', error);
        }
    }

    /**
     * Gets the base container and layout styles
     * @returns {string} CSS styles for containers and layout
     * @private
     */
    _getContainerStyles() {
        return `
            .performance-monitor-container {
                padding: 20px;
            }
            
            .select-server-message {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 300px;
                background-color: #f8f9fa;
                border-radius: 5px;
                color: #6c757d;
            }
        `;
    }

    /**
     * Gets the server list item styles
     * @returns {string} CSS styles for server list items
     * @private
     */
    _getServerListStyles() {
        return `
            .server-item {
                margin-bottom: 10px;
            }
            
            .server-name {
                font-weight: bold;
            }
            
            .server-type {
                font-size: 0.8rem;
                color: #666;
            }
            
            .server-actions {
                display: flex;
                gap: 5px;
            }
            
            .no-servers {
                padding: 10px;
                text-align: center;
                color: #666;
            }
        `;
    }

    /**
     * Gets the dashboard styles
     * @returns {string} CSS styles for dashboard components
     * @private
     */
    _getDashboardStyles() {
        return `
            .performance-dashboard {
                margin-top: 20px;
            }
            
            .dashboard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            
            .chart-container {
                height: 300px;
                margin-bottom: 20px;
            }
        `;
    }

    /**
     * Gets the resource meter styles
     * @returns {string} CSS styles for resource meters
     * @private
     */
    _getResourceMeterStyles() {
        return `
            .resource-meter {
                margin-bottom: 10px;
            }
            
            .meter-label {
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .meter-bar {
                height: 20px;
                background-color: #f0f0f0;
                border-radius: 3px;
                overflow: hidden;
            }
            
            .meter-fill {
                height: 100%;
                transition: width 0.3s ease;
            }
            
            .meter-fill.status-good {
                background-color: #28a745;
            }
            
            .meter-fill.status-warning {
                background-color: #ffc107;
            }
            
            .meter-fill.status-critical {
                background-color: #dc3545;
            }
            
            .meter-value {
                text-align: right;
                font-size: 0.8rem;
                margin-top: 2px;
            }
        `;
    }

    /**
     * Gets the suggestion styles
     * @returns {string} CSS styles for optimization suggestions
     * @private
     */
    _getSuggestionStyles() {
        return `
            .suggestions-group {
                margin-bottom: 20px;
            }
            
            .suggestion-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 5px;
            }
            
            .suggestion-actions {
                margin-top: 10px;
                margin-bottom: 10px;
            }
        `;
    }

    /**
     * Add CSS styles for performance monitor UI
     */
    addStyles() {
        try {
            // Create style element
            const style = document.createElement('style');

            // Combine all component styles
            style.textContent = 
                this._getContainerStyles() +
                this._getServerListStyles() + 
                this._getDashboardStyles() +
                this._getResourceMeterStyles() +
                this._getSuggestionStyles();

            // Add style to document
            document.head.appendChild(style);
        } catch (error) {
            logger.error('Error adding styles:', error);
        }
    }

    /**
     * Helper method to update a specific section within the dashboard.
     * Handles finding the container, generating content, and error handling.
     * @param {HTMLElement} dashboardElement - The main dashboard container element.
     * @param {string} selector - The CSS selector for the section's container element.
     * @param {function(): string} contentGenerator - A function that returns the HTML string for the content.
     * @param {string} errorMsg - The error message to display if content generation fails.
     * @private
     */
    _updateDashboardSection(dashboardElement, selector, contentGenerator, errorMsg) {
        const container = dashboardElement.querySelector(selector);
        if (!container) {
            logger.warn(`Dashboard section container not found with selector: ${selector}`);
            return; // Or potentially append dynamically if needed, but safer to ensure structure exists
        }
        try {
            container.innerHTML = contentGenerator();
        } catch (error) {
            logger.error(`${errorMsg} Error:`, error);
            container.innerHTML = `<p class="text-danger">${errorMsg}</p>`;
        }
    }

    /**
     * Renders the overall status badge in the dashboard.
     * @param {string} serverId - The ID of the server.
     * @param {HTMLElement} dashboardElement - The dashboard container element.
     * @private
     */
    _renderDashboardStatus(serverId, dashboardElement) {
        this._updateDashboardSection(
            dashboardElement,
            '.dashboard-status-container',
            () => `<strong>Status:</strong> ${this.getServerStatusBadge(serverId)}`,
            `Error loading status for ${serverId}.`
        );
    }

    /**
     * Renders the performance charts in the dashboard.
     * @param {string} serverId - The ID of the server.
     * @param {HTMLElement} dashboardElement - The dashboard container element.
     * @private
     */
    _renderDashboardCharts(serverId, dashboardElement) {
        try {
            performanceVisualizer.updateCharts(serverId); // This likely handles finding/updating its own chart elements
        } catch (error) {
            logger.error(`Error rendering dashboard charts for ${serverId}:`, error);
            const chartContainer = dashboardElement.querySelector('.dashboard-charts-container');
            if (chartContainer) {
                chartContainer.innerHTML = '<p class="text-danger">Error loading charts.</p>';
            }
        }
    }

    /**
     * Renders the optimization suggestions in the dashboard.
     * @param {string} serverId - The ID of the server.
     * @param {HTMLElement} dashboardElement - The dashboard container element.
     * @private
     */
    _renderDashboardSuggestions(serverId, dashboardElement) {
        this._updateDashboardSection(
            dashboardElement,
            '.dashboard-suggestions-container',
            () => this.performanceMonitor.renderOptimizationSuggestions(serverId),
            `Error loading suggestions for ${serverId}.`
        );
    }

    /**
     * Renders the performance report section in the dashboard.
     * @param {string} serverId - The ID of the server.
     * @param {HTMLElement} dashboardElement - The dashboard container element.
     * @private
     */
    _renderDashboardReport(serverId, dashboardElement) {
        this._updateDashboardSection(
            dashboardElement,
            '.dashboard-report-container',
            () => performanceVisualizer.renderPerformanceReport(serverId),
            `Error loading report for ${serverId}.`
        );
    }

    /**
     * Render dashboard for a server
     * @param {string} serverId - Server ID
     */
    renderDashboard(serverId) {
        const dashboardElement = document.getElementById(this.dashboardId);
        if (!dashboardElement) {
            logger.error('Performance monitor dashboard element not found');
            return;
        }

        // Clear previous content and show loading indicator
        dashboardElement.innerHTML = '<div class="d-flex justify-content-center align-items-center" style="min-height: 200px;"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';

        // Use setTimeout to allow the loading indicator to render
        setTimeout(() => {
            try {
                // Clear loading indicator
                dashboardElement.innerHTML = '';

                // Create main structural elements
                const headerDiv = document.createElement('div');
                headerDiv.className = 'dashboard-header mb-3';
                headerDiv.innerHTML = `
                    <h3>Dashboard: ${serverId}</h3>
                    <div class="dashboard-status-container"></div>
                `; // Status container included here

                const chartsDiv = document.createElement('div');
                chartsDiv.className = 'dashboard-charts-container mb-4';

                const suggestionsDiv = document.createElement('div');
                suggestionsDiv.className = 'dashboard-suggestions-container mb-4';

                const reportDiv = document.createElement('div');
                reportDiv.className = 'dashboard-report-container';

                // Append structure to the main dashboard element
                dashboardElement.appendChild(headerDiv);
                dashboardElement.appendChild(chartsDiv);
                dashboardElement.appendChild(suggestionsDiv);
                dashboardElement.appendChild(reportDiv);

                // Render sections using helper methods
                this._renderDashboardStatus(serverId, dashboardElement);
                this._renderDashboardCharts(serverId, dashboardElement);
                this._renderDashboardSuggestions(serverId, dashboardElement);
                this._renderDashboardReport(serverId, dashboardElement);

            } catch (error) {
                logger.error(`Error rendering dashboard structure for server ${serverId}:`, error);
                // Show error message in dashboard if structure building fails
                dashboardElement.innerHTML = '<div class="alert alert-danger">Error building dashboard structure. Please check console for details.</div>';
            }
        }, 50); // Short delay to allow loader rendering
    }
}

// Create singleton instance
const performanceMonitorUI = new PerformanceMonitorUI();

// Add styles
performanceMonitorUI.addStyles();

// Export for use in other modules
export default performanceMonitorUI;
