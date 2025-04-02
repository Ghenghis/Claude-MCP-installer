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
                container.className = 'performance-monitor-container';
                
                // Create container structure
                container.innerHTML = `
                    <div class="performance-monitor">
                        <div class="row">
                            <div class="col-md-3">
                                <div class="card">
                                    <div class="card-header">
                                        <h5>Monitored Servers</h5>
                                    </div>
                                    <div class="card-body">
                                        <div id="${this.serverListId}" class="server-list"></div>
                                        <div class="mt-3">
                                            <button id="refresh-server-list" class="btn btn-sm btn-primary">Refresh</button>
                                            <button id="show-settings" class="btn btn-sm btn-secondary">Settings</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-9">
                                <div id="${this.dashboardId}" class="dashboard-container">
                                    <div class="select-server-message">
                                        <h4>Select a server to view performance dashboard</h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="${this.settingsId}" class="settings-container" style="display: none;">
                        <div class="card">
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
                
                // Add container to document
                document.body.appendChild(container);
                
                // Initialize settings form
                this.initializeSettingsForm();
            }
        } catch (error) {
            logger.error('Error creating UI container:', error);
        }
    }
    
    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        try {
            // Refresh server list button
            const refreshButton = document.getElementById('refresh-server-list');
            if (refreshButton) {
                refreshButton.addEventListener('click', () => {
                    this.refreshServerList();
                });
            }
            
            // Show settings button
            const showSettingsButton = document.getElementById('show-settings');
            if (showSettingsButton) {
                showSettingsButton.addEventListener('click', () => {
                    this.showSettings();
                });
            }
            
            // Cancel settings button
            const cancelSettingsButton = document.getElementById('cancel-settings');
            if (cancelSettingsButton) {
                cancelSettingsButton.addEventListener('click', () => {
                    this.hideSettings();
                });
            }
            
            // Settings form
            const settingsForm = document.getElementById('performance-settings-form');
            if (settingsForm) {
                settingsForm.addEventListener('submit', (event) => {
                    event.preventDefault();
                    this.saveSettings();
                });
            }
            
            // Resource alert event
            window.addEventListener('resource-alert', (event) => {
                const { serverId, resourceType, value, threshold, message } = event.detail;
                this.showAlert(message, 'warning');
                this.updateServerStatus(serverId);
            });
            
            // Auto-optimize event
            window.addEventListener('auto-optimize', (event) => {
                const { serverId, suggestions } = event.detail;
                this.showAlert(`Auto-optimized server ${serverId} for ${suggestions.length} high priority issues`, 'info');
                this.updateServerStatus(serverId);
            });
            
            // Monitoring started event
            window.addEventListener('monitoring-started', (event) => {
                const { serverId } = event.detail;
                this.refreshServerList();
                this.showAlert(`Started monitoring server ${serverId}`, 'success');
            });
            
            // Monitoring stopped event
            window.addEventListener('monitoring-stopped', (event) => {
                const { serverId } = event.detail;
                this.refreshServerList();
                this.showAlert(`Stopped monitoring server ${serverId}`, 'info');
            });
        } catch (error) {
            logger.error('Error initializing event listeners:', error);
        }
    }
    
    /**
     * Initialize settings form
     */
    initializeSettingsForm() {
        try {
            // Get auto-optimize toggle
            const autoOptimizeToggle = document.getElementById('auto-optimize-toggle');
            if (autoOptimizeToggle) {
                autoOptimizeToggle.checked = performanceMonitor.autoOptimizeEnabled;
            }
            
            // Get threshold inputs
            const cpuThreshold = document.getElementById('cpu-threshold');
            const memoryThreshold = document.getElementById('memory-threshold');
            const diskThreshold = document.getElementById('disk-threshold');
            const networkThreshold = document.getElementById('network-threshold');
            
            // Set threshold values
            if (cpuThreshold) {
                cpuThreshold.value = performanceMonitor.alertThresholds.cpu;
            }
            
            if (memoryThreshold) {
                memoryThreshold.value = performanceMonitor.alertThresholds.memory;
            }
            
            if (diskThreshold) {
                diskThreshold.value = performanceMonitor.alertThresholds.disk;
            }
            
            if (networkThreshold) {
                networkThreshold.value = performanceMonitor.alertThresholds.network;
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
            const serverList = document.getElementById(this.serverListId);
            
            if (!serverList) {
                logger.error('Server list container not found');
                return;
            }
            
            // Get monitored servers
            const servers = performanceMonitor.getMonitoredServers();
            
            // Clear server list
            serverList.innerHTML = '';
            
            // Add servers to list
            if (Object.keys(servers).length === 0) {
                serverList.innerHTML = '<div class="no-servers">No servers being monitored</div>';
            } else {
                const serverListHtml = `
                    <ul class="list-group">
                        ${Object.values(servers).map(server => `
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
                        `).join('')}
                    </ul>
                `;
                
                serverList.innerHTML = serverListHtml;
                
                // Add event listeners
                const viewDashboardButtons = serverList.querySelectorAll('.view-dashboard');
                const viewReportButtons = serverList.querySelectorAll('.view-report');
                const stopMonitoringButtons = serverList.querySelectorAll('.stop-monitoring');
                
                viewDashboardButtons.forEach(button => {
                    button.addEventListener('click', (event) => {
                        const serverId = event.target.dataset.serverId;
                        this.showDashboard(serverId);
                    });
                });
                
                viewReportButtons.forEach(button => {
                    button.addEventListener('click', (event) => {
                        const serverId = event.target.dataset.serverId;
                        performanceMonitor.showPerformanceReport(serverId);
                    });
                });
                
                stopMonitoringButtons.forEach(button => {
                    button.addEventListener('click', (event) => {
                        const serverId = event.target.dataset.serverId;
                        performanceMonitor.stopMonitoring(serverId);
                    });
                });
            }
            
            // Add start monitoring section
            serverList.innerHTML += `
                <div class="start-monitoring mt-3">
                    <h6>Start Monitoring</h6>
                    <form id="start-monitoring-form">
                        <div class="mb-2">
                            <input type="text" class="form-control form-control-sm" id="server-id" placeholder="Server ID" required>
                        </div>
                        <div class="mb-2">
                            <input type="text" class="form-control form-control-sm" id="server-name" placeholder="Server Name">
                        </div>
                        <div class="mb-2">
                            <select class="form-select form-select-sm" id="server-type">
                                <option value="node">Node.js</option>
                                <option value="python">Python</option>
                                <option value="docker">Docker</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-sm btn-success">Start Monitoring</button>
                    </form>
                </div>
            `;
            
            // Add event listener for start monitoring form
            const startMonitoringForm = document.getElementById('start-monitoring-form');
            
            if (startMonitoringForm) {
                startMonitoringForm.addEventListener('submit', (event) => {
                    event.preventDefault();
                    
                    const serverId = document.getElementById('server-id').value;
                    const serverName = document.getElementById('server-name').value || serverId;
                    const serverType = document.getElementById('server-type').value;
                    
                    performanceMonitor.startMonitoring(serverId, {
                        name: serverName,
                        type: serverType
                    });
                });
            }
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
            // Get dashboard container
            const dashboard = document.getElementById(this.dashboardId);
            
            if (!dashboard) {
                logger.error('Dashboard container not found');
                return;
            }
            
            // Show dashboard
            dashboard.style.display = 'block';
            
            // Render performance dashboard
            performanceMonitor.renderPerformanceDashboard(this.dashboardId, serverId);
        } catch (error) {
            logger.error(`Error showing dashboard for server ${serverId}:`, error);
        }
    }
    
    /**
     * Get server status badge
     * @param {string} serverId - Server ID
     * @returns {string} Server status badge HTML
     */
    getServerStatusBadge(serverId) {
        try {
            // Get server resources
            const resources = performanceMonitor.resourceMonitor.getResources(serverId);
            
            if (!resources) {
                return '<span class="badge bg-secondary">Unknown</span>';
            }
            
            // Check if any resource is above high threshold
            const thresholds = performanceMonitor.performanceOptimizer.getThresholds();
            
            if (
                resources.cpu > thresholds.cpu.high ||
                resources.memory > thresholds.memory.high ||
                resources.disk > thresholds.disk.high ||
                resources.network > thresholds.network.high
            ) {
                return '<span class="badge bg-danger">Critical</span>';
            }
            
            // Check if any resource is above medium threshold
            if (
                resources.cpu > thresholds.cpu.medium ||
                resources.memory > thresholds.memory.medium ||
                resources.disk > thresholds.disk.medium ||
                resources.network > thresholds.network.medium
            ) {
                return '<span class="badge bg-warning text-dark">Warning</span>';
            }
            
            // All resources are below medium threshold
            return '<span class="badge bg-success">Good</span>';
        } catch (error) {
            logger.error(`Error getting server status badge for server ${serverId}:`, error);
            return '<span class="badge bg-secondary">Unknown</span>';
        }
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
     * Add CSS styles for performance monitor UI
     */
    addStyles() {
        try {
            // Create style element
            const style = document.createElement('style');
            
            // Add CSS
            style.textContent = `
                .performance-monitor-container {
                    padding: 20px;
                }
                
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
                
                .select-server-message {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 300px;
                    background-color: #f8f9fa;
                    border-radius: 5px;
                    color: #6c757d;
                }
                
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
            
            // Add style to document
            document.head.appendChild(style);
        } catch (error) {
            logger.error('Error adding styles:', error);
        }
    }
}

// Create singleton instance
const performanceMonitorUI = new PerformanceMonitorUI();

// Add styles
performanceMonitorUI.addStyles();

// Export for use in other modules
export default performanceMonitorUI;
