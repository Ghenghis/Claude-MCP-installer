/**
 * Template Manager - Handles template selection and configuration
 */
class TemplateManagerClass {
    constructor() {
        this.templates = {
            'basic-api': {
                name: 'Basic API Server',
                description: 'Simple REST API server with basic CRUD operations',
                icon: 'fas fa-server',
                difficulty: 'beginner',
                requirements: ['Node.js 14+', 'npm 6+'],
                features: ['RESTful endpoints', 'JSON responses', 'Basic authentication'],
                githubPath: 'basic-api'
            },
            'web-dashboard': {
                name: 'Web Dashboard',
                description: 'Admin dashboard with user management',
                icon: 'fas fa-tachometer-alt',
                difficulty: 'beginner',
                requirements: ['Node.js 14+', 'npm 6+'],
                features: ['User authentication', 'Admin panel', 'Data visualization'],
                githubPath: 'web-dashboard'
            },
            'data-processor': {
                name: 'Data Processor',
                description: 'Background processing with task queue',
                icon: 'fas fa-cogs',
                difficulty: 'intermediate',
                requirements: ['Node.js 16+', 'npm 7+', 'Redis'],
                features: ['Task queue', 'Worker processes', 'Data transformation'],
                githubPath: 'data-processor'
            },
            'media-server': {
                name: 'Media Server',
                description: 'File storage and streaming capabilities',
                icon: 'fas fa-photo-video',
                difficulty: 'intermediate',
                requirements: ['Node.js 16+', 'npm 7+', '2GB+ RAM'],
                features: ['File uploads', 'Media streaming', 'Transcoding'],
                githubPath: 'media-server'
            },
            'ml-inference': {
                name: 'ML Inference',
                description: 'Machine learning model deployment',
                icon: 'fas fa-brain',
                difficulty: 'advanced',
                requirements: ['Node.js 16+', 'npm 7+', '4GB+ RAM', 'GPU (optional)'],
                features: ['Model serving', 'API endpoints', 'Batch processing'],
                githubPath: 'ml-inference'
            },
            'full-stack': {
                name: 'Full Stack',
                description: 'Complete application with frontend and backend',
                icon: 'fas fa-layer-group',
                difficulty: 'advanced',
                requirements: ['Node.js 16+', 'npm 7+', '2GB+ RAM'],
                features: ['Frontend app', 'Backend API', 'Database integration'],
                githubPath: 'full-stack'
            }
        };
        
        this.selectedTemplate = null;
        this.bindTemplateSelection();
    }
    
    /**
     * Bind event listeners to template cards
     */
    bindTemplateSelection() {
        const templateCards = document.querySelectorAll('.template-card');
        
        templateCards.forEach(card => {
            card.addEventListener('click', () => {
                const templateId = card.dataset.template;
                this.selectTemplate(templateId);
                
                // Update UI
                templateCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
            });
        });
    }
    
    /**
     * Select a template
     * @param {string} templateId - The ID of the template to select
     */
    selectTemplate(templateId) {
        if (this.templates[templateId]) {
            this.selectedTemplate = templateId;
            Logger.log(`Selected template: ${this.templates[templateId].name}`, 'info');
            
            // Update requirements display
            this.updateRequirementsDisplay(templateId);
        } else {
            Logger.log(`Template not found: ${templateId}`, 'error');
        }
    }
    
    /**
     * Update the requirements display for the selected template
     * @param {string} templateId - The ID of the template
     */
    updateRequirementsDisplay(templateId) {
        const requirementsContainer = document.getElementById('templateRequirements');
        if (!requirementsContainer) return;
        
        const template = this.templates[templateId];
        if (!template) return;
        
        // Clear existing content
        requirementsContainer.innerHTML = '';
        
        // Add requirements
        const requirementsList = document.createElement('ul');
        template.requirements.forEach(req => {
            const item = document.createElement('li');
            item.textContent = req;
            requirementsList.appendChild(item);
        });
        
        requirementsContainer.appendChild(requirementsList);
    }
    
    /**
     * Get the selected template configuration
     * @returns {Object} The selected template configuration
     */
    getSelectedTemplateConfig() {
        return this.templates[this.selectedTemplate] || null;
    }
    
    /**
     * Check if the system meets the requirements for the selected template
     * @returns {Promise<boolean>} Whether the system meets the requirements
     */
    async checkTemplateRequirements() {
        if (!this.selectedTemplate) {
            Logger.log('No template selected', 'warning');
            return false;
        }
        
        const template = this.templates[this.selectedTemplate];
        Logger.log(`Checking requirements for ${template.name}...`, 'info');
        
        // Simulate requirement checking
        return new Promise(resolve => {
            setTimeout(() => {
                const allMet = Math.random() > 0.2; // 80% chance of success for demo
                
                if (allMet) {
                    Logger.log('All template requirements met', 'success');
                } else {
                    Logger.log('Some template requirements not met', 'warning');
                }
                
                resolve(allMet);
            }, 1000);
        });
    }
}

// Create singleton instance
const TemplateManager = new TemplateManagerClass();