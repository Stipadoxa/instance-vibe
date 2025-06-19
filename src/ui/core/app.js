// src/ui/core/app.js
// Main application bootstrap for AIDesigner UI

// Import AI Generator UI
import { AIGeneratorUI } from '../features/ai-generator-ui.js';

class AIDesignerApp {
    constructor() {
        this.stateManager = null;
        this.messageHandler = null;
        this.features = new Map();
        this.isInitialized = false;
        
        // Bind methods
        this.initialize = this.initialize.bind(this);
        this.handleDOMReady = this.handleDOMReady.bind(this);
    }
    
    /**
     * Initialize the application
     */
    async initialize() {
        if (this.isInitialized) {
            console.warn('⚠️ App already initialized');
            return;
        }
        
        try {
            console.log('🚀 AIDesigner UI initializing...');
            
            // 1. Initialize state management
            this.initializeStateManager();
            
            // 2. Initialize message handling
            this.initializeMessageHandler();
            
            // 3. Load prompt generator
            this.initializePromptGenerator();
            
            // 4. Load state from session storage
            this.loadPersistedState();
            
            // 5. Initialize UI components and features
            await this.initializeFeatures();
            
            // 6. Set up global event listeners
            this.setupGlobalListeners();
            
            // 7. Request saved data from plugin
            this.requestSavedData();
            
            this.isInitialized = true;
            console.log('✅ AIDesigner UI fully initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize AIDesigner UI:', error);
            this.handleInitializationError(error);
        }
    }
    
    /**
     * Initialize state manager
     */
    initializeStateManager() {
        if (!window.StateManager) {
            throw new Error('StateManager not available');
        }
        
        this.stateManager = window.StateManager;
        
        // Set up state change reactions
        this.setupStateReactions();
        
        console.log('✅ State manager initialized');
    }
    
    /**
     * Initialize message handler
     */
    initializeMessageHandler() {
        if (!window.createMessageHandler) {
            throw new Error('createMessageHandler not available');
        }
        
        this.messageHandler = window.createMessageHandler(this.stateManager);
        this.messageHandler.initialize();
        
        console.log('✅ Message handler initialized');
    }
    
    /**
     * Initialize prompt generator
     */
    initializePromptGenerator() {
        try {
            if (window.AIDesignerPromptGenerator) {
                const promptGenerator = new window.AIDesignerPromptGenerator();
                this.stateManager.setState('promptGenerator', promptGenerator);
                console.log('✅ Prompt generator initialized');
            } else {
                console.warn('⚠️ AIDesignerPromptGenerator not available');
            }
        } catch (error) {
            console.error('❌ Failed to initialize prompt generator:', error);
        }
    }
    
    /**
     * Load persisted state from session storage
     */
    loadPersistedState() {
        this.stateManager.loadFromSession();
        console.log('✅ Persisted state loaded');
    }
    
    /**
     * Initialize all features
     */
    async initializeFeatures() {
        // Initialize features in dependency order
        const featureInitializers = [
            () => this.initializeTabNavigation(),
            () => this.initializePlatformToggle(),
            () => this.initializeApiSettings(),
            () => this.initializeDesignSystem(),
            () => this.initializeAIGenerator(),
            () => this.initializeImageUpload(),
            () => this.initializeSessionManagement()
        ];
        
        for (const initializer of featureInitializers) {
            try {
                await initializer();
            } catch (error) {
                console.error('❌ Feature initialization failed:', error);
            }
        }
        
        console.log('✅ All features initialized');
    }
    
