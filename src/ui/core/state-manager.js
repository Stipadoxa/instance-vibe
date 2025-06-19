// src/ui/core/state-manager.js
// Centralized state management for AIDesigner UI

class StateManager {
    constructor() {
        this.state = {
            // Tab management
            currentTab: 'design-system',
            
            // Design system data
            scanResults: [],
            currentFilter: 'all',
            searchQuery: '',
            
            // AI Generator data
            lastGeneratedJSON: null,
            selectedImage: null,
            currentPlatform: 'mobile',
            
            // Design iteration state
            designState: {
                original: null,
                current: null,
                history: [],
                frameId: null,
                isIterating: false
            },
            
            // Session management
            currentSessionData: null,
            pendingSessionRestore: null,
            
            // API settings
            apiKeyLoaded: false,
            
            // UI state
            generatorTabEnabled: false
        };
        
        this.subscribers = new Map();
        this.eventListeners = new Map();
    }
    
    /**
     * Get current state value
     */
    getState(key) {
        if (key) {
            return this.state[key];
        }
        return { ...this.state }; // Return copy to prevent mutations
    }
    
    /**
     * Set state value and notify subscribers
     */
    setState(key, value) {
        const oldValue = this.state[key];
        this.state[key] = value;
        
        // Notify subscribers of this specific key
        this.notifySubscribers(key, value, oldValue);
        
        // Notify global state change listeners
        this.notifyStateChange(key, value, oldValue);
        
        console.log(`🔄 State updated: ${key}`, value);
    }
    
    /**
     * Update nested state (like designState properties)
     */
    updateNestedState(parentKey, childKey, value) {
        if (this.state[parentKey] && typeof this.state[parentKey] === 'object') {
            const oldParentValue = { ...this.state[parentKey] };
            this.state[parentKey][childKey] = value;
            
            this.notifySubscribers(parentKey, this.state[parentKey], oldParentValue);
            this.notifySubscribers(`${parentKey}.${childKey}`, value);
            
            console.log(`🔄 Nested state updated: ${parentKey}.${childKey}`, value);
        }
    }
    
    /**
     * Subscribe to state changes for a specific key
     */
    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        this.subscribers.get(key).add(callback);
        
