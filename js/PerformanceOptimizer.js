/**
 * PerformanceOptimizer.js - Provides performance optimization suggestions for MCP servers
 * Analyzes resource usage patterns and suggests optimizations
 */

import resourceMonitor from './ResourceMonitor.js';

class PerformanceOptimizer {
    constructor() {
        this.thresholds = {
            cpu: {
                high: 80,
                medium: 50
            },
            memory: {
                high: 85,
                medium: 60
            },
            disk: {
                high: 90,
                medium: 70
            },
            network: {
                high: 80,
                medium: 50
            }
        };
        
        this.optimizationRules = [];
        this.serverConfigs = {};
        
        // Initialize performance optimizer
        this.initializeOptimizer();
    }
    
    /**
     * Initialize performance optimizer
     */
    initializeOptimizer() {
        try {
            // Load server configurations
            this.loadServerConfigs();
            
            // Initialize optimization rules
            this.initializeOptimizationRules();
            
            console.info('Performance optimizer initialized');
        } catch (error) {
            console.error('Error initializing performance optimizer:', error);
        }
    }
    
    /**
     * Load server configurations from localStorage
     */
    loadServerConfigs() {
        try {
            const storedConfigs = localStorage.getItem('mcp_server_configs');
            
            if (storedConfigs) {
                this.serverConfigs = JSON.parse(storedConfigs);
            }
        } catch (error) {
            console.error('Error loading server configurations:', error);
        }
    }
    
    /**
     * Define a standard optimization rule
     * @param {string} id - Rule identifier
     * @param {string} name - Rule name
     * @param {string} description - Rule description
     * @param {string} resourceType - Type of resource (cpu, memory, disk, network, general)
     * @param {Function} condition - Function that determines if rule applies
     * @param {Array<string>} suggestions - List of optimization suggestions
     * @param {string} priority - Priority level (high, medium, low)
     * @private
     */
    _defineRule(id, name, description, resourceType, condition, suggestions, priority) {
        this.addOptimizationRule({
            id,
            name,
            description,
            resourceType,
            condition,
            suggestions,
            priority
        });
    }
    
    /**
     * Initialize optimization rules
     */
    initializeOptimizationRules() {
        this._initializeCpuRules();
        this._initializeMemoryRules();
        this._initializeDiskRules();
        this._initializeNetworkRules();
        this._initializeGeneralRules();
    }
    
    /**
     * Initialize CPU optimization rules
     * @private
     */
    _initializeCpuRules() {
        // CPU high usage rule
        this._defineRule(
            'cpu-high-usage',
            'High CPU Usage',
            'Server is experiencing high CPU usage',
            'cpu',
            (value, stats) => value > this.thresholds.cpu.high,
            [
                'Consider scaling up CPU resources for this server',
                'Check for CPU-intensive processes that can be optimized',
                'Implement request throttling to reduce CPU load',
                'Enable caching to reduce computational overhead'
            ],
            'high'
        );
        
        // CPU spikes rule
        this._defineRule(
            'cpu-spikes',
            'CPU Usage Spikes',
            'Server is experiencing CPU usage spikes',
            'cpu',
            (value, stats) => (
                value > this.thresholds.cpu.medium && 
                stats.max - stats.min > 40
            ),
            [
                'Implement request queuing to smooth out CPU usage',
                'Check for scheduled tasks that might be causing spikes',
                'Consider distributing workload more evenly',
                'Optimize database queries that might be causing CPU spikes'
            ],
            'medium'
        );
    }
    
    /**
     * Initialize memory optimization rules
     * @private
     */
    _initializeMemoryRules() {
        // Memory high usage rule
        this._defineRule(
            'memory-high-usage',
            'High Memory Usage',
            'Server is experiencing high memory usage',
            'memory',
            (value, stats) => value > this.thresholds.memory.high,
            [
                'Consider scaling up memory resources for this server',
                'Check for memory leaks in the application',
                'Implement memory caching with proper TTL values',
                'Optimize large data processing operations'
            ],
            'high'
        );
        
        // Memory growth rule
        this._defineRule(
            'memory-growth',
            'Memory Usage Growth',
            'Server memory usage is steadily increasing',
            'memory',
            (value, stats, history) => {
                if (history.length < 10) return false;
                
                // Check if memory usage has been consistently increasing
                const recentHistory = history.slice(-10);
                let increasingCount = 0;
                
                for (let i = 1; i < recentHistory.length; i++) {
                    if (recentHistory[i].resources.memory > recentHistory[i-1].resources.memory) {
                        increasingCount++;
                    }
                }
                
                return increasingCount >= 7; // 70% of recent measurements show increase
            },
            [
                'Check for memory leaks in the application',
                'Implement proper cleanup of resources',
                'Consider implementing a memory limit for the server',
                'Restart the server periodically to release memory'
            ],
            'high'
        );
    }
    
