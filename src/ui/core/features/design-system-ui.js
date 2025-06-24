// src/ui/features/design-system-ui.js
// Design System scanning and management UI for AIDesigner

import { MessageHandler } from '../message-handler.js';
import { UIFramework } from '../ui-framework.js';
import { StateManager } from '../state-manager.js';

export class DesignSystemUI {
    constructor() {
        console.log('🚀 NEW DesignSystemUI constructor called - Export button version!');
        // Component type categories
        this.componentTypes = {
            'Navigation': ['appbar', 'navbar', 'tab', 'tabs', 'breadcrumb', 'pagination', 'navigation', 'sidebar', 'bottom-navigation', 'menu'],
            'Input': ['button', 'input', 'textarea', 'select', 'checkbox', 'radio', 'switch', 'slider', 'searchbar', 'chip'],
            'Display': ['card', 'list', 'list-item', 'avatar', 'image', 'icon', 'text', 'header', 'badge', 'tooltip'],
            'Feedback': ['snackbar', 'alert', 'dialog', 'modal', 'progress', 'skeleton', 'loading', 'toast'],
            'Layout': ['container', 'frame', 'grid', 'divider', 'spacer'],
            'Specialized': ['fab', 'actionsheet', 'bottomsheet', 'chart', 'table', 'calendar', 'timeline', 'upload', 'gallery', 'map', 'rating', 'cart', 'price']
        };

        // State
        this.scanResults = [];
        this.currentFilter = 'all';
        this.searchQuery = '';

        // DOM elements
        this.elements = {
            scanBtn: null,
            rescanBtn: null,
            exportRawBtn: null,
            scanStatusContainer: null,
            scanStatusText: null,
            componentsSection: null,
            promptSection: null,
            componentsList: null,
            searchInput: null,
            filterButtons: null,
            statsBar: null,
            totalCount: null,
            highConfCount: null,
            lowConfCount: null,
            verifiedCount: null
        };

        this.initialize();
    }

