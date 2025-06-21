// src/ui/core/app.js
// Main application bootstrap for AIDesigner UI

// --- CORRECTED IMPORTS ---
// This tells the bundler to look for these files in the SAME directory.
import { UIFramework } from './ui-framework.js';
import stateManager from './state-manager.js';
import { createMessageHandler } from './message-handler.js';
import { TabManager } from './tab-manager.js';
import { APISettingsUI } from './api-settings-ui.js';
import { DesignSystemUI } from './design-system-ui.js';
import { AIGeneratorUI } from './ai-generator-ui.js';

// These are not standard ES modules, so we import them for their side effects (attaching to window).
// The bundler will still find them in the same directory and include them.
import './component-patterns.js';
import './prompt-generator.js';
// --- END OF CORRECTED IMPORTS ---


class AIDesignerApp {
    constructor() {
        this.stateManager = null;
        this.messageHandler = null;
        this.features = new Map();
        this.isInitialized = false;
        
        // Bind methods
        this.initialize = this.initialize.bind(this);
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
        this.stateManager = stateManager;
        this.setupStateReactions();
        console.log('✅ State manager initialized');
    }
    
    /**
     * Initialize message handler
     */
    initializeMessageHandler() {
        this.messageHandler = createMessageHandler(this.stateManager);
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
        const featureInitializers = [
            () => this.initializeTabNavigation(),
            () => this.initializePlatformToggle(),
            () => this.initializeApiSettings(),
            () => this.initializeDesignSystem(),
            () => this.initializeAIGenerator(),
            () => this.initializeImageUpload()
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
        const tabManager = new TabManager();
        this.features.set('tabManager', tabManager);
        
        const currentTab = this.stateManager.getState('currentTab');
        if (currentTab) {
            tabManager.switchTab(currentTab);
        }
    }
    
    /**
     * Initialize platform toggle
     */
    initializePlatformToggle() {
        const mobileToggle = document.getElementById('mobile-toggle');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => this.stateManager.setState('currentPlatform', 'mobile'));
        }
        
        const desktopToggle = document.getElementById('desktop-toggle');
        if (desktopToggle) {
            desktopToggle.addEventListener('click', () => this.stateManager.setState('currentPlatform', 'desktop'));
        }
        
        const currentPlatform = this.stateManager.getState('currentPlatform');
        this.updatePlatformToggleUI(currentPlatform || 'mobile');
    }
    
    /**
     * Initialize API settings feature
     */
    initializeApiSettings() {
        const apiSettings = new APISettingsUI();
        this.features.set('apiSettings', apiSettings);
    }
    
    /**
     * Initialize design system feature
     */
    initializeDesignSystem() {
        const designSystem = new DesignSystemUI();
        this.features.set('designSystem', designSystem);
    }
    
    /**
     * Initialize AI generator feature
     */
    initializeAIGenerator() {
        const aiGeneratorUI = new AIGeneratorUI();
        aiGeneratorUI.initialize(this.stateManager, this.messageHandler);
        this.features.set('aiGenerator', aiGeneratorUI);
        window.aiGeneratorUI = aiGeneratorUI; // For debugging
    }

    /**
     * Initialize image upload functionality
     */
    initializeImageUpload() {
        const area = document.getElementById('imageUploadArea');
        const input = document.getElementById('imageInput');
        
        if (area && input) {
            area.addEventListener('click', (e) => {
                if (e.target.tagName !== 'BUTTON') { input.click(); }
            });
            input.addEventListener('change', (e) => {
                if (e.target.files.length > 0) { this.handleImageFile(e.target.files[0]); }
            });
            // Note: Drag and drop listeners can be added here as well if needed
        }
    }

    /**
     * Set up state change reactions
     */
    setupStateReactions() {
        this.stateManager.subscribe('generatorTabEnabled', (enabled) => {
            const tab = this.features.get('tabManager');
            if(enabled) {
                tab?.enableTab('ai-generator');
            } else {
                tab?.disableTab('ai-generator');
            }
        });
        this.stateManager.subscribe('currentPlatform', (platform) => {
            this.updatePlatformToggleUI(platform);
        });
    }

    /**
     * Set up global event listeners
     */
    setupGlobalListeners() {
        window.addEventListener('error', (event) => console.error('Global error:', event.error));
        window.addEventListener('unhandledrejection', (event) => console.error('Unhandled promise rejection:', event.reason));
    }

    /**
     * Request saved data from plugin
     */
    requestSavedData() {
        this.messageHandler.sendToPlugin({ type: 'get-saved-scan' });
        this.messageHandler.sendToPlugin({ type: 'get-api-key' });
        console.log('📡 Requested saved data from plugin');
    }

    /**
     * Handle image file selection
     */
    async handleImageFile(file) {
        // Implementation for handling image files...
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
     * Handle initialization errors
     */
    handleInitializationError(error) {
        console.error('❌ Initialization failed:', error);
        document.body.innerHTML = `<div style="padding: 20px; text-align: center; color: #721c24; background: #f8d7da;"><h3>⚠️ Initialization Error</h3><p>${error.message}</p></div>`;
    }
}

// Auto-initialize when DOM is ready
function initializeApp() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const app = new AIDesignerApp();
            app.initialize();
            window.aidesignerApp = app; // For debugging
        });
    } else {
        const app = new AIDesignerApp();
        app.initialize();
        window.aidesignerApp = app; // For debugging
    }
}

// Start the application
initializeApp();