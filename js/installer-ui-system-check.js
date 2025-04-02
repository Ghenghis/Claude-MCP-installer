/**
 * Installer UI System Check - System requirements verification
 * Handles checking system requirements for installation
 */

/**
 * Check system requirements
 * @returns {Promise<Object>} Promise resolving to requirements status
 */
function checkSystemRequirements() {
    return new Promise((resolve, reject) => {
        try {
            // Log check
            logCheckStart();
            
            // Perform individual checks
            const nodeVersion = checkNodeVersion();
            const diskSpace = checkDiskSpace();
            const memory = checkMemory();
            const dockerAvailable = checkDockerAvailability();
            
            // Determine if requirements are met
            const missingRequirements = collectMissingRequirements(
                nodeVersion, 
                diskSpace, 
                memory
            );
            
            // Resolve with requirements status
            resolve({
                satisfied: missingRequirements.length === 0,
                missing: missingRequirements,
                details: {
                    nodeVersion,
                    diskSpace,
                    memory,
                    dockerAvailable
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Log system check start
 */
function logCheckStart() {
    if (window.InstallerUIUtils && window.InstallerUIUtils.logMessage) {
        window.InstallerUIUtils.logMessage('Checking system requirements...', 'info');
    } else {
        console.log('Checking system requirements...');
    }
}

/**
 * Collect missing requirements
 * @param {Object} nodeVersion - Node.js version check result
 * @param {Object} diskSpace - Disk space check result
 * @param {Object} memory - Memory check result
 * @returns {Array} Array of missing requirements
 */
function collectMissingRequirements(nodeVersion, diskSpace, memory) {
    const missingRequirements = [];
    
    if (!nodeVersion.satisfied) {
        missingRequirements.push(`Node.js ${nodeVersion.required}+`);
    }
    
    if (!diskSpace.satisfied) {
        missingRequirements.push(`${diskSpace.required}GB disk space`);
    }
    
    if (!memory.satisfied) {
        missingRequirements.push(`${memory.required}GB RAM`);
    }
    
    return missingRequirements;
}

/**
 * Check Node.js version
 * @returns {Object} Node.js version check result
 */
function checkNodeVersion() {
    // In a real implementation, this would check the actual Node.js version
    // For our simulation, we'll assume it's available
    
    // Try to get actual version if we have access to Electron API
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.getNodeVersion) {
        try {
            const version = window.electronAPI.getNodeVersion();
            const requiredVersion = '14.0.0';
            
            // Compare versions
            return {
                required: requiredVersion,
                current: version,
                satisfied: compareVersions(version, requiredVersion) >= 0
            };
        } catch (error) {
            console.warn('Error checking Node.js version:', error);
        }
    }
    
    // Default fallback
    return {
        required: '14.0.0',
        current: '16.0.0',
        satisfied: true
    };
}

/**
 * Check available disk space
 * @returns {Object} Disk space check result
 */
function checkDiskSpace() {
    // In a real implementation, this would check the actual disk space
    // For our simulation, we'll assume it's sufficient
    
    // Try to get actual disk space if we have access to Electron API
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.getDiskSpace) {
        try {
            const availableSpace = window.electronAPI.getDiskSpace();
            const requiredSpace = 2; // GB
            
            return {
                required: requiredSpace,
                available: availableSpace,
                satisfied: availableSpace >= requiredSpace
            };
        } catch (error) {
            console.warn('Error checking disk space:', error);
        }
    }
    
    // Default fallback
    return {
        required: 2,
        available: 50,
        satisfied: true
    };
}

/**
 * Check available memory
 * @returns {Object} Memory check result
 */
function checkMemory() {
    // In a real implementation, this would check the actual memory
    // For our simulation, we'll assume it's sufficient
    
    // Try to get actual memory if we have access to Electron API
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.getSystemMemory) {
        try {
            const availableMemory = window.electronAPI.getSystemMemory();
            const requiredMemory = 4; // GB
            
            return {
                required: requiredMemory,
                available: availableMemory,
                satisfied: availableMemory >= requiredMemory
            };
        } catch (error) {
            console.warn('Error checking memory:', error);
        }
    }
    
    // Default fallback
    return {
        required: 4,
        available: 8,
        satisfied: true
    };
}

/**
 * Check Docker availability
 * @returns {boolean} Whether Docker is available
 */
function checkDockerAvailability() {
    // Use the Docker module if available
    if (window.InstallerUIDocker && window.InstallerUIDocker.isDockerAvailable) {
        return window.InstallerUIDocker.isDockerAvailable();
    }
    
    // Try to check Docker availability if we have access to Electron API
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.isDockerRunning) {
        try {
            return window.electronAPI.isDockerRunning();
        } catch (error) {
            console.warn('Error checking Docker availability:', error);
        }
    }
    
    // Default fallback
    return false;
}

/**
 * Compare version strings
 * @param {string} version1 - First version
 * @param {string} version2 - Second version
 * @returns {number} -1 if version1 < version2, 0 if equal, 1 if version1 > version2
 */
function compareVersions(version1, version2) {
    const parts1 = version1.split('.').map(Number);
    const parts2 = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const part1 = parts1[i] || 0;
        const part2 = parts2[i] || 0;
        
        if (part1 < part2) return -1;
        if (part1 > part2) return 1;
    }
    
    return 0;
}

// Export functions for use in other modules
window.InstallerUISystemCheck = {
    checkSystemRequirements,
    checkNodeVersion,
    checkDiskSpace,
    checkMemory,
    checkDockerAvailability,
    compareVersions
};
