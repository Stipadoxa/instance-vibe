// ui-main.js - Main entry point for bundling all UI modules

// Import core modules (these should work)
import { UIFramework } from './src/ui/core/ui-framework.js';
import { StateManager } from './src/ui/core/state-manager.js';
import { TabManager } from './src/ui/core/tab-manager.js';
import { MessageHandler } from './src/ui/core/message-handler.js';

// Import feature modules with correct paths
import { DesignSystemUI } from './src/ui/core/features/design-system-ui.js';
import { AIGeneratorUI } from './src/ui/core/features/ai-generator-ui.js';
import { APISettingsUI } from './src/ui/core/features/api-settings-ui.js';

// Import main app (comment out temporarily if it has issues)
// import { AIDesignerApp } from './src/ui/core/app.js';

// Make modules available globally for Figma plugin environment
window.UIFramework = UIFramework;
window.StateManager = StateManager;
window.TabManager = TabManager;
window.MessageHandler = MessageHandler;
window.DesignSystemUI = DesignSystemUI;
window.AIGeneratorUI = AIGeneratorUI;
window.APISettingsUI = APISettingsUI;

// TODO: Add app back once import paths are fixed
// window.AIDesignerApp = AIDesignerApp;

// Make key functions available globally for backward compatibility
window.$ = UIFramework.$;
window.byId = UIFramework.byId;
window.showStatus = UIFramework.showStatus;
window.clearStatus = UIFramework.clearStatus;
window.switchTab = UIFramework.switchTab;
window.copyToClipboard = UIFramework.copyToClipboard;

// Initialize the app when DOM is ready
function initializeUIModules() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            try {
                // Initialize individual modules for now
                if (window.DesignSystemUI) {
                    window.designSystemUI = new window.DesignSystemUI();
                }
                if (window.TabManager) {
                    window.tabManager = new window.TabManager();
                }
                
                console.log('✅ UI modules initialized individually');
                
                // TODO: Use AIDesignerApp once import paths are fixed
                // const app = new AIDesignerApp();
                // await app.initialize();
                // window.aidesignerApp = app;
            } catch (error) {
                console.error('❌ Module initialization failed:', error);
            }
        });
    } else {
        // DOM is already ready
        try {
            if (window.DesignSystemUI) {
                window.designSystemUI = new window.DesignSystemUI();
            }
            if (window.TabManager) {
                window.tabManager = new window.TabManager();
            }
            console.log('✅ UI modules initialized individually');
        } catch (error) {
            console.error('❌ Module initialization failed:', error);
        }
    }
}

// Auto-initialize
initializeUIModules();

console.log('✅ UI modules loaded and ready');