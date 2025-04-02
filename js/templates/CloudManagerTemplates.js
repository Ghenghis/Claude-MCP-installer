/**
 * @file HTML templates for the Cloud Manager UI.
 */

class CloudManagerTemplates {

    /**
     * Generates the main container HTML for the Cloud Manager section.
     * @returns {string} HTML string for the main container.
     */
    static getMainContainerHTML() {
        return `
            <div id="cloud-manager-container" class="container-fluid mt-3">
                <h2><i class="fas fa-cloud-upload-alt me-2"></i>Cloud Deployment Manager</h2>
                <hr>
                <div class="row">
                    <div class="col-md-4">
                        ${this.getProviderSelectionHTML()}
                        ${this.getDeploymentFormHTML()}
                    </div>
                    <div class="col-md-8">
                        ${this.getActiveDeploymentsHTML()}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generates HTML for the cloud provider selection and configuration area.
     * @param {Object} providers - Object containing supported provider details.
     * @returns {string} HTML string.
     */
    static getProviderSelectionHTML(providers = {}) {
        // TODO: Populate dynamically based on CloudManager.getSupportedProviders()
        return `
            <div class="card mb-3">
                <div class="card-header">Cloud Provider Configuration</div>
                <div class="card-body">
                    <div class="mb-3">
                        <label for="cloud-provider-select" class="form-label">Select Provider:</label>
                        <select id="cloud-provider-select" class="form-select">
                            <option value="">-- Select Provider --</option>
                            <!-- Options will be populated dynamically -->
                             <option value="aws">AWS (Coming Soon)</option>
                             <option value="gcp">GCP (Coming Soon)</option>
                             <option value="azure">Azure (Coming Soon)</option>
                        </select>
                    </div>
                    <div id="cloud-provider-config-form" class="mt-3" style="display: none;">
                        <!-- Configuration fields will be loaded here based on selection -->
                        <p class="text-muted">Provider-specific configuration fields will appear here.</p>
                        <button id="save-provider-config" class="btn btn-primary btn-sm">Save Configuration</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generates HTML for the server deployment form.
     * @returns {string} HTML string.
     */
    static getDeploymentFormHTML() {
        return `
            <div class="card mb-3">
                <div class="card-header">Deploy New Server</div>
                <div class="card-body">
                    <form id="cloud-deployment-form">
                        <div class="mb-3">
                            <label for="cloud-deploy-server-select" class="form-label">Select Installed Server:</label>
                            <select id="cloud-deploy-server-select" class="form-select" required>
                                <option value="">-- Select Server --</option>
                                <!-- Options populated from ServerManager -->
                            </select>
                        </div>
                         <div class="mb-3">
                            <label for="cloud-deploy-name" class="form-label">Deployment Name (Optional):</label>
                            <input type="text" id="cloud-deploy-name" class="form-control" placeholder="e.g., my-claude-prod">
                        </div>
                        <div id="cloud-deployment-options" class="mb-3">
                            <p class="text-muted">Provider-specific deployment options will appear here.</p>
                            <!-- e.g., instance type, region, VPC -->
                        </div>
                        <button type="submit" id="start-cloud-deployment" class="btn btn-success" disabled>Deploy to Cloud</button>
                    </form>
                </div>
            </div>
        `;
    }

    /**
     * Generates HTML for the active deployments list.
     * @returns {string} HTML string.
     */
    static getActiveDeploymentsHTML() {
        return `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    Active Cloud Deployments
                    <button id="refresh-deployments-btn" class="btn btn-sm btn-outline-secondary" title="Refresh List">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
                <div class="card-body">
                    <div id="active-deployments-list">
                        <p class="text-muted">No active deployments found. Use the form to deploy a server.</p>
                        <!-- Deployment cards will be rendered here -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generates HTML for a single active deployment card.
     * @param {Object} deployment - The deployment details object.
     * @returns {string} HTML string for the deployment card.
     */
    static getDeploymentCardHTML(deployment) {
        const statusClasses = {
            pending: 'text-warning',
            running: 'text-success',
            error: 'text-danger',
            terminated: 'text-muted'
        };
        const statusClass = statusClasses[deployment.status] || 'text-secondary';

        return `
            <div class="card mb-2 deployment-card" data-deployment-id="${deployment.id}">
                <div class="card-body">
                    <h5 class="card-title">Deployment ID: ${deployment.id}</h5>
                    <p class="card-text mb-1">Server ID: ${deployment.serverId}</p>
                    <p class="card-text mb-1">Provider: ${deployment.providerId.toUpperCase()}</p>
                    <p class="card-text mb-1">Status: <strong class="${statusClass}">${deployment.status}</strong></p>
                    ${deployment.ipAddress ? `<p class="card-text mb-1">IP Address: ${deployment.ipAddress}</p>` : ''}
                    <p class="card-text"><small class="text-muted">Created: ${new Date(deployment.createdAt).toLocaleString()}</small></p>
                    <button class="btn btn-danger btn-sm terminate-deployment-btn" data-deployment-id="${deployment.id}" ${deployment.status === 'terminated' ? 'disabled' : ''}>
                        <i class="fas fa-trash-alt me-1"></i> Terminate
                    </button>
                    <!-- TODO: Add buttons for logs, SSH, etc. -->
                </div>
            </div>
        `;
    }

     /**
     * Generates HTML for provider-specific configuration fields (AWS example).
     * @returns {string} HTML string.
     */
    static getAWSConfigFieldsHTML() {
        return `
            <h5>AWS Configuration</h5>
            <div class="mb-3">
                <label for="aws-access-key-id" class="form-label">Access Key ID:</label>
                <input type="password" id="aws-access-key-id" class="form-control" required>
            </div>
            <div class="mb-3">
                <label for="aws-secret-access-key" class="form-label">Secret Access Key:</label>
                <input type="password" id="aws-secret-access-key" class="form-control" required>
            </div>
            <div class="mb-3">
                <label for="aws-region" class="form-label">Default Region:</label>
                <select id="aws-region" class="form-select" required>
                    <option value="us-east-1">us-east-1 (N. Virginia)</option>
                    <option value="us-west-2">us-west-2 (Oregon)</option>
                    <!-- Add more regions as needed -->
                </select>
            </div>
        `;
    }

     /**
     * Generates HTML for provider-specific deployment options (AWS example).
     * @returns {string} HTML string.
     */
    static getAWSDeploymentOptionsHTML() {
        return `
            <h5>AWS Deployment Options</h5>
            <div class="mb-3">
                <label for="aws-instance-type" class="form-label">Instance Type:</label>
                <select id="aws-instance-type" class="form-select" required>
                    <option value="t2.micro">t2.micro (Free Tier Eligible)</option>
                    <option value="t3.small">t3.small</option>
                    <!-- Add more instance types -->
                </select>
            </div>
             <div class="mb-3">
                <label for="aws-deployment-region" class="form-label">Deployment Region:</label>
                <select id="aws-deployment-region" class="form-select" required>
                    <option value="us-east-1">us-east-1 (N. Virginia)</option>
                    <option value="us-west-2">us-west-2 (Oregon)</option>
                    <!-- Add more regions -->
                </select>
            </div>
            <!-- TODO: Add VPC, Security Group options -->
        `;
    }

    // TODO: Add templates for GCP, Azure config and deployment options
}
