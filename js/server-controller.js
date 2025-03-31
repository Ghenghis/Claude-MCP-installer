/**
 * Server Controller - Handles server operations
 */
class ServerControllerClass {
    constructor() {
        this.serverStatus = 'stopped';
        this.serverPid = null;
        this.serverUrl = '';
        this.bindServerButtons();
    }
    
    /**
     * Bind event listeners to server control buttons
     */
    bindServerButtons() {
        const startBtn = document.getElementById('startServerBtn');
        const stopBtn = document.getElementById('stopServerBtn');
        const restartBtn = document.getElementById('restartServerBtn');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => this.start());
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stop());
        }
        
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restart());
        }
    }
    
    /**
     * Start the MCP server
     */
    start() {
        Logger.log('Starting MCP server...', 'info');
        
        // Simulate server start (replace with actual implementation)
        setTimeout(() => {
            this.serverStatus = 'running';
            this.serverPid = Math.floor(Math.random() * 10000);
            this.serverUrl = 'http://localhost:3000';
            
            Logger.log('MCP server started successfully', 'success');
            this.updateServerStatus();
        }, 1000);
    }
    
    /**
     * Stop the MCP server
     */
    stop() {
        Logger.log('Stopping MCP server...', 'info');
        
        // Simulate server stop (replace with actual implementation)
        setTimeout(() => {
            this.serverStatus = 'stopped';
            this.serverPid = null;
            
            Logger.log('MCP server stopped', 'warning');
            this.updateServerStatus();
        }, 1000);
    }
    
    /**
     * Restart the MCP server
     */
    restart() {
        Logger.log('Restarting MCP server...', 'info');
        
        // Simulate server restart (replace with actual implementation)
        setTimeout(() => {
            this.serverStatus = 'running';
            this.serverPid = Math.floor(Math.random() * 10000);
            this.serverUrl = 'http://localhost:3000';
            
            Logger.log('MCP server restarted successfully', 'success');
            this.updateServerStatus();
        }, 2000);
    }
    
    /**
     * Update the server status in the UI
     */
    updateServerStatus() {
        const statusIndicator = document.getElementById('status-indicator');
        if (statusIndicator) {
            const statusDot = statusIndicator.querySelector('.status-dot');
            const statusText = statusIndicator.querySelector('.status-text');
            
            if (this.serverStatus === 'running') {
                statusDot.className = 'status-dot online';
                statusText.textContent = 'Online';
            } else {
                statusDot.className = 'status-dot offline';
                statusText.textContent = 'Offline';
            }
        }
    }
}

// Create singleton instance
const ServerController = new ServerControllerClass();