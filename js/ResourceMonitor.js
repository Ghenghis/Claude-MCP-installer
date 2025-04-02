/**
 * ResourceMonitor.js - Handles real-time resource monitoring for MCP servers
 * Tracks CPU, memory, network, and disk usage for server instances
 */

class ResourceMonitor {
    constructor() {
        this.servers = {};
        this.monitoringIntervals = {};
        this.resourceHistory = {};
        this.maxHistoryLength = 100; // Maximum number of history points to keep per server
        this.defaultInterval = 5000; // Default monitoring interval in milliseconds
        
        // Initialize resource monitoring
        this.initializeMonitoring();
    }
    
    /**
     * Initialize resource monitoring
     */
    initializeMonitoring() {
        try {
            // Load resource history from localStorage
            this.loadResourceHistory();
            
            console.info('Resource monitoring initialized');
        } catch (error) {
            console.error('Error initializing resource monitoring:', error);
        }
    }
    
    /**
     * Load resource history from localStorage
     */
    loadResourceHistory() {
        try {
            const storedHistory = localStorage.getItem('mcp_resource_history');
            
            if (storedHistory) {
                this.resourceHistory = JSON.parse(storedHistory);
            }
        } catch (error) {
            console.error('Error loading resource history:', error);
        }
    }
    
    /**
     * Save resource history to localStorage
     */
    saveResourceHistory() {
        try {
            // Only store the last 24 hours of data to prevent localStorage from growing too large
            const prunedHistory = {};
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
            
            Object.keys(this.resourceHistory).forEach(serverId => {
                prunedHistory[serverId] = this.resourceHistory[serverId].filter(
                    entry => entry.timestamp > oneDayAgo
                );
            });
            
            localStorage.setItem('mcp_resource_history', JSON.stringify(prunedHistory));
        } catch (error) {
            console.error('Error saving resource history:', error);
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
            if (this.monitoringIntervals[serverId]) {
                // Already monitoring this server
                return true;
            }
            
            // Initialize server in resource history if needed
            if (!this.resourceHistory[serverId]) {
                this.resourceHistory[serverId] = [];
            }
            
            // Initialize server in servers object
            this.servers[serverId] = {
                id: serverId,
                name: options.name || serverId,
                type: options.type || 'unknown',
                lastUpdate: Date.now(),
                resources: {
                    cpu: 0,
                    memory: 0,
                    disk: 0,
                    network: 0
                }
            };
            
            // Set monitoring interval
            const interval = options.interval || this.defaultInterval;
            this.monitoringIntervals[serverId] = setInterval(() => {
                this.updateServerResources(serverId);
            }, interval);
            
            return true;
        } catch (error) {
            console.error('Error starting monitoring:', error);
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
            if (this.monitoringIntervals[serverId]) {
                clearInterval(this.monitoringIntervals[serverId]);
                delete this.monitoringIntervals[serverId];
            }
            
            return true;
        } catch (error) {
            console.error('Error stopping monitoring:', error);
            return false;
        }
    }
    
    /**
     * Update server resources
     * @param {string} serverId - Server ID
     */
    async updateServerResources(serverId) {
        try {
            // Get server resources
            const resources = await this.getServerResources(serverId);
            
            // Update server resources
            if (this.servers[serverId]) {
                this.servers[serverId].resources = resources;
                this.servers[serverId].lastUpdate = Date.now();
                
                // Add to resource history
                this.addToResourceHistory(serverId, resources);
                
                // Dispatch event for UI updates
                this.dispatchResourceUpdateEvent(serverId, resources);
            }
        } catch (error) {
            console.error(`Error updating resources for server ${serverId}:`, error);
        }
    }
    
    /**
     * Get server resources
     * @param {string} serverId - Server ID
     * @returns {Promise<Object>} Server resources
     */
    async getServerResources(serverId) {
        try {
            // In a real implementation, we would query the server for resource usage
            // For this demo, we'll generate simulated resource data
            return this.getSimulatedResources(serverId);
        } catch (error) {
            console.error(`Error getting resources for server ${serverId}:`, error);
            return {
                cpu: 0,
                memory: 0,
                disk: 0,
                network: 0
            };
        }
    }
    
    /**
     * Get simulated resources for a server
     * @param {string} serverId - Server ID
     * @returns {Object} Simulated resources
     */
    getSimulatedResources(serverId) {
        // Get previous resources if available
        const prevResources = this.servers[serverId]?.resources || {
            cpu: 0,
            memory: 0,
            disk: 0,
            network: 0
        };
        
        // Generate realistic resource usage that changes gradually
        const resources = {
            cpu: this.simulateResourceValue(prevResources.cpu, 0, 100, 10),
            memory: this.simulateResourceValue(prevResources.memory, 0, 100, 5),
            disk: this.simulateResourceValue(prevResources.disk, 0, 100, 2),
            network: this.simulateResourceValue(prevResources.network, 0, 100, 15)
        };
        
        return resources;
    }
    
    /**
     * Simulate a resource value that changes gradually
     * @param {number} prevValue - Previous value
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @param {number} maxChange - Maximum change
     * @returns {number} Simulated value
     */
    simulateResourceValue(prevValue, min, max, maxChange) {
        // Generate a random change
        const change = (Math.random() * maxChange * 2) - maxChange;
        
        // Calculate new value
        let newValue = prevValue + change;
        
        // Ensure value is within bounds
        newValue = Math.max(min, Math.min(max, newValue));
        
        return parseFloat(newValue.toFixed(1));
    }
    
    /**
     * Add resources to history
     * @param {string} serverId - Server ID
     * @param {Object} resources - Server resources
     */
    addToResourceHistory(serverId, resources) {
        try {
            // Initialize server in resource history if needed
            if (!this.resourceHistory[serverId]) {
                this.resourceHistory[serverId] = [];
            }
            
            // Add resources to history
            this.resourceHistory[serverId].push({
                timestamp: Date.now(),
                resources: { ...resources }
            });
            
            // Trim history if needed
            if (this.resourceHistory[serverId].length > this.maxHistoryLength) {
                this.resourceHistory[serverId] = this.resourceHistory[serverId].slice(
                    this.resourceHistory[serverId].length - this.maxHistoryLength
                );
            }
            
            // Save resource history periodically (every 10 updates)
            if (this.resourceHistory[serverId].length % 10 === 0) {
                this.saveResourceHistory();
            }
        } catch (error) {
            console.error(`Error adding to resource history for server ${serverId}:`, error);
        }
    }
    
    /**
     * Dispatch resource update event
     * @param {string} serverId - Server ID
     * @param {Object} resources - Server resources
     */
    dispatchResourceUpdateEvent(serverId, resources) {
        try {
            // Create custom event
            const event = new CustomEvent('resource-update', {
                detail: {
                    serverId,
                    resources,
                    timestamp: Date.now()
                }
            });
            
            // Dispatch event
            window.dispatchEvent(event);
        } catch (error) {
            console.error(`Error dispatching resource update event for server ${serverId}:`, error);
        }
    }
    
    /**
     * Get current resources for a server
     * @param {string} serverId - Server ID
     * @returns {Object|null} Server resources or null if not found
     */
    getResources(serverId) {
        return this.servers[serverId]?.resources || null;
    }
    
    /**
     * Applies time range filtering to resource history entries
     * @param {Array} history - Resource history entries
     * @param {Object} options - Filter options with optional startTime and endTime
     * @returns {Array} Filtered history entries
     * @private
     */
    _filterHistoryByTimeRange(history, options) {
        return history.filter(entry => {
            if (options.startTime && entry.timestamp < options.startTime) {
                return false;
            }
            
            if (options.endTime && entry.timestamp > options.endTime) {
                return false;
            }
            
            return true;
        });
    }

    /**
     * Applies limit filtering to resource history entries
     * @param {Array} history - Resource history entries
     * @param {number} limit - Maximum number of entries to return
     * @returns {Array} Limited history entries
     * @private
     */
    _limitHistoryEntries(history, limit) {
        if (limit && limit < history.length) {
            return history.slice(history.length - limit);
        }
        return history;
    }

    /**
     * Get resource history for a server
     * @param {string} serverId - Server ID
     * @param {Object} options - Options for filtering history
     * @returns {Array} Resource history
     */
    getResourceHistory(serverId, options = {}) {
        try {
            // Get resource history
            const history = this.resourceHistory[serverId] || [];
            
            // Apply filters based on options
            let filteredHistory = history;
            
            // Apply time range filter if specified
            if (options.startTime || options.endTime) {
                filteredHistory = this._filterHistoryByTimeRange(filteredHistory, options);
            }
            
            // Apply limit if specified
            if (options.limit) {
                filteredHistory = this._limitHistoryEntries(filteredHistory, options.limit);
            }
            
            return filteredHistory;
        } catch (error) {
            logger.error(`Error getting resource history for server ${serverId}:`, error);
            return [];
        }
    }
    
    /**
     * Get resource statistics for a server
     * @param {string} serverId - Server ID
     * @param {Object} options - Options for calculating statistics
     * @returns {Object} Resource statistics
     */
    getResourceStatistics(serverId, options = {}) {
        try {
            // Get resource history
            const history = this.getResourceHistory(serverId, options);
            
            if (history.length === 0) {
                return {
                    cpu: { min: 0, max: 0, avg: 0 },
                    memory: { min: 0, max: 0, avg: 0 },
                    disk: { min: 0, max: 0, avg: 0 },
                    network: { min: 0, max: 0, avg: 0 }
                };
            }
            
            // Calculate statistics
            const stats = {
                cpu: this.calculateStatistics(history.map(entry => entry.resources.cpu)),
                memory: this.calculateStatistics(history.map(entry => entry.resources.memory)),
                disk: this.calculateStatistics(history.map(entry => entry.resources.disk)),
                network: this.calculateStatistics(history.map(entry => entry.resources.network))
            };
            
            return stats;
        } catch (error) {
            console.error(`Error getting resource statistics for server ${serverId}:`, error);
            return {
                cpu: { min: 0, max: 0, avg: 0 },
                memory: { min: 0, max: 0, avg: 0 },
                disk: { min: 0, max: 0, avg: 0 },
                network: { min: 0, max: 0, avg: 0 }
            };
        }
    }
    
    /**
     * Calculate statistics for an array of values
     * @param {Array<number>} values - Array of values
     * @returns {Object} Statistics
     */
    calculateStatistics(values) {
        if (values.length === 0) {
            return { min: 0, max: 0, avg: 0 };
        }
        
        const min = Math.min(...values);
        const max = Math.max(...values);
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = parseFloat((sum / values.length).toFixed(1));
        
        return { min, max, avg };
    }
    
    /**
     * Get all monitored servers
     * @returns {Object} Servers object
     */
    getMonitoredServers() {
        return { ...this.servers };
    }
    
    /**
     * Clear resource history for a server
     * @param {string} serverId - Server ID
     * @returns {boolean} Success status
     */
    clearResourceHistory(serverId) {
        try {
            if (this.resourceHistory[serverId]) {
                this.resourceHistory[serverId] = [];
                this.saveResourceHistory();
            }
            
            return true;
        } catch (error) {
            console.error(`Error clearing resource history for server ${serverId}:`, error);
            return false;
        }
    }
    
    /**
     * Clear all resource history
     * @returns {boolean} Success status
     */
    clearAllResourceHistory() {
        try {
            this.resourceHistory = {};
            this.saveResourceHistory();
            
            return true;
        } catch (error) {
            console.error('Error clearing all resource history:', error);
            return false;
        }
    }
}

// Create singleton instance
const resourceMonitor = new ResourceMonitor();

// Export for use in other modules
export default resourceMonitor;