    /**
     * Initialize disk optimization rules
     * @private
     */
    _initializeDiskRules() {
        // Disk high usage rule
        this._defineRule(
            'disk-high-usage',
            'High Disk Usage',
            'Server is experiencing high disk usage',
            'disk',
            (value, stats) => value > this.thresholds.disk.high,
            [
                'Consider scaling up disk resources for this server',
                'Implement log rotation to reduce disk usage',
                'Clean up temporary files regularly',
                'Move static assets to a CDN or separate storage'
            ],
            'medium'
        );
    }
    
    /**
     * Initialize network optimization rules
     * @private
     */
    _initializeNetworkRules() {
        // Network high usage rule
        this._defineRule(
            'network-high-usage',
            'High Network Usage',
            'Server is experiencing high network usage',
            'network',
            (value, stats) => value > this.thresholds.network.high,
            [
                'Implement data compression for network transfers',
                'Use HTTP/2 to reduce connection overhead',
                'Optimize API responses to reduce payload size',
                'Implement caching to reduce network requests'
            ],
            'medium'
        );
    }
    
    /**
     * Initialize general optimization rules
     * @private
     */
    _initializeGeneralRules() {
        // Overall high usage rule
        this._defineRule(
            'overall-high-usage',
            'Overall High Resource Usage',
            'Server is experiencing high usage across multiple resources',
            'general',
            (value, stats, history, resources) => (
                resources.cpu > this.thresholds.cpu.medium &&
                resources.memory > this.thresholds.memory.medium &&
                (resources.disk > this.thresholds.disk.medium || 
                 resources.network > this.thresholds.network.medium)
            ),
            [
                'Consider scaling up resources for this server',
                'Optimize application code to reduce resource usage',
                'Implement load balancing to distribute workload',
                'Consider using a CDN for static content'
            ],
            'high'
        );
    }
    
    /**
     * Add an optimization rule
     * @param {Object} rule - Optimization rule
     */
    addOptimizationRule(rule) {
        this.optimizationRules.push(rule);
    }
    
    /**
     * Get optimization suggestions for a server
     * @param {string} serverId - Server ID
     * @returns {Array} Optimization suggestions
     */
    getOptimizationSuggestions(serverId) {
        try {
            // Get resources, history, and statistics
            const { resources, history, stats } = this._getResourcesAndStats(serverId);
            
            if (!resources) {
                return [];
            }
            
            // Apply standard optimization rules
            const ruleSuggestions = this._applyOptimizationRules(resources, history, stats);
            
            // Add server-specific suggestions
            const serverSpecificSuggestions = this._getServerSpecificSuggestions(serverId, resources);
            
            return [...ruleSuggestions, ...serverSpecificSuggestions];
        } catch (error) {
            console.error(`Error getting optimization suggestions for server ${serverId}:`, error);
            return [];
        }
    }
    
    /**
     * Retrieve resources, history, and stats for a server
     * @param {string} serverId - Server ID
     * @returns {Object} Object containing resources, history, and stats
     * @private
     */
    _getResourcesAndStats(serverId) {
        const resources = resourceMonitor.getResources(serverId);
        const history = resourceMonitor.getResourceHistory(serverId, { limit: 20 });
        const stats = resourceMonitor.getResourceStatistics(serverId, { limit: 20 });
        
        return { resources, history, stats };
    }
    
    /**
     * Apply standard optimization rules
     * @param {Object} resources - Current resources
     * @param {Array} history - Resource history
     * @param {Object} stats - Resource statistics
     * @returns {Array} Suggestions from applied rules
     * @private
     */
    _applyOptimizationRules(resources, history, stats) {
        const suggestions = [];
        
        for (const rule of this.optimizationRules) {
            const conditionMet = this._checkRuleCondition(rule, resources, history, stats);
            
            if (conditionMet) {
                suggestions.push(this._createSuggestionFromRule(rule));
            }
        }
        
        return suggestions;
    }
    
    /**
     * Check if a rule's condition is met
     * @param {Object} rule - Optimization rule
     * @param {Object} resources - Current resources
     * @param {Array} history - Resource history
     * @param {Object} stats - Resource statistics
     * @returns {boolean} True if condition is met
     * @private
     */
    _checkRuleCondition(rule, resources, history, stats) {
        if (rule.resourceType === 'general') {
            return rule.condition(null, null, history, resources);
        } else {
            const resourceValue = resources[rule.resourceType];
            const resourceStats = stats[rule.resourceType];
            return rule.condition(resourceValue, resourceStats, history);
        }
    }
    
    /**
     * Create a suggestion object from a rule
     * @param {Object} rule - Optimization rule
     * @returns {Object} Suggestion object
     * @private
     */
    _createSuggestionFromRule(rule) {
        return {
            id: rule.id,
            name: rule.name,
            description: rule.description,
            suggestions: rule.suggestions,
            priority: rule.priority,
            resourceType: rule.resourceType
        };
    }
    
