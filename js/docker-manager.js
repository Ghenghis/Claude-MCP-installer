/**
 * Docker Manager - Handles Docker-specific operations for MCP servers
 */
class DockerManager {
    constructor(options = {}) {
        this.options = options;
        this.containers = [];
        this.isDockerAvailable = false;
        this.statusCheckInterval = null;
        this.statusCheckIntervalTime = options.statusCheckInterval || 30000; // 30 seconds
    }

    /**
     * Initialize the Docker manager
     * @returns {Promise<boolean>} Whether Docker is available
     */
    async initialize() {
        try {
            this.isDockerAvailable = await this.checkDockerAvailability();
            
            if (this.isDockerAvailable) {
                console.log('Docker is available');
                await this.loadContainers();
                this.startStatusChecks();
            } else {
                console.warn('Docker is not available');
            }
            
            return this.isDockerAvailable;
        } catch (error) {
            console.error('Error initializing Docker manager:', error);
            return false;
        }
    }

    /**
     * Check if Docker is available
     * @returns {Promise<boolean>} Whether Docker is available
     */
    async checkDockerAvailability() {
        // In a real implementation, we would check if Docker is installed and running
        // For simulation purposes, we'll just return true
        return new Promise(resolve => {
            setTimeout(() => resolve(true), 500);
        });
    }

    /**
     * Load existing Docker containers
     * @returns {Promise<void>}
     */
    async loadContainers() {
        // In a real implementation, we would run 'docker ps -a' and parse the output
        // For simulation purposes, we'll just create some sample containers
        this.containers = [
            {
                id: 'container1',
                name: 'mcp-brave-search',
                image: 'mcp/brave-search:latest',
                status: 'running',
                created: '2025-03-30T10:00:00Z',
                ports: ['8080:8080'],
                volumes: ['/data:/app/data'],
                logs: []
            },
            {
                id: 'container2',
                name: 'mcp-json-server',
                image: 'mcp/json-server:latest',
                status: 'exited',
                created: '2025-03-29T15:30:00Z',
                ports: ['8081:8080'],
                volumes: ['/data:/app/data'],
                logs: []
            }
        ];
    }

    /**
     * Start periodic status checks for containers
     */
    startStatusChecks() {
        if (this.statusCheckInterval) {
            clearInterval(this.statusCheckInterval);
        }
        
        this.statusCheckInterval = setInterval(() => {
            this.updateContainerStatuses();
        }, this.statusCheckIntervalTime);
    }

    /**
     * Stop periodic status checks
     */
    stopStatusChecks() {
        if (this.statusCheckInterval) {
            clearInterval(this.statusCheckInterval);
            this.statusCheckInterval = null;
        }
    }

    /**
     * Update container statuses
     * @returns {Promise<void>}
     */
    async updateContainerStatuses() {
        // In a real implementation, we would run 'docker ps' and update container statuses
        // For simulation purposes, we'll just randomly update statuses
        for (const container of this.containers) {
            // 10% chance of changing status
            if (Math.random() < 0.1) {
                container.status = container.status === 'running' ? 'exited' : 'running';
                console.log(`Container ${container.name} status changed to ${container.status}`);
                
                // Trigger status change event
                this.triggerEvent('containerStatusChanged', container);
            }
        }
    }

    /**
     * Create a new Docker container for an MCP server
     * @param {Object} options Container creation options
     * @returns {Promise<Object>} Created container
     */
    async createContainer(options) {
        const {
            name,
            image,
            ports,
            volumes,
            environment,
            command
        } = options;
        
        console.log(`Creating container ${name} from image ${image}`);
        
        // In a real implementation, we would run 'docker create' with the provided options
        // For simulation purposes, we'll just create a container object
        const container = {
            id: `container${Date.now()}`,
            name,
            image,
            status: 'created',
            created: new Date().toISOString(),
            ports: ports || [],
            volumes: volumes || [],
            environment: environment || {},
            command: command || '',
            logs: []
        };
        
        // Add to containers list
        this.containers.push(container);
        
        // Trigger container created event
        this.triggerEvent('containerCreated', container);
        
        return container;
    }

    /**
     * Start a Docker container
     * @param {string} containerId Container ID or name
     * @returns {Promise<Object>} Container
     */
    async startContainer(containerId) {
        const container = this.getContainerById(containerId);
        
        if (!container) {
            throw new Error(`Container ${containerId} not found`);
        }
        
        console.log(`Starting container ${container.name}`);
        
        // In a real implementation, we would run 'docker start'
        // For simulation purposes, we'll just update the status
        container.status = 'running';
        
        // Trigger container started event
        this.triggerEvent('containerStarted', container);
        
        return container;
    }

    /**
     * Stop a Docker container
     * @param {string} containerId Container ID or name
     * @returns {Promise<Object>} Container
     */
    async stopContainer(containerId) {
        const container = this.getContainerById(containerId);
        
        if (!container) {
            throw new Error(`Container ${containerId} not found`);
        }
        
        console.log(`Stopping container ${container.name}`);
        
        // In a real implementation, we would run 'docker stop'
        // For simulation purposes, we'll just update the status
        container.status = 'exited';
        
        // Trigger container stopped event
        this.triggerEvent('containerStopped', container);
        
        return container;
    }

    /**
     * Restart a Docker container
     * @param {string} containerId Container ID or name
     * @returns {Promise<Object>} Container
     */
    async restartContainer(containerId) {
        const container = this.getContainerById(containerId);
        
        if (!container) {
            throw new Error(`Container ${containerId} not found`);
        }
        
        console.log(`Restarting container ${container.name}`);
        
        // In a real implementation, we would run 'docker restart'
        // For simulation purposes, we'll just update the status
        container.status = 'restarting';
        
        // Simulate restart delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        container.status = 'running';
        
        // Trigger container restarted event
        this.triggerEvent('containerRestarted', container);
        
        return container;
    }

