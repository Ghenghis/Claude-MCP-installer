/**
 * AiInstallerState.js
 * Manages state for the AI-assisted installation process
 */

class AiInstallerState {
    constructor() {
        this.state = {
            isAnalyzing: false,
            analysisResult: null,
            installPlan: null,
            currentStep: 0,
            totalSteps: 0,
            errors: []
        };
        
        // Check if AI mode is enabled from localStorage
        this.aiModeEnabled = localStorage.getItem('aiModeEnabled') === 'true';
    }
    
    /**
     * Reset the installer state to its initial values
     */
    resetState() {
        this.state = {
            isAnalyzing: true,
            analysisResult: null,
            installPlan: null,
            currentStep: 0,
            totalSteps: 0,
            errors: []
        };
    }
    
    /**
     * Set the analysis result
     * @param {Object} result - Repository analysis result
     */
    setAnalysisResult(result) {
        this.state.analysisResult = result;
    }
    
    /**
     * Set the installation plan
     * @param {Object} plan - Installation plan
     */
    setInstallPlan(plan) {
        this.state.installPlan = plan;
        this.state.totalSteps = plan.steps.length;
    }
    
    /**
     * Update the current step
     * @param {number} step - Current step number
     */
    setCurrentStep(step) {
        this.state.currentStep = step;
    }
    
    /**
     * Add an error to the error list
     * @param {Error} error - Error object
     */
    addError(error) {
        this.state.errors.push(error);
    }
    
    /**
     * Set the analyzing state
     * @param {boolean} isAnalyzing - Whether analysis is in progress
     */
    setAnalyzing(isAnalyzing) {
        this.state.isAnalyzing = isAnalyzing;
    }
    
    /**
     * Get the current state
     * @returns {Object} Current state
     */
    getState() {
        return this.state;
    }
    
    /**
     * Check if AI mode is enabled
     * @returns {boolean} Whether AI mode is enabled
     */
    isAiModeEnabled() {
        return this.aiModeEnabled;
    }
    
    /**
     * Set AI mode enabled state
     * @param {boolean} enabled - Whether AI mode is enabled
     */
    setAiModeEnabled(enabled) {
        this.aiModeEnabled = enabled;
        localStorage.setItem('aiModeEnabled', enabled ? 'true' : 'false');
    }
}

// Create a singleton instance
const aiInstallerState = new AiInstallerState();

// Export the singleton
export default aiInstallerState;
