/**
 * Error Handler for MCP Server Manager
 * Provides centralized error handling with user-friendly messages
 */

class ErrorHandler {
    constructor() {
        // Error message mapping
        this.errorMessages = {
            // Installation errors
            'INSTALL_FAILED': 'Installation failed. Please check the logs for details.',
            'REPO_NOT_FOUND': 'Repository not found. Please check the URL and try again.',
            'INVALID_REPO_URL': 'Invalid repository URL. Please provide a valid GitHub repository URL.',
            'DEPENDENCY_MISSING': 'Required dependency is missing. Please install the missing dependency and try again.',
            'PERMISSION_DENIED': 'Permission denied. Please check your permissions and try again.',
            'NETWORK_ERROR': 'Network error. Please check your internet connection and try again.',
            'TIMEOUT': 'Operation timed out. Please try again later.',
            'DISK_SPACE': 'Insufficient disk space. Please free up some space and try again.',
            'PORT_IN_USE': 'Port is already in use. Please choose a different port or stop the service using it.',
            
            // Server management errors
            'SERVER_NOT_FOUND': 'Server not found. It may have been deleted or moved.',
            'SERVER_START_FAILED': 'Failed to start server. Please check the logs for details.',
            'SERVER_STOP_FAILED': 'Failed to stop server. It might be stuck or not responding.',
            'SERVER_RESTART_FAILED': 'Failed to restart server. Please try stopping and starting manually.',
            'CONFIG_INVALID': 'Invalid configuration. Please check the configuration file for errors.',
            'CONFIG_SAVE_FAILED': 'Failed to save configuration. Please check file permissions.',
            
            // Docker errors
            'DOCKER_NOT_RUNNING': 'Docker is not running. Please start Docker and try again.',
            'DOCKER_COMMAND_FAILED': 'Docker command failed. Please check Docker is installed and running correctly.',
            'CONTAINER_NOT_FOUND': 'Container not found. It may have been removed manually.',
            'IMAGE_NOT_FOUND': 'Docker image not found. It may need to be pulled first.',
            
            // Backup/Restore errors
            'BACKUP_FAILED': 'Backup operation failed. Please check permissions and available space.',
            'RESTORE_FAILED': 'Restore operation failed. The backup may be corrupted or incompatible.',
            'BACKUP_NOT_FOUND': 'Backup not found. It may have been deleted or moved.',
            
            // Search errors
            'SEARCH_FAILED': 'Search operation failed. Please try again with different keywords.',
            'API_RATE_LIMIT': 'GitHub API rate limit exceeded. Please try again later.',
            
            // General errors
            'UNKNOWN_ERROR': 'An unknown error occurred. Please try again or check the logs for details.',
            'OPERATION_CANCELLED': 'Operation was cancelled by the user.',
            'FEATURE_UNAVAILABLE': 'This feature is not available in your current environment.',
            'FILE_NOT_FOUND': 'File not found. It may have been deleted or moved.',
            'INVALID_INPUT': 'Invalid input. Please check your input and try again.'
        };
        
        // Default error message
        this.defaultErrorMessage = 'An error occurred. Please try again.';
        
        // Initialize error toast container if it doesn't exist
        this.initializeErrorToast();
    }
    
    /**
     * Initialize the error toast container
     */
    initializeErrorToast() {
        if (!document.getElementById('errorToastContainer')) {
            const toastContainer = document.createElement('div');
            toastContainer.id = 'errorToastContainer';
            toastContainer.className = 'error-toast-container';
            document.body.appendChild(toastContainer);
        }
    }
    
    /**
     * Handle an error with a specific error code
     * @param {string} errorCode - The error code
     * @param {Error|string} [error] - The original error or additional details
     * @param {Object} [options] - Additional options for handling the error
     * @returns {string} - The user-friendly error message
     */
    handleError(errorCode, error = null, options = {}) {
        // Get user-friendly message based on error code
        const userMessage = this.getUserMessage(errorCode, error);
        
        // Log the error
        this.logError(errorCode, error, userMessage);
        
        // Show UI notification if not suppressed
        if (!options.suppressNotification) {
            this.showErrorNotification(userMessage, options);
        }
        
        // Return the user-friendly message
        return userMessage;
    }
    
    /**
     * Get a user-friendly message for an error code
     * @param {string} errorCode - The error code
     * @param {Error|string} [error] - The original error or additional details
     * @returns {string} - The user-friendly error message
     */
    getUserMessage(errorCode, error) {
        // Get the message from the mapping or use the default
        let message = this.errorMessages[errorCode] || this.defaultErrorMessage;
        
        // Add additional details if available
        if (error) {
            const errorDetails = error instanceof Error ? error.message : error;
            if (errorDetails && typeof errorDetails === 'string') {
                // Only add details if they provide additional information
                if (!message.includes(errorDetails)) {
                    message += ` (${errorDetails})`;
                }
            }
        }
        
        return message;
    }
    