    /**
     * Initialize tab navigation
     */
    initializeTabNavigation() {
        // Set up tab switching
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = this.extractTabId(btn);
                if (tabId) {
                    UIFramework.switchTab(tabId);
                }
            });
        });
        
        // Restore current tab
        const currentTab = this.stateManager.getState('currentTab');
        if (currentTab) {
            UIFramework.switchTab(currentTab);
        }
    }
    
    /**
     * Initialize platform toggle
     */
    initializePlatformToggle() {
        const mobileToggle = document.getElementById('mobile-toggle');
        const desktopToggle = document.getElementById('desktop-toggle');
        
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                this.stateManager.setState('currentPlatform', 'mobile');
                this.updatePlatformToggleUI('mobile');
            });
        }
        
        if (desktopToggle) {
            desktopToggle.addEventListener('click', () => {
                this.stateManager.setState('currentPlatform', 'desktop');
                this.updatePlatformToggleUI('desktop');
            });
        }
        
        // Restore current platform
        const currentPlatform = this.stateManager.getState('currentPlatform');
        this.updatePlatformToggleUI(currentPlatform);
    }
    
    /**
     * Initialize API settings feature
     */
    initializeApiSettings() {
        if (window.ApiSettingsFeature) {
            const apiSettings = new window.ApiSettingsFeature(this.stateManager, this.messageHandler);
            this.features.set('apiSettings', apiSettings);
            apiSettings.initialize();
        }
    }
    
    /**
     * Initialize design system feature
     */
    initializeDesignSystem() {
        if (window.DesignSystemFeature) {
            const designSystem = new window.DesignSystemFeature(this.stateManager, this.messageHandler);
            this.features.set('designSystem', designSystem);
            designSystem.initialize();
        }
    }
    
    /**
     * Initialize AI generator feature - UPDATED to use new AIGeneratorUI
     */
    initializeAIGenerator() {
        try {
            // Create AI Generator UI instance
            const aiGeneratorUI = new AIGeneratorUI();
            
            // Initialize with state manager and message handler
            aiGeneratorUI.initialize(this.stateManager, this.messageHandler);
            
            // Store in features map
            this.features.set('aiGenerator', aiGeneratorUI);
            
            // Make globally available for debugging
            window.aiGeneratorUI = aiGeneratorUI;
            
            console.log('✅ AI Generator UI initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize AI Generator UI:', error);
            
            // Fallback to old implementation if available
            if (window.AiGeneratorFeature) {
                console.log('🔄 Falling back to legacy AI Generator...');
                const aiGenerator = new window.AiGeneratorFeature(this.stateManager, this.messageHandler);
                this.features.set('aiGenerator', aiGenerator);
                aiGenerator.initialize();
            }
        }
    }
    
    /**
     * Initialize image upload functionality
     */
    initializeImageUpload() {
        const area = document.getElementById('imageUploadArea');
        const input = document.getElementById('imageInput');
        
        if (area && input) {
            // Click to upload
            area.addEventListener('click', (e) => {
                if (e.target.tagName !== 'BUTTON') {
                    input.click();
                }
            });
            
            // Drag and drop
            area.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                area.style.borderColor = '#0366d6';
            });
            
            area.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                area.style.borderColor = '#d1d5da';
            });
            
            area.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                area.style.borderColor = '#d1d5da';
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleImageFile(files[0]);
                } else {
                    this.stateManager.clearSelectedImage();
                }
            });
            
            // File input change
            input.addEventListener('change', (e) => {
                const files = e.target.files;
                if (files.length > 0) {
                    this.handleImageFile(files[0]);
                } else {
                    this.stateManager.clearSelectedImage();
                }
            });
        }
    }
    
    /**
     * Initialize session management
     */
    initializeSessionManagement() {
        // Session management will be handled by the features that need it
        // This is just a placeholder for any global session-related setup
    }
    
    /**
     * Set up state change reactions
     */
    setupStateReactions() {
        // React to generator tab enablement
        this.stateManager.subscribe('generatorTabEnabled', (enabled) => {
            const generatorTab = document.getElementById('generatorTab');
            if (generatorTab) {
                generatorTab.disabled = !enabled;
            }
        });
        
        // React to platform changes
        this.stateManager.subscribe('currentPlatform', (platform) => {
            this.updatePlatformToggleUI(platform);
        });
        
        // React to API key loading
        this.stateManager.subscribe('apiKeyLoaded', (loaded) => {
            if (loaded) {
                this.stateManager.setState('generatorTabEnabled', true);
            }
        });
        
        // React to design state changes for AI Generator
        this.stateManager.subscribe('designState', (designState) => {
            const aiGenerator = this.features.get('aiGenerator');
            if (aiGenerator && aiGenerator.updateDesignState) {
                aiGenerator.updateDesignState(designState);
            }
        });
    }
    
    /**
     * Set up global event listeners
     */
    setupGlobalListeners() {
        // Handle beforeunload for saving state
        window.addEventListener('beforeunload', () => {
            this.stateManager.saveToSession();
        });
        
        // Handle visibility change for state persistence
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stateManager.saveToSession();
            }
        });
        
        // Global error handling
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
        });
        
        // Clear image selection hotkey (Escape)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const imagePreview = document.getElementById('imagePreview');
                if (imagePreview && imagePreview.style.display !== 'none') {
                    this.clearImageSelection();
                }
            }
        });
    }
    
    /**
     * Request saved data from plugin
     */
    requestSavedData() {
        // Request saved scan data
        this.messageHandler.sendToPlugin({ type: 'get-saved-scan' });
        
        // Request API key
        this.messageHandler.sendToPlugin({ type: 'get-api-key' });
        
        console.log('📡 Requested saved data from plugin');
    }
    
    /**
     * Handle image file selection
     */
    async handleImageFile(file) {
        try {
            // Validate file
            const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            const maxSize = 4 * 1024 * 1024; // 4MB
            
            if (!validTypes.includes(file.type)) {
                throw new Error('Invalid file type. Please use JPG, PNG, WEBP, or GIF.');
            }
            
            if (file.size > maxSize) {
                throw new Error('File is too large. Maximum size is 4MB.');
            }
            
            // Convert to base64
            const base64 = await this.fileToBase64(file);
            
            // Update state
            this.stateManager.setSelectedImage({
                base64: base64,
                type: file.type,
                name: file.name
            });
            
            // Update UI
            this.updateImagePreviewUI(file, base64);
            
            UIFramework.showStatus('generationStatus', `✅ Image "${file.name}" loaded successfully.`, 'success');
            
        } catch (error) {
            console.error('Error processing image:', error);
            UIFramework.showStatus('generationStatus', `❌ ${error.message}`, 'error');
            this.stateManager.clearSelectedImage();
        }
    }
    
    /**
     * Clear image selection
     */
    clearImageSelection() {
        this.stateManager.clearSelectedImage();
        
        const imageInput = document.getElementById('imageInput');
        if (imageInput) imageInput.value = '';
        
        const imagePreview = document.getElementById('imagePreview');
        const uploadPrompt = document.getElementById('uploadPrompt');
        const imageUploadArea = document.getElementById('imageUploadArea');
        
        if (imagePreview) imagePreview.style.display = 'none';
        if (uploadPrompt) uploadPrompt.style.display = 'block';
        if (imageUploadArea) imageUploadArea.classList.remove('has-image');
        
        UIFramework.clearStatus('generationStatus');
    }
    
    /**
     * Convert file to base64
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
    }
    
    /**
     * Update image preview UI
     */
    updateImagePreviewUI(file, base64) {
        const previewImg = document.getElementById('previewImg');
        const imagePreview = document.getElementById('imagePreview');
        const uploadPrompt = document.getElementById('uploadPrompt');
        const imageUploadArea = document.getElementById('imageUploadArea');
        
        if (previewImg && imagePreview && uploadPrompt && imageUploadArea) {
            previewImg.src = `data:${file.type};base64,${base64}`;
            imagePreview.style.display = 'flex';
            uploadPrompt.style.display = 'none';
            imageUploadArea.classList.add('has-image');
        }
    }
    
    /**
     * Update platform toggle UI
     */
    updatePlatformToggleUI(platform) {
        const mobileToggle = document.getElementById('mobile-toggle');
        const desktopToggle = document.getElementById('desktop-toggle');
        
        if (mobileToggle && desktopToggle) {
            mobileToggle.classList.toggle('active', platform === 'mobile');
            desktopToggle.classList.toggle('active', platform === 'desktop');
        }
    }
    
    /**
     * Extract tab ID from button
     */
    extractTabId(button) {
        // Try to extract from onclick attribute first
        const onclick = button.getAttribute('onclick');
        if (onclick) {
            const match = onclick.match(/switchTab\(['"]([^'"]+)['"]\)/);
            if (match) return match[1];
        }
        
        // Try data attribute
        return button.getAttribute('data-tab');
    }
    
    /**
     * Handle initialization errors
     */
    handleInitializationError(error) {
        console.error('❌ Initialization failed:', error);
        
        // Show error message to user
        const errorMessage = `
            <div style="padding: 20px; text-align: center; color: #721c24; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; margin: 20px;">
                <h3>⚠️ Initialization Error</h3>
                <p>The AIDesigner plugin failed to initialize properly.</p>
                <p><strong>Error:</strong> ${error.message}</p>
                <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    🔄 Reload Plugin
                </button>
            </div>
        `;
        
        document.body.innerHTML = errorMessage;
    }
    
    /**
     * Get feature instance
     */
    getFeature(name) {
        return this.features.get(name);
    }
    
    /**
     * Get AI Generator UI instance
     */
    getAIGeneratorUI() {
        return this.features.get('aiGenerator');
    }
    
    /**
     * Cleanup and destroy
     */
    destroy() {
        if (this.messageHandler) {
            this.messageHandler.destroy();
        }
        
        this.features.forEach(feature => {
            if (feature.destroy) {
                feature.destroy();
            }
        });
        
        this.features.clear();
        UIFramework.cleanup();
        
        this.isInitialized = false;
        console.log('🧹 AIDesigner UI destroyed');
    }
}

// Auto-initialize when DOM is ready
function initializeApp() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const app = new AIDesignerApp();
            app.initialize();
            
            // Make app available globally for debugging
            window.aidesignerApp = app;
        });
    } else {
        // DOM is already ready
        const app = new AIDesignerApp();
        app.initialize();
        window.aidesignerApp = app;
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.AIDesignerApp = AIDesignerApp;
    window.initializeApp = initializeApp;
    
    // Auto-initialize
    initializeApp();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AIDesignerApp, initializeApp };
}