    /**
     * Initialize Design System UI
     */
    initialize() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupElements());
        } else {
            this.setupElements();
        }

        this.registerMessageHandlers();
        this.addRawExportButton();
    }

    /**
     * Setup DOM elements and event listeners
     */
    setupElements() {
        this.elements = {
            scanBtn: document.getElementById('scanBtn'),
            rescanBtn: document.getElementById('rescanBtn'),
            exportRawBtn: document.getElementById('exportRawBtn'),
            scanStatusContainer: document.getElementById('scanStatusContainer'),
            scanStatusText: document.getElementById('scanStatusText'),
            componentsSection: document.getElementById('componentsSection'),
            promptSection: document.getElementById('promptSection'),
            componentsList: document.getElementById('componentsList'),
            searchInput: document.getElementById('searchInput'),
            statsBar: document.getElementById('statsBar'),
            totalCount: document.getElementById('totalCount'),
            highConfCount: document.getElementById('highConfCount'),
            lowConfCount: document.getElementById('lowConfCount'),
            verifiedCount: document.getElementById('verifiedCount')
        };

        this.setupEventListeners();
        console.log('✅ Design System UI initialized');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Scan button
        if (this.elements.scanBtn) {
            this.elements.scanBtn.addEventListener('click', () => this.scanDesignSystem());
        }

        // Rescan button
        if (this.elements.rescanBtn) {
            this.elements.rescanBtn.addEventListener('click', () => this.rescanDesignSystem());
        }

        // Export raw data button
        if (this.elements.exportRawBtn) {
            this.elements.exportRawBtn.addEventListener('click', () => this.exportRawScanData());
        }

        // Search input
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.renderComponentList();
            });
        }

        // Filter buttons
        this.setupFilterButtons();

        // Generate LLM prompt button
        const promptBtn = document.querySelector('[onclick="generateLLMPrompt()"]');
        if (promptBtn) {
            promptBtn.removeAttribute('onclick');
            promptBtn.addEventListener('click', () => this.generateLLMPrompt());
        }
    }

    /**
     * Setup filter button event listeners
     */
    setupFilterButtons() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                filterButtons.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                e.target.classList.add('active');
                
                // Update filter
                this.currentFilter = e.target.dataset.filter;
                this.renderComponentList();
            });
        });
    }

    /**
     * Register message handlers for design system events
     */
    registerMessageHandlers() {
        // Register handlers with MessageHandler if available
        if (window.messageHandler) {
            window.messageHandler.register('scan-results', (msg) => {
                this.handleScanResults(msg.components);
            });

            window.messageHandler.register('saved-scan-loaded', (msg) => {
                this.displaySavedScan(msg.components, msg.scanTime);
            });

            window.messageHandler.register('component-type-updated', (msg) => {
                this.handleComponentTypeUpdated(msg.componentId, msg.newType, msg.componentName);
            });

            window.messageHandler.register('llm-prompt-generated', (msg) => {
                this.handleLLMPromptGenerated(msg.prompt);
            });
        }
    }

    /**
     * Start design system scan
     */
    scanDesignSystem() {
        if (this.elements.scanBtn) {
            this.elements.scanBtn.disabled = true;
            this.elements.scanBtn.textContent = '🔍 Scanning...';
        }

        MessageHandler.sendMessage({ type: 'scan-design-system' });
        console.log('🔍 Starting design system scan');
    }

    /**
     * Re-scan design system
     */
    rescanDesignSystem() {
        this.scanDesignSystem();
    }

    /**
     * Handle scan results from backend
     */
    handleScanResults(components) {
        if (this.elements.scanBtn) {
            this.elements.scanBtn.disabled = false;
            this.elements.scanBtn.textContent = '🔍 Scan Design System';
        }

        this.displaySavedScan(components, Date.now());
        console.log(`✅ Scan completed: ${components?.length || 0} components found`);
    }

    /**
     * Display saved scan results
     */
    displaySavedScan(components, scanTime) {
        this.scanResults = components || [];
        
        const statusContainer = this.elements.scanStatusContainer;
        const statusText = this.elements.scanStatusText;
        const rescanBtn = this.elements.rescanBtn;
        
        if (this.scanResults.length > 0) {
            if (statusContainer) statusContainer.classList.add('loaded');
            if (statusText) {
                const timeAgo = scanTime ? this.getTimeAgo(scanTime) : 'recently';
                statusText.textContent = `✅ ${this.scanResults.length} components loaded (scanned ${timeAgo})`;
            }
            if (rescanBtn) rescanBtn.style.display = 'inline-block';
            
            // Show export button when results are available
            if (this.elements.exportRawBtn) {
                this.elements.exportRawBtn.style.display = 'inline-block';
            }
            
            this.displayComponents();
            this.enableGeneratorTab();
        } else {
            if (statusText) statusText.textContent = 'No design system scanned yet';
            if (rescanBtn) rescanBtn.style.display = 'none';
            if (this.elements.exportRawBtn) this.elements.exportRawBtn.style.display = 'none';
        }
    }

    /**
     * Display components section and render list
     */
    displayComponents() {
        if (this.scanResults.length === 0) {
            if (this.elements.componentsSection) this.elements.componentsSection.style.display = 'none';
            if (this.elements.promptSection) this.elements.promptSection.style.display = 'none';
            return;
        }

        // Set isVerified to false for components that don't have it
        this.scanResults.forEach(comp => {
            if (comp.isVerified === undefined) {
                comp.isVerified = false;
            }
        });

        this.renderComponentList();
        this.updateComponentStats();

        if (this.elements.componentsSection) this.elements.componentsSection.style.display = 'block';
        if (this.elements.promptSection) this.elements.promptSection.style.display = 'block';
    }

    /**
     * Render the component list based on current filters
     */
    renderComponentList() {
        const container = this.elements.componentsList;
        if (!container) return;

        const filteredComponents = this.getFilteredComponents();
        container.innerHTML = '';

        filteredComponents.forEach(comp => {
            const item = this.createComponentItem(comp);
            container.appendChild(item);
        });

        // Setup event listeners for the new elements
        this.setupComponentItemListeners();
    }

    /**
     * Setup event listeners for component items
     */
    setupComponentItemListeners() {
        const container = this.elements.componentsList;
        if (!container) return;

        // Type select dropdowns
        container.querySelectorAll('.type-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const componentId = e.target.getAttribute('data-component-id');
                const newType = e.target.value;
                this.handleTypeChange(componentId, newType);
            });
        });

        // Navigation buttons
        container.querySelectorAll('.navigate-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const componentId = e.target.getAttribute('data-component-id');
                const pageName = e.target.getAttribute('data-page-name');
                this.handleNavigation(componentId, pageName);
            });
        });
    }

    /**
     * Create a component item DOM element
     */
    createComponentItem(comp) {
        const item = document.createElement('div');
        item.className = 'component-item';
        item.dataset.componentId = comp.id;

        const confidence = Math.round(comp.confidence * 100);
        let confidenceClass = 'confidence-low';
        if (comp.isVerified) confidenceClass = 'confidence-verified';
        else if (confidence >= 80) confidenceClass = 'confidence-high';
        else if (confidence >= 60) confidenceClass = 'confidence-medium';

        const statusIcon = comp.isVerified ? '✓' : (comp.suggestedType === 'unknown' ? '❓' : '🤖');
        const statusClass = comp.isVerified ? 'icon-verified' : (comp.suggestedType === 'unknown' ? 'icon-unknown' : 'icon-auto');
        const selectOptions = this.createSelectOptions(comp.suggestedType);

        item.innerHTML = `
            <div class="component-info">
                <div class="component-name">${comp.name}</div>
                <div class="component-meta">
                    <div class="type-selector">
                        <span class="status-icon ${statusClass}">${statusIcon}</span>
                        <select class="type-select" data-component-id="${comp.id}">${selectOptions}</select>
                    </div>
                    <span class="confidence-badge ${confidenceClass}">${comp.isVerified ? 'Manual' : confidence + '%'}</span>
                    <span class="page-info">📄 ${comp.pageInfo?.pageName || 'Unknown'}</span>
                </div>
            </div>
            <div class="component-actions">
                <button class="btn-action navigate-btn" data-component-id="${comp.id}" data-page-name="${comp.pageInfo?.pageName || ''}" title="View in Figma">👁️</button>
            </div>
        `;

        return item;
    }

    /**
     * Create select options for component type dropdown
     */
    createSelectOptions(selectedType) {
        let options = '';
        
        Object.keys(this.componentTypes).forEach(category => {
            options += `<optgroup label="${category}">`;
            this.componentTypes[category].forEach(type => {
                const isSelected = type === selectedType ? 'selected' : '';
                options += `<option value="${type}" ${isSelected}>${type}</option>`;
            });
            options += '</optgroup>';
        });

        const unknownSelected = selectedType === 'unknown' ? 'selected' : '';
        options += `<optgroup label="Other"><option value="unknown" ${unknownSelected}>unknown</option></optgroup>`;

        return options;
    }

    /**
     * Get filtered components based on search and filter
     */
    getFilteredComponents() {
        let filtered = this.scanResults;

        // Apply search filter
        if (this.searchQuery) {
            filtered = filtered.filter(comp => 
                comp.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
                comp.suggestedType.toLowerCase().includes(this.searchQuery.toLowerCase())
            );
        }

        // Apply category filter
        switch (this.currentFilter) {
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
     * Update component statistics in the stats bar
     */
    updateComponentStats() {
        const total = this.scanResults.length;
        const highConf = this.scanResults.filter(comp => comp.confidence >= 0.8 && !comp.isVerified).length;
        const lowConf = this.scanResults.filter(comp => (comp.confidence < 0.6 || comp.suggestedType === 'unknown') && !comp.isVerified).length;
        const verified = this.scanResults.filter(comp => comp.isVerified).length;

        if (this.elements.totalCount) this.elements.totalCount.textContent = total;
        if (this.elements.highConfCount) this.elements.highConfCount.textContent = highConf;
        if (this.elements.lowConfCount) this.elements.lowConfCount.textContent = lowConf;
        if (this.elements.verifiedCount) this.elements.verifiedCount.textContent = verified;
    }

    /**
     * Handle component type change
     */
    handleTypeChange(componentId, newType) {
        const component = this.scanResults.find(comp => comp.id === componentId);
        if (component) {
            component.suggestedType = newType;
            component.confidence = 1.0;
            component.isVerified = true;
            
            this.renderComponentList();
            this.updateComponentStats();
            
            MessageHandler.sendMessage({
                type: 'update-component-type',
                payload: { componentId, newType }
            });

            console.log(`✅ Updated component ${componentId} to type: ${newType}`);
        }
    }

    /**
     * Handle navigation to component in Figma
     */
    handleNavigation(componentId, pageName) {
        MessageHandler.sendMessage({
            type: 'navigate-to-component',
            componentId,
            pageName
        });

        console.log(`🧭 Navigating to component: ${componentId} on page: ${pageName}`);
    }

    /**
     * Handle component type updated from backend
     */
    handleComponentTypeUpdated(componentId, newType, componentName) {
        console.log(`✅ Component type updated: ${componentName} → ${newType}`);
        // The component was already updated in handleTypeChange, so no need to do anything else
    }

    /**
     * Generate LLM prompt for the design system
     */
    generateLLMPrompt() {
        MessageHandler.sendMessage({ type: 'generate-llm-prompt' });
        console.log('📋 Generating LLM prompt for design system');
    }

    /**
     * Handle generated LLM prompt
     */
    handleLLMPromptGenerated(prompt) {
        UIFramework.copyToClipboard(prompt)
            .then(() => {
                if (this.elements.scanStatusText) {
                    this.showScanStatus('📋 Prompt copied to clipboard!', 'success');
                }
            });
    }

    /**
     * Enable the generator tab after successful scan
     */
    enableGeneratorTab() {
        // Update state
        StateManager.setState('generatorTabEnabled', true);
        
        // Enable through tab manager if available
        if (window.tabManager) {
            window.tabManager.enableGeneratorTab();
        } else {
            // Fallback - directly enable the tab
            const generatorTab = document.getElementById('generatorTab');
            if (generatorTab) {
                generatorTab.disabled = false;
            }
        }

        console.log('✅ Generator tab enabled');
    }

    /**
     * Show scan status message
     */
    showScanStatus(message, type) {
        if (this.elements.scanStatusContainer) {
            const statusDiv = document.createElement('div');
            statusDiv.className = `status ${type}`;
            statusDiv.textContent = message;
            
            this.elements.scanStatusContainer.appendChild(statusDiv);
            
            // Remove after 3 seconds
            setTimeout(() => {
                if (statusDiv.parentNode) {
                    statusDiv.parentNode.removeChild(statusDiv);
                }
            }, 3000);
        }
    }

    /**
     * Get time ago string for display
     */
    getTimeAgo(timestamp) {
        if (!timestamp) return 'some time ago';
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes} minutes ago`;
        if (hours < 24) return `${hours} hours ago`;
        return `${days} days ago`;
    }

    /**
     * Get current scan results
     */
    getScanResults() {
        return this.scanResults;
    }

    /**
     * Get current filter state
     */
    getCurrentFilter() {
        return this.currentFilter;
    }

    /**
     * Get current search query
     */
    getSearchQuery() {
        return this.searchQuery;
    }

    /**
     * Reset all filters and search
     */
    resetFilters() {
        this.currentFilter = 'all';
        this.searchQuery = '';
        
        if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
        }
        
        // Reset filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === 'all') {
                btn.classList.add('active');
            }
        });
        
        this.renderComponentList();
    }

    /**
     * Add raw export button to the UI
     */
    addRawExportButton() {
        const scanBtn = this.elements.scanBtn;
        if (!scanBtn) return;

        // Create export button if it doesn't exist
        if (!this.elements.exportRawBtn) {
            const exportBtn = document.createElement('button');
            exportBtn.id = 'exportRawBtn';
            exportBtn.className = 'btn btn-secondary';
            exportBtn.innerHTML = '📥 Export Raw Data';
            exportBtn.style.display = 'none';
            exportBtn.style.marginLeft = '8px';
            exportBtn.title = 'Export raw scan results as JSON';
            exportBtn.setAttribute('aria-label', 'Export raw scan data as JSON file');
            
            // Insert after scan button
            scanBtn.parentNode.insertBefore(exportBtn, scanBtn.nextSibling);
            this.elements.exportRawBtn = exportBtn;
            
            // Add event listener
            exportBtn.addEventListener('click', () => this.exportRawScanData());
        }
    }

    /**
     * Export raw scan data as JSON file
     */
    exportRawScanData() {
        if (!this.scanResults || this.scanResults.length === 0) {
            this.showScanStatus('❌ No scan data available to export', 'error');
            return;
        }

        try {
            // Prepare export data with metadata
            const exportData = {
                metadata: {
                    exportedAt: new Date().toISOString(),
                    componentCount: this.scanResults.length,
                    exportVersion: '1.0',
                    source: 'Figma Design System Scanner'
                },
                components: this.scanResults
            };

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const filename = `design-system-raw-data-${timestamp}.json`;

            // Download the JSON file
            this.downloadJsonFile(exportData, filename);

            this.showScanStatus('✅ Raw data exported successfully', 'success');
            console.log(`📥 Exported ${this.scanResults.length} components to ${filename}`);
        } catch (error) {
            console.error('Export failed:', error);
            this.showScanStatus('❌ Export failed. Please try again.', 'error');
        }
    }

    /**
     * Download data as JSON file
     */
    downloadJsonFile(data, filename) {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL object
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    /**
     * Refresh the component display
     */
    refresh() {
        this.renderComponentList();
        this.updateComponentStats();
    }
}

// Export for backward compatibility - these functions can be called globally
window.scanDesignSystem = function() {
    window.designSystemUI?.scanDesignSystem();
};

window.rescanDesignSystem = function() {
    window.designSystemUI?.rescanDesignSystem();
};

window.generateLLMPrompt = function() {
    window.designSystemUI?.generateLLMPrompt();
};

// Helper function to enable generator tab (used by other modules)
window.enableGeneratorTab = function() {
    window.designSystemUI?.enableGeneratorTab();
};