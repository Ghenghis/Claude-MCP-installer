/**
 * Backup Events - Handles events and notifications for the backup system
 * Provides a centralized event management system for backup operations
 */

class BackupEvents {
    constructor() {
        this.eventListeners = {};
        this.initialize();
    }

    /**
     * Initialize the event system
     */
    initialize() {
        // Define standard event types
        this.eventTypes = [
            'backupStarted',
            'backupProgress',
            'backupCompleted',
            'backupFailed',
            'restoreStarted',
            'restoreProgress',
            'restoreCompleted',
            'restoreFailed',
            'backupDeleted'
        ];
        
        // Initialize event listeners for each type
        this.eventTypes.forEach(type => {
            this.eventListeners[type] = [];
        });
        
        console.log('Backup event system initialized');
    }

    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        
        this.eventListeners[event].push(callback);
        return this; // For chaining
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    off(event, callback) {
        if (!this.eventListeners[event]) {
            return this;
        }
        
        this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
        return this; // For chaining
    }

    /**
     * Trigger an event
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    trigger(event, data) {
        if (!this.eventListeners[event]) {
            return;
        }
        
        // Add timestamp to event data
        const eventData = {
            ...data,
            timestamp: new Date().toISOString()
        };
        
        // Log event for debugging
        this.logEvent(event, eventData);
        
        // Call all listeners
        for (const callback of this.eventListeners[event]) {
            try {
                callback(eventData);
            } catch (error) {
                console.error(`Error in ${event} event handler:`, error);
            }
        }
        
        return this; // For chaining
    }

    /**
     * Log event for debugging
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    logEvent(event, data) {
        // Log to console with different colors based on event type
        let logStyle = 'color: #333; background: #f0f0f0;';
        
        switch (event) {
            case 'backupStarted':
            case 'restoreStarted':
                logStyle = 'color: white; background: #007bff;';
                break;
            case 'backupCompleted':
            case 'restoreCompleted':
                logStyle = 'color: white; background: #28a745;';
                break;
            case 'backupFailed':
            case 'restoreFailed':
                logStyle = 'color: white; background: #dc3545;';
                break;
            case 'backupProgress':
            case 'restoreProgress':
                logStyle = 'color: white; background: #17a2b8;';
                break;
            case 'backupDeleted':
                logStyle = 'color: white; background: #6c757d;';
                break;
        }
        
        console.log(`%c[${event}]`, logStyle, data);
    }

    /**
     * Register default UI handlers
     * @param {Object} elements - UI elements
     */
    registerDefaultHandlers(elements) {
        if (!elements) return;
        
        // Progress handler
        this.on('backupProgress', data => {
            if (elements.progressBar) {
                elements.progressBar.style.width = `${data.progress}%`;
            }
            
            if (elements.progressText) {
                elements.progressText.textContent = `${data.progress}%`;
            }
            
            if (elements.progressStatus) {
                elements.progressStatus.textContent = data.message || '';
            }
            
            if (elements.progressContainer) {
                elements.progressContainer.style.display = 'block';
            }
        });
        
        // Similar handler for restore progress
        this.on('restoreProgress', data => {
            if (elements.progressBar) {
                elements.progressBar.style.width = `${data.progress}%`;
            }
            
            if (elements.progressText) {
                elements.progressText.textContent = `${data.progress}%`;
            }
            
            if (elements.progressStatus) {
                elements.progressStatus.textContent = data.message || '';
            }
            
            if (elements.progressContainer) {
                elements.progressContainer.style.display = 'block';
            }
        });
        
        // Completion handlers
        this.on('backupCompleted', () => {
            if (elements.progressContainer) {
                setTimeout(() => {
                    elements.progressContainer.style.display = 'none';
                }, 2000);
            }
        });
        
        this.on('restoreCompleted', () => {
            if (elements.progressContainer) {
                setTimeout(() => {
                    elements.progressContainer.style.display = 'none';
                }, 2000);
            }
        });
        
        // Error handlers
        this.on('backupFailed', data => {
            if (elements.progressContainer) {
                elements.progressContainer.style.display = 'none';
            }
            
            // Show error notification if available
            if (window.NotificationSystem) {
                window.NotificationSystem.showError(`Backup failed: ${data.error}`);
            } else {
                alert(`Backup failed: ${data.error}`);
            }
        });
        
        this.on('restoreFailed', data => {
            if (elements.progressContainer) {
                elements.progressContainer.style.display = 'none';
            }
            
            // Show error notification if available
            if (window.NotificationSystem) {
                window.NotificationSystem.showError(`Restore failed: ${data.error}`);
            } else {
                alert(`Restore failed: ${data.error}`);
            }
        });
    }
}

// Create a singleton instance
window.BackupEvents = new BackupEvents();
