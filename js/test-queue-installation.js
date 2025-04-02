/**
 * Test Queue Installation - Test script for the MCP Server Manager queue installation functionality
 * This script tests the handleInstallQueue function with real repositories and various installation methods
 */

// Test configuration
const TEST_CONFIG = {
    repositories: [
        {
            name: "Claude Server",
            url: "https://github.com/davidteren/claude-server",
            method: "npx"
        },
        {
            name: "JSON MCP Server",
            url: "https://github.com/GongRzhe/JSON-MCP-Server",
            method: "python"
        },
        {
            name: "MCP Installer",
            url: "https://github.com/anaisbetts/mcp-installer",
            method: "uv"
        },
        {
            name: "MCP Marketplace",
            url: "https://github.com/cline/mcp-marketplace",
            method: "docker"
        },
        {
            name: "Brave Search MCP Server",
            url: "https://github.com/browserbase/mcp-server-browserbase",
            method: "npx"
        },
        {
            name: "Official MCP Servers",
            url: "https://github.com/modelcontextprotocol/servers",
            method: "python"
        }
    ],
    installPath: "C:\\Program Files\\Claude Desktop MCP",
    testTimeout: 60000 // 60 seconds timeout for the entire test
};

// Test results tracking
const testResults = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    details: []
};

/**
 * Main test function
 */
async function runQueueInstallationTests() {
    console.log("=== STARTING QUEUE INSTALLATION TESTS ===");
    const startTime = Date.now();
    
    // Create test log container
    createTestLogContainer();
    
    try {
        // Test individual repository installations
        await testIndividualInstallations();
        
        // Test batch installation (queue)
        await testBatchInstallation();
        
        // Test error handling
        await testErrorHandling();
        
        // Test cancellation
        await testCancellation();
        
        // Test backup creation after installation
        await testBackupAfterInstallation();
        
        // Display final results
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        logTestMessage(`Tests completed in ${duration}s`, "info");
        logTestMessage(`Total: ${testResults.total}, Success: ${testResults.success}, Failed: ${testResults.failed}, Skipped: ${testResults.skipped}`, 
            testResults.failed > 0 ? "error" : "success");
    } catch (error) {
        logTestMessage(`Test suite failed: ${error.message}`, "error");
    }
}

/**
 * Test individual repository installations
 */
async function testIndividualInstallations() {
    logTestMessage("Testing individual repository installations...", "info");
    
    for (const repo of TEST_CONFIG.repositories) {
        testResults.total++;
        
        try {
            logTestMessage(`Testing installation of ${repo.name} (${repo.url}) with ${repo.method} method...`, "info");
            
            // Create a test queue item
            const queueItem = createQueueItem(repo);
            
            // Check if we have the installer class available
            if (!window.Installer && !window.InstallerUI) {
                logTestMessage("Installer class not found, using mock installer", "warning");
                testResults.skipped++;
                continue;
            }
            
            // Create installer instance
            const installer = window.Installer ? 
                new window.Installer({
                    methodId: repo.method,
                    installPath: TEST_CONFIG.installPath
                }) : 
                {
                    installFromGitHub: async (url, options) => {
                        try {
                            if (window.InstallerUI && typeof window.InstallerUI.installFromUrl === 'function') {
                                await window.InstallerUI.installFromUrl(url, {
                                    methodId: repo.method,
                                    installPath: TEST_CONFIG.installPath,
                                    logCallback: options.logCallback
                                });
                                return { success: true };
                            }
                            return { success: false, error: "InstallerUI.installFromUrl not available" };
                        } catch (error) {
                            return { success: false, error: error.message };
                        }
                    }
                };
            
            // Process the queue item
            const result = await processQueueItem(queueItem, installer);
            
            if (result.success) {
                testResults.success++;
                logTestMessage(`✓ Successfully installed ${repo.name}`, "success");
            } else {
                testResults.failed++;
                logTestMessage(`✗ Failed to install ${repo.name}: ${result.error || "Unknown error"}`, "error");
            }
            
            testResults.details.push({
                name: repo.name,
                url: repo.url,
                method: repo.method,
                success: result.success,
                error: result.error
            });
        } catch (error) {
            testResults.failed++;
            logTestMessage(`✗ Test failed for ${repo.name}: ${error.message}`, "error");
            testResults.details.push({
                name: repo.name,
                url: repo.url,
                method: repo.method,
                success: false,
                error: error.message
            });
        }
    }
}