    /**
     * Log an error to the console and potentially to a log file
     * @param {string} errorCode - The error code
     * @param {Error|string} [error] - The original error
     * @param {string} userMessage - The user-friendly message
     */
    logError(errorCode, error, userMessage) {
        // Create a structured error log
        const errorLog = {
            code: errorCode,
            timestamp: new Date().toISOString(),
            message: userMessage,
            originalError: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : null
        };
        
        // Log to console
        console.error('Error:', errorLog);
        
        // If Logger is available, log there too
        if (window.Logger) {
            window.Logger.log(`Error: ${userMessage}`, 'error');
        }
    }
    
    /**
     * Show an error notification in the UI
     * @param {string} message - The error message to display
     * @param {Object} [options] - Additional options for the notification
     */
    showErrorNotification(message, options = {}) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        
        // Set toast content
        toast.innerHTML = `
            <div class="error-toast-icon">
                <i class="fas fa-exclamation-circle"></i>
            </div>
            <div class="error-toast-content">
                <div class="error-toast-title">Error</div>
                <div class="error-toast-message">${message}</div>
            </div>
            <button class="error-toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to container
        const container = document.getElementById('errorToastContainer');
        container.appendChild(toast);
        
        // Add close button event
        const closeButton = toast.querySelector('.error-toast-close');
        closeButton.addEventListener('click', () => {
            toast.classList.add('error-toast-hiding');
            setTimeout(() => {
                container.removeChild(toast);
            }, 300);
        });
        
        // Auto-hide after timeout (default: 5 seconds)
        const timeout = options.timeout || 5000;
        setTimeout(() => {
            if (container.contains(toast)) {
                toast.classList.add('error-toast-hiding');
                setTimeout(() => {
                    if (container.contains(toast)) {
                        container.removeChild(toast);
                    }
                }, 300);
            }
        }, timeout);
        
        // Animate in
        setTimeout(() => {
            toast.classList.add('error-toast-visible');
        }, 10);
    }
    
    /**
     * Handle a caught exception
     * @param {Error} error - The caught error
     * @param {string} [context] - The context in which the error occurred
     * @param {Object} [options] - Additional options for handling the error
     * @returns {string} - The user-friendly error message
     */
    handleException(error, context = '', options = {}) {
        // Determine error code based on error type or message
        let errorCode = 'UNKNOWN_ERROR';
        
        if (error.name === 'NetworkError' || error.message.includes('network')) {
            errorCode = 'NETWORK_ERROR';
        } else if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
            errorCode = 'TIMEOUT';
        } else if (error.message.includes('permission') || error.message.includes('access denied')) {
            errorCode = 'PERMISSION_DENIED';
        } else if (error.message.includes('not found') || error.message.includes('404')) {
            errorCode = 'FILE_NOT_FOUND';
        }
        
        // Add context to options
        const handlingOptions = { ...options, context };
        
        // Handle the error with the determined code
        return this.handleError(errorCode, error, handlingOptions);
    }
}

// Create a global instance
window.ErrorHandler = new ErrorHandler();

// Add CSS for error toast
document.addEventListener('DOMContentLoaded', () => {
    // Only add if not already present
    if (!document.getElementById('errorToastStyles')) {
        const style = document.createElement('style');
        style.id = 'errorToastStyles';
        style.textContent = `
            .error-toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 350px;
            }
            
            .error-toast {
                background-color: #fff;
                border-left: 4px solid #dc3545;
                border-radius: 4px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                display: flex;
                align-items: flex-start;
                padding: 12px 15px;
                transform: translateX(120%);
                transition: transform 0.3s ease;
                overflow: hidden;
            }
            
            .dark-theme .error-toast {
                background-color: #2d2d2d;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }
            
            .error-toast-visible {
                transform: translateX(0);
            }
            
            .error-toast-hiding {
                transform: translateX(120%);
            }
            
            .error-toast-icon {
                color: #dc3545;
                font-size: 20px;
                margin-right: 12px;
                flex-shrink: 0;
            }
            
            .error-toast-content {
                flex: 1;
                min-width: 0;
            }
            
            .error-toast-title {
                font-weight: 600;
                margin-bottom: 5px;
                color: #dc3545;
            }
            
            .dark-theme .error-toast-title {
                color: #f77;
            }
            
            .error-toast-message {
                font-size: 14px;
                color: #666;
                word-wrap: break-word;
            }
            
            .dark-theme .error-toast-message {
                color: #ccc;
            }
            
            .error-toast-close {
                background: none;
                border: none;
                color: #aaa;
                cursor: pointer;
                font-size: 16px;
                margin-left: 10px;
                padding: 0;
                flex-shrink: 0;
            }
            
            .error-toast-close:hover {
                color: #666;
            }
            
            .dark-theme .error-toast-close:hover {
                color: #ddd;
            }
        `;
        document.head.appendChild(style);
    }
});
