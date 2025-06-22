// src/ui/features/api-settings-ui.js
// API Settings UI functionality for AIDesigner

import { MessageHandler } from '../message-handler.js';
import { UIFramework } from '../ui-framework.js';

export class APISettingsUI {
    constructor() {
        this.elements = {
            apiKeyInput: null,
            saveBtn: null,
            testBtn: null,
            statusContainer: null
        };
        
        this.initialize();
    }

    /**
     * Initialize API settings UI
     */
    initialize() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupElements());
        } else {
            this.setupElements();
        }
    }

    /**
     * Setup DOM elements and event listeners
     */
    setupElements() {
        this.elements = {
            apiKeyInput: document.getElementById('apiKey'),
            saveBtn: document.getElementById('saveBtn'),
            testBtn: document.getElementById('testBtn'),
            statusContainer: document.getElementById('connectionStatus')
        };

        if (this.elements.apiKeyInput && this.elements.saveBtn && this.elements.testBtn) {
            this.setupEventListeners();
            this.setupApiKeyHandling();
            console.log('✅ API Settings UI initialized');
        } else {
            console.warn('⚠️ API Settings elements not found');
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Save button
        this.elements.saveBtn?.addEventListener('click', () => this.saveApiKey());
        
        // Test button  
        this.elements.testBtn?.addEventListener('click', () => this.testConnection());

        // API key input handlers
        this.setupApiKeyHandling();
    }

    /**
     * Setup API key input behavior
     */
    setupApiKeyHandling() {
        const input = this.elements.apiKeyInput;
        if (!input) return;

        // Handle focus - clear masked value
        input.addEventListener('focus', function() {
            if (this.getAttribute('data-has-key') === 'true') {
                this.value = '';
                this.setAttribute('data-has-key', 'false');
            }
        });
        
        // Handle input - mark as changed
        input.addEventListener('input', function() {
            if (this.value.length > 0) {
                this.setAttribute('data-has-key', 'false');
            }
        });
    }

    /**
     * Save API key
     */
    async saveApiKey() {
        const input = this.elements.apiKeyInput;
        const saveBtn = this.elements.saveBtn;
        
        if (!input || !saveBtn) return;
        
        const apiKey = input.value.trim();
        
        // Check if already saved
        if (input.getAttribute('data-has-key') === 'true' && apiKey.includes('●')) {
            this.showStatus('ℹ️ API key already saved', 'info');
            return;
        }
        
        if (!apiKey) {
            this.showStatus('❌ Please enter an API key', 'error');
            return;
        }
        
        // Update UI
        saveBtn.disabled = true;
        saveBtn.textContent = '💾 Saving...';
        
        // Send to backend
        MessageHandler.sendMessage({
            type: 'save-api-key',
            payload: apiKey
        });
    }

    /**
     * Test API connection
     */
    async testConnection() {
        const testBtn = this.elements.testBtn;
        if (!testBtn) return;
        
        testBtn.disabled = true;
        testBtn.textContent = '🔌 Testing...';
        this.showStatus('🔄 Requesting API key...', 'info');
        
        try {
            const apiKey = await this.getApiKeyFromBackend();
            
            if (!apiKey) {
                throw new Error('API key not found. Please save it.');
            }
            
            this.showStatus('🔄 Testing connection with Gemini API...', 'info');
            
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'Hello' }] }]
                })
            });
            
            if (response.ok) {
                this.showStatus('✅ Connection successful!', 'success');
            } else {
                const errorData = await response.json();
                throw new Error(`HTTP ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.showStatus(`❌ Error: ${errorMessage}`, 'error');
        } finally {
            testBtn.disabled = false;
            testBtn.textContent = '🔌 Test Connection';
        }
    }

    /**
     * Get API key from backend
     */
    async getApiKeyFromBackend() {
        this.showStatus('🔄 Getting API key...', 'info');
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                window.removeEventListener('message', handler);
                reject(new Error('Timeout getting API key.'));
            }, 3000);
            
            const handler = (event) => {
                const msg = event.data.pluginMessage;
                if (msg && (msg.type === 'api-key-found' || msg.type === 'api-key-not-found')) {
                    clearTimeout(timeout);
                    window.removeEventListener('message', handler);
                    resolve(msg.payload || null);
                }
            };
            
            window.addEventListener('message', handler);
            MessageHandler.sendMessage({ type: 'get-api-key' });
        });
    }

    /**
     * Handle API key loaded from storage
     */
    handleApiKeyLoaded(apiKey) {
        const input = this.elements.apiKeyInput;
        if (!input) return;
        
        input.value = '●'.repeat(40);
        input.setAttribute('data-has-key', 'true');
        this.showStatus('✅ API key loaded from previous session', 'success');
    }

    /**
     * Handle API key saved successfully
     */
    handleApiKeySaved() {
        const saveBtn = this.elements.saveBtn;
        const input = this.elements.apiKeyInput;
        
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 Save API Key';
        }
        
        if (input) {
            input.value = '●'.repeat(40);
            input.setAttribute('data-has-key', 'true');
        }
        
        this.showStatus('✅ API key saved successfully!', 'success');
    }

    /**
     * Clear all data
     */
    clearAllData() {
        if (confirm('Clear all saved data? This will remove API key and design system cache.')) {
            MessageHandler.sendMessage({ type: 'clear-storage' });
            location.reload();
        }
    }

    /**
     * Show status message
     */
    showStatus(message, type) {
        if (this.elements.statusContainer) {
            UIFramework.showStatus(this.elements.statusContainer.id, message, type);
        }
    }

    /**
     * Clear status message
     */
    clearStatus() {
        if (this.elements.statusContainer) {
            UIFramework.clearStatus(this.elements.statusContainer.id);
        }
    }
}

// Export for backward compatibility
window.saveApiKey = function() {
    window.apiSettingsUI?.saveApiKey();
};

window.testGeminiConnection = function() {
    window.apiSettingsUI?.testConnection();
};

window.clearAllData = function() {
    window.apiSettingsUI?.clearAllData();
};