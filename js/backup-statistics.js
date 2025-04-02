/**
 * Backup Statistics - Provides statistics and insights about backup usage
 */
class BackupStatistics {
    constructor() {
        this.backupManager = new BackupManager();
        this.fileSystem = window.FileSystemAPI;
        this.initUI();
    }

    /**
     * Initialize UI elements
     */
    initUI() {
        this.elements = {
            statsContainer: document.getElementById('backup-stats-container'),
            storageUsageChart: document.getElementById('storage-usage-chart'),
            backupFrequencyChart: document.getElementById('backup-frequency-chart'),
            serverDistributionChart: document.getElementById('server-distribution-chart')
        };
        
        if (this.elements.statsContainer) {
            this.loadStatistics();
        }
    }

    /**
     * Load backup statistics
     */
    async loadStatistics() {
        try {
            // Show loading state
            this.showLoading();
            
            // Get all servers
            const servers = await this.getServers();
            
            // Get statistics for each server
            const serverStats = await Promise.all(
                servers.map(server => this.getServerStatistics(server.id))
            );
            
            // Get overall statistics
            const overallStats = this.calculateOverallStatistics(serverStats);
            
            // Display statistics
            this.displayStatistics(overallStats, serverStats);
            
            // Render charts
            this.renderCharts(overallStats, serverStats);
            
            // Hide loading state
            this.hideLoading();
        } catch (error) {
            console.error('Error loading backup statistics:', error);
            this.showError('Failed to load backup statistics');
            this.hideLoading();
        }
    }

    /**
     * Get servers
     * @returns {Promise<Array>} Array of servers
     */
    async getServers() {
        try {
            return await window.ServerManager.getServers();
        } catch (error) {
            console.error('Error getting servers:', error);
            return [];
        }
    }

    /**
     * Get statistics for a server
     * @param {string} serverId - Server ID
     * @returns {Promise<Object>} Server statistics
     */
    async getServerStatistics(serverId) {
        try {
            // Get server info
            const server = await window.ServerManager.getServerInfo(serverId);
            
            // Get backups for server
            const backups = await this.backupManager.getBackups(serverId);
            
            // Calculate total size
            let totalSize = 0;
            for (const backup of backups) {
                totalSize += await this.getBackupSize(serverId, backup.id);
            }
            
            // Calculate backup frequency
            const backupFrequency = this.calculateBackupFrequency(backups);
            
            // Return statistics
            return {
                serverId,
                serverName: server.name,
                backupCount: backups.length,
                totalSize,
                oldestBackup: backups.length > 0 ? new Date(backups[backups.length - 1].timestamp) : null,
                newestBackup: backups.length > 0 ? new Date(backups[0].timestamp) : null,
                backupFrequency
            };
        } catch (error) {
            console.error(`Error getting statistics for server ${serverId}:`, error);
            return {
                serverId,
                serverName: 'Unknown',
                backupCount: 0,
                totalSize: 0,
                oldestBackup: null,
                newestBackup: null,
                backupFrequency: {}
            };
        }
    }

    /**
     * Get backup size
     * @param {string} serverId - Server ID
     * @param {string} backupId - Backup ID
     * @returns {Promise<number>} Backup size in bytes
     */
    async getBackupSize(serverId, backupId) {
        try {
            const backupDir = `${this.backupManager.options.backupBasePath || './backups'}/${serverId}/${backupId}`;
            
            // Get directory size recursively
            return await this.getDirectorySize(backupDir);
        } catch (error) {
            console.error(`Error getting size for backup ${backupId}:`, error);
            return 0;
        }
    }

    /**
     * Get directory size recursively
     * @param {string} dirPath - Directory path
     * @returns {Promise<number>} Directory size in bytes
     */
    async getDirectorySize(dirPath) {
        try {
            // Check if directory exists
            const exists = await this.fileSystem.existsAsync(dirPath);
            if (!exists) {
                return 0;
            }
            
            // Get files in directory
            const files = await this.fileSystem.readdirAsync(dirPath);
            
            let totalSize = 0;
            
            // Calculate size of each file/directory
            for (const file of files) {
                const filePath = this.fileSystem.path.join(dirPath, file);
                const stat = await this.fileSystem.statAsync(filePath);
                
                if (stat.isDirectory()) {
                    // Recursively get size of subdirectory
                    totalSize += await this.getDirectorySize(filePath);
                } else {
                    // Add file size
                    totalSize += stat.size;
                }
            }
            
            return totalSize;
        } catch (error) {
            console.error(`Error getting directory size for ${dirPath}:`, error);
            return 0;
        }
    }