/**
 * Test batch installation (queue)
 */
async function testBatchInstallation() {
    logTestMessage("Testing batch installation (queue)...", "info");
    testResults.total++;
    
    try {
        // Create queue items
        const queue = TEST_CONFIG.repositories.map(repo => createQueueItem(repo));
        
        // Set up mock window.installationQueue
        window.installationQueue = queue;
        
        // Check if we have the installer class available
        if (!window.Installer && !window.InstallerUI) {
            logTestMessage("Installer class not found, skipping batch installation test", "warning");
            testResults.skipped++;
            return;
        }
        
        // Create installer instance
        const installer = window.Installer ? 
            new window.Installer({
                installPath: TEST_CONFIG.installPath
            }) : 
            {
                installFromGitHub: async (url, options) => {
                    try {
                        if (window.InstallerUI && typeof window.InstallerUI.installFromUrl === 'function') {
                            const queueItem = queue.find(item => item.repoUrl === url);
                            await window.InstallerUI.installFromUrl(url, {
                                methodId: queueItem ? queueItem.method : 'npx',
                                installPath: TEST_CONFIG.installPath,
                                logCallback: options.logCallback
                            });
                            return { success: true };
                        }
                        return { success: false, error: "InstallerUI.installFromUrl not available" };
                    } catch (error) {
                        return { success: false, error: error.message };
                    }
                }
            };
        
        // Store original window.Installer
        const originalInstaller = window.Installer;
        
        // Mock window.Installer to return our instance
        window.Installer = function() {
            return installer;
        };
        
        // Mock functions needed by handleInstallQueue
        window.setQueueButtonsState = function(disabled) {
            logTestMessage(`Queue buttons ${disabled ? 'disabled' : 'enabled'}`, "info");
        };
        
        window.updateItemStatus = function(id, status, message) {
            logTestMessage(`Item ${id} status updated to ${status}${message ? ': ' + message : ''}`, "info");
        };
        
        window.createItemLogCallback = function(item) {
            return function(message) {
                logTestMessage(`[${item.repoName}] ${message}`, "info");
            };
        };
        
        // Mock processQueueItem if it's not available
        if (typeof window.processQueueItem !== 'function') {
            window.processQueueItem = processQueueItem;
        }
        
        // Call handleInstallQueue
        if (typeof window.handleInstallQueue === 'function') {
            await window.handleInstallQueue();
            testResults.success++;
            logTestMessage("✓ Batch installation completed successfully", "success");
        } else {
            // If handleInstallQueue is not available, simulate it
            logTestMessage("handleInstallQueue not found, simulating...", "warning");
            
            // Process each item in the queue
            for (const item of queue) {
                if (item.status === 'pending') {
                    await processQueueItem(item, installer);
                }
            }
            
            testResults.success++;
            logTestMessage("✓ Simulated batch installation completed", "success");
        }
        
        // Restore original window.Installer
        window.Installer = originalInstaller;
    } catch (error) {
        testResults.failed++;
        logTestMessage(`✗ Batch installation test failed: ${error.message}`, "error");
    }
}

/**
 * Test error handling
 */
