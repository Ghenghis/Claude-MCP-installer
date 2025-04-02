/**
 * PerformanceVisualizer.js - Visualizes performance data for MCP servers
 * Creates charts and reports for resource usage and optimization suggestions
 */

import resourceMonitor from './ResourceMonitor.js';
import performanceOptimizer from './PerformanceOptimizer.js';

class PerformanceVisualizer {
    constructor() {
        this.chartColors = {
            cpu: 'rgba(255, 99, 132, 0.8)',
            memory: 'rgba(54, 162, 235, 0.8)',
            disk: 'rgba(255, 206, 86, 0.8)',
            network: 'rgba(75, 192, 192, 0.8)'
        };
        
        this.charts = {};
        this.reportData = {};
        
        // Initialize event listeners
        this.initializeEventListeners();
    }
    
    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        // Listen for resource updates
        window.addEventListener('resource-update', (event) => {
            const { serverId, resources } = event.detail;
            this.updateCharts(serverId, resources);
        });
    }
    
    /**
     * Create a resource usage chart for a server
     * @param {string} containerId - Container element ID
     * @param {string} serverId - Server ID
     * @param {string} resourceType - Resource type (cpu, memory, disk, network)
     * @param {Object} options - Chart options
     * @returns {Object} Chart object
     */
    createResourceChart(containerId, serverId, resourceType, options = {}) {
        try {
            const container = document.getElementById(containerId);
            
            if (!container) {
                console.error(`Container element ${containerId} not found`);
                return null;
            }
            
            // Create canvas element
            const canvas = document.createElement('canvas');
            canvas.id = `chart-${serverId}-${resourceType}`;
            container.appendChild(canvas);
            
            // Get resource history
            const history = resourceMonitor.getResourceHistory(serverId, options);
            
            // Prepare chart data
            const labels = history.map(entry => {
                const date = new Date(entry.timestamp);
                return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
            });
            
            const data = history.map(entry => entry.resources[resourceType]);
            
            // Create chart
            const ctx = canvas.getContext('2d');
            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} Usage (%)`,
                        data,
                        backgroundColor: this.chartColors[resourceType],
                        borderColor: this.chartColors[resourceType],
                        borderWidth: 1,
                        fill: false,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                                display: true,
                                text: 'Usage (%)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Time'
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        },
                        legend: {
                            position: 'top'
                        }
                    }
                }
            });
            
            // Store chart reference
            const chartId = `${serverId}-${resourceType}`;
            this.charts[chartId] = chart;
            
            return chart;
        } catch (error) {
            console.error(`Error creating resource chart for server ${serverId}:`, error);
            return null;
        }
    }
    
    /**
     * Create a combined resource usage chart for a server
     * @param {string} containerId - Container element ID
     * @param {string} serverId - Server ID
     * @param {Object} options - Chart options
     * @returns {Object} Chart object
     */
    createCombinedResourceChart(containerId, serverId, options = {}) {
        try {
            const container = document.getElementById(containerId);
            
            if (!container) {
                console.error(`Container element ${containerId} not found`);
                return null;
            }
            
            // Create canvas element
            const canvas = document.createElement('canvas');
            canvas.id = `chart-${serverId}-combined`;
            container.appendChild(canvas);
            
            // Get resource history
            const history = resourceMonitor.getResourceHistory(serverId, options);
            
            // Prepare chart data
            const labels = history.map(entry => {
                const date = new Date(entry.timestamp);
                return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
            });
            
            const datasets = [
                {
                    label: 'CPU Usage (%)',
                    data: history.map(entry => entry.resources.cpu),
                    backgroundColor: this.chartColors.cpu,
                    borderColor: this.chartColors.cpu,
                    borderWidth: 1,
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Memory Usage (%)',
                    data: history.map(entry => entry.resources.memory),
                    backgroundColor: this.chartColors.memory,
                    borderColor: this.chartColors.memory,
                    borderWidth: 1,
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Disk Usage (%)',
                    data: history.map(entry => entry.resources.disk),
                    backgroundColor: this.chartColors.disk,
                    borderColor: this.chartColors.disk,
                    borderWidth: 1,
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Network Usage (%)',
                    data: history.map(entry => entry.resources.network),
                    backgroundColor: this.chartColors.network,
                    borderColor: this.chartColors.network,
                    borderWidth: 1,
                    fill: false,
                    tension: 0.4
                }
            ];
            
            // Create chart
            const ctx = canvas.getContext('2d');
            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                                display: true,
                                text: 'Usage (%)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Time'
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        },
                        legend: {
                            position: 'top'
                        }
                    }
                }
            });
            
            // Store chart reference
            const chartId = `${serverId}-combined`;
            this.charts[chartId] = chart;
            
            return chart;
        } catch (error) {
            console.error(`Error creating combined resource chart for server ${serverId}:`, error);
            return null;
        }
    }
    
    /**
     * Update charts for a server
     * @param {string} serverId - Server ID
     * @param {Object} resources - Server resources
     */
    updateCharts(serverId, resources) {
        try {
            // Update individual resource charts
            for (const resourceType of ['cpu', 'memory', 'disk', 'network']) {
                const chartId = `${serverId}-${resourceType}`;
                const chart = this.charts[chartId];
                
                if (chart) {
                    // Add new data point
                    const date = new Date();
                    const label = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
                    
                    chart.data.labels.push(label);
                    chart.data.datasets[0].data.push(resources[resourceType]);
                    
                    // Remove oldest data point if too many
                    if (chart.data.labels.length > 20) {
                        chart.data.labels.shift();
                        chart.data.datasets[0].data.shift();
                    }
                    
                    // Update chart
                    chart.update();
                }
            }
            
            // Update combined resource chart
            const combinedChartId = `${serverId}-combined`;
            const combinedChart = this.charts[combinedChartId];
            
            if (combinedChart) {
                // Add new data point
                const date = new Date();
                const label = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
                
                combinedChart.data.labels.push(label);
                
                for (let i = 0; i < 4; i++) {
                    const resourceType = ['cpu', 'memory', 'disk', 'network'][i];
                    combinedChart.data.datasets[i].data.push(resources[resourceType]);
                    
                    // Remove oldest data point if too many
                    if (combinedChart.data.labels.length > 20) {
                        combinedChart.data.labels.shift();
                        combinedChart.data.datasets[i].data.shift();
                    }
                }
                
                // Update chart
                combinedChart.update();
            }
        } catch (error) {
            console.error(`Error updating charts for server ${serverId}:`, error);
        }
    }
    
    /**
     * Generate a performance report for a server
     * @param {string} serverId - Server ID
     * @returns {Object} Performance report
     */
    generatePerformanceReport(serverId) {
        try {
            // Get resource statistics
            const stats = resourceMonitor.getResourceStatistics(serverId);
            
            // Get optimization suggestions
            const suggestions = performanceOptimizer.getOptimizationSuggestions(serverId);
            
            // Create report
            const report = {
                serverId,
                timestamp: Date.now(),
                statistics: stats,
                suggestions,
                summary: this.generateReportSummary(stats, suggestions)
            };
            
            // Store report data
            this.reportData[serverId] = report;
            
            return report;
        } catch (error) {
            console.error(`Error generating performance report for server ${serverId}:`, error);
            return null;
        }
    }
    
    /**
     * Generate a summary for a performance report
     * @param {Object} stats - Resource statistics
     * @param {Array} suggestions - Optimization suggestions
     * @returns {string} Report summary
     */
    generateReportSummary(stats, suggestions) {
        try {
            // Generate summary based on statistics and suggestions
            const highPrioritySuggestions = suggestions.filter(s => s.priority === 'high');
            const mediumPrioritySuggestions = suggestions.filter(s => s.priority === 'medium');
            
            let summary = '';
            
            if (highPrioritySuggestions.length > 0) {
                summary += `Critical issues: ${highPrioritySuggestions.length}. `;
            }
            
            if (mediumPrioritySuggestions.length > 0) {
                summary += `Warnings: ${mediumPrioritySuggestions.length}. `;
            }
            
            // Add resource usage summary
            summary += 'Resource usage: ';
            
            if (stats.cpu.avg > 80) {
                summary += 'CPU (Critical), ';
            } else if (stats.cpu.avg > 50) {
                summary += 'CPU (Warning), ';
            } else {
                summary += 'CPU (Good), ';
            }
            
            if (stats.memory.avg > 85) {
                summary += 'Memory (Critical), ';
            } else if (stats.memory.avg > 60) {
                summary += 'Memory (Warning), ';
            } else {
                summary += 'Memory (Good), ';
            }
            
            if (stats.disk.avg > 90) {
                summary += 'Disk (Critical), ';
            } else if (stats.disk.avg > 70) {
                summary += 'Disk (Warning), ';
            } else {
                summary += 'Disk (Good), ';
            }
            
            if (stats.network.avg > 80) {
                summary += 'Network (Critical)';
            } else if (stats.network.avg > 50) {
                summary += 'Network (Warning)';
            } else {
                summary += 'Network (Good)';
            }
            
            return summary;
        } catch (error) {
            console.error('Error generating report summary:', error);
            return 'Error generating report summary';
        }
    }
    
    /**
     * Render a performance report to HTML
     * @param {string} containerId - Container element ID
     * @param {string} serverId - Server ID
     * @returns {boolean} Success status
     */
    renderPerformanceReport(containerId, serverId) {
        try {
            const container = document.getElementById(containerId);
            
            if (!container) {
                console.error(`Container element ${containerId} not found`);
                return false;
            }
            
            // Generate report if not already generated
            if (!this.reportData[serverId]) {
                this.generatePerformanceReport(serverId);
            }
            
            const report = this.reportData[serverId];
            
            if (!report) {
                console.error(`No report data for server ${serverId}`);
                return false;
            }
            
            // Clear container
            container.innerHTML = '';
            
            // Create report HTML
            const reportHtml = `
                <div class="performance-report">
                    <h2>Performance Report</h2>
                    <p><strong>Server:</strong> ${serverId}</p>
                    <p><strong>Generated:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
                    
                    <h3>Summary</h3>
                    <p>${report.summary}</p>
                    
                    <h3>Resource Statistics</h3>
                    <table class="stats-table">
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
                                <td>${report.statistics.cpu.min}</td>
                                <td>${report.statistics.cpu.max}</td>
                                <td>${report.statistics.cpu.avg}</td>
                                <td class="${this.getStatusClass(report.statistics.cpu.avg, 'cpu')}">${this.getStatusText(report.statistics.cpu.avg, 'cpu')}</td>
                            </tr>
                            <tr>
                                <td>Memory</td>
                                <td>${report.statistics.memory.min}</td>
                                <td>${report.statistics.memory.max}</td>
                                <td>${report.statistics.memory.avg}</td>
                                <td class="${this.getStatusClass(report.statistics.memory.avg, 'memory')}">${this.getStatusText(report.statistics.memory.avg, 'memory')}</td>
                            </tr>
                            <tr>
                                <td>Disk</td>
                                <td>${report.statistics.disk.min}</td>
                                <td>${report.statistics.disk.max}</td>
                                <td>${report.statistics.disk.avg}</td>
                                <td class="${this.getStatusClass(report.statistics.disk.avg, 'disk')}">${this.getStatusText(report.statistics.disk.avg, 'disk')}</td>
                            </tr>
                            <tr>
                                <td>Network</td>
                                <td>${report.statistics.network.min}</td>
                                <td>${report.statistics.network.max}</td>
                                <td>${report.statistics.network.avg}</td>
                                <td class="${this.getStatusClass(report.statistics.network.avg, 'network')}">${this.getStatusText(report.statistics.network.avg, 'network')}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <h3>Optimization Suggestions</h3>
                    ${this.renderSuggestions(report.suggestions)}
                </div>
            `;
            
            // Set container HTML
            container.innerHTML = reportHtml;
            
            return true;
        } catch (error) {
            console.error(`Error rendering performance report for server ${serverId}:`, error);
            return false;
        }
    }
    
    /**
     * Render optimization suggestions to HTML
     * @param {Array} suggestions - Optimization suggestions
     * @returns {string} HTML for suggestions
     */
    renderSuggestions(suggestions) {
        if (suggestions.length === 0) {
            return '<p>No optimization suggestions available.</p>';
        }
        
        // Group suggestions by priority
        const highPriority = suggestions.filter(s => s.priority === 'high');
        const mediumPriority = suggestions.filter(s => s.priority === 'medium');
        const lowPriority = suggestions.filter(s => s.priority === 'low');
        
        let html = '';
        
        // Render high priority suggestions
        if (highPriority.length > 0) {
            html += '<div class="suggestions-group high-priority">';
            html += '<h4>Critical Issues</h4>';
            html += '<ul>';
            
            for (const suggestion of highPriority) {
                html += `
                    <li>
                        <h5>${suggestion.name}</h5>
                        <p>${suggestion.description}</p>
                        <ul class="suggestion-actions">
                            ${suggestion.suggestions.map(s => `<li>${s}</li>`).join('')}
                        </ul>
                    </li>
                `;
            }
            
            html += '</ul>';
            html += '</div>';
        }
        
        // Render medium priority suggestions
        if (mediumPriority.length > 0) {
            html += '<div class="suggestions-group medium-priority">';
            html += '<h4>Warnings</h4>';
            html += '<ul>';
            
            for (const suggestion of mediumPriority) {
                html += `
                    <li>
                        <h5>${suggestion.name}</h5>
                        <p>${suggestion.description}</p>
                        <ul class="suggestion-actions">
                            ${suggestion.suggestions.map(s => `<li>${s}</li>`).join('')}
                        </ul>
                    </li>
                `;
            }
            
            html += '</ul>';
            html += '</div>';
        }
        
        // Render low priority suggestions
        if (lowPriority.length > 0) {
            html += '<div class="suggestions-group low-priority">';
            html += '<h4>Recommendations</h4>';
            html += '<ul>';
            
            for (const suggestion of lowPriority) {
                html += `
                    <li>
                        <h5>${suggestion.name}</h5>
                        <p>${suggestion.description}</p>
                        <ul class="suggestion-actions">
                            ${suggestion.suggestions.map(s => `<li>${s}</li>`).join('')}
                        </ul>
                    </li>
                `;
            }
            
            html += '</ul>';
            html += '</div>';
        }
        
        return html;
    }
    
    /**
     * Get status class for a resource value
     * @param {number} value - Resource value
     * @param {string} resourceType - Resource type
     * @returns {string} Status class
     */
    getStatusClass(value, resourceType) {
        const thresholds = performanceOptimizer.getThresholds()[resourceType];
        
        if (value > thresholds.high) {
            return 'status-critical';
        } else if (value > thresholds.medium) {
            return 'status-warning';
        } else {
            return 'status-good';
        }
    }
    
    /**
     * Get status text for a resource value
     * @param {number} value - Resource value
     * @param {string} resourceType - Resource type
     * @returns {string} Status text
     */
    getStatusText(value, resourceType) {
        const thresholds = performanceOptimizer.getThresholds()[resourceType];
        
        if (value > thresholds.high) {
            return 'Critical';
        } else if (value > thresholds.medium) {
            return 'Warning';
        } else {
            return 'Good';
        }
    }
}

// Create singleton instance
const performanceVisualizer = new PerformanceVisualizer();

// Export for use in other modules
export default performanceVisualizer;
