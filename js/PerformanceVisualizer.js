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
            const canvas = this._setupCanvas(containerId, serverId, resourceType);
            if (!canvas) {
                return null;
            }
            
            // Get resource history
            const history = resourceMonitor.getResourceHistory(serverId, options);
            
            // Prepare chart data
            const labels = history.map(entry => {
                const date = new Date(entry.timestamp);
                return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            });
            
            const data = history.map(entry => entry.resources[resourceType]);
            
            // Create chart
            const ctx = canvas.getContext('2d');
            const chart = this._createChartInstance(ctx, 'line', { labels, datasets: [{ label: `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} Usage (%)`, data, backgroundColor: this.chartColors[resourceType], borderColor: this.chartColors[resourceType], borderWidth: 1, fill: false, tension: 0.4 }] }, {
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
            const canvas = this._setupCanvas(containerId, serverId, 'combined');
            if (!canvas) {
                return null;
            }
            
            // Get resource history
            const history = resourceMonitor.getResourceHistory(serverId, options);
            
            // Prepare data and options
            const chartData = this._prepareCombinedChartData(history);
            const chartOptions = this._getCombinedChartOptions();
            
            // Create chart
            const ctx = canvas.getContext('2d');
            const chart = this._createChartInstance(ctx, 'line', chartData, chartOptions);
            
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
     * Sets up the canvas element for a chart.
     * @param {string} containerId - The ID of the container element.
     * @param {string} serverId - The server ID.
     * @param {string} chartName - Specific name for the chart (e.g., 'cpu', 'combined').
     * @returns {HTMLCanvasElement | null} The canvas element or null if container not found.
     * @private
     */
    _setupCanvas(containerId, serverId, chartName) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container element ${containerId} not found`);
            return null;
        }
        
        // Remove existing canvas if it exists
        const existingCanvas = document.getElementById(`chart-${serverId}-${chartName}`);
        if (existingCanvas) {
            existingCanvas.remove();
        }
        
        const canvas = document.createElement('canvas');
        canvas.id = `chart-${serverId}-${chartName}`;
        container.appendChild(canvas);
        return canvas;
    }
    
    /**
     * Prepares the labels and datasets for the combined resource chart.
     * @param {Array<Object>} history - The resource history data.
     * @returns {{labels: Array<string>, datasets: Array<Object>}} Chart data object.
     * @private
     */
    _prepareCombinedChartData(history) {
        const labels = history.map(entry => {
            const date = new Date(entry.timestamp);
            // Format time as HH:MM
            return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        });
        
        const resourceTypes = ['cpu', 'memory', 'disk', 'network'];
        const datasets = resourceTypes.map(type => ({
            label: `${type.charAt(0).toUpperCase() + type.slice(1)} Usage (%)`,
            data: history.map(entry => entry.resources[type] ?? 0), // Use nullish coalescing for safety
            backgroundColor: this.chartColors[type],
            borderColor: this.chartColors[type],
            borderWidth: 1,
            fill: false,
            tension: 0.4 // Smoothes the line
        }));
        
        return { labels, datasets };
    }
    
    /**
     * Creates a new Chart.js instance.
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
     * @param {string} chartType - The type of chart (e.g., 'line').
     * @param {Object} data - The chart data (labels, datasets).
     * @param {Object} options - The chart options.
     * @returns {Chart} The Chart.js instance.
     * @private
     */
    _createChartInstance(ctx, chartType, data, options) {
        return new Chart(ctx, {
            type: chartType,
            data: data,
            options: options
        });
    }
    
    /**
     * Gets the Chart.js options specific to the combined resource chart.
     * @returns {Object} Chart options object.
     * @private
     */
    _getCombinedChartOptions() {
        return {
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
                    mode: 'index', // Show tooltips for all datasets at that index
                    intersect: false
                },
                legend: {
                    position: 'top'
                }
            }
        };
    }
    
    /**
     * Removes the oldest data point from a chart if the number of data points exceeds the maximum.
     * @param {Chart} chart - The Chart.js instance.
     * @param {number} [maxPoints=20] - The maximum number of data points to keep.
     * @private
     */
    _shiftChartDataIfNeeded(chart, maxPoints = 20) {
        if (chart.data.labels.length > maxPoints) {
            chart.data.labels.shift();
            chart.data.datasets.forEach(dataset => {
                dataset.data.shift();
            });
        }
    }
    
    /**
     * Creates a formatted time label for chart data points
     * @returns {string} Formatted time label (HH:MM)
     * @private
     */
    _createTimeLabel() {
        const date = new Date();
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    /**
     * Adds a data point to a chart and updates it
     * @param {Object} chart - The chart to update
     * @param {string} label - The label for the data point
     * @param {number|Array<number>} data - The data value(s) to add
     * @private
     */
    _addDataPointAndUpdate(chart, label, data) {
        if (!chart) return;
        
        // Add label
        chart.data.labels.push(label);
        
        // Add data (handle both single values and arrays)
        if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i++) {
                chart.data.datasets[i].data.push(data[i]);
            }
        } else {
            chart.data.datasets[0].data.push(data);
        }
        
        // Maintain chart size limit
        this._shiftChartDataIfNeeded(chart);
        
        // Update chart
        chart.update();
    }
    
    /**
     * Update charts for a server
     * @param {string} serverId - Server ID
     * @param {Object} resources - Server resources
     */
    updateCharts(serverId, resources) {
        try {
            // Create a time label once for all charts
            const timeLabel = this._createTimeLabel();
            
            // Update individual resource charts
            for (const resourceType of ['cpu', 'memory', 'disk', 'network']) {
                const chartId = `${serverId}-${resourceType}`;
                const chart = this.charts[chartId];
                
                if (chart) {
                    this._addDataPointAndUpdate(chart, timeLabel, resources[resourceType]);
                }
            }
            
            // Update combined resource chart
            const combinedChartId = `${serverId}-combined`;
            const combinedChart = this.charts[combinedChartId];
            
            if (combinedChart) {
                const resourceValues = ['cpu', 'memory', 'disk', 'network'].map(type => resources[type]);
                this._addDataPointAndUpdate(combinedChart, timeLabel, resourceValues);
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
            
            summary += this._getResourceStatusSummary('cpu', stats.cpu.avg);
            summary += this._getResourceStatusSummary('memory', stats.memory.avg);
            summary += this._getResourceStatusSummary('disk', stats.disk.avg);
            summary += this._getResourceStatusSummary('network', stats.network.avg);
 
            return summary.trim(); // Trim trailing space if network was good
        } catch (error) {
            console.error('Error generating report summary:', error);
            return 'Error generating report summary';
        }
    }
    
    /**
     * Gets the summary string for a single resource's status based on its average value.
     * @param {string} resourceType - The type of resource (e.g., 'cpu', 'memory').
     * @param {number} avgValue - The average value for the resource.
     * @returns {string} A summary string fragment (e.g., "CPU (Critical), ").
     * @private
     */
    _getResourceStatusSummary(resourceType, avgValue) {
        const capitalizedType = resourceType.charAt(0).toUpperCase() + resourceType.slice(1);
        let status = 'Good';
        let thresholds = { critical: 80, warning: 50 }; // Default (CPU, Network)
        
        if (resourceType === 'memory') {
            thresholds = { critical: 85, warning: 60 };
        } else if (resourceType === 'disk') {
            thresholds = { critical: 90, warning: 70 };
        }
        
        if (avgValue > thresholds.critical) {
            status = 'Critical';
        } else if (avgValue > thresholds.warning) {
            status = 'Warning';
        }
        
        // Add comma and space for all but the last one (network)
        const suffix = (resourceType !== 'network') ? ', ' : ''; 
        return `${capitalizedType} (${status})${suffix}`;
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
            const headerHtml = this._buildReportHeaderHTML(serverId, report.timestamp);
            const summaryHtml = this._buildReportSummaryHTML(report.summary);
            const statsTableHtml = this._buildStatsTableHTML(report.statistics);
            const suggestionsHtml = this.renderSuggestions(report.suggestions);
            
            const reportHtml = `
                <div class="performance-report">
                    ${headerHtml}
                    ${summaryHtml}
                    ${statsTableHtml}
                    <h3>Optimization Suggestions</h3>
                    ${suggestionsHtml}
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
     * Builds the HTML for the report header.
     * @param {string} serverId - The server ID.
     * @param {number} timestamp - The timestamp when the report was generated.
     * @returns {string} HTML string for the report header.
     * @private
     */
    _buildReportHeaderHTML(serverId, timestamp) {
        return `
            <h2>Performance Report</h2>
            <p><strong>Server:</strong> ${serverId}</p>
            <p><strong>Generated:</strong> ${new Date(timestamp).toLocaleString()}</p>
        `;
    }
    
    /**
     * Builds the HTML for the report summary section.
     * @param {string} summary - The summary text.
     * @returns {string} HTML string for the summary.
     * @private
     */
    _buildReportSummaryHTML(summary) {
        return `
            <h3>Summary</h3>
            <p>${summary || 'No summary available.'}</p>
        `;
    }
    
    /**
     * Builds the HTML for the resource statistics table.
     * @param {Object} statistics - The statistics object (e.g., { cpu: { min, max, avg }, ... }).
     * @returns {string} HTML string for the statistics table.
     * @private
     */
    _buildStatsTableHTML(statistics) {
        if (!statistics) {
            return '<p>Statistics not available.</p>';
        }
        
        let tableHtml = `
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
        `;
        
        for (const resourceType of ['cpu', 'memory', 'disk', 'network']) {
            const stats = statistics[resourceType] || { min: 'N/A', max: 'N/A', avg: 'N/A' };
            const avg = typeof stats.avg === 'number' ? stats.avg.toFixed(2) : 'N/A'; // Format average
            const statusInfo = this._getResourceStatusInfo(stats.avg, resourceType);
            const statusClass = statusInfo.class;
            const statusText = statusInfo.text;
            
            tableHtml += `
                <tr>
                    <td>${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}</td>
                    <td>${stats.min}</td>
                    <td>${stats.max}</td>
                    <td>${avg}</td>
                    <td class="${statusClass}">${statusText}</td>
                </tr>
            `;
        }
        
        tableHtml += `
                </tbody>
            </table>
        `;
        
        return tableHtml;
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
        
        // Use the helper to render each group
        let html = this._renderSuggestionGroup('Critical Issues', highPriority, 'high-priority');
        html += this._renderSuggestionGroup('Warnings', mediumPriority, 'medium-priority');
        html += this._renderSuggestionGroup('Recommendations', lowPriority, 'low-priority');
        
        return html;
    }
    
    /**
     * Renders a group of suggestions with a specific title and CSS class.
     * @param {string} title - The title for the suggestion group (e.g., 'Critical Issues').
     * @param {Array<Object>} suggestions - Array of suggestion objects for this group.
     * @param {string} cssClass - The CSS class to apply to the group div (e.g., 'high-priority').
     * @returns {string} HTML string for the suggestion group.
     * @private
     */
    _renderSuggestionGroup(title, suggestions, cssClass) {
        if (!suggestions || suggestions.length === 0) {
            return '';
        }
        
        let groupHtml = `<div class="suggestions-group ${cssClass}">`;
        groupHtml += `<h4>${title}</h4>`;
        groupHtml += '<ul>';
        
        for (const suggestion of suggestions) {
            // Ensure suggestion.suggestions is an array before mapping
            const actionsHtml = Array.isArray(suggestion.suggestions) 
                ? suggestion.suggestions.map(s => `<li>${s}</li>`).join('') 
                : '';
            
            groupHtml += `
                <li>
                    <h5>${suggestion.name || 'Unnamed Suggestion'}</h5>
                    <p>${suggestion.description || 'No description.'}</p>
                    <ul class="suggestion-actions">
                        ${actionsHtml}
                    </ul>
                </li>
            `;
        }
        
        groupHtml += '</ul>';
        groupHtml += '</div>';
        return groupHtml;
    }
    
    /**
     * Validates if a numeric resource value is usable for status determination
     * @param {number} value - The resource value to validate
     * @returns {boolean} True if the value is valid and usable, false otherwise
     * @private
     */
    _isValidResourceValue(value) {
        return value !== null && typeof value !== 'undefined' && !isNaN(value);
    }

    /**
     * Determines the status level and corresponding text/class based on value and thresholds.
     * @param {number} value - The resource value to check.
     * @param {string} resourceType - The type of resource (e.g., 'cpu').
     * @returns {{text: string, class: string}} Object containing status text and CSS class.
     * @private
     */
    _getResourceStatusInfo(value, resourceType) {
        // First validate the value
        if (!this._isValidResourceValue(value)) {
            return { text: 'N/A', class: 'status-unknown' };
        }
        
        const thresholds = this._getThresholdsForResource(resourceType);
        
        if (value > thresholds.high) return { text: 'Critical', class: 'status-critical' };
        if (value > thresholds.medium) return { text: 'Warning', class: 'status-warning' };
        return { text: 'Good', class: 'status-good' };
    }
    
    /**
     * Gets the performance thresholds for a specific resource type.
     * @param {string} resourceType - The type of resource (e.g., 'cpu', 'memory').
     * @returns {{high: number, medium: number}} Object containing high and medium thresholds.
     * @private
     */
    _getThresholdsForResource(resourceType) {
        // Default thresholds (CPU, Network)
        let thresholds = { high: 80, medium: 50 }; 
        
        // Use specific thresholds if available from performanceOptimizer
        // Needs review if performanceOptimizer isn't global/member.
        const optimizerThresholds = performanceOptimizer?.getThresholds?.[resourceType];
        if (optimizerThresholds) {
            return optimizerThresholds; 
        }
        
        // Fallback to hardcoded defaults if optimizer doesn't provide them
        if (resourceType === 'memory') {
            thresholds = { high: 85, warning: 60 };
        } else if (resourceType === 'disk') {
            thresholds = { high: 90, warning: 70 };
        }
        
        return thresholds; 
    }
    
    /**
     * Determines the status level and corresponding text/class based on value and thresholds.
     * @param {number} value - The resource value to check.
     * @param {string} resourceType - The type of resource (e.g., 'cpu').
     * @returns {{text: string, class: string}} Object containing status text and CSS class.
     * @private
     */
    _getResourceStatusInfo(value, resourceType) {
        // First validate the value
        if (!this._isValidResourceValue(value)) {
            return { text: 'N/A', class: 'status-unknown' };
        }
        
        const thresholds = this._getThresholdsForResource(resourceType);
        
        if (value > thresholds.high) return { text: 'Critical', class: 'status-critical' };
        if (value > thresholds.medium) return { text: 'Warning', class: 'status-warning' };
        return { text: 'Good', class: 'status-good' };
    }
    
    /**
     * Get status class for a resource value
     * @param {number} value - Resource value
     * @param {string} resourceType - Resource type
     * @returns {string} Status class
     */
    getStatusClass(value, resourceType) {
        return this._getResourceStatusInfo(value, resourceType).class;
    }
    
    /**
     * Get status text for a resource value
     * @param {number} value - Resource value
     * @param {string} resourceType - Resource type
     * @returns {string} Status text
     */
    getStatusText(value, resourceType) {
        return this._getResourceStatusInfo(value, resourceType).text;
    }
}

// Create singleton instance
const performanceVisualizer = new PerformanceVisualizer();

// Export for use in other modules
export default performanceVisualizer;