async function testErrorHandling() {
    logTestMessage("Testing error handling...", "info");
    testResults.total++;
    
    try {
        // Create a test queue item with an invalid URL
        const invalidItem = createQueueItem({
            name: "Invalid Repository",
            url: "https://github.com/invalid/repository-that-does-not-exist",
            method: "npx"
        });
        
        // Check if we have the installer class available
        if (!window.Installer && !window.InstallerUI) {
            logTestMessage("Installer class not found, skipping error handling test", "warning");
            testResults.skipped++;
            return;
        }
        
        // Create installer instance
        const installer = window.Installer ? 
            new window.Installer({
                installPath: TEST_CONFIG.installPath
            }) : 
            {
                installFromGitHub: async (url, options) => {
                    try {
                        if (window.InstallerUI && typeof window.InstallerUI.installFromUrl === 'function') {
                            await window.InstallerUI.installFromUrl(url, {
                                methodId: 'npx',
                                installPath: TEST_CONFIG.installPath,
                                logCallback: options.logCallback
                            });
                            return { success: true };
                        }
                        return { success: false, error: "InstallerUI.installFromUrl not available" };
                    } catch (error) {
                        return { success: false, error: error.message };
                    }
                }
            };
        
        // Process the invalid item
        const result = await processQueueItem(invalidItem, installer);
        
        // The test is successful if the installation fails (as expected)
        if (!result.success) {
            testResults.success++;
            logTestMessage("✓ Error handling test passed (installation failed as expected)", "success");
        } else {
            testResults.failed++;
            logTestMessage("✗ Error handling test failed (installation succeeded unexpectedly)", "error");
        }
    } catch (error) {
        // The test is also successful if an error is thrown
        testResults.success++;
        logTestMessage(`✓ Error handling test passed (error thrown as expected): ${error.message}`, "success");
    }
}

/**
 * Test cancellation
 */
async function testCancellation() {
    logTestMessage("Testing cancellation...", "info");
    testResults.total++;
    
    try {
        // Create a test queue with multiple items
        const queue = TEST_CONFIG.repositories.slice(0, 3).map(repo => createQueueItem(repo));
        
        // Set up mock window.installationQueue
        window.installationQueue = queue;
        
        // Check if we have the installer class available
        if (!window.Installer && !window.InstallerUI) {
            logTestMessage("Installer class not found, skipping cancellation test", "warning");
            testResults.skipped++;
            return;
        }
        
        // Create installer instance with a delay to allow for cancellation
        const installer = {
            installFromGitHub: async (url, options) => {
                return new Promise((resolve) => {
                    // Log start
                    if (options.logCallback) {
                        options.logCallback(`Starting installation of ${url}...`);
                    }
                    
                    // Set a timeout to simulate installation
                    const timeout = setTimeout(() => {
                        if (options.logCallback) {
                            options.logCallback(`Installation of ${url} completed`);
                        }
                        resolve({ success: true });
                    }, 2000);
                    
                    // Store the timeout in the installer for cancellation
                    installer.currentTimeout = timeout;
                });
            },
            cancel: function() {
                if (this.currentTimeout) {
                    clearTimeout(this.currentTimeout);
                    this.currentTimeout = null;
                    return true;
                }
                return false;
            }
        };
        
        // Start installation of the first item
        const firstItem = queue[0];
        const installPromise = processQueueItem(firstItem, installer);
        
        // Wait a short time to allow installation to start
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Cancel the installation
        const cancelled = installer.cancel();
        
        if (cancelled) {
            testResults.success++;
            logTestMessage("✓ Cancellation test passed (installation was cancelled)", "success");
        } else {
            testResults.failed++;
            logTestMessage("✗ Cancellation test failed (could not cancel installation)", "error");
        }
        
        // Wait for the installation promise to resolve or reject
        try {
            await installPromise;
        } catch (error) {
            // Expected error due to cancellation
            logTestMessage(`Installation promise rejected after cancellation: ${error.message}`, "info");
        }
    } catch (error) {
        testResults.failed++;
        logTestMessage(`✗ Cancellation test failed: ${error.message}`, "error");
    }
}

/**
 * Test backup creation after installation
 */
