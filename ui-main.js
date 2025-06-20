// ui-main.js - Main entry point for bundling all UI modules
console.log('🎯 ui-main.js loading...');

// Import core modules (these should work)
import { UIFramework } from './src/ui/core/ui-framework.js';
import { StateManager } from './src/ui/core/state-manager.js';
import { TabManager } from './src/ui/core/tab-manager.js';
import { MessageHandler } from './src/ui/core/message-handler.js';

// Import feature modules with correct paths
import { DesignSystemUI } from './src/ui/core/features/design-system-ui.js';
import { AIGeneratorUI } from './src/ui/core/features/ai-generator-ui.js';
import { APISettingsUI } from './src/ui/core/features/api-settings-ui.js';

// Import main app
import { AIDesignerApp } from './src/ui/core/app.js';

// Make modules available globally for Figma plugin environment
window.UIFramework = UIFramework;
window.StateManager = StateManager;
window.TabManager = TabManager;
window.MessageHandler = MessageHandler;
window.DesignSystemUI = DesignSystemUI;
window.AIGeneratorUI = AIGeneratorUI;
window.APISettingsUI = APISettingsUI;

window.AIDesignerApp = AIDesignerApp;

// Make key functions available globally for backward compatibility
window.$ = UIFramework.$;
window.byId = UIFramework.byId;
window.showStatus = UIFramework.showStatus;
window.clearStatus = UIFramework.clearStatus;
window.switchTab = UIFramework.switchTab;
window.copyToClipboard = UIFramework.copyToClipboard;

// Add compatibility functions expected by the HTML
window.scanDesignSystem = function() {
    if (window.aidesignerApp) {
        const designSystemFeature = window.aidesignerApp.getFeature('designSystem');
        if (designSystemFeature && designSystemFeature.scanDesignSystem) {
            designSystemFeature.scanDesignSystem();
        }
    }
};

window.rescanDesignSystem = function() {
    if (window.aidesignerApp) {
        const designSystemFeature = window.aidesignerApp.getFeature('designSystem');
        if (designSystemFeature && designSystemFeature.rescanDesignSystem) {
            designSystemFeature.rescanDesignSystem();
        }
    }
};

window.setActivePlatform = function(platform) {
    if (window.StateManager) {
        window.StateManager.setState('currentPlatform', platform);
    }
    
    // Update button states
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const platformBtn = document.getElementById(platform + '-toggle');
    if (platformBtn) {
        platformBtn.classList.add('active');
    }
    
    console.log('Platform switched to:', platform);
};

// Create message handler function expected by the app
window.createMessageHandler = function(stateManager) {
    return new MessageHandler(stateManager);
};

// Add ALL missing global functions expected by the HTML onclick handlers
window.closeSessionModal = function() {
    if (window.aidesignerApp) {
        const sessionFeature = window.aidesignerApp.getFeature('sessionManagement');
        if (sessionFeature && sessionFeature.closeSessionModal) {
            sessionFeature.closeSessionModal();
        }
    }
};

window.restoreSession = function() {
    if (window.aidesignerApp) {
        const sessionFeature = window.aidesignerApp.getFeature('sessionManagement');
        if (sessionFeature && sessionFeature.restoreSession) {
            sessionFeature.restoreSession();
        }
    }
};

window.startNewSession = function() {
    if (window.aidesignerApp) {
        const sessionFeature = window.aidesignerApp.getFeature('sessionManagement');
        if (sessionFeature && sessionFeature.startNewSession) {
            sessionFeature.startNewSession();
        }
    }
};

window.showAllSessions = function() {
    if (window.aidesignerApp) {
        const sessionFeature = window.aidesignerApp.getFeature('sessionManagement');
        if (sessionFeature && sessionFeature.showAllSessions) {
            sessionFeature.showAllSessions();
        }
    }
};

window.closeAllSessionsModal = function() {
    if (window.aidesignerApp) {
        const sessionFeature = window.aidesignerApp.getFeature('sessionManagement');
        if (sessionFeature && sessionFeature.closeAllSessionsModal) {
            sessionFeature.closeAllSessionsModal();
        }
    }
};

window.generateLLMPrompt = function() {
    if (window.aidesignerApp) {
        const designSystemFeature = window.aidesignerApp.getFeature('designSystem');
        if (designSystemFeature && designSystemFeature.generateLLMPrompt) {
            designSystemFeature.generateLLMPrompt();
        }
    }
};

window.saveApiKey = function() {
    console.log('💾 Save API Key called');
    if (window.aidesignerApp) {
        const apiSettingsFeature = window.aidesignerApp.getFeature('apiSettings');
        if (apiSettingsFeature && apiSettingsFeature.saveApiKey) {
            console.log('✅ Calling apiSettingsFeature.saveApiKey()');
            apiSettingsFeature.saveApiKey();
        } else {
            console.warn('⚠️ API Settings feature not found or missing saveApiKey method');
        }
    } else {
        console.warn('⚠️ aidesignerApp not found');
    }
};

