/**
 * Notification Manager - Handles notifications for the application
 */
class NotificationManager {
    constructor() {
        this.container = this.createNotificationContainer();
        this.notifications = [];
        this.maxNotifications = 5;
    }

    /**
     * Create notification container
     * @returns {HTMLElement} Notification container
     */
    createNotificationContainer() {
        let container = document.getElementById('notification-container');
        
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            document.body.appendChild(container);
        }
        
        return container;
    }

    /**
     * Show a notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, warning, info)
     * @param {number} [duration=5000] - Duration in milliseconds
     */
    show(message, type = 'info', duration = 5000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Add icon based on type
        const icon = this.getIconForType(type);
        
        // Set notification content
        notification.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">${message}</div>
            <button class="notification-close">&times;</button>
        `;
        
        // Add to container
        this.container.appendChild(notification);
        
        // Add to notifications array
        this.notifications.push(notification);
        
        // Limit number of notifications
        this.limitNotifications();
        
        // Add event listener for close button
        const closeButton = notification.querySelector('.notification-close');
        closeButton.addEventListener('click', () => {
            this.remove(notification);
        });
        
        // Show notification with animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }
        
        return notification;
    }

    /**
     * Show a success notification
     * @param {string} message - Notification message
     * @param {number} [duration=5000] - Duration in milliseconds
     */
    showSuccess(message, duration = 5000) {
        return this.show(message, 'success', duration);
    }

    /**
     * Show an error notification
     * @param {string} message - Notification message
     * @param {number} [duration=5000] - Duration in milliseconds
     */
    showError(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }

    /**
     * Show a warning notification
     * @param {string} message - Notification message
     * @param {number} [duration=5000] - Duration in milliseconds
     */
    showWarning(message, duration = 5000) {
        return this.show(message, 'warning', duration);
    }

    /**
     * Show an info notification
     * @param {string} message - Notification message
     * @param {number} [duration=5000] - Duration in milliseconds
     */
    showInfo(message, duration = 5000) {
        return this.show(message, 'info', duration);
    }

    /**
     * Remove a notification
     * @param {HTMLElement} notification - Notification element
     */
    remove(notification) {
        // Hide notification with animation
        notification.classList.remove('show');
        
        // Remove after animation completes
        setTimeout(() => {
            if (notification.parentNode === this.container) {
                this.container.removeChild(notification);
            }
            
            // Remove from notifications array
            const index = this.notifications.indexOf(notification);
            if (index !== -1) {
                this.notifications.splice(index, 1);
            }
        }, 300);
    }

    /**
     * Limit the number of notifications
     */
    limitNotifications() {
        if (this.notifications.length > this.maxNotifications) {
            // Remove oldest notification
            this.remove(this.notifications[0]);
        }
    }

    /**
     * Get icon for notification type
     * @param {string} type - Notification type
     * @returns {string} Icon HTML
     */
    getIconForType(type) {
        switch (type) {
            case 'success':
                return '<i class="fas fa-check-circle"></i>';
            case 'error':
                return '<i class="fas fa-exclamation-circle"></i>';
            case 'warning':
                return '<i class="fas fa-exclamation-triangle"></i>';
            case 'info':
            default:
                return '<i class="fas fa-info-circle"></i>';
        }
    }
}

// Initialize the NotificationManager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.NotificationManager = new NotificationManager();
});