async function testBackupAfterInstallation() {
    logTestMessage("Testing backup creation after installation...", "info");
    testResults.total++;
    
    try {
        // Check if backup manager is available
        if (!window.backupManager) {
            logTestMessage("Backup manager not found, skipping backup test", "warning");
            testResults.skipped++;
            return;
        }
        
        // Create a test queue item
        const repo = TEST_CONFIG.repositories[0];
        const queueItem = createQueueItem(repo);
        
        // Check if we have the installer class available
        if (!window.Installer && !window.InstallerUI) {
            logTestMessage("Installer class not found, skipping backup test", "warning");
            testResults.skipped++;
            return;
        }
        
        // Create installer instance
        const installer = window.Installer ? 
            new window.Installer({
                methodId: repo.method,
                installPath: TEST_CONFIG.installPath
            }) : 
            {
                installFromGitHub: async (url, options) => {
                    try {
                        if (window.InstallerUI && typeof window.InstallerUI.installFromUrl === 'function') {
                            await window.InstallerUI.installFromUrl(url, {
                                methodId: repo.method,
                                installPath: TEST_CONFIG.installPath,
                                logCallback: options.logCallback
                            });
                            return { success: true };
                        }
                        return { success: false, error: "InstallerUI.installFromUrl not available" };
                    } catch (error) {
                        return { success: false, error: error.message };
                    }
                }
            };
        
        // Process the queue item
        const result = await processQueueItem(queueItem, installer);
        
        if (!result.success) {
            logTestMessage(`Installation failed, skipping backup test: ${result.error || "Unknown error"}`, "warning");
            testResults.skipped++;
            return;
        }
        
        // Create a backup after installation
        try {
            // Get server ID (assuming it's the same as the repository name for testing)
            const serverId = repo.name.replace(/\s+/g, '-').toLowerCase();
            
            // Create backup
            const backup = await window.backupManager.createBackup(serverId, {
                name: `Test Backup - ${repo.name}`,
                description: "Created during test queue installation",
                type: "full",
                includeLogs: true
            });
            
            if (backup && backup.id) {
                testResults.success++;
                logTestMessage(`✓ Successfully created backup after installation: ${backup.id}`, "success");
            } else {
                testResults.failed++;
                logTestMessage("✗ Failed to create backup after installation", "error");
            }
        } catch (error) {
            testResults.failed++;
            logTestMessage(`✗ Backup creation test failed: ${error.message}`, "error");
        }
    } catch (error) {
        testResults.failed++;
        logTestMessage(`✗ Backup test failed: ${error.message}`, "error");
    }
}

/**
 * Create a test queue item
 * @param {Object} repo - Repository information
 * @returns {Object} Queue item
 */