window.testGeminiConnection = function() {
    console.log('🔌 Test Connection called');
    if (window.aidesignerApp) {
        const apiSettingsFeature = window.aidesignerApp.getFeature('apiSettings');
        if (apiSettingsFeature && apiSettingsFeature.testConnection) {
            console.log('✅ Calling apiSettingsFeature.testConnection()');
            apiSettingsFeature.testConnection();
        } else {
            console.warn('⚠️ API Settings feature not found or missing testConnection method');
        }
    } else {
        console.warn('⚠️ aidesignerApp not found');
    }
};

window.clearAllData = function() {
    if (window.aidesignerApp) {
        const apiSettingsFeature = window.aidesignerApp.getFeature('apiSettings');
        if (apiSettingsFeature && apiSettingsFeature.clearAllData) {
            apiSettingsFeature.clearAllData();
        }
    }
};

window.startFresh = function() {
    if (window.aidesignerApp) {
        const aiGeneratorFeature = window.aidesignerApp.getFeature('aiGenerator');
        if (aiGeneratorFeature && aiGeneratorFeature.startFresh) {
            aiGeneratorFeature.startFresh();
        }
    }
};

window.viewCurrentDesignJSON = function() {
    if (window.aidesignerApp) {
        const aiGeneratorFeature = window.aidesignerApp.getFeature('aiGenerator');
        if (aiGeneratorFeature && aiGeneratorFeature.viewCurrentDesignJSON) {
            aiGeneratorFeature.viewCurrentDesignJSON();
        }
    }
};

window.resetToOriginal = function() {
    if (window.aidesignerApp) {
        const aiGeneratorFeature = window.aidesignerApp.getFeature('aiGenerator');
        if (aiGeneratorFeature && aiGeneratorFeature.resetToOriginal) {
            aiGeneratorFeature.resetToOriginal();
        }
    }
};

window.clearImageSelection = function() {
    if (window.aidesignerApp) {
        const aiGeneratorFeature = window.aidesignerApp.getFeature('aiGenerator');
        if (aiGeneratorFeature && aiGeneratorFeature.clearImageSelection) {
            aiGeneratorFeature.clearImageSelection();
        } else if (window.aidesignerApp.clearImageSelection) {
            window.aidesignerApp.clearImageSelection();
        }
    }
};

window.generateWithGemini = function() {
    if (window.aidesignerApp) {
        const aiGeneratorFeature = window.aidesignerApp.getFeature('aiGenerator');
        if (aiGeneratorFeature && aiGeneratorFeature.generateWithGemini) {
            aiGeneratorFeature.generateWithGemini();
        }
    }
};

window.copyGeneratedJSON = function() {
    if (window.aidesignerApp) {
        const aiGeneratorFeature = window.aidesignerApp.getFeature('aiGenerator');
        if (aiGeneratorFeature && aiGeneratorFeature.copyGeneratedJSON) {
            aiGeneratorFeature.copyGeneratedJSON();
        }
    }
};

window.toggleJSONView = function() {
    if (window.aidesignerApp) {
        const aiGeneratorFeature = window.aidesignerApp.getFeature('aiGenerator');
        if (aiGeneratorFeature && aiGeneratorFeature.toggleJSONView) {
            aiGeneratorFeature.toggleJSONView();
        }
    }
};

window.generateFromJSON = function() {
    if (window.aidesignerApp) {
        const aiGeneratorFeature = window.aidesignerApp.getFeature('aiGenerator');
        if (aiGeneratorFeature && aiGeneratorFeature.generateFromJSON) {
            aiGeneratorFeature.generateFromJSON();
        }
    }
};

// Initialize the app when DOM is ready
function initializeUIModules() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            try {
                // Use the full AIDesignerApp for proper initialization
                const app = new AIDesignerApp();
                app.initialize();
                window.aidesignerApp = app;
                
                console.log('✅ UI modules initialized with AIDesignerApp');
                
                // Debug: Check what's available
                console.log('Available features:', Array.from(app.features.keys()));
                console.log('Global functions check:', {
                    switchTab: typeof window.switchTab,
                    scanDesignSystem: typeof window.scanDesignSystem,
                    setActivePlatform: typeof window.setActivePlatform
                });
            } catch (error) {
                console.error('❌ App initialization failed:', error);
                
                // Fallback to individual module initialization
                try {
                    if (window.DesignSystemUI) {
                        window.designSystemUI = new window.DesignSystemUI();
                    }
                    if (window.TabManager) {
                        window.tabManager = new window.TabManager();
                    }
                    console.log('✅ Fallback: UI modules initialized individually');
                } catch (fallbackError) {
                    console.error('❌ Fallback initialization also failed:', fallbackError);
                }
            }
        });
    } else {
        // DOM is already ready
        try {
            const app = new AIDesignerApp();
            app.initialize();
            window.aidesignerApp = app;
            console.log('✅ UI modules initialized with AIDesignerApp');
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            
            // Fallback to individual module initialization
            try {
                if (window.DesignSystemUI) {
                    window.designSystemUI = new window.DesignSystemUI();
                }
                if (window.TabManager) {
                    window.tabManager = new window.TabManager();
                }
                console.log('✅ Fallback: UI modules initialized individually');
            } catch (fallbackError) {
                console.error('❌ Fallback initialization also failed:', fallbackError);
            }
        }
    }
}

// Auto-initialize
initializeUIModules();

console.log('✅ UI modules loaded and ready');