// src/ui/core/message-handler.js
// Plugin message communication layer for AIDesigner UI

class MessageHandler {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.handlers = new Map();
        this.middleware = [];
        this.isInitialized = false;
        
        // Bind the main message handler
        this.handleMessage = this.handleMessage.bind(this);
    }
    
    /**
     * Initialize message handling
     */
    initialize() {
        if (this.isInitialized) return;
        
        window.addEventListener('message', this.handleMessage);
        this.isInitialized = true;
        console.log('📨 Message handler initialized');
    }
    
    /**
     * Register a handler for a specific message type
     */
    register(messageType, handler) {
        if (!this.handlers.has(messageType)) {
            this.handlers.set(messageType, []);
        }
        this.handlers.get(messageType).push(handler);
        console.log(`📝 Handler registered for: ${messageType}`);
    }
    
    /**
     * Unregister a handler
     */
    unregister(messageType, handler) {
        const handlers = this.handlers.get(messageType);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
                if (handlers.length === 0) {
                    this.handlers.delete(messageType);
                }
            }
        }
    }
    
    /**
     * Add middleware that runs before all handlers
     */
    addMiddleware(middleware) {
        this.middleware.push(middleware);
    }
    
    /**
     * Main message handler - routes messages to registered handlers
     */
    async handleMessage(event) {
        const msg = event.data.pluginMessage;
        if (!msg) return;
        
        console.log("📨 Message from plugin:", msg.type);
        
        try {
            // Run middleware first
            let shouldContinue = true;
            for (const middleware of this.middleware) {
                const result = await middleware(msg, this.stateManager);
                if (result === false) {
                    shouldContinue = false;
                    break;
                }
            }
            
            if (!shouldContinue) return;
            
            // Route to registered handlers
            const handlers = this.handlers.get(msg.type);
            if (handlers && handlers.length > 0) {
                for (const handler of handlers) {
                    try {
                        await handler(msg, this.stateManager);
                    } catch (error) {
                        console.error(`❌ Handler error for ${msg.type}:`, error);
                    }
                }
            } else {
                // Handle unknown message types
                this.handleUnknownMessage(msg);
            }
            
        } catch (error) {
            console.error("❌ Message handling error:", error);
        }
    }
    
    /**
     * Handle unknown message types
     */
    handleUnknownMessage(msg) {
        console.warn(`⚠️ No handler registered for message type: ${msg.type}`);
    }
    
    /**
     * Send message to plugin backend
     */
    sendToPlugin(message) {
        try {
            parent.postMessage({
                pluginMessage: message
            }, '*');
            console.log("📤 Message sent to plugin:", message.type);
        } catch (error) {
            console.error("❌ Failed to send message:", error);
        }
    }
    
    /**
     * Send message and wait for response
     */
    async sendAndWait(message, responseType, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.unregister(responseType, responseHandler);
                reject(new Error(`Timeout waiting for ${responseType}`));
            }, timeout);
            
            const responseHandler = (responseMsg) => {
                clearTimeout(timeoutId);
                this.unregister(responseType, responseHandler);
                resolve(responseMsg);
            };
            
            this.register(responseType, responseHandler);
            this.sendToPlugin(message);
        });
    }
    
    /**
     * Cleanup
     */
    destroy() {
        if (this.isInitialized) {
            window.removeEventListener('message', this.handleMessage);
            this.handlers.clear();
            this.middleware = [];
            this.isInitialized = false;
            console.log('📨 Message handler destroyed');
        }
    }
}

// Core message handlers that don't belong to specific features
class CoreMessageHandlers {
    static registerAll(messageHandler, stateManager) {
        // API Key management
        messageHandler.register('api-key-loaded', (msg, state) => {
            console.log('✅ API key loaded from storage');
            state.setState('apiKeyLoaded', true);
            
            const apiKeyInput = document.getElementById('apiKey');
            if (apiKeyInput) {
                apiKeyInput.value = '●'.repeat(40);
                apiKeyInput.setAttribute('data-has-key', 'true');
            }
            
            state.setState('generatorTabEnabled', true);
            CoreMessageHandlers.showStatus('connectionStatus', '✅ API key loaded from previous session', 'success');
        });
        
        messageHandler.register('api-key-saved', (msg, state) => {
            const saveBtn = document.getElementById('saveBtn');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = '💾 Save API Key';
            }
            
            CoreMessageHandlers.showStatus('connectionStatus', '✅ API key saved successfully!', 'success');
            
            const keyInput = document.getElementById('apiKey');
            if (keyInput) {
                keyInput.value = '●'.repeat(40);
                keyInput.setAttribute('data-has-key', 'true');
            }
            
            state.setState('generatorTabEnabled', true);
            state.setState('apiKeyLoaded', true);
        });
        
        messageHandler.register('api-key-found', (msg, state) => {
            state.setState('apiKeyLoaded', true);
        });
        
        messageHandler.register('api-key-not-found', (msg, state) => {
            state.setState('apiKeyLoaded', false);
        });
        
        messageHandler.register('api-key-error', (msg, state) => {
            state.setState('apiKeyLoaded', false);
            CoreMessageHandlers.showStatus('connectionStatus', `❌ API key error: ${msg.payload}`, 'error');
        });
        
        // Generic error handling
        messageHandler.register('ui-generation-error', (msg, state) => {
            CoreMessageHandlers.showStatus('generationStatus', `❌ Generation error: ${msg.error}`, 'error');
        });
        
        // Navigation
        messageHandler.register('component-navigation-success', (msg, state) => {
            // Handle successful navigation to component
            console.log('✅ Navigated to component successfully');
        });
        
        console.log('✅ Core message handlers registered');
    }
    
    /**
     * Utility function for showing status messages
     */
    static showStatus(containerId, message, type) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = `<div class="status ${type}">${message}</div>`;
    }
    
    /**
     * Utility function for clearing status messages
     */
    static clearStatus(containerId) {
        const container = document.getElementById(containerId);
        if (container) container.innerHTML = '';
    }
}

// Export factory function to create message handler with state manager
function createMessageHandler(stateManager) {
    const messageHandler = new MessageHandler(stateManager);
    
    // Register core handlers
    CoreMessageHandlers.registerAll(messageHandler, stateManager);
    
    return messageHandler;
}

// Export classes for use in other modules
if (typeof window !== 'undefined') {
    window.MessageHandler = MessageHandler;
    window.createMessageHandler = createMessageHandler;
    window.CoreMessageHandlers = CoreMessageHandlers;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MessageHandler,
        createMessageHandler,
        CoreMessageHandlers
    };
}