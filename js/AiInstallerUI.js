/**
 * AiInstallerUI.js
 * Handles UI interactions for the AI-assisted installation process
 */

import aiInstallerState from './AiInstallerState.js';

class AiInstallerUI {
    constructor() {
        this.aiModeToggle = document.getElementById('aiModeToggle');
        this.installButton = document.getElementById('installButton');
        this.logContainer = document.getElementById('logContainer');
    }
    
    /**
     * Initialize UI elements and event listeners
     */
    initialize() {
        this.addEventListeners();
        
        // Initialize UI based on current AI mode state
        const aiModeEnabled = aiInstallerState.isAiModeEnabled();
        this.updateUIForAiMode(aiModeEnabled);
        
        // Set initial toggle state
        if (this.aiModeToggle) {
            this.aiModeToggle.checked = aiModeEnabled;
        }
    }
    
    /**
     * Add event listeners to UI elements
     */
    addEventListeners() {
        // AI mode toggle
        if (this.aiModeToggle) {
            this.aiModeToggle.addEventListener('change', () => {
                this.toggleAiMode(this.aiModeToggle.checked);
            });
        }
    }
    
    /**
     * Toggle AI-assisted installation mode
     * @param {boolean} enabled - Whether AI mode is enabled
     */
    toggleAiMode(enabled) {
        // Update state
        aiInstallerState.setAiModeEnabled(enabled);
        
        // Update UI
        this.updateUIForAiMode(enabled);
        
        // Log mode change
        this.logMessage(`AI-assisted installation mode ${enabled ? 'enabled' : 'disabled'}`, 'info');
    }
    
    /**
     * Update UI elements based on AI mode
     * @param {boolean} enabled - Whether AI mode is enabled
     */
    updateUIForAiMode(enabled) {
        // Update AI feature visibility
        document.querySelectorAll('.ai-feature').forEach(element => {
            element.style.display = enabled ? 'block' : 'none';
        });
        
        // Update installation button text
        if (this.installButton) {
            this.installButton.textContent = enabled ? 'AI-Assisted Install' : 'Install';
        }
    }
    
    /**
     * Log a message to the UI
     * @param {string} message - Message to log
     * @param {string} type - Message type (info, success, warning, error)
     */
    logMessage(message, type = 'info') {
        if (!this.logContainer) {
            console.log(`[${type.toUpperCase()}] ${message}`);
            return;
        }
        
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        
        const timestamp = new Date().toLocaleTimeString();
        const icon = this.getIconForLogType(type);
        
        logEntry.innerHTML = `
            <span class="log-time">${timestamp}</span>
            <span class="log-icon">${icon}</span>
            <span class="log-message">${message}</span>
        `;
        
        this.logContainer.appendChild(logEntry);
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
    }
    
    /**
     * Get icon for log message type
     * @param {string} type - Message type
     * @returns {string} HTML for icon
     */
    getIconForLogType(type) {
        switch (type) {
            case 'success':
                return '<i class="fas fa-check-circle"></i>';
            case 'warning':
                return '<i class="fas fa-exclamation-triangle"></i>';
            case 'error':
                return '<i class="fas fa-times-circle"></i>';
            case 'info':
            default:
                return '<i class="fas fa-info-circle"></i>';
        }
    }
    
    /**
     * Update installation progress in the UI
     * @param {number} step - Current step
     * @param {number} total - Total steps
     */
    updateProgress(step, total) {
        const progressBar = document.getElementById('installProgress');
        const progressText = document.getElementById('progressText');
        
        if (progressBar && progressText) {
            const percentage = Math.round((step / total) * 100);
            progressBar.style.width = `${percentage}%`;
            progressBar.setAttribute('aria-valuenow', percentage);
            progressText.textContent = `${step} of ${total} (${percentage}%)`;
        }
    }
}

// Create a singleton instance
const aiInstallerUI = new AiInstallerUI();

// Export the singleton
export default aiInstallerUI;