    /**
     * Calculate backup frequency
     * @param {Array} backups - Array of backups
     * @returns {Object} Backup frequency by day of week and hour
     */
    calculateBackupFrequency(backups) {
        const dayFrequency = {
            'Sunday': 0,
            'Monday': 0,
            'Tuesday': 0,
            'Wednesday': 0,
            'Thursday': 0,
            'Friday': 0,
            'Saturday': 0
        };
        
        const hourFrequency = {};
        for (let i = 0; i < 24; i++) {
            hourFrequency[i] = 0;
        }
        
        // Calculate frequency
        for (const backup of backups) {
            const date = new Date(backup.timestamp);
            const day = date.toLocaleDateString('en-US', { weekday: 'long' });
            const hour = date.getHours();
            
            dayFrequency[day]++;
            hourFrequency[hour]++;
        }
        
        return {
            byDay: dayFrequency,
            byHour: hourFrequency
        };
    }

    /**
     * Calculate overall statistics
     * @param {Array} serverStats - Array of server statistics
     * @returns {Object} Overall statistics
     */
    calculateOverallStatistics(serverStats) {
        // Calculate totals
        const totalBackups = serverStats.reduce((total, stats) => total + stats.backupCount, 0);
        const totalSize = serverStats.reduce((total, stats) => total + stats.totalSize, 0);
        
        // Find oldest and newest backups
        let oldestBackup = null;
        let newestBackup = null;
        
        for (const stats of serverStats) {
            if (stats.oldestBackup && (!oldestBackup || stats.oldestBackup < oldestBackup)) {
                oldestBackup = stats.oldestBackup;
            }
            
            if (stats.newestBackup && (!newestBackup || stats.newestBackup > newestBackup)) {
                newestBackup = stats.newestBackup;
            }
        }
        
        // Calculate backup frequency
        const overallDayFrequency = {
            'Sunday': 0,
            'Monday': 0,
            'Tuesday': 0,
            'Wednesday': 0,
            'Thursday': 0,
            'Friday': 0,
            'Saturday': 0
        };
        
        const overallHourFrequency = {};
        for (let i = 0; i < 24; i++) {
            overallHourFrequency[i] = 0;
        }
        
        for (const stats of serverStats) {
            for (const day in stats.backupFrequency.byDay) {
                overallDayFrequency[day] += stats.backupFrequency.byDay[day];
            }
            
            for (const hour in stats.backupFrequency.byHour) {
                overallHourFrequency[hour] += stats.backupFrequency.byHour[hour];
            }
        }
        
        return {
            totalBackups,
            totalSize,
            serverCount: serverStats.length,
            oldestBackup,
            newestBackup,
            backupFrequency: {
                byDay: overallDayFrequency,
                byHour: overallHourFrequency
            }
        };
    }

    /**
     * Display statistics
     * @param {Object} overallStats - Overall statistics
     * @param {Array} serverStats - Array of server statistics
     */
    displayStatistics(overallStats, serverStats) {
        if (!this.elements.statsContainer) return;
        
        // Format overall statistics
        const totalSizeFormatted = this.formatFileSize(overallStats.totalSize);
        const oldestBackupFormatted = overallStats.oldestBackup 
            ? overallStats.oldestBackup.toLocaleDateString() 
            : 'N/A';
        const newestBackupFormatted = overallStats.newestBackup 
            ? overallStats.newestBackup.toLocaleDateString() 
            : 'N/A';
        
        // Create HTML for overall statistics
        let html = `
            <div class="stats-section">
                <h3>Overall Statistics</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${overallStats.totalBackups}</div>
                        <div class="stat-label">Total Backups</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${overallStats.serverCount}</div>
                        <div class="stat-label">Servers</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${totalSizeFormatted}</div>
                        <div class="stat-label">Total Size</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${oldestBackupFormatted}</div>
                        <div class="stat-label">Oldest Backup</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${newestBackupFormatted}</div>
                        <div class="stat-label">Newest Backup</div>
                    </div>
                </div>
            </div>
            
            <div class="stats-section">
                <h3>Server Breakdown</h3>
                <div class="stats-table-container">
                    <table class="stats-table">
                        <thead>
                            <tr>
                                <th>Server</th>
                                <th>Backups</th>
                                <th>Size</th>
                                <th>Latest Backup</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        // Add rows for each server
        for (const stats of serverStats) {
            const sizeFormatted = this.formatFileSize(stats.totalSize);
            const latestBackupFormatted = stats.newestBackup 
                ? stats.newestBackup.toLocaleDateString() 
                : 'N/A';
            
            html += `
                <tr>
                    <td>${stats.serverName}</td>
                    <td>${stats.backupCount}</td>
                    <td>${sizeFormatted}</td>
                    <td>${latestBackupFormatted}</td>
                </tr>
            `;
        }
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="stats-section">
                <h3>Charts</h3>
                <div class="stats-charts">
                    <div class="chart-container">
                        <h4>Storage Usage by Server</h4>
                        <canvas id="storage-usage-chart"></canvas>
                    </div>
                    <div class="chart-container">
                        <h4>Backup Frequency by Day</h4>
                        <canvas id="backup-frequency-chart"></canvas>
                    </div>
                    <div class="chart-container">
                        <h4>Backup Distribution by Server</h4>
                        <canvas id="server-distribution-chart"></canvas>
                    </div>
                </div>
            </div>
        `;
        
        // Set HTML
        this.elements.statsContainer.innerHTML = html;
        
        // Update chart elements
        this.elements.storageUsageChart = document.getElementById('storage-usage-chart');
        this.elements.backupFrequencyChart = document.getElementById('backup-frequency-chart');
        this.elements.serverDistributionChart = document.getElementById('server-distribution-chart');
    }

