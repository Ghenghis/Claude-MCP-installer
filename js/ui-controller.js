/**
 * UI Controller - Handles all UI interactions and updates
 */
class UIController {
    constructor() {
        // Initialize UI elements
        this.modeToggle = document.getElementById('modeToggle');
        this.advancedOptions = document.getElementById('advancedOptions');
        this.statusIndicator = document.getElementById('status-indicator');
        
        // Bind event listeners
        this.bindEventListeners();
    }
    
    bindEventListeners() {
        // Mode toggle (Normal/Advanced)
        if (this.modeToggle) {
            this.modeToggle.addEventListener('change', () => {
                this.toggleAdvancedMode(this.modeToggle.checked);
            });
        }
        
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // Method selection
        document.querySelectorAll('.method-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectMethod(e.currentTarget.dataset.method);
            });
        });
        
        // Template selection
        document.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.selectTemplate(e.currentTarget.dataset.template);
            });
        });
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }
    
    toggleAdvancedMode(isAdvanced) {
        if (isAdvanced) {
            this.advancedOptions.style.display = 'block';
            Logger.log('Advanced mode enabled', 'info');
        } else {
            this.advancedOptions.style.display = 'none';
            Logger.log('Switched to normal mode', 'info');
        }
    }
    
    switchTab(tabId) {
        // Remove active class from all tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to selected tab
        document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
        
        // Show selected tab content
        // Implementation details...
        
        Logger.log(`Switched to ${tabId} tab`, 'info');
    }
    
    selectMethod(method) {
        // Implementation details...
        Logger.log(`Selected installation method: ${method}`, 'info');
    }
    
    selectTemplate(template) {
        // Implementation details...
        Logger.log(`Selected template: ${template}`, 'info');
    }
    
    updateServerStatus(status) {
        const dot = this.statusIndicator.querySelector('.status-dot');
        const text = this.statusIndicator.querySelector('.status-text');
        
        if (status === 'running') {
            dot.className = 'status-dot online';
            text.textContent = 'Online';
        } else {
            dot.className = 'status-dot offline';
            text.textContent = 'Offline';
        }
    }
    
    handleKeyboardShortcuts(e) {
        // Ctrl+S for saving configuration
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            Logger.log('Quick save configuration executed (Ctrl+S)', 'success');
        }
        
        // Ctrl+R for restarting server
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            ServerController.restart();
        }
        
        // Ctrl+B for backup
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            InstallationManager.backupConfiguration();
        }
    }
}