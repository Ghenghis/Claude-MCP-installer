/**
 * AI Installer - Handles AI-assisted installation of MCP servers
 * Coordinates between specialized modules for repository analysis, planning,
 * execution, and error recovery
 */

import aiInstallerState from './AiInstallerState.js';
import aiInstallerUI from './AiInstallerUI.js';
import aiRepositoryAnalyzer from './AiRepositoryAnalyzer.js';
import aiInstallationPlanner from './AiInstallationPlanner.js';
import aiInstallationExecutor from './AiInstallationExecutor.js';
import aiInstallerUtils from './AiInstallerUtils.js';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initAiInstaller();
});

/**
 * Initialize the AI installer
 */
function initAiInstaller() {
    // Initialize UI
    aiInstallerUI.initialize();
}

/**
 * Perform AI-assisted installation
 * @param {string} repoUrl - Repository URL
 * @param {Object} options - Installation options
 * @returns {Promise<void>} Promise that resolves when installation is complete
 */
async function performAiAssistedInstallation(repoUrl, options = {}) {
    const log = options.logCallback || ((msg, level) => aiInstallerUI.logMessage(msg, level));
    
    try {
        // Reset state
        aiInstallerState.resetState();
        
        // Log start of installation
        log('Starting AI-assisted installation...', 'info');
        
        // Step 1: Analyze repository
        const repoAnalysis = await aiRepositoryAnalyzer.analyzeRepository(repoUrl, log);
        
        // Step 2: Create installation plan
        const installPlan = await aiInstallationPlanner.createInstallationPlan(repoAnalysis, options, log);
        
        // Step 3: Verify prerequisites
        await aiInstallationPlanner.verifyPrerequisites(installPlan, log);
        
        // Step 4: Execute installation steps
        await aiInstallationExecutor.executeInstallation(installPlan, options, log);
        
        // Step 5: Verify installation
        await aiInstallationExecutor.verifyInstallation(installPlan, options, log);
        
        // Step 6: Update Claude Desktop configuration
        await aiInstallationExecutor.updateClaudeConfig(
            repoUrl, 
            options.installPath, 
            installPlan.recommendedMethod, 
            log
        );
        
        // Log completion
        log('AI-assisted installation completed successfully', 'success');
        return Promise.resolve();
    } catch (error) {
        log(`AI-assisted installation failed: ${error.message}`, 'error');
        return Promise.reject(error);
    }
}

// Make functions globally accessible
window.AiInstaller = {
    performAiAssistedInstallation,
    toggleAiMode: (enabled) => aiInstallerUI.toggleAiMode(enabled),
    getState: () => aiInstallerState.getState(),
    isAiModeEnabled: () => aiInstallerState.isAiModeEnabled(),
    utils: aiInstallerUtils
};
