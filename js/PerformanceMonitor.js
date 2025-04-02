/**
 * PerformanceMonitor.js - Main module for performance monitoring
 * Integrates ResourceMonitor, PerformanceOptimizer, and PerformanceVisualizer
 */

import resourceMonitor from './ResourceMonitor.js';
import performanceOptimizer from './PerformanceOptimizer.js';
import performanceVisualizer from './PerformanceVisualizer.js';
import logger from './logger.js';

// Define severity level constants for clarity
const SEVERITY_LEVELS = {
    CRITICAL: 2,
    WARNING: 1,
    GOOD: 0,
    UNKNOWN: -1
};

class PerformanceMonitor {
    constructor() {
        this.resourceMonitor = resourceMonitor;
        this.performanceOptimizer = performanceOptimizer;
        this.performanceVisualizer = performanceVisualizer;
        
        this.monitoredServers = {};
        this.autoOptimizeEnabled = false;
        this.alertThresholds = {
            cpu: 90,
            memory: 90,
            disk: 95,
            network: 90
        };
        
        // Initialize performance monitor
        this.initializeMonitor();
    }
    
    /**
     * Initialize performance monitor
     */
    initializeMonitor() {
        try {
            // Load settings from localStorage
            this.loadSettings();
            
            // Initialize event listeners
            this.initializeEventListeners();
            
            logger.info('Performance monitor initialized');
        } catch (error) {
            logger.error('Error initializing performance monitor:', error);
        }
    }
    
    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const storedSettings = localStorage.getItem('mcp_performance_settings');
            