    /**
     * Render charts
     * @param {Object} overallStats - Overall statistics
     * @param {Array} serverStats - Array of server statistics
     */
    renderCharts(overallStats, serverStats) {
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js is not available. Charts will not be rendered.');
            return;
        }
        
        // Render storage usage chart
        this.renderStorageUsageChart(serverStats);
        
        // Render backup frequency chart
        this.renderBackupFrequencyChart(overallStats.backupFrequency);
        
        // Render server distribution chart
        this.renderServerDistributionChart(serverStats);
    }

    /**
     * Render storage usage chart
     * @param {Array} serverStats - Array of server statistics
     */
    renderStorageUsageChart(serverStats) {
        if (!this.elements.storageUsageChart) return;
        
        // Prepare data
        const labels = serverStats.map(stats => stats.serverName);
        const data = serverStats.map(stats => stats.totalSize);
        
        // Generate colors
        const colors = this.generateChartColors(serverStats.length);
        
        // Create chart
        new Chart(this.elements.storageUsageChart, {
            type: 'pie',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colors
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.raw;
                                const formattedValue = this.formatFileSize(value);
                                return `${context.label}: ${formattedValue}`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Render backup frequency chart
     * @param {Object} backupFrequency - Backup frequency data
     */
    renderBackupFrequencyChart(backupFrequency) {
        if (!this.elements.backupFrequencyChart) return;
        
        // Prepare data
        const labels = Object.keys(backupFrequency.byDay);
        const data = Object.values(backupFrequency.byDay);
        
        // Create chart
        new Chart(this.elements.backupFrequencyChart, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Backups',
                    data,
                    backgroundColor: 'rgba(99, 102, 241, 0.7)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }

    /**
     * Render server distribution chart
     * @param {Array} serverStats - Array of server statistics
     */
    renderServerDistributionChart(serverStats) {
        if (!this.elements.serverDistributionChart) return;
        
        // Prepare data
        const labels = serverStats.map(stats => stats.serverName);
        const data = serverStats.map(stats => stats.backupCount);
        
        // Generate colors
        const colors = this.generateChartColors(serverStats.length);
        
        // Create chart
        new Chart(this.elements.serverDistributionChart, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colors
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    /**
     * Generate chart colors
     * @param {number} count - Number of colors to generate
     * @returns {Array} Array of colors
     */
    generateChartColors(count) {
        const colors = [];
        const baseColors = [
            'rgba(99, 102, 241, 0.7)',   // Indigo
            'rgba(16, 185, 129, 0.7)',   // Emerald
            'rgba(239, 68, 68, 0.7)',    // Red
            'rgba(245, 158, 11, 0.7)',   // Amber
            'rgba(59, 130, 246, 0.7)',   // Blue
            'rgba(168, 85, 247, 0.7)',   // Purple
            'rgba(236, 72, 153, 0.7)',   // Pink
            'rgba(20, 184, 166, 0.7)',   // Teal
            'rgba(249, 115, 22, 0.7)',   // Orange
            'rgba(139, 92, 246, 0.7)'    // Violet
        ];
        
        // Use base colors first
        for (let i = 0; i < count; i++) {
            if (i < baseColors.length) {
                colors.push(baseColors[i]);
            } else {
                // Generate random colors if we need more
                const r = Math.floor(Math.random() * 255);
                const g = Math.floor(Math.random() * 255);
                const b = Math.floor(Math.random() * 255);
                colors.push(`rgba(${r}, ${g}, ${b}, 0.7)`);
            }
        }
        
        return colors;
    }

    /**
     * Format file size
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
    }

    /**
     * Show loading state
     */
    showLoading() {
        if (!this.elements.statsContainer) return;
        
        this.elements.statsContainer.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Loading backup statistics...</p>
            </div>
        `;
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        // Loading state is replaced when statistics are displayed
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        if (!this.elements.statsContainer) return;
        
        this.elements.statsContainer.innerHTML = `
            <div class="error-container">
                <div class="error-icon">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <p>${message}</p>
                <button class="retry-btn" onclick="window.BackupStatistics.loadStatistics()">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}

// Initialize the BackupStatistics when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.BackupStatistics = new BackupStatistics();
});
