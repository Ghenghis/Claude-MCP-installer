/**
 * AiRepositoryAnalyzer.js
 * Handles repository analysis for the AI-assisted installation process
 */

import aiInstallerState from './AiInstallerState.js';
import aiInstallerUI from './AiInstallerUI.js';

class AiRepositoryAnalyzer {
    /**
     * Analyze repository with appropriate module
     * @param {string} repoUrl - Repository URL
     * @param {Function} log - Optional custom logging function
     * @returns {Promise<Object>} Promise resolving to repository analysis
     */
    async analyzeRepository(repoUrl, log = null) {
        const logger = log || ((msg, level) => aiInstallerUI.logMessage(msg, level));
        
        // Update state
        aiInstallerState.setAnalyzing(true);
        
        try {
            // Check if analysis module is available
            if (!this.isAnalysisModuleAvailable()) {
                throw new Error('Repository analysis module not available');
            }
            
            // Log start of analysis
            logger('Analyzing repository structure and dependencies...', 'info');
            
            // Perform analysis
            const repoAnalysis = await window.AiInstallerAnalysis.analyzeRepository(repoUrl, logger);
            
            // Update state with analysis result
            aiInstallerState.setAnalysisResult(repoAnalysis);
            
            // Log analysis results
            this.logAnalysisResults(repoAnalysis, logger);
            
            return repoAnalysis;
        } catch (error) {
            logger(`Repository analysis failed: ${error.message}`, 'error');
            aiInstallerState.addError(error);
            throw error;
        } finally {
            aiInstallerState.setAnalyzing(false);
        }
    }
    
    /**
     * Check if analysis module is available
     * @returns {boolean} Whether analysis module is available
     */
    isAnalysisModuleAvailable() {
        return !!(window.AiInstallerAnalysis && window.AiInstallerAnalysis.analyzeRepository);
    }
    
    /**
     * Log analysis results
     * @param {Object} repoAnalysis - Repository analysis
     * @param {Function} log - Logging function
     */
    logAnalysisResults(repoAnalysis, log) {
        log(`Detected primary language: ${repoAnalysis.language}`, 'info');
        log(`Detected framework: ${repoAnalysis.framework || 'None'}`, 'info');
        
        if (repoAnalysis.dependencies && repoAnalysis.dependencies.length > 0) {
            log('Detected dependencies:', 'info');
            repoAnalysis.dependencies.forEach(dep => {
                log(`- ${dep.name}${dep.version ? ` (${dep.version})` : ''}`, 'info');
            });
        }
        
        if (repoAnalysis.serverType) {
            log(`Detected server type: ${repoAnalysis.serverType}`, 'info');
        }
        
        if (repoAnalysis.recommendedMethod) {
            log(`Recommended installation method: ${repoAnalysis.recommendedMethod}`, 'info');
        }
    }
}

// Create a singleton instance
const aiRepositoryAnalyzer = new AiRepositoryAnalyzer();

// Export the singleton
export default aiRepositoryAnalyzer;