            if (storedSettings) {
                const settings = JSON.parse(storedSettings);
                
                if (settings.autoOptimizeEnabled !== undefined) {
                    this.autoOptimizeEnabled = settings.autoOptimizeEnabled;
                }
                
                if (settings.alertThresholds) {
                    this.alertThresholds = { ...this.alertThresholds, ...settings.alertThresholds };
                }
            }
        } catch (error) {
            logger.error('Error loading performance settings:', error);
        }
    }
    
    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            const settings = {
                autoOptimizeEnabled: this.autoOptimizeEnabled,
                alertThresholds: this.alertThresholds
            };
            
            localStorage.setItem('mcp_performance_settings', JSON.stringify(settings));
        } catch (error) {
            logger.error('Error saving performance settings:', error);
        }
    }
    
    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        // Listen for resource updates
        window.addEventListener('resource-update', (event) => {
            const { serverId, resources } = event.detail;
            
            // Check for resource alerts
            this.checkResourceAlerts(serverId, resources);
            
            // Auto-optimize if enabled
            if (this.autoOptimizeEnabled) {
                this.autoOptimizeServer(serverId);
            }
        });
    }
    
    /**
     * Check for resource alerts
     * @param {string} serverId - Server ID
     * @param {Object} resources - Server resources
     */
    checkResourceAlerts(serverId, resources) {
        try {
            // Check each resource type against alert thresholds
            for (const [resourceType, value] of Object.entries(resources)) {
                const threshold = this.alertThresholds[resourceType];
                
                if (threshold && value > threshold) {
                    this.triggerResourceAlert(serverId, resourceType, value);
                }
            }
        } catch (error) {
            logger.error(`Error checking resource alerts for server ${serverId}:`, error);
        }
    }
    
    /**
     * Trigger a resource alert
     * @param {string} serverId - Server ID
     * @param {string} resourceType - Resource type
     * @param {number} value - Resource value
     */
    triggerResourceAlert(serverId, resourceType, value) {
        try {
            // Create alert message
            const alertMessage = `Alert: ${resourceType.toUpperCase()} usage for server ${serverId} is at ${value}% (threshold: ${this.alertThresholds[resourceType]}%)`;
            
            // Log alert
            logger.warn(alertMessage);
            
            // Create custom event
            const event = new CustomEvent('resource-alert', {
                detail: {
                    serverId,
                    resourceType,
                    value,
                    threshold: this.alertThresholds[resourceType],
                    message: alertMessage,
                    timestamp: Date.now()
                }
            });
            
            // Dispatch event
            window.dispatchEvent(event);
        } catch (error) {
            logger.error(`Error triggering resource alert for server ${serverId}:`, error);
        }
    }
    
    /**
     * Auto-optimize a server
     * @param {string} serverId - Server ID
     */
    async autoOptimizeServer(serverId) {
        try {
            // Get optimization suggestions
            const suggestions = this.performanceOptimizer.getOptimizationSuggestions(serverId);
            
            // Filter for high priority suggestions
            const highPrioritySuggestions = suggestions.filter(s => s.priority === 'high');
            
            if (highPrioritySuggestions.length > 0) {
                logger.info(`Auto-optimizing server ${serverId} for ${highPrioritySuggestions.length} high priority issues`);
                
                // Apply optimizations
                for (const suggestion of highPrioritySuggestions) {
                    await this.performanceOptimizer.applyOptimization(serverId, suggestion.id);
                }
                
                // Create custom event
                const event = new CustomEvent('auto-optimize', {
                    detail: {
                        serverId,
                        suggestions: highPrioritySuggestions,
                        timestamp: Date.now()
                    }
                });
                
                // Dispatch event
                window.dispatchEvent(event);
            }
        } catch (error) {
            logger.error(`Error auto-optimizing server ${serverId}:`, error);
        }
    }
    
    /**
     * Handles the common logic for starting or stopping monitoring for a server.
     * @param {string} serverId - The ID of the server.
     * @param {Object} actionConfig - Configuration object for the action.
     * @returns {boolean} Success status.
     * @private
     */
    _handleMonitoringStateChange(serverId, actionConfig) {
        const { type, resourceMonitorAction, eventName, updateStateFunc, getEventDetailsFunc } = actionConfig;
        const actionVerb = type === 'start' ? 'Starting' : 'Stopping';
        
        try {
            logger.info(`${actionVerb} performance monitoring for server ${serverId}`);
            
            const success = resourceMonitorAction(); // Call the provided resource monitor function
            
            if (success) {
                updateStateFunc(); // Update the internal monitored server state
                
                // Create and dispatch custom event
                const eventDetail = getEventDetailsFunc();
                const event = new CustomEvent(eventName, { detail: eventDetail });
                window.dispatchEvent(event);
                
                logger.info(`Successfully ${type === 'start' ? 'started' : 'stopped'} monitoring for ${serverId}.`);
                return true;
            } else {
                logger.warn(`Resource monitor action failed when trying to ${type} monitoring for ${serverId}.`);
                return false;
            }
        } catch (error) {
            logger.error(`Error ${type}ing performance monitoring for server ${serverId}:`, error);
            return false;
        }
    }
    
    /**
     * Start monitoring a server
     * @param {string} serverId - Server ID
     * @param {Object} options - Monitoring options (e.g., { name: 'MyServer', type: 'web' })
     * @returns {boolean} Success status
     */
    startMonitoring(serverId, options = {}) {
        if (this.monitoredServers[serverId]) {
            return false; // Already monitoring
        }
        
        const actionConfig = {
            type: 'start',
            resourceMonitorAction: () => this.resourceMonitor.startMonitoring(serverId),
            eventName: 'monitoring-started',
            updateStateFunc: () => {
                this.monitoredServers[serverId] = {
                    id: serverId,
                    name: options.name || serverId,
                    type: options.type || 'unknown',
                    startTime: Date.now(),
                    intervalId: null, // Or manage actual interval if needed here
                    status: 'running'
                };
                logger.debug("Updated monitoredServers state after start:", this.monitoredServers);
            },
            getEventDetailsFunc: () => ({ serverId: serverId })
        };
        
        return this._handleMonitoringStateChange(serverId, actionConfig);
    }
    
    /**
     * Stop monitoring a server
     * @param {string} serverId - Server ID
     * @returns {boolean} Success status
     */
    stopMonitoring(serverId) {
        if (!this.monitoredServers[serverId]) {
            return false; // Not currently monitoring
        }
        
        const actionConfig = {
            type: 'stop',
            resourceMonitorAction: () => this.resourceMonitor.stopMonitoring(serverId),
            eventName: 'monitoring-stopped',
            updateStateFunc: () => {
                delete this.monitoredServers[serverId];
                logger.debug("Updated monitoredServers state after stop:", this.monitoredServers);
            },
            getEventDetailsFunc: () => ({ serverId: serverId })
        };
        
        return this._handleMonitoringStateChange(serverId, actionConfig);
    }
    
    /**
     * Get monitored servers
     * @returns {Object} Monitored servers
     */
    getMonitoredServers() {
        return { ...this.monitoredServers };
    }
    
    /**
     * Generate a performance report for a server
     * @param {string} serverId - Server ID
     * @returns {Object} Performance report
     */
    generatePerformanceReport(serverId) {
        try {
            logger.info(`Generating performance report for server ${serverId}`);
            
            return this.performanceVisualizer.generatePerformanceReport(serverId);
        } catch (error) {
            logger.error(`Error generating performance report for server ${serverId}:`, error);
            return null;
        }
    }
    
    /**
     * Render a performance dashboard for a server
     * @param {string} containerId - Container element ID
     * @param {string} serverId - Server ID
     * @returns {boolean} Success status
     */
    renderPerformanceDashboard(containerId, serverId) {
        try {
            const container = document.getElementById(containerId);
            
            if (!container) {
                logger.error(`Container element ${containerId} not found`);
                return false;
            }
            
            // Clear container
            container.innerHTML = '';
            
            // Create dashboard structure
            const dashboardHtml = `
                <div class="performance-dashboard">
                    <div class="dashboard-header">
                        <h2>Performance Dashboard: ${this.monitoredServers[serverId]?.name || serverId}</h2>
                        <div class="dashboard-controls">
                            <button id="refresh-dashboard-${serverId}" class="btn btn-primary">Refresh</button>
                            <button id="generate-report-${serverId}" class="btn btn-secondary">Generate Report</button>
                        </div>
                    </div>
                    
                    <div class="dashboard-content">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-header">Resource Usage</div>
                                    <div class="card-body">
                                        <div id="resource-chart-${serverId}" class="chart-container"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-header">Resource Statistics</div>
                                    <div class="card-body">
                                        <div id="resource-stats-${serverId}" class="stats-container"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row mt-4">
                            <div class="col-md-12">
                                <div class="card">
                                    <div class="card-header">Optimization Suggestions</div>
                                    <div class="card-body">
                                        <div id="optimization-suggestions-${serverId}" class="suggestions-container"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Set container HTML
            container.innerHTML = dashboardHtml;
            
            // Create resource chart
            this.performanceVisualizer.createCombinedResourceChart(`resource-chart-${serverId}`, serverId);
            
            // Render resource statistics
            this.renderResourceStatistics(`resource-stats-${serverId}`, serverId);
            
            // Render optimization suggestions
            this.renderOptimizationSuggestions(`optimization-suggestions-${serverId}`, serverId);
            
            // Add event listeners
            document.getElementById(`refresh-dashboard-${serverId}`).addEventListener('click', () => {
                this.renderPerformanceDashboard(containerId, serverId);
            });
            
            document.getElementById(`generate-report-${serverId}`).addEventListener('click', () => {
                this.showPerformanceReport(serverId);
            });
            
            return true;
        } catch (error) {
            logger.error(`Error rendering performance dashboard for server ${serverId}:`, error);
            return false;
        }
    }
    
    /**
     * Render resource statistics for a server
     * @param {string} containerId - Container element ID
     * @param {string} serverId - Server ID
     * @returns {boolean} Success status
     */
    renderResourceStatistics(containerId, serverId) {
        try {
            const container = document.getElementById(containerId);
            
            if (!container) {
                logger.error(`Container element ${containerId} not found`);
                return false;
            }
            
            // Get resource statistics
            const stats = this.resourceMonitor.getResourceStatistics(serverId);
            
            // Create statistics HTML
            const statsHtml = `
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Resource</th>
                            <th>Min (%)</th>
                            <th>Max (%)</th>
                            <th>Avg (%)</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>CPU</td>
                            <td>${stats.cpu.min}</td>
                            <td>${stats.cpu.max}</td>
                            <td>${stats.cpu.avg}</td>
                            <td><span class="badge ${this.getStatusBadgeClass(stats.cpu.avg, 'cpu')}">${this.getStatusText(stats.cpu.avg, 'cpu')}</span></td>
                        </tr>
                        <tr>
                            <td>Memory</td>
                            <td>${stats.memory.min}</td>
                            <td>${stats.memory.max}</td>
                            <td>${stats.memory.avg}</td>
                            <td><span class="badge ${this.getStatusBadgeClass(stats.memory.avg, 'memory')}">${this.getStatusText(stats.memory.avg, 'memory')}</span></td>
                        </tr>
                        <tr>
                            <td>Disk</td>
                            <td>${stats.disk.min}</td>
                            <td>${stats.disk.max}</td>
                            <td>${stats.disk.avg}</td>
                            <td><span class="badge ${this.getStatusBadgeClass(stats.disk.avg, 'disk')}">${this.getStatusText(stats.disk.avg, 'disk')}</span></td>
                        </tr>
                        <tr>
                            <td>Network</td>
                            <td>${stats.network.min}</td>
                            <td>${stats.network.max}</td>
                            <td>${stats.network.avg}</td>
                            <td><span class="badge ${this.getStatusBadgeClass(stats.network.avg, 'network')}">${this.getStatusText(stats.network.avg, 'network')}</span></td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="mt-3">
                    <h5>Current Resource Usage</h5>
                    <div class="resource-meters">
                        ${this.renderResourceMeter('CPU', this.resourceMonitor.getResources(serverId)?.cpu || 0, 'cpu')}
                        ${this.renderResourceMeter('Memory', this.resourceMonitor.getResources(serverId)?.memory || 0, 'memory')}
                        ${this.renderResourceMeter('Disk', this.resourceMonitor.getResources(serverId)?.disk || 0, 'disk')}
                        ${this.renderResourceMeter('Network', this.resourceMonitor.getResources(serverId)?.network || 0, 'network')}
                    </div>
                </div>
            `;
            
            // Set container HTML
            container.innerHTML = statsHtml;
            
            return true;
        } catch (error) {
            logger.error(`Error rendering resource statistics for server ${serverId}:`, error);
            return false;
        }
    }
    
    /**
     * Render a resource meter
     * @param {string} label - Resource label
     * @param {number} value - Resource value
     * @param {string} resourceType - Resource type
     * @returns {string} Resource meter HTML
     */
    renderResourceMeter(label, value, resourceType) {
        const meterClass = this.getStatusClass(value, resourceType);
        
        return `
            <div class="resource-meter">
                <div class="meter-label">${label}</div>
                <div class="meter-bar">
                    <div class="meter-fill ${meterClass}" style="width: ${value}%"></div>
                </div>
                <div class="meter-value">${value}%</div>
            </div>
        `;
    }
    
    /**
     * Render optimization suggestions for a server
     * @param {string} containerId - Container element ID
     * @param {string} serverId - Server ID
     * @returns {boolean} Success status
     */
    renderOptimizationSuggestions(containerId, serverId) {
        try {
            const container = document.getElementById(containerId);
            
            if (!container) {
                logger.error(`Container element ${containerId} not found`);
                return false;
            }
            
            // Get optimization suggestions
            const suggestions = this.performanceOptimizer.getOptimizationSuggestions(serverId);
            
            // Create suggestions HTML
            let suggestionsHtml = '';
            
            if (suggestions.length === 0) {
                suggestionsHtml = '<p>No optimization suggestions available.</p>';
            } else {
                // Group suggestions by priority
                const highPriority = suggestions.filter(s => s.priority === 'high');
                const mediumPriority = suggestions.filter(s => s.priority === 'medium');
                const lowPriority = suggestions.filter(s => s.priority === 'low');
                
                // Render each group
                suggestionsHtml += this._renderSuggestionGroupHTML({ title: 'Critical Issues', suggestions: highPriority, badgeClass: 'bg-danger', badgeTextClass: 'text-white' }, serverId);
                suggestionsHtml += this._renderSuggestionGroupHTML({ title: 'Warnings', suggestions: mediumPriority, badgeClass: 'bg-warning', badgeTextClass: 'text-dark' }, serverId);
                suggestionsHtml += this._renderSuggestionGroupHTML({ title: 'Recommendations', suggestions: lowPriority, badgeClass: 'bg-info', badgeTextClass: 'text-dark' }, serverId);
            }
            
            // Set container HTML
            container.innerHTML = suggestionsHtml;
            
            // Add event listeners
            const optimizationButtons = container.querySelectorAll('.apply-optimization');
            
            for (const button of optimizationButtons) {
                button.addEventListener('click', async (event) => {
                    const serverId = event.target.dataset.server;
                    const optimizationId = event.target.dataset.optimization;
                    
                    // Apply optimization
                    const success = await this.performanceOptimizer.applyOptimization(serverId, optimizationId);
                    
                    if (success) {
                        // Refresh suggestions
                        this.renderOptimizationSuggestions(containerId, serverId);
                    }
                });
            }
            
            return true;
        } catch (error) {
            logger.error(`Error rendering optimization suggestions for server ${serverId}:`, error);
            return false;
        }
    }
    
    /**
     * Renders the HTML for a single group of optimization suggestions.
     * @param {object} groupConfig - Configuration for the suggestion group.
     * @param {string} groupConfig.title - The title for the suggestion group.
     * @param {Array} groupConfig.suggestions - An array of suggestion objects for this group.
     * @param {string} groupConfig.badgeClass - The CSS class for the group badge.
     * @param {string} [groupConfig.badgeTextClass=''] - Additional CSS class for badge text.
     * @param {string} serverId - The ID of the server these suggestions apply to.
     * @returns {string} HTML string for the suggestion group.
     * @private
     */
    _renderSuggestionGroupHTML(groupConfig, serverId) {
        const { title, suggestions, badgeClass, badgeTextClass = '' } = groupConfig;
        
        if (!suggestions || suggestions.length === 0) {
            return '';
        }
        
        let groupHtml = `<div class="suggestions-group mt-3">`; // mt-3 for spacing between groups
        groupHtml += `<h5><span class="badge ${badgeClass} ${badgeTextClass}">${title}</span></h5>`;
        groupHtml += '<ul class="list-group">';
        
        for (const suggestion of suggestions) {
            const actionsHtml = Array.isArray(suggestion.suggestions) 
                ? suggestion.suggestions.map(s => `<li>${s}</li>`).join('') 
                : '';
            const resourceBadgeClass = badgeClass; // Use group badge color for resource for consistency
            const resourceBadgeTextClass = badgeTextClass;
            
            groupHtml += `
                <li class="list-group-item">
                    <div class="suggestion-header">
                        <strong>${suggestion.name || 'Unnamed Suggestion'}</strong>
                        <span class="badge ${resourceBadgeClass} ${resourceBadgeTextClass}">${(suggestion.resourceType || 'General').toUpperCase()}</span>
                    </div>
                    <p>${suggestion.description || 'No description available.'}</p>
                    <div class="suggestion-actions">
                        <strong>Recommended Actions:</strong>
                        <ul>${actionsHtml}</ul>
                    </div>
                    <button class="btn btn-sm btn-primary apply-optimization" data-server="${serverId}" data-optimization="${suggestion.id}">Apply Optimization</button>
                </li>
            `;
        }
        
        groupHtml += '</ul></div>';
        return groupHtml;
    }
    
    /**
     * Show a performance report for a server
     * @param {string} serverId - Server ID
     */
    showPerformanceReport(serverId) {
        try {
            // Generate report
            const report = this.generatePerformanceReport(serverId);
            
            if (!report) {
                logger.error(`No report data for server ${serverId}`);
                return;
            }
            
            // Create modal element
            const modalId = `performance-report-modal-${serverId}`;
            let modal = document.getElementById(modalId);
            
            if (!modal) {
                modal = document.createElement('div');
                modal.id = modalId;
                modal.className = 'modal fade';
                modal.tabIndex = -1;
                modal.setAttribute('aria-hidden', 'true');
                
                document.body.appendChild(modal);
            }
            
            // Create modal HTML
            const modalHtml = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Performance Report: ${this.monitoredServers[serverId]?.name || serverId}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div id="report-container-${serverId}"></div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" id="download-report-${serverId}">Download Report</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Set modal HTML
            modal.innerHTML = modalHtml;
            
            // Show modal
            const modalInstance = new bootstrap.Modal(modal);
            modalInstance.show();
            
            // Render report
            this.performanceVisualizer.renderPerformanceReport(`report-container-${serverId}`, serverId);
            
            // Add event listener for download button
            document.getElementById(`download-report-${serverId}`).addEventListener('click', () => {
                this.downloadPerformanceReport(serverId);
            });
        } catch (error) {
            logger.error(`Error showing performance report for server ${serverId}:`, error);
        }
    }
    
    /**
     * Download a performance report for a server
     * @param {string} serverId - Server ID
     */
    downloadPerformanceReport(serverId) {
        try {
            // Generate report
            const report = this.generatePerformanceReport(serverId);
            
            if (!report) {
                logger.error(`No report data for server ${serverId}`);
                return;
            }
            
            // Create report JSON
            const reportJson = JSON.stringify(report, null, 2);
            
            // Create download link
            const blob = new Blob([reportJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            link.href = url;
            link.download = `performance-report-${serverId}-${new Date().toISOString().slice(0, 10)}.json`;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            URL.revokeObjectURL(url);
        } catch (error) {
            logger.error(`Error downloading performance report for server ${serverId}:`, error);
        }
    }
    
    /**
     * Checks if the required data (resources and thresholds) for status calculation is available.
     * @param {object|null|undefined} resources - The resource data object.
     * @param {object|null|undefined} thresholds - The threshold data object.
     * @param {string} serverId - The ID of the server (for logging).
     * @returns {boolean} True if both resources and thresholds are valid objects, false otherwise.
     * @private
     */
    _hasRequiredStatusData(resources, thresholds, serverId) {
        const hasData = !!resources && !!thresholds; // Explicitly check both are truthy
        if (!hasData) {
            logger.warn(`Cannot determine overall status for ${serverId}: Missing resources or thresholds.`);
        }
        return hasData;
    }

    /**
     * Determines the overall status of a server based on its resource usage against thresholds.
     * Assumes performanceOptimizer is available via this.performanceOptimizer
     * @param {string} serverId - The ID of the server.
     * @returns {{text: string, class: string}} Object with the highest severity status text and CSS class.
     */
    getServerOverallStatus(serverId) {
        try {
            const resources = this.resourceMonitor?.getResources(serverId);
            const thresholds = this.performanceOptimizer?.getThresholds();

            // Validate required data first
            if (!this._hasRequiredStatusData(resources, thresholds, serverId)) {
                return { text: 'Unknown', class: 'status-unknown' };
            }

            // Get status for each resource type
            const statusArray = [
                this._getCpuStatus(resources.cpu),
                this._getMemoryStatus(resources.memory),
                this._getDiskStatus(resources.disk),
                this._getNetworkStatus(resources.network)
            ];

            // Determine the highest severity status
            let overallStatus = this._getHighestSeverityStatus(statusArray);

            return overallStatus;

        } catch (error) {
            logger.error(`Error getting overall status for server ${serverId}:`, error);
            return { text: 'Error', class: 'status-unknown' }; // Return error status
        }
    }

    /**
     * Gets the status for CPU usage
     * @param {number|null} cpuUsage - CPU usage percentage
     * @returns {{text: string, class: string}} Status object
     * @private
     */
    _getCpuStatus(cpuUsage) {
        return this._getResourceStatusInfo(cpuUsage, 'cpu');
    }

    /**
     * Gets the status for memory usage
     * @param {number|null} memoryUsage - Memory usage percentage
     * @returns {{text: string, class: string}} Status object
     * @private
     */
    _getMemoryStatus(memoryUsage) {
        return this._getResourceStatusInfo(memoryUsage, 'memory');
    }

    /**
     * Gets the status for network usage
     * @param {number|null} networkUsage - Network usage percentage
     * @returns {{text: string, class: string}} Status object
     * @private
     */
    _getNetworkStatus(networkUsage) {
        return this._getResourceStatusInfo(networkUsage, 'network');
    }

    /**
     * Gets the status for disk usage, handling multiple disks if present
     * @param {Object|Array|number|null} diskData - Disk usage data (could be percentage or object with multiple disks)
     * @returns {{text: string, class: string}} Status object
     * @private
     */
    _getDiskStatus(diskData) {
        // Handle case where diskData is null or undefined
        if (diskData === null || typeof diskData === 'undefined') {
            return { text: 'N/A', class: 'status-unknown' };
        }

        // Handle case where diskData is a simple percentage
        if (typeof diskData === 'number') {
            return this._getResourceStatusInfo(diskData, 'disk');
        }

        // Handle case where diskData is an array of disk objects
        if (Array.isArray(diskData)) {
            const diskStatuses = diskData.map(disk => 
                this._getResourceStatusInfo(disk.usage, 'disk')
            );
            return this._getHighestSeverityStatus(diskStatuses);
        }

        // Handle case where diskData is an object with multiple disks
        if (typeof diskData === 'object') {
            const diskStatuses = Object.values(diskData).map(usage => 
                this._getResourceStatusInfo(usage, 'disk')
            );
            return this._getHighestSeverityStatus(diskStatuses);
        }

        // Default fallback
        return { text: 'Unknown', class: 'status-unknown' };
    }

    /**
     * Converts a status class to a numeric severity level.
     * @param {string} statusClass - The CSS status class.
     * @returns {number} Severity level (2: Critical, 1: Warning, 0: Good, -1: Unknown/NA).
     * @private
     */
    _getSeverityLevel(statusClass) {
        if (statusClass === 'status-critical') return SEVERITY_LEVELS.CRITICAL;
        if (statusClass === 'status-warning') return SEVERITY_LEVELS.WARNING;
        // Handle potential combined classes like 'status-warning text-dark'
        if (statusClass.includes('status-warning')) return SEVERITY_LEVELS.WARNING;
        if (statusClass === 'status-unknown') return SEVERITY_LEVELS.UNKNOWN;
        return SEVERITY_LEVELS.GOOD; // Default to Good
    }

    /**
     * Determines the highest severity status from an array of status objects.
     * @param {Array<{text: string, class: string}>} statusArray - Array of status objects.
     * @returns {{text: string, class: string}} The highest severity status.
     * @private
     */
    _getHighestSeverityStatus(statusArray) {
        // Handle empty or invalid array
        if (!statusArray || statusArray.length === 0) {
            return { text: 'Unknown', class: 'status-unknown' };
        }

        // Start with the first status
        let highestStatus = statusArray[0];
        let highestSeverity = this._getSeverityLevel(statusArray[0].class);

        // Check each status
        for (let i = 1; i < statusArray.length; i++) {
            const currentStatus = statusArray[i];
            const currentSeverity = this._getSeverityLevel(currentStatus.class);

            // Critical is highest priority - return immediately
            if (currentSeverity === SEVERITY_LEVELS.CRITICAL) {
                return currentStatus;
            }

            // Update if this status has higher severity
            if (this._isHigherSeverity(currentSeverity, highestSeverity)) {
                highestStatus = currentStatus;
                highestSeverity = currentSeverity;
            }
        }

        // Adjust text for warning to include dark text class if needed by CSS
        if (highestStatus.class === 'status-warning') {
            highestStatus.class += ' text-dark';
        }

        return highestStatus;
    }
    
    /**
     * Determines if a severity level is higher than another
     * @param {number} currentSeverity - Current severity level being checked
     * @param {number} highestSeverity - Current highest severity level
     * @returns {boolean} True if currentSeverity is higher
     * @private
     */
    _isHigherSeverity(currentSeverity, highestSeverity) {
        return (
            currentSeverity > highestSeverity ||
            (currentSeverity === SEVERITY_LEVELS.UNKNOWN && highestSeverity === SEVERITY_LEVELS.GOOD)
        );
    }
    
    /**
     * Determines the status level and corresponding text/class based on value and thresholds.
     * Assumes performanceOptimizer is available via this.performanceOptimizer
     * @param {number} value - The resource value to check.
     * @param {string} resourceType - The type of resource (e.g., 'cpu').
     * @returns {{text: string, class: string}} Object with status text and CSS class.
     * @private
     */
    _getResourceStatusInfo(value, resourceType) {
        // 1. Check for invalid value
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return { text: 'N/A', class: 'status-unknown' };
        }

        // 2. Get thresholds
        const thresholds = this.performanceOptimizer?.getThresholds()?.[resourceType];
        if (!thresholds) {
            logger.warn(`Thresholds not defined for resource type: ${resourceType}`);
            return { text: 'Unknown', class: 'status-unknown' };
        }

        // 3. Determine status based on thresholds using the helper
        return this._getStatusFromThresholds(value, thresholds);
    }

    /**
     * Determines the status level based on a value and its high/medium thresholds.
     * @param {number} value - The resource value.
     * @param {object} thresholds - Object containing high and medium thresholds.
     * @returns {{text: string, class: string}}
     * @private
     */
    _getStatusFromThresholds(value, thresholds) {
        if (value > thresholds.high) return { text: 'Critical', class: 'status-critical' };
        if (value > thresholds.medium) return { text: 'Warning', class: 'status-warning' };
        return { text: 'Good', class: 'status-good' };
    }
    
    /**
     * Get status text for a resource based on value and thresholds
     * @param {number} value - Resource value
     * @param {string} resourceType - Resource type
     * @returns {string} Status text
     */
    getStatusText(value, resourceType) {
        // Use the helper to get the status info object
        const statusInfo = this._getResourceStatusInfo(value, resourceType);
        // Return only the text part
        return statusInfo.text;
    }
    
    /**
     * Get status class for a resource value
     * @param {number} value - Resource value
     * @param {string} resourceType - Resource type
     * @returns {string} Status class
     */
    getStatusClass(value, resourceType) {
        const thresholds = this.performanceOptimizer.getThresholds()[resourceType];
        
        if (value > thresholds.high) {
            return 'status-critical';
        } else if (value > thresholds.medium) {
            return 'status-warning';
        } else {
            return 'status-good';
        }
    }
    
    /**
     * Get status badge class for a resource value
     * @param {number} value - Resource value
     * @param {string} resourceType - Resource type
     * @returns {string} Status badge class
     */
    getStatusBadgeClass(value, resourceType) {
        const thresholds = this.performanceOptimizer.getThresholds()[resourceType];
        
        if (value > thresholds.high) {
            return 'bg-danger';
        } else if (value > thresholds.medium) {
            return 'bg-warning text-dark';
        } else {
            return 'bg-success';
        }
    }
    
    /**
     * Enable auto-optimization
     * @param {boolean} enabled - Whether auto-optimization is enabled
     */
    setAutoOptimize(enabled) {
        this.autoOptimizeEnabled = enabled;
        this.saveSettings();
        
        logger.info(`Auto-optimization ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Update alert thresholds
     * @param {Object} thresholds - New thresholds
     * @returns {boolean} Success status
     */
    updateAlertThresholds(thresholds) {
        try {
            // Update thresholds
            this.alertThresholds = { ...this.alertThresholds, ...thresholds };
            
            // Save settings
            this.saveSettings();
            
            logger.info('Alert thresholds updated:', this.alertThresholds);
            
            return true;
        } catch (error) {
            logger.error('Error updating alert thresholds:', error);
            return false;
        }
    }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Export for use in other modules
export default performanceMonitor;
