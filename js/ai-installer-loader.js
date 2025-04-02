/**
 * AI Installer Loader - Loads all AI installer modules
 * Ensures proper loading order and module availability
 */

document.addEventListener('DOMContentLoaded', function() {
    loadAiInstallerModules();
});

/**
 * Load all AI installer modules in the correct order
 */
function loadAiInstallerModules() {
    const modulesToLoad = [
        'ai-installer-analysis.js',
        'ai-installer-planning.js',
        'ai-installer-execution.js',
        'ai-installer-recovery.js',
        'ai-installer.js'
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
        console.log('All AI installer modules loaded successfully');
        return;
    }
    
    const script = document.createElement('script');
    script.src = `js/${modules[index]}`;
    script.onload = function() {
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

// Make loader functions globally accessible
window.AiInstallerLoader = {
    loadAiInstallerModules,
    loadModulesSequentially
};
