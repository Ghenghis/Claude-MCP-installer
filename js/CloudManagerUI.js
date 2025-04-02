/**
 * @file Manages the UI for cloud deployment features.
 */

class CloudManagerUI {
    constructor(containerId, cloudMgr, serverMgr) {
        this.containerElement = document.getElementById(containerId);
        if (!this.containerElement) {
            logger.error(`CloudManagerUI: Container element '#${containerId}' not found.`);
            return;
        }
        this.cloudManager = cloudMgr; // Instance of CloudManager
        this.serverManager = serverMgr; // Instance of ServerManager (needed for server list)

        this.render();
        this.attachEventListeners();
        logger.info(\"CloudManagerUI initialized.\");
    }

    render() {
        logger.debug(\"Rendering Cloud Manager UI.\");
        if (!this.containerElement) return;
        // Render the main structure
        this.containerElement.innerHTML = CloudManagerTemplates.getMainContainerHTML();

        // Populate initial state
        this.populateProviderSelect();
        this.populateServerSelect();
        this.renderActiveDeployments();
    }

    attachEventListeners() {
        if (!this.containerElement) return;

        this.containerElement.addEventListener('change', (event) => {
            if (event.target.id === 'cloud-provider-select') {
                this.handleProviderSelectChange(event.target.value);
            }
        });

        this.containerElement.addEventListener('click', (event) => {
            if (event.target.id === 'save-provider-config') {
                this.handleSaveProviderConfig();
            }
            if (event.target.id === 'refresh-deployments-btn') {
                this.renderActiveDeployments();
            }
            if (event.target.classList.contains('terminate-deployment-btn')) {
                const deploymentId = event.target.dataset.deploymentId;
                this.handleTerminateDeployment(deploymentId);
            }
        });

        const deploymentForm = this.containerElement.querySelector('#cloud-deployment-form');
        if (deploymentForm) {
            deploymentForm.addEventListener('submit', (event) => {
                event.preventDefault();
                this.handleDeployFormSubmit();
            });
        }
    }

    populateProviderSelect() {
        const selectElement = this.containerElement.querySelector('#cloud-provider-select');
        if (!selectElement) return;

        const providers = this.cloudManager.getSupportedProviders();
        // Clear existing options except the placeholder
        selectElement.innerHTML = '<option value="">-- Select Provider --</option>';

        // TODO: Populate dynamically when providers are added to CloudManager
        // For now, using static options from template
        // Object.keys(providers).forEach(providerId => {
        //     const option = document.createElement('option');
        //     option.value = providerId;
        //     option.textContent = providers[providerId].name;
        //     selectElement.appendChild(option);
        // });
        logger.debug(\"Provider select populated (statically for now).\");
    }

    populateServerSelect() {
        const selectElement = this.containerElement.querySelector('#cloud-deploy-server-select');
        if (!selectElement || !this.serverManager) return;

        const installedServers = this.serverManager.getInstalledServers(); // Assuming this method exists
        // Clear existing options except the placeholder
        selectElement.innerHTML = '<option value="">-- Select Server --</option>';

        if (Object.keys(installedServers).length === 0) {
             selectElement.disabled = true;
             // Optionally add a disabled option indicating no servers
             const option = document.createElement('option');
             option.value = "";
             option.textContent = "No servers installed locally";
             option.disabled = true;
             selectElement.appendChild(option);
             return;
        }

        selectElement.disabled = false;
        Object.values(installedServers).forEach(server => {
            // Assuming server object has 'id' and 'name' or similar
            const option = document.createElement('option');
            option.value = server.id; // Use a unique identifier
            option.textContent = server.name || server.id; // Display name
            selectElement.appendChild(option);
        });
        logger.debug(\"Server select populated.\");
    }

    handleProviderSelectChange(providerId) {
        const configFormContainer = this.containerElement.querySelector('#cloud-provider-config-form');
        const deploymentOptionsContainer = this.containerElement.querySelector('#cloud-deployment-options');
        const deployButton = this.containerElement.querySelector('#start-cloud-deployment');

        if (!configFormContainer || !deploymentOptionsContainer || !deployButton) return;

        configFormContainer.innerHTML = ''; // Clear previous content
        deploymentOptionsContainer.innerHTML = ''; // Clear previous content

        if (!providerId) {
            configFormContainer.style.display = 'none';
            deploymentOptionsContainer.innerHTML = '<p class="text-muted">Select a provider to see deployment options.</p>';
            deployButton.disabled = true;
            return;
        }

        // Load provider-specific config fields and deployment options
        // Using placeholder AWS templates for now
        switch (providerId.toLowerCase()) {
            case 'aws':
                configFormContainer.innerHTML = CloudManagerTemplates.getAWSConfigFieldsHTML();
                deploymentOptionsContainer.innerHTML = CloudManagerTemplates.getAWSDeploymentOptionsHTML();
                break;
            // TODO: Add cases for gcp, azure, etc.
            default:
                 configFormContainer.innerHTML = '<p class="text-danger">Configuration for this provider is not yet implemented.</p>';
                 deploymentOptionsContainer.innerHTML = '<p class="text-danger">Deployment options for this provider are not yet implemented.</p>';
                 break;
        }

        configFormContainer.style.display = 'block';
        deployButton.disabled = false; // Enable deploy button once provider is selected
        logger.debug(`UI updated for selected provider: ${providerId}`);
    }

    handleSaveProviderConfig() {
        const providerId = this.containerElement.querySelector('#cloud-provider-select').value;
        if (!providerId) {
             showToast('Error', 'Please select a cloud provider first.', 'error');
             return;
        }

        let config = {};
        // TODO: Dynamically gather config values based on the rendered form
        switch (providerId.toLowerCase()) {
            case 'aws':
                config = {
                    accessKeyId: this.containerElement.querySelector('#aws-access-key-id')?.value,
                    secretAccessKey: this.containerElement.querySelector('#aws-secret-access-key')?.value,
                    region: this.containerElement.querySelector('#aws-region')?.value
                };
                 // Basic validation
                 if (!config.accessKeyId || !config.secretAccessKey || !config.region) {
                     showToast('Error', 'Please fill in all AWS configuration fields.', 'error');
                     return;
                 }
                break;
            // Add cases for other providers
            default:
                 showToast('Info', 'Configuration saving not implemented for this provider yet.', 'info');
                 return;
        }

        const success = this.cloudManager.setProviderConfig(providerId, config);
        if (success) {
            showToast('Success', `Configuration saved for ${providerId.toUpperCase()}.`, 'success');
        } else {
            showToast('Error', `Failed to save configuration for ${providerId.toUpperCase()}.`, 'error');
        }
    }

    async handleDeployFormSubmit() {
        const providerId = this.containerElement.querySelector('#cloud-provider-select').value;
        const serverId = this.containerElement.querySelector('#cloud-deploy-server-select').value;
        const deploymentName = this.containerElement.querySelector('#cloud-deploy-name').value;
        const deployButton = this.containerElement.querySelector('#start-cloud-deployment');

        if (!providerId || !serverId) {
            showToast('Error', 'Please select a cloud provider and a server to deploy.', 'error');
            return;
        }

        // TODO: Gather provider-specific deployment options dynamically
        let deploymentOptions = {};
         switch (providerId.toLowerCase()) {
            case 'aws':
                deploymentOptions = {
                    instanceType: this.containerElement.querySelector('#aws-instance-type')?.value,
                    region: this.containerElement.querySelector('#aws-deployment-region')?.value,
                    name: deploymentName || `mcp-${serverId}-${Date.now()}`
                    // Add other AWS options (VPC, security group etc.)
                };
                if (!deploymentOptions.instanceType || !deploymentOptions.region) {
                    showToast('Error', 'Please select AWS instance type and region.', 'error');
                    return;
                }
                break;
            default:
                 showToast('Error', 'Deployment not implemented for this provider yet.', 'error');
                 return;
        }

        // TODO: Get the actual server configuration object from ServerManager based on serverId
        const serverConfig = this.serverManager.getServerConfig(serverId); // Assuming this method exists
        if (!serverConfig) {
             showToast('Error', `Could not find configuration for server ID: ${serverId}.`, 'error');
             return;
        }

        logger.info(`Starting cloud deployment process for server ${serverId} to ${providerId}...`);
        deployButton.disabled = true;
        deployButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deploying...';

        try {
            const deploymentDetails = await this.cloudManager.deployServer(providerId, serverConfig, deploymentOptions);
            if (deploymentDetails) {
                showToast('Success', `Deployment started for ${serverConfig.name || serverId}. ID: ${deploymentDetails.id}`, 'success');
                this.renderActiveDeployments(); // Update the list
                // Optionally clear the form
                this.containerElement.querySelector('#cloud-deployment-form').reset();
                this.handleProviderSelectChange(providerId); // Reset options view
            } else {
                throw new Error('Deployment initiation failed.');
            }
        } catch (error) {
            logger.error("Cloud deployment failed:", error);
            showToast('Error', `Deployment failed: ${error.message}`, 'error');
        } finally {
            deployButton.disabled = false;
            deployButton.innerHTML = 'Deploy to Cloud';
        }
    }

    renderActiveDeployments() {
        const listContainer = this.containerElement.querySelector('#active-deployments-list');
        if (!listContainer) return;

        const deployments = this.cloudManager.getDeploymentStatus();
        logger.debug("Rendering active deployments:", deployments);

        if (Object.keys(deployments).length === 0) {
            listContainer.innerHTML = '<p class="text-muted">No active deployments found.</p>';
            return;
        }

        listContainer.innerHTML = ''; // Clear previous list
        Object.values(deployments).forEach(deployment => {
            const cardHTML = CloudManagerTemplates.getDeploymentCardHTML(deployment);
            listContainer.insertAdjacentHTML('beforeend', cardHTML);
        });
    }

    async handleTerminateDeployment(deploymentId) {
        if (!deploymentId) return;

        if (!confirm(`Are you sure you want to terminate deployment ${deploymentId}? This may incur costs if not done properly.`)) {
            return;
        }

        const terminateButton = this.containerElement.querySelector(`.terminate-deployment-btn[data-deployment-id="${deploymentId}"]`);
        if (terminateButton) {
             terminateButton.disabled = true;
             terminateButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Terminating...';
        }

        logger.info(`Attempting termination of deployment ${deploymentId}...`);
        try {
            const success = await this.cloudManager.terminateDeployment(deploymentId);
            if (success) {
                showToast('Success', `Deployment ${deploymentId} terminated.`, 'success');
                // Update the specific card or re-render the list
                this.renderActiveDeployments();
            } else {
                 throw new Error('Termination request failed.');
            }
        } catch (error) {
             logger.error(`Failed to terminate deployment ${deploymentId}:`, error);
             showToast('Error', `Termination failed: ${error.message}`, 'error');
             if (terminateButton) {
                 terminateButton.disabled = false; // Re-enable button on failure
                 terminateButton.innerHTML = '<i class="fas fa-trash-alt me-1"></i> Terminate';
             }
        }
    }
}
