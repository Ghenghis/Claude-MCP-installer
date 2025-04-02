/**
 * Backup Loader - Ensures proper loading of backup system modules
 * Handles dependency management and initialization of the backup system
 */

document.addEventListener('DOMContentLoaded', function() {
    loadBackupModules();
});

/**
 * Load all backup modules in the correct order
 */
function loadBackupModules() {
    const modulesToLoad = [
        'backup-core.js',
        'backup-operations.js',
        'backup-events.js',
        'backup-manager.js',
        'backup-statistics.js',
        'backup-restore-ui.js'
    ];
    
    // Load modules in sequence to ensure dependencies are available
    loadModulesSequentially(modulesToLoad, 0);
}

/**
 * Load modules sequentially to ensure proper dependency order
 * @param {Array} modules - Array of module paths to load
 * @param {number} index - Current index in the modules array
 */
function loadModulesSequentially(modules, index) {
    if (index >= modules.length) {
        // All modules loaded
        console.log('All backup modules loaded successfully');
        initializeBackupSystem();
        return;
    }
    
    const script = document.createElement('script');
    script.src = `js/${modules[index]}`;
    script.onload = function() {
        // Log success
        console.log(`Loaded module: ${modules[index]}`);
        
        // Load next module when this one is loaded
        loadModulesSequentially(modules, index + 1);
    };
    script.onerror = function() {
        console.error(`Failed to load module: ${modules[index]}`);
        // Continue loading other modules even if one fails
        loadModulesSequentially(modules, index + 1);
    };
    
    document.head.appendChild(script);
}

/**
 * Initialize the backup system after all modules are loaded
 */
function initializeBackupSystem() {
    // Check if all required modules are loaded
    if (!window.BackupCore || !window.BackupOperations || !window.BackupEvents) {
        console.error('Required backup modules not loaded. Backup system initialization failed.');
        return;
    }
    
    console.log('Initializing backup system...');
    
    // Initialize event system first
    if (window.BackupEvents) {
        // Register UI elements if available
        const uiElements = getBackupUIElements();
        if (uiElements) {
            window.BackupEvents.registerDefaultHandlers(uiElements);
        }
    }
    
    // Initialize backup manager
    if (window.BackupManager) {
        const backupManager = new window.BackupManager();
        window.backupManager = backupManager; // Make globally available
        backupManager.initialize().then(() => {
            console.log('Backup system initialized successfully');
        }).catch(error => {
            console.error('Backup system initialization failed:', error);
        });
    }
}

/**
 * Get backup UI elements for event handlers
 * @returns {Object} UI elements
 */
function getBackupUIElements() {
    return {
        progressContainer: document.getElementById('backup-progress-container'),
        progressBar: document.getElementById('backup-progress-bar'),
        progressText: document.getElementById('backup-progress-text'),
        progressStatus: document.getElementById('backup-progress-status')
    };
}

// Make loader functions globally accessible
window.BackupLoader = {
    loadBackupModules,
    loadModulesSequentially,
    initializeBackupSystem
};