    /**
     * Remove a Docker container
     * @param {string} containerId Container ID or name
     * @returns {Promise<boolean>} Whether the container was removed
     */
    async removeContainer(containerId) {
        const containerIndex = this.containers.findIndex(c => c.id === containerId || c.name === containerId);
        
        if (containerIndex === -1) {
            throw new Error(`Container ${containerId} not found`);
        }
        
        const container = this.containers[containerIndex];
        
        console.log(`Removing container ${container.name}`);
        
        // In a real implementation, we would run 'docker rm'
        // For simulation purposes, we'll just remove it from the list
        this.containers.splice(containerIndex, 1);
        
        // Trigger container removed event
        this.triggerEvent('containerRemoved', container);
        
        return true;
    }

    /**
     * Get logs for a Docker container
     * @param {string} containerId Container ID or name
     * @param {Object} options Log options
     * @returns {Promise<Array>} Container logs
     */
    async getContainerLogs(containerId, options = {}) {
        const container = this.getContainerById(containerId);
        
        if (!container) {
            throw new Error(`Container ${containerId} not found`);
        }
        
        console.log(`Getting logs for container ${container.name}`);
        
        // In a real implementation, we would run 'docker logs'
        // For simulation purposes, we'll generate some sample logs
        const logCount = options.lines || 10;
        const logs = [];
        
        for (let i = 0; i < logCount; i++) {
            logs.push({
                timestamp: new Date(Date.now() - (i * 60000)).toISOString(),
                message: `Sample log message ${i + 1} for ${container.name}`,
                level: i % 3 === 0 ? 'error' : (i % 2 === 0 ? 'warning' : 'info')
            });
        }
        
        // Update container logs
        container.logs = logs;
        
        return logs;
    }

    /**
     * Build a Docker image from a repository
     * @param {string} repoUrl Repository URL
     * @param {string} tag Image tag
     * @param {Object} options Build options
     * @returns {Promise<Object>} Built image
     */
    async buildImage(repoUrl, tag, options = {}) {
        console.log(`Building Docker image from ${repoUrl} with tag ${tag}`);
        
        // In a real implementation, we would run 'docker build'
        // For simulation purposes, we'll just create an image object
        const image = {
            id: `image${Date.now()}`,
            tag,
            repository: repoUrl,
            created: new Date().toISOString(),
            size: '250MB'
        };
        
        // Trigger image built event
        this.triggerEvent('imageBuilt', image);
        
        return image;
    }

    /**
     * Install an MCP server as a Docker container
     * @param {string} repoUrl Repository URL
     * @param {Object} options Installation options
     * @returns {Promise<Object>} Created container
     */
    async installMcpServer(repoUrl, options = {}) {
        try {
            const {
                name = `mcp-server-${Date.now()}`,
                tag = 'latest',
                ports = ['8080:8080'],
                volumes = [],
                environment = {},
                buildArgs = {},
                autoStart = true
            } = options;
            
            // Log callback function
            const log = options.logCallback || (msg => console.log(`[DockerManager] ${msg}`));
            
            log(`Installing MCP server from ${repoUrl} using Docker`);
            
            // Check if Docker is available
            if (!this.isDockerAvailable) {
                const isAvailable = await this.checkDockerAvailability();
                if (!isAvailable) {
                    throw new Error('Docker is not available');
                }
                this.isDockerAvailable = true;
            }
            
            // Build the Docker image
            log('Building Docker image...');
            const image = await this.buildImage(repoUrl, tag, { buildArgs });
            
            // Create the container
            log('Creating Docker container...');
            const container = await this.createContainer({
                name,
                image: `${image.repository}:${image.tag}`,
                ports,
                volumes,
                environment
            });
            
            // Start the container if autoStart is true
            if (autoStart) {
                log('Starting Docker container...');
                await this.startContainer(container.id);
            }
            
            log(`MCP server installed successfully as Docker container: ${container.name}`);
            
            return {
                success: true,
                container,
                image
            };
        } catch (error) {
            console.error('Error installing MCP server as Docker container:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get a container by ID or name
     * @param {string} containerId Container ID or name
     * @returns {Object} Container
     */
    getContainerById(containerId) {
        return this.containers.find(c => c.id === containerId || c.name === containerId);
    }

    /**
     * Get all containers
     * @returns {Array} Containers
     */
    getAllContainers() {
        return [...this.containers];
    }

    /**
     * Get running containers
     * @returns {Array} Running containers
     */
    getRunningContainers() {
        return this.containers.filter(c => c.status === 'running');
    }

    /**
     * Trigger an event
     * @param {string} eventName Event name
     * @param {Object} data Event data
     */
    triggerEvent(eventName, data) {
        // Create and dispatch a custom event
        const event = new CustomEvent(`docker:${eventName}`, { detail: data });
        document.dispatchEvent(event);
    }

    /**
     * Add an event listener
     * @param {string} eventName Event name
     * @param {Function} callback Callback function
     */
    on(eventName, callback) {
        document.addEventListener(`docker:${eventName}`, event => callback(event.detail));
    }

    /**
     * Remove an event listener
     * @param {string} eventName Event name
     * @param {Function} callback Callback function
     */
    off(eventName, callback) {
        document.removeEventListener(`docker:${eventName}`, callback);
    }
}

// Make the DockerManager globally available
window.DockerManager = DockerManager;

// Initialize the Docker manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Create a global instance for use by other components
    window.dockerManager = new DockerManager();
    
    // Initialize the Docker manager
    await window.dockerManager.initialize();
});