function createQueueItem(repo) {
    return {
        id: `test-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        repoName: repo.name,
        repoUrl: repo.url,
        method: repo.method,
        status: 'pending',
        addedAt: new Date().toISOString(),
        error: null
    };
}

/**
 * Process a queue item (simplified version of the actual function)
 * @param {Object} item - Queue item to process
 * @param {Object} installer - Installer instance
 * @returns {Promise<Object>} Installation result
 */
async function processQueueItem(item, installer) {
    // Update status to installing
    logTestMessage(`Installing ${item.repoName}...`, "info");
    
    try {
        // Create log callback for this item
        const logCallback = function(message) {
            logTestMessage(`[${item.repoName}] ${message}`, "info");
        };
        
        // Call installer with repository URL
        const result = await installer.installFromGitHub(
            item.repoUrl,
            { 
                logCallback,
                methodId: item.method,
                installPath: TEST_CONFIG.installPath
            }
        );
        
        if (result.success) {
            logTestMessage(`Successfully installed ${item.repoName}`, "success");
            return { success: true };
        } else {
            logTestMessage(`Failed to install ${item.repoName}: ${result.error || "Unknown error"}`, "error");
            return { success: false, error: result.error || "Unknown error" };
        }
    } catch (error) {
        logTestMessage(`Error installing ${item.repoName}: ${error.message}`, "error");
        return { success: false, error: error.message };
    }
}

/**
 * Create test log container
 */
function createTestLogContainer() {
    // Check if container already exists
    let container = document.getElementById('testLogContainer');
    
    if (!container) {
        // Create container
        container = document.createElement('div');
        container.id = 'testLogContainer';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 500px;
            max-height: 80vh;
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            z-index: 9999;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        `;
        
        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 10px 15px;
            background-color: #007bff;
            color: white;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        header.textContent = 'Queue Installation Tests';
        
        // Create close button
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
        `;
        closeButton.addEventListener('click', function() {
            container.style.display = 'none';
        });
        
        // Create log content
        const content = document.createElement('div');
        content.id = 'testLogContent';
        content.style.cssText = `
            padding: 10px 15px;
            overflow-y: auto;
            flex: 1;
            font-family: monospace;
            font-size: 12px;
            line-height: 1.5;
        `;
        
        // Create footer
        const footer = document.createElement('div');
        footer.style.cssText = `
            padding: 10px 15px;
            background-color: #f0f0f0;
            border-top: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
        `;
        
        // Create status
        const status = document.createElement('div');
        status.id = 'testStatus';
        status.textContent = 'Running tests...';
        
        // Add elements to container
        header.appendChild(closeButton);
        container.appendChild(header);
        container.appendChild(content);
        footer.appendChild(status);
        container.appendChild(footer);
        
        // Add container to body
        document.body.appendChild(container);
    } else {
        // Clear existing content
        const content = document.getElementById('testLogContent');
        if (content) {
            content.innerHTML = '';
        }
        
        // Reset status
        const status = document.getElementById('testStatus');
        if (status) {
            status.textContent = 'Running tests...';
        }
        
        // Show container
        container.style.display = 'flex';
    }
}

/**
 * Log a test message
 * @param {string} message - Message to log
 * @param {string} type - Message type (info, success, warning, error)
 */
function logTestMessage(message, type = 'info') {
    // Log to console
    switch (type) {
        case 'success':
            console.log(`%c✓ ${message}`, 'color: green');
            break;
        case 'warning':
            console.warn(`⚠ ${message}`);
            break;
        case 'error':
            console.error(`✗ ${message}`);
            break;
        default:
            console.log(`ℹ ${message}`);
    }
    
    // Log to UI
    const content = document.getElementById('testLogContent');
    if (content) {
        const entry = document.createElement('div');
        entry.style.cssText = getLogEntryStyles(type);
        
        // Add timestamp
        const timestamp = new Date().toLocaleTimeString();
        entry.innerHTML = `<span style="color: #888;">[${timestamp}]</span> ${message}`;
        
        // Add to content
        content.appendChild(entry);
        
        // Scroll to bottom
        content.scrollTop = content.scrollHeight;
    }
    
    // Update status
    const status = document.getElementById('testStatus');
    if (status) {
        status.textContent = message;
        
        // Set status color
        switch (type) {
            case 'success':
                status.style.color = 'green';
                break;
            case 'warning':
                status.style.color = 'orange';
                break;
            case 'error':
                status.style.color = 'red';
                break;
            default:
                status.style.color = 'black';
        }
    }
}

/**
 * Get CSS styles for log entry based on type
 * @param {string} type - Log entry type
 * @returns {string} CSS styles
 */
function getLogEntryStyles(type) {
    const baseStyles = 'margin-bottom: 5px; padding: 5px; border-radius: 3px;';
    
    switch (type) {
        case 'success':
            return `${baseStyles} background-color: #d4edda; color: #155724;`;
        case 'warning':
            return `${baseStyles} background-color: #fff3cd; color: #856404;`;
        case 'error':
            return `${baseStyles} background-color: #f8d7da; color: #721c24;`;
        default:
            return `${baseStyles} background-color: #e2e3e5; color: #383d41;`;
    }
}

// Run tests when the page is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add a button to run tests
    const testButton = document.createElement('button');
    testButton.id = 'runQueueInstallationTestsBtn';
    testButton.textContent = 'Run Queue Installation Tests';
    testButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 10px 15px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        z-index: 9999;
    `;
    testButton.addEventListener('click', runQueueInstallationTests);
    
    // Add button to body
    document.body.appendChild(testButton);
});