        // Return unsubscribe function
        return () => {
            const keySubscribers = this.subscribers.get(key);
            if (keySubscribers) {
                keySubscribers.delete(callback);
                if (keySubscribers.size === 0) {
                    this.subscribers.delete(key);
                }
            }
        };
    }
    
    /**
     * Subscribe to any state change
     */
    subscribeToAll(callback) {
        return this.subscribe('*', callback);
    }
    
    /**
     * Notify subscribers of state changes
     */
    notifySubscribers(key, newValue, oldValue) {
        const keySubscribers = this.subscribers.get(key);
        if (keySubscribers) {
            keySubscribers.forEach(callback => {
                try {
                    callback(newValue, oldValue, key);
                } catch (error) {
                    console.error(`Error in state subscriber for ${key}:`, error);
                }
            });
        }
        
        // Also notify wildcard subscribers
        const allSubscribers = this.subscribers.get('*');
        if (allSubscribers) {
            allSubscribers.forEach(callback => {
                try {
                    callback(newValue, oldValue, key);
                } catch (error) {
                    console.error(`Error in wildcard state subscriber:`, error);
                }
            });
        }
    }
    
    /**
     * Notify general state change listeners
     */
    notifyStateChange(key, newValue, oldValue) {
        const changeEvent = {
            key,
            newValue,
            oldValue,
            timestamp: Date.now()
        };
        
        // Emit custom event for other systems to listen
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('aidesigner-state-change', {
                detail: changeEvent
            }));
        }
    }
    
    /**
     * Reset specific state section
     */
    resetState(key) {
        const initialValues = {
            designState: {
                original: null,
                current: null,
                history: [],
                frameId: null,
                isIterating: false
            },
            selectedImage: null,
            lastGeneratedJSON: null,
            currentSessionData: null,
            pendingSessionRestore: null
        };
        
        if (initialValues[key]) {
            this.setState(key, initialValues[key]);
        }
    }
    
    /**
     * Bulk state update (for initialization or restoration)
     */
    batchUpdate(updates) {
        const changes = [];
        
        Object.entries(updates).forEach(([key, value]) => {
            const oldValue = this.state[key];
            this.state[key] = value;
            changes.push({ key, value, oldValue });
        });
        
        // Notify all changes at once
        changes.forEach(({ key, value, oldValue }) => {
            this.notifySubscribers(key, value, oldValue);
        });
        
        console.log(`🔄 Batch state update:`, changes.map(c => c.key));
    }
    
    /**
     * Design state specific helpers
     */
    startIteration(generatedJSON, frameId) {
        this.setState('designState', {
            original: JSON.parse(JSON.stringify(generatedJSON)),
            current: generatedJSON,
            frameId: frameId,
            isIterating: true,
            history: ["Original design generated."]
        });
    }
    
    addToHistory(action) {
        const currentDesignState = { ...this.state.designState };
        currentDesignState.history.push(action);
        this.setState('designState', currentDesignState);
    }
    
    updateCurrentDesign(modifiedJSON) {
        const currentDesignState = { ...this.state.designState };
        currentDesignState.current = modifiedJSON;
        this.setState('designState', currentDesignState);
    }
    
    resetToOriginal() {
        const currentDesignState = { ...this.state.designState };
        currentDesignState.current = JSON.parse(JSON.stringify(currentDesignState.original));
        currentDesignState.history = ["Original design generated."];
        this.setState('designState', currentDesignState);
    }
    
    /**
     * Image state helpers
     */
    setSelectedImage(imageData) {
        this.setState('selectedImage', imageData);
    }
    
    clearSelectedImage() {
        this.setState('selectedImage', null);
    }
    
    isValidImageSelected() {
        const image = this.state.selectedImage;
        return image && 
               image.base64 && 
               image.type && 
               image.base64.length > 0;
    }
    
    /**
     * Component scanning helpers
     */
    updateScanResults(components) {
        this.setState('scanResults', components || []);
    }
    
    getFilteredComponents() {
        const { scanResults, currentFilter, searchQuery } = this.state;
        let filtered = scanResults;
        
        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(comp => 
                comp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                comp.suggestedType.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        
        // Apply category filter
        switch (currentFilter) {
            case 'unknown':
                return filtered.filter(comp => comp.suggestedType === 'unknown');
            case 'low':
                return filtered.filter(comp => comp.confidence < 0.6 && !comp.isVerified);
            case 'verified':
                return filtered.filter(comp => comp.isVerified);
            default:
                return filtered;
        }
    }
    
    /**
     * Platform helpers
     */
    switchPlatform(platform) {
        this.setState('currentPlatform', platform);
    }
    
    /**
     * Debug helpers
     */
    dumpState() {
        console.log('📊 Current State:', this.state);
        console.log('📊 Active Subscribers:', 
            Array.from(this.subscribers.keys()).map(key => ({
                key,
                count: this.subscribers.get(key).size
            }))
        );
    }
    
    /**
     * Persistence helpers (save to sessionStorage for tab refresh)
     */
    saveToSession() {
        try {
            const persistentState = {
                currentTab: this.state.currentTab,
                currentPlatform: this.state.currentPlatform,
                currentFilter: this.state.currentFilter,
                searchQuery: this.state.searchQuery
            };
            sessionStorage.setItem('aidesigner-ui-state', JSON.stringify(persistentState));
        } catch (error) {
            console.warn('Could not save state to session:', error);
        }
    }
    
    loadFromSession() {
        try {
            const saved = sessionStorage.getItem('aidesigner-ui-state');
            if (saved) {
                const persistentState = JSON.parse(saved);
                this.batchUpdate(persistentState);
            }
        } catch (error) {
            console.warn('Could not load state from session:', error);
        }
    }
}

// Create and export singleton instance
const stateManager = new StateManager();

// Auto-save state changes to session
stateManager.subscribe('currentTab', () => stateManager.saveToSession());
stateManager.subscribe('currentPlatform', () => stateManager.saveToSession());
stateManager.subscribe('currentFilter', () => stateManager.saveToSession());
stateManager.subscribe('searchQuery', () => stateManager.saveToSession());

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.StateManager = stateManager;
}

// Also support module exports if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = stateManager;
}