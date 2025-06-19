// src/ui/core/tab-manager.js
// Tab navigation and management for AIDesigner UI

import { StateManager } from './state-manager.js';

export class TabManager {
    constructor() {
        this.currentTab = 'design-system';
        this.tabs = {
            'design-system': {
                button: null,
                content: null,
                title: '🔍 Design System',
                enabled: true
            },
            'api-settings': {
                button: null,
                content: null,
                title: '⚙️ API Settings',
                enabled: true
            },
            'ai-generator': {
                button: null,
                content: null,
                title: '💬 AI Generator',
                enabled: false // Initially disabled until scan completes
            }
        };
        
        this.initializeEventListeners();
    }

    /**
     * Initialize tab navigation event listeners
     */
    initializeEventListeners() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupTabButtons();
            });
        } else {
            this.setupTabButtons();
        }
    }

    /**
     * Setup tab button click handlers
     */
    setupTabButtons() {
        Object.keys(this.tabs).forEach(tabId => {
            const button = document.querySelector(`[onclick="switchTab('${tabId}')"]`) || 
                          document.querySelector(`[data-tab="${tabId}"]`);
            const content = document.getElementById(tabId);
            
            if (button && content) {
                this.tabs[tabId].button = button;
                this.tabs[tabId].content = content;
                
                // Remove inline onclick and add event listener
                button.removeAttribute('onclick');
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.switchTab(tabId);
                });
                
                console.log(`✅ Tab "${tabId}" initialized`);
            } else {
                console.warn(`⚠️ Tab elements not found for "${tabId}"`);
            }
        });

        // Set initial active tab
        this.switchTab(this.currentTab);
    }

    /**
     * Switch to specified tab
     * @param {string} tabId - ID of tab to switch to
     */
    switchTab(tabId) {
        if (!this.tabs[tabId]) {
            console.error(`❌ Unknown tab: ${tabId}`);
            return;
        }

        // Check if tab is enabled
        if (!this.tabs[tabId].enabled) {
            console.log(`⚠️ Tab "${tabId}" is disabled`);
            return;
        }

        console.log(`🔄 Switching to tab: ${tabId}`);

        // Update state
        this.currentTab = tabId;
        StateManager.updateState({ currentTab: tabId });

        // Update button states
        Object.keys(this.tabs).forEach(id => {
            const tab = this.tabs[id];
            if (tab.button) {
                tab.button.classList.remove('active');
                if (id === tabId) {
                    tab.button.classList.add('active');
                }
            }
        });

        // Update content visibility
        Object.keys(this.tabs).forEach(id => {
            const tab = this.tabs[id];
            if (tab.content) {
                tab.content.classList.remove('active');
                if (id === tabId) {
                    tab.content.classList.add('active');
                }
            }
        });

        // Emit tab change event
        this.emitTabChangeEvent(tabId);
    }

    /**
     * Enable a specific tab
     * @param {string} tabId - ID of tab to enable
     */
    enableTab(tabId) {
        if (!this.tabs[tabId]) {
            console.error(`❌ Unknown tab: ${tabId}`);
            return;
        }

        this.tabs[tabId].enabled = true;
        
        if (this.tabs[tabId].button) {
            this.tabs[tabId].button.disabled = false;
            this.tabs[tabId].button.classList.remove('disabled');
        }

        console.log(`✅ Tab "${tabId}" enabled`);
    }

    /**
     * Disable a specific tab
     * @param {string} tabId - ID of tab to disable
     */
    disableTab(tabId) {
        if (!this.tabs[tabId]) {
            console.error(`❌ Unknown tab: ${tabId}`);
            return;
        }

        this.tabs[tabId].enabled = false;
        
        if (this.tabs[tabId].button) {
            this.tabs[tabId].button.disabled = true;
            this.tabs[tabId].button.classList.add('disabled');
        }

        // If current tab is being disabled, switch to first enabled tab
        if (this.currentTab === tabId) {
            const firstEnabledTab = Object.keys(this.tabs).find(id => this.tabs[id].enabled);
            if (firstEnabledTab) {
                this.switchTab(firstEnabledTab);
            }
        }

        console.log(`❌ Tab "${tabId}" disabled`);
    }

    /**
     * Get current active tab
     * @returns {string} Current tab ID
     */
    getCurrentTab() {
        return this.currentTab;
    }

    /**
     * Check if a tab is enabled
     * @param {string} tabId - ID of tab to check
     * @returns {boolean} True if tab is enabled
     */
    isTabEnabled(tabId) {
        return this.tabs[tabId]?.enabled || false;
    }

    /**
     * Get all tab information
     * @returns {Object} Tab configuration object
     */
    getAllTabs() {
        return { ...this.tabs };
    }

    /**
     * Update tab title
     * @param {string} tabId - ID of tab to update
     * @param {string} newTitle - New title for the tab
     */
    updateTabTitle(tabId, newTitle) {
        if (!this.tabs[tabId]) {
            console.error(`❌ Unknown tab: ${tabId}`);
            return;
        }

        this.tabs[tabId].title = newTitle;
        
        if (this.tabs[tabId].button) {
            // Update button text while preserving any icons
            const button = this.tabs[tabId].button;
            const iconMatch = button.textContent.match(/^[🔍⚙️💬]\s*/);
            const icon = iconMatch ? iconMatch[0] : '';
            button.textContent = icon + newTitle.replace(/^[🔍⚙️💬]\s*/, '');
        }

        console.log(`📝 Tab "${tabId}" title updated to: ${newTitle}`);
    }

    /**
     * Emit custom tab change event
     * @param {string} tabId - ID of newly active tab
     */
    emitTabChangeEvent(tabId) {
        const event = new CustomEvent('tabChanged', {
            detail: {
                tabId,
                previousTab: this.currentTab,
                timestamp: Date.now()
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Add listener for tab change events
     * @param {Function} callback - Function to call when tab changes
     */
    onTabChange(callback) {
        document.addEventListener('tabChanged', (event) => {
            callback(event.detail);
        });
    }

    /**
     * Enable the AI Generator tab (called after successful scan)
     */
    enableGeneratorTab() {
        this.enableTab('ai-generator');
        
        // Update tab title to show it's ready
        const currentTitle = this.tabs['ai-generator'].title;
        if (!currentTitle.includes('✓')) {
            this.updateTabTitle('ai-generator', currentTitle.replace('💬', '💬✓'));
        }
    }

    /**
     * Reset AI Generator tab state
     */
    resetGeneratorTab() {
        this.disableTab('ai-generator');
        this.updateTabTitle('ai-generator', '💬 AI Generator');
    }

    /**
     * Show tab loading state
     * @param {string} tabId - ID of tab to show loading for
     * @param {boolean} isLoading - Whether tab is loading
     */
    setTabLoading(tabId, isLoading) {
        if (!this.tabs[tabId]) return;

        const button = this.tabs[tabId].button;
        if (!button) return;

        if (isLoading) {
            button.classList.add('loading');
            button.style.opacity = '0.7';
            button.style.pointerEvents = 'none';
        } else {
            button.classList.remove('loading');
            button.style.opacity = '';
            button.style.pointerEvents = '';
        }
    }

    /**
     * Add badge to tab (e.g., notification count)
     * @param {string} tabId - ID of tab to add badge to
     * @param {string|number} content - Badge content
     */
    addTabBadge(tabId, content) {
        if (!this.tabs[tabId]) return;

        const button = this.tabs[tabId].button;
        if (!button) return;

        // Remove existing badge
        const existingBadge = button.querySelector('.tab-badge');
        if (existingBadge) {
            existingBadge.remove();
        }

        // Add new badge
        const badge = document.createElement('span');
        badge.className = 'tab-badge';
        badge.textContent = content;
        badge.style.cssText = `
            position: absolute;
            top: 4px;
            right: 4px;
            background: var(--color-error);
            color: white;
            border-radius: 8px;
            padding: 2px 6px;
            font-size: 10px;
            font-weight: 600;
            min-width: 16px;
            text-align: center;
        `;
        
        button.style.position = 'relative';
        button.appendChild(badge);
    }

    /**
     * Remove badge from tab
     * @param {string} tabId - ID of tab to remove badge from
     */
    removeTabBadge(tabId) {
        if (!this.tabs[tabId]) return;

        const button = this.tabs[tabId].button;
        if (!button) return;

        const badge = button.querySelector('.tab-badge');
        if (badge) {
            badge.remove();
        }
    }

    /**
     * Destroy tab manager and clean up event listeners
     */
    destroy() {
        Object.keys(this.tabs).forEach(tabId => {
            const tab = this.tabs[tabId];
            if (tab.button) {
                // Clone button to remove all event listeners
                const newButton = tab.button.cloneNode(true);
                tab.button.parentNode.replaceChild(newButton, tab.button);
            }
        });
        
        console.log('🗑️ TabManager destroyed');
    }
}

// Global function for backward compatibility (can be removed later)
window.switchTab = function(tabId) {
    if (window.tabManager) {
        window.tabManager.switchTab(tabId);
    } else {
        console.warn('⚠️ TabManager not initialized, using fallback');
        // Fallback implementation
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        const targetBtn = document.querySelector(`[onclick*="${tabId}"]`);
        const targetContent = document.getElementById(tabId);
        
        if (targetBtn && targetContent) {
            targetBtn.classList.add('active');
            targetContent.classList.add('active');
        }
    }
};