    /**
     * Get server-specific optimization suggestions
     * @param {string} serverId - Server ID
     * @param {Object} resources - Current resources
     * @returns {Array} Server-specific optimization suggestions
     * @private
     */
    _getServerSpecificSuggestions(serverId, resources) {
        try {
            const suggestions = [];
            const serverConfig = this.serverConfigs[serverId];
            
            if (!serverConfig) {
                return suggestions;
            }
            
            // Check server type and add specific suggestions
            switch (serverConfig.type) {
                case 'node':
                    this._addNodeSuggestions(suggestions, resources);
                    break;
                    
                case 'python':
                    this._addPythonSuggestions(suggestions, resources);
                    break;
                    
                case 'docker':
                    this._addDockerSuggestions(suggestions);
                    break;
                    
                default:
                    // No specific suggestions for unknown server types
                    break;
            }
            
            return suggestions;
        } catch (error) {
            console.error(`Error getting server-specific suggestions for server ${serverId}:`, error);
            return [];
        }
    }
    
    /**
     * Add Node.js specific suggestions
     * @param {Array} suggestions - Suggestions array to modify
     * @param {Object} resources - Current resources
     * @private
     */
    _addNodeSuggestions(suggestions, resources) {
        if (resources.memory > this.thresholds.memory.medium) {
            suggestions.push({
                id: 'node-memory-limit',
                name: 'Node.js Memory Limit',
                description: 'Consider setting a memory limit for Node.js',
                suggestions: [
                    'Set --max-old-space-size option to limit memory usage',
                    'Implement proper garbage collection practices',
                    'Use a process manager like PM2 to monitor and restart on high memory usage'
                ],
                priority: 'medium',
                resourceType: 'memory'
            });
        }
    }
    
    /**
     * Add Python specific suggestions
     * @param {Array} suggestions - Suggestions array to modify
     * @param {Object} resources - Current resources
     * @private
     */
    _addPythonSuggestions(suggestions, resources) {
        if (resources.cpu > this.thresholds.cpu.medium) {
            suggestions.push({
                id: 'python-async',
                name: 'Python Async Processing',
                description: 'Consider using async processing for Python',
                suggestions: [
                    'Use asyncio for I/O-bound operations',
                    'Implement multiprocessing for CPU-bound tasks',
                    'Consider using Gunicorn with multiple workers'
                ],
                priority: 'medium',
                resourceType: 'cpu'
            });
        }
    }
    
    /**
     * Add Docker specific suggestions
     * @param {Array} suggestions - Suggestions array to modify
     * @private
     */
    _addDockerSuggestions(suggestions) {
        suggestions.push({
            id: 'docker-resource-limits',
            name: 'Docker Resource Limits',
            description: 'Consider setting resource limits for Docker containers',
            suggestions: [
                'Set CPU and memory limits in Docker configuration',
                'Use Docker Compose to manage resource allocation',
                'Implement health checks to restart containers when needed'
            ],
            priority: 'medium',
            resourceType: 'general'
        });
    }
    
    /**
     * Apply an optimization to a server
     * @param {string} serverId - Server ID
     * @param {string} optimizationId - Optimization ID
     * @returns {Promise<boolean>} Success status
     */
    async applyOptimization(serverId, optimizationId) {
        try {
            // In a real implementation, we would apply the optimization to the server
            // For this demo, we'll just log the optimization
            console.info(`Applying optimization ${optimizationId} to server ${serverId}`);
            
            // Simulate applying optimization
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            return true;
        } catch (error) {
            console.error(`Error applying optimization ${optimizationId} to server ${serverId}:`, error);
            return false;
        }
    }
    
    /**
     * Get optimization thresholds
     * @returns {Object} Optimization thresholds
     */
    getThresholds() {
        return { ...this.thresholds };
    }
    
    /**
     * Update optimization thresholds
     * @param {Object} thresholds - New thresholds
     * @returns {boolean} Success status
     */
    updateThresholds(thresholds) {
        try {
            // Update thresholds
            if (thresholds.cpu) {
                this.thresholds.cpu = { ...this.thresholds.cpu, ...thresholds.cpu };
            }
            
            if (thresholds.memory) {
                this.thresholds.memory = { ...this.thresholds.memory, ...thresholds.memory };
            }
            
            if (thresholds.disk) {
                this.thresholds.disk = { ...this.thresholds.disk, ...thresholds.disk };
            }
            
            if (thresholds.network) {
                this.thresholds.network = { ...this.thresholds.network, ...thresholds.network };
            }
            
            return true;
        } catch (error) {
            console.error('Error updating optimization thresholds:', error);
            return false;
        }
    }
    
    /**
     * Get all optimization rules
     * @returns {Array} Optimization rules
     */
    getOptimizationRules() {
        return [...this.optimizationRules];
    }
}

// Create singleton instance
const performanceOptimizer = new PerformanceOptimizer();

// Export for use in other modules
export default performanceOptimizer;
