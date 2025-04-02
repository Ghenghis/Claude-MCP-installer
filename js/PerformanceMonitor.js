/**
 * PerformanceMonitor.js - Main module for performance monitoring
 * Integrates ResourceMonitor, PerformanceOptimizer, and PerformanceVisualizer
 */

import resourceMonitor from './ResourceMonitor.js';
import performanceOptimizer from './PerformanceOptimizer.js';
import performanceVisualizer from './PerformanceVisualizer.js';
import logger from './logger.js';

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
     * Start monitoring a server
     * @param {string} serverId - Server ID
     * @param {Object} options - Monitoring options
     * @returns {boolean} Success status
     */
    startMonitoring(serverId, options = {}) {
        try {
            logger.info(`Starting performance monitoring for server ${serverId}`);
            
            // Start resource monitoring
            const success = this.resourceMonitor.startMonitoring(serverId, options);
            
            if (success) {
                // Store server in monitoredServers
                this.monitoredServers[serverId] = {
                    id: serverId,
                    name: options.name || serverId,
                    type: options.type || 'unknown',
                    startTime: Date.now(),
                    options
                };
                
                // Create custom event
                const event = new CustomEvent('monitoring-started', {
                    detail: {
                        serverId,
                        options,
                        timestamp: Date.now()
                    }
                });
                
                // Dispatch event
                window.dispatchEvent(event);
            }
            
            return success;
        } catch (error) {
            logger.error(`Error starting performance monitoring for server ${serverId}:`, error);
            return false;
        }
    }
    
    /**
     * Stop monitoring a server
     * @param {string} serverId - Server ID
     * @returns {boolean} Success status
     */
    stopMonitoring(serverId) {
        try {
            logger.info(`Stopping performance monitoring for server ${serverId}`);
            
            // Stop resource monitoring
            const success = this.resourceMonitor.stopMonitoring(serverId);
            
            if (success) {
                // Remove server from monitoredServers
                delete this.monitoredServers[serverId];
                
                // Create custom event
                const event = new CustomEvent('monitoring-stopped', {
                    detail: {
                        serverId,
                        timestamp: Date.now()
                    }
                });
                
                // Dispatch event
                window.dispatchEvent(event);
            }
            
            return success;
        } catch (error) {
            logger.error(`Error stopping performance monitoring for server ${serverId}:`, error);
            return false;
        }
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
                
                // Render high priority suggestions
                if (highPriority.length > 0) {
                    suggestionsHtml += '<div class="suggestions-group">';
                    suggestionsHtml += '<h5><span class="badge bg-danger">Critical Issues</span></h5>';
                    suggestionsHtml += '<ul class="list-group">';
                    
                    for (const suggestion of highPriority) {
                        suggestionsHtml += `
                            <li class="list-group-item">
                                <div class="suggestion-header">
                                    <strong>${suggestion.name}</strong>
                                    <span class="badge bg-danger">${suggestion.resourceType.toUpperCase()}</span>
                                </div>
                                <p>${suggestion.description}</p>
                                <div class="suggestion-actions">
                                    <strong>Recommended Actions:</strong>
                                    <ul>
                                        ${suggestion.suggestions.map(s => `<li>${s}</li>`).join('')}
                                    </ul>
                                </div>
                                <button class="btn btn-sm btn-primary apply-optimization" data-server="${serverId}" data-optimization="${suggestion.id}">Apply Optimization</button>
                            </li>
                        `;
                    }
                    
                    suggestionsHtml += '</ul>';
                    suggestionsHtml += '</div>';
                }
                
                // Render medium priority suggestions
                if (mediumPriority.length > 0) {
                    suggestionsHtml += '<div class="suggestions-group mt-3">';
                    suggestionsHtml += '<h5><span class="badge bg-warning text-dark">Warnings</span></h5>';
                    suggestionsHtml += '<ul class="list-group">';
                    
                    for (const suggestion of mediumPriority) {
                        suggestionsHtml += `
                            <li class="list-group-item">
                                <div class="suggestion-header">
                                    <strong>${suggestion.name}</strong>
                                    <span class="badge bg-warning text-dark">${suggestion.resourceType.toUpperCase()}</span>
                                </div>
                                <p>${suggestion.description}</p>
                                <div class="suggestion-actions">
                                    <strong>Recommended Actions:</strong>
                                    <ul>
                                        ${suggestion.suggestions.map(s => `<li>${s}</li>`).join('')}
                                    </ul>
                                </div>
                                <button class="btn btn-sm btn-primary apply-optimization" data-server="${serverId}" data-optimization="${suggestion.id}">Apply Optimization</button>
                            </li>
                        `;
                    }
                    
                    suggestionsHtml += '</ul>';
                    suggestionsHtml += '</div>';
                }
                
                // Render low priority suggestions
                if (lowPriority.length > 0) {
                    suggestionsHtml += '<div class="suggestions-group mt-3">';
                    suggestionsHtml += '<h5><span class="badge bg-info text-dark">Recommendations</span></h5>';
                    suggestionsHtml += '<ul class="list-group">';
                    
                    for (const suggestion of lowPriority) {
                        suggestionsHtml += `
                            <li class="list-group-item">
                                <div class="suggestion-header">
                                    <strong>${suggestion.name}</strong>
                                    <span class="badge bg-info text-dark">${suggestion.resourceType.toUpperCase()}</span>
                                </div>
                                <p>${suggestion.description}</p>
                                <div class="suggestion-actions">
                                    <strong>Recommended Actions:</strong>
                                    <ul>
                                        ${suggestion.suggestions.map(s => `<li>${s}</li>`).join('')}
                                    </ul>
                                </div>
                                <button class="btn btn-sm btn-primary apply-optimization" data-server="${serverId}" data-optimization="${suggestion.id}">Apply Optimization</button>
                            </li>
                        `;
                    }
                    
                    suggestionsHtml += '</ul>';
                    suggestionsHtml += '</div>';
                }
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
     * Get status text for a resource value
     * @param {number} value - Resource value
     * @param {string} resourceType - Resource type
     * @returns {string} Status text
     */
    getStatusText(value, resourceType) {
        const thresholds = this.performanceOptimizer.getThresholds()[resourceType];
        
        if (value > thresholds.high) {
            return 'Critical';
        } else if (value > thresholds.medium) {
            return 'Warning';
        } else {
            return 'Good';
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
