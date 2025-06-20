// src/ui/features/ai-generator-ui.js
// AI Generator UI functionality for AIDesigner

import { MessageHandler } from '../message-handler.js';
import { UIFramework } from '../ui-framework.js';
import { StateManager } from '../state-manager.js';

export class AIGeneratorUI {
    constructor() {
        // Core state
        this.lastGeneratedJSON = null;
        this.promptGenerator = null;
        this.selectedImage = null;
        this.currentPlatform = 'mobile';
        this.scanResults = [];
        
        // Design iteration state
        this.designState = {
            original: null,
            current: null,
            history: [],
            frameId: null,
            isIterating: false
        };

        // DOM elements
        this.elements = {
            // Main UI elements
            userPrompt: null,
            generateBtn: null,
            contextBar: null,
            currentContext: null,
            resetBtn: null,
            generationStatus: null,
            
            // Platform toggle
            mobileToggle: null,
            desktopToggle: null,
            
            // Image upload
            imageUploadArea: null,
            imageInput: null,
            imagePreview: null,
            previewImg: null,
            uploadPrompt: null,
            
            // Iteration mode
            iterationContext: null,
            currentDesignName: null,
            modHistory: null,
            userPromptLabel: null,
            
            // JSON debug
            jsonInput: null,
            jsonOutput: null,
            jsonDebugSection: null
        };

        this.initialize();
    }

    /**
     * Initialize AI Generator UI
     */
    initialize() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupElements());
        } else {
            this.setupElements();
        }

        this.registerMessageHandlers();
        this.initializePromptGenerator();
    }

    /**
     * Setup DOM elements and event listeners
     */
    setupElements() {
        this.elements = {
            // Main UI elements
            userPrompt: document.getElementById('userPrompt'),
            generateBtn: document.getElementById('generateBtn'),
            contextBar: document.getElementById('contextBar'),
            currentContext: document.getElementById('currentContext'),
            resetBtn: document.getElementById('resetBtn'),
            generationStatus: document.getElementById('generationStatus'),
            
            // Platform toggle
            mobileToggle: document.getElementById('mobile-toggle'),
            desktopToggle: document.getElementById('desktop-toggle'),
            
            // Image upload
            imageUploadArea: document.getElementById('imageUploadArea'),
            imageInput: document.getElementById('imageInput'),
            imagePreview: document.getElementById('imagePreview'),
            previewImg: document.getElementById('previewImg'),
            uploadPrompt: document.getElementById('uploadPrompt'),
            
            // Iteration mode
            iterationContext: document.getElementById('iterationContext'),
            currentDesignName: document.getElementById('currentDesignName'),
            modHistory: document.getElementById('modHistory'),
            userPromptLabel: document.getElementById('userPromptLabel'),
            
            // JSON debug
            jsonInput: document.getElementById('jsonInput'),
            jsonOutput: document.getElementById('jsonOutput'),
            jsonDebugSection: document.getElementById('jsonDebugSection')
        };

        this.setupEventListeners();
        this.setupImageUploadListeners();
        this.setupPlatformToggle();
        console.log('✅ AI Generator UI initialized');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Main generate button
        if (this.elements.generateBtn) {
            this.elements.generateBtn.addEventListener('click', () => this.generateWithGemini());
        }

        // Reset/start fresh button
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', () => this.startFresh());
        }

        // Manual JSON generation
        const manualBtn = document.querySelector('[onclick="generateFromJSON()"]');
        if (manualBtn) {
            manualBtn.removeAttribute('onclick');
            manualBtn.addEventListener('click', () => this.generateFromJSON());
        }

        // JSON debug buttons
        const copyBtn = document.querySelector('[onclick="copyGeneratedJSON()"]');
        if (copyBtn) {
            copyBtn.removeAttribute('onclick');
            copyBtn.addEventListener('click', () => this.copyGeneratedJSON());
        }

        const toggleBtn = document.querySelector('[onclick="toggleJSONView()"]');
        if (toggleBtn) {
            toggleBtn.removeAttribute('onclick');
            toggleBtn.addEventListener('click', () => this.toggleJSONView());
        }

        // Iteration mode buttons
        const viewJSONBtn = document.querySelector('[onclick="viewCurrentDesignJSON()"]');
        if (viewJSONBtn) {
            viewJSONBtn.removeAttribute('onclick');
            viewJSONBtn.addEventListener('click', () => this.viewCurrentDesignJSON());
        }

        const resetToOriginalBtn = document.querySelector('[onclick="resetToOriginal()"]');
        if (resetToOriginalBtn) {
            resetToOriginalBtn.removeAttribute('onclick');
            resetToOriginalBtn.addEventListener('click', () => this.resetToOriginal());
        }

        // Clear image button
        const clearImageBtn = document.querySelector('[onclick="clearImageSelection()"]');
        if (clearImageBtn) {
            clearImageBtn.removeAttribute('onclick');
            clearImageBtn.addEventListener('click', () => this.clearImageSelection());
        }
    }

    /**
     * Setup platform toggle functionality
     */
    setupPlatformToggle() {
        if (this.elements.mobileToggle) {
            this.elements.mobileToggle.addEventListener('click', () => {
                this.setActivePlatform('mobile');
            });
        }

        if (this.elements.desktopToggle) {
            this.elements.desktopToggle.addEventListener('click', () => {
                this.setActivePlatform('desktop');
            });
        }

        // Set initial platform
        this.setActivePlatform('mobile');
    }

    /**
     * Set active platform and update UI
     */
    setActivePlatform(platform) {
        this.currentPlatform = platform;
        
        // Update button states
        if (this.elements.mobileToggle && this.elements.desktopToggle) {
            this.elements.mobileToggle.classList.remove('active');
            this.elements.desktopToggle.classList.remove('active');
            
            if (platform === 'mobile') {
                this.elements.mobileToggle.classList.add('active');
            } else {
                this.elements.desktopToggle.classList.add('active');
            }
        }
        
        console.log('Platform switched to:', platform);
    }

    /**
     * Setup image upload listeners (drag/drop and file input)
     */
    setupImageUploadListeners() {
        const area = this.elements.imageUploadArea;
        const input = this.elements.imageInput;
        
        if (area && input) {
            // Click to select file
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
                    this.handleImageSelection(files[0]);
                } else {
                    console.log('📝 No files dropped, ensuring selectedImage is null');
                    this.selectedImage = null;
                }
            });
            
            // File input change
            input.addEventListener('change', (e) => {
                console.log('🔍 File input change event fired');
                const files = e.target.files;
                console.log('🔍 Files count:', files.length);
                
                if (files.length > 0) {
                    console.log('📁 File selected:', files[0].name);
                    this.handleImageSelection(files[0]);
                } else {
                    console.log('❌ File dialog canceled, clearing selectedImage');
                    this.selectedImage = null;
                    console.log('✅ selectedImage after clearing:', this.selectedImage);
                }
            });
        }
    }

    /**
     * Initialize prompt generator
     */
    initializePromptGenerator() {
        try {
            console.log('🔍 DEBUG: About to create AIDesignerPromptGenerator');
            if (window.AIDesignerPromptGenerator) {
                this.promptGenerator = new window.AIDesignerPromptGenerator();
                console.log('🔍 DEBUG: Prompt generator created successfully:', !!this.promptGenerator);
            } else {
                console.error('❌ AIDesignerPromptGenerator not available');
            }
        } catch (error) {
            console.error('❌ ERROR creating prompt generator:', error);
        }
    }

    /**
     * Register message handlers for AI generator events
     */
    registerMessageHandlers() {
        if (window.messageHandler) {
            window.messageHandler.register('ui-generated-success', (msg) => {
                this.handleUIGeneratedSuccess(msg.generatedJSON, msg.frameId);
            });

            window.messageHandler.register('ui-modified-success', (msg) => {
                this.handleUIModifiedSuccess();
            });

            window.messageHandler.register('ui-generation-error', (msg) => {
                this.handleUIGenerationError(msg.error);
            });

            window.messageHandler.register('session-restored', (msg) => {
                this.handleSessionRestored(msg.designState, msg.scanData);
            });

            window.messageHandler.register('session-cleared', () => {
                this.startFresh();
            });
        }
    }

    /**
     * Main generation entry point
     */
    async generateWithGemini() {
        if (this.designState.isIterating) {
            await this.iterateOnDesign();
        } else {
            await this.generateNewDesign();
        }
    }

    /**
     * Generate new design from prompt/image
     */
    async generateNewDesign() {
        const userPrompt = this.elements.userPrompt?.value.trim() || '';
        const generateBtn = this.elements.generateBtn;
        
        // Robust image validation
        const hasValidImage = this.isValidImageSelected();
        console.log('🔍 Image validation:');
        console.log('  - selectedImage:', this.selectedImage);
        console.log('  - hasValidImage:', hasValidImage);
        
        if (!userPrompt && !hasValidImage) {
            this.showStatus('❌ Please describe the UI or upload a reference image', 'error');
            return;
        }
        
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.textContent = '🪄 Generating...';
        }
        
        this.showStatus('🤖 Gemini is generating UI...', 'info');

        try {
            const apiKey = await this.getApiKeyFromBackend();
            
            // Generate prompt with platform awareness
            const promptData = this.promptGenerator.generatePrompt(
                userPrompt, 
                this.scanResults, 
                [], 
                hasValidImage,
                this.currentPlatform
            );
            
            console.log('🔍 Using hasValidImage:', hasValidImage);
            console.log('🔍 Prompt type:', hasValidImage ? 'IMAGE ANALYSIS' : 'TEXT ONLY');
            
            // Pass actual image only if validation passes
            const imageToSend = hasValidImage ? this.selectedImage : null;
            const response = await this.callGeminiAPI(apiKey, promptData.fullPrompt, imageToSend);
            
            console.log('🔍 Raw LLM response:', response);
            console.log('🔍 Response length:', response.length);
            
            // AI Self-Check & Retry System Integration
            const basicValidation = this.validateAndFixJSONEnhanced(response);
            if (!basicValidation.isValid) {
                throw new Error(`JSON parsing failed: ${basicValidation.errors.join(', ')}`);
            }
            
            // Run AI validation on the parsed JSON
            const aiValidation = this.validateAIResponse(basicValidation.data, this.scanResults);
            let layoutData;
            
            if (aiValidation.isValid) {
                console.log('✅ First attempt passed AI validation');
                layoutData = basicValidation.data;
            } else {
                console.log('❌ AI validation failed, starting retry system...');
                console.log('Errors:', aiValidation.errors);
                
                try {
                    layoutData = await this.executeRetry(userPrompt, aiValidation, this.scanResults, 1);
                    this.showStatus('✅ Retry successful! UI improved and validated.', 'success');
                } catch (retryError) {
                    throw new Error(`AI validation and all retries failed: ${retryError.message}`);
                }
            }
            
            this.lastGeneratedJSON = layoutData;

            // Show debug JSON
            if (this.elements.jsonDebugSection) {
                this.elements.jsonDebugSection.style.display = 'block';
            }
            if (this.elements.jsonOutput) {
                this.elements.jsonOutput.textContent = JSON.stringify(layoutData, null, 2);
            }

            this.showStatus('✨ Creating UI in Figma...', 'success');
            MessageHandler.sendMessage({
                type: 'generate-ui-from-json',
                payload: JSON.stringify(layoutData)
            });
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.showStatus(`❌ Error: ${errorMessage}`, 'error');
        } finally {
            if (generateBtn) {
                generateBtn.disabled = false;
                generateBtn.textContent = '🪄 Generate UI';
            }
        }
    }

    /**
     * Iterate on existing design with modifications
     */
    async iterateOnDesign() {
        const userPrompt = this.elements.userPrompt?.value.trim() || '';
        const generateBtn = this.elements.generateBtn;

        if (!userPrompt) {
            this.showStatus('❌ Please describe the changes you want to make.', 'error');
            return;
        }

        // Debug image state verification
        console.log('🔍 Before generating modification prompt:');
        console.log('  - selectedImage:', this.selectedImage);
        console.log('  - !!selectedImage:', !!this.selectedImage);
        console.log('  - isValidImageSelected():', this.isValidImageSelected());
        console.log('  - Should use modification prompt (not image prompt)');

        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.textContent = '🪄 Applying...';
        }
        
        this.showStatus('🤖 Gemini is analyzing your changes...', 'info');

        try {
            const apiKey = await this.getApiKeyFromBackend();
            
            // Use generateModificationPrompt directly with platform support
            const promptData = this.promptGenerator.generateModificationPrompt(
                userPrompt, 
                this.designState.current, 
                this.scanResults, 
                this.currentPlatform
            );
            console.log('✅ Using modification prompt with platform:', this.currentPlatform);
            
            const response = await this.callGeminiAPI(apiKey, promptData.fullPrompt, null);
            
            // AI Self-Check & Retry System for Modifications
            const basicValidation = this.validateAndFixJSONEnhanced(response);
            if (!basicValidation.isValid) {
                throw new Error(`JSON parsing failed: ${basicValidation.errors.join(', ')}`);
            }
            
            // Run AI validation on the modification
            const aiValidation = this.validateAIResponse(basicValidation.data, this.scanResults);
            let validatedData;
            
            if (aiValidation.isValid) {
                console.log('✅ Modification passed AI validation on first attempt');
                validatedData = basicValidation.data;
            } else {
                console.log('❌ Modification validation failed, starting retry system...');
                try {
                    validatedData = await this.executeRetry(userPrompt, aiValidation, this.scanResults, 1);
                    this.showStatus('✅ Modification retry successful! Changes validated.', 'success');
                } catch (retryError) {
                    throw new Error(`Modification validation failed: ${retryError.message}`);
                }
            }
            
            const modifiedJSON = validatedData;
            this.lastGeneratedJSON = modifiedJSON;

            // Update state
            this.designState.current = modifiedJSON;
            this.designState.history.push(userPrompt);
            this.updateModificationHistory();
            this.saveCurrentSession();

            // Display debug JSON
            if (this.elements.jsonDebugSection) {
                this.elements.jsonDebugSection.style.display = 'block';
            }
            if (this.elements.jsonOutput) {
                this.elements.jsonOutput.textContent = JSON.stringify(modifiedJSON, null, 2);
            }

            // Send to backend for in-place update
            MessageHandler.sendMessage({
                type: 'modify-existing-ui',
                payload: {
                    modifiedJSON: modifiedJSON,
                    frameId: this.designState.frameId
                }
            });

            if (this.elements.userPrompt) {
                this.elements.userPrompt.value = '';
            }
            this.showStatus('✅ Changes applied successfully!', 'success');

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.showStatus(`❌ Error: ${errorMessage}`, 'error');
        } finally {
            if (generateBtn) {
                generateBtn.disabled = false;
                generateBtn.textContent = '🪄 Apply Changes';
            }
        }
    }

    /**
     * Generate UI from manual JSON input
     */
    generateFromJSON() {
        const jsonInput = this.elements.jsonInput;
        if (!jsonInput || !jsonInput.value.trim()) {
            this.showStatus('Please paste JSON data', 'error');
            return;
        }
        
        // Manual generation always starts a fresh session
        this.startFresh(); 
        MessageHandler.sendMessage({
            type: 'generate-ui-from-json',
            payload: jsonInput.value.trim()
        });
    }

    /**
     * Start fresh - reset to new design mode
     */
    startFresh() {
        // Reset state object
        this.designState = {
            original: null,
            current: null,
            history: [],
            frameId: null,
            isIterating: false
        };

        // Force clear selectedImage
        this.selectedImage = null;
        console.log('🔄 startFresh called, selectedImage reset to:', this.selectedImage);

        // Update UI elements
        if (this.elements.iterationContext) {
            this.elements.iterationContext.style.display = 'none';
        }
        if (this.elements.userPromptLabel) {
            this.elements.userPromptLabel.textContent = 'Describe the UI you want to create:';
        }
        if (this.elements.userPrompt) {
            this.elements.userPrompt.placeholder = 'create a login form with email and password fields...';
            this.elements.userPrompt.value = '';
        }
        if (this.elements.currentContext) {
            this.elements.currentContext.textContent = 'Ready for new UI';
        }
        if (this.elements.generateBtn) {
            this.elements.generateBtn.textContent = '🪄 Generate UI';
        }
        if (this.elements.imageUploadArea) {
            this.elements.imageUploadArea.style.display = 'block';
        }

        this.clearStatus();
        this.clearImageSelection();
    }

    /**
     * Enter iteration mode after successful generation
     */
    enterIterationMode(generatedJSON, frameId) {
        this.designState.original = JSON.parse(JSON.stringify(generatedJSON));
        this.designState.current = generatedJSON;
        this.designState.frameId = frameId;
        this.designState.isIterating = true;
        this.designState.history = ["Original design generated."];

        // Save session state
        this.saveCurrentSession();

        // Update UI
        if (this.elements.currentDesignName) {
            this.elements.currentDesignName.textContent = generatedJSON.layoutContainer?.name || 'Generated UI';
        }
        this.updateModificationHistory();
        
        if (this.elements.iterationContext) {
            this.elements.iterationContext.style.display = 'block';
        }
        if (this.elements.userPromptLabel) {
            this.elements.userPromptLabel.textContent = 'Describe the changes you want to make:';
        }
        if (this.elements.userPrompt) {
            this.elements.userPrompt.placeholder = 'e.g., "add a forgot password link" or "change the button to secondary"';
        }
        if (this.elements.generateBtn) {
            this.elements.generateBtn.textContent = '🪄 Apply Changes';
        }
        
        // Hide image upload during iteration to avoid confusion
        if (this.elements.imageUploadArea) {
            this.elements.imageUploadArea.style.display = 'none';
        }
    }

    /**
     * Update modification history display
     */
    updateModificationHistory() {
        const historyList = this.elements.modHistory;
        if (historyList && this.designState.history) {
            historyList.innerHTML = this.designState.history
                .map(item => `<li>${item}</li>`)
                .join('');
        }
    }

    /**
     * Reset to original generated design
     */
    async resetToOriginal() {
        if (!this.designState.isIterating || !this.designState.original) return;
        
        this.showStatus('🔄 Resetting to original design...', 'info');
        
        // Update state
        this.designState.current = JSON.parse(JSON.stringify(this.designState.original));
        this.designState.history = ["Original design generated."];
        this.updateModificationHistory();
        this.saveCurrentSession();

        // Send message to backend to re-render the original JSON
        MessageHandler.sendMessage({
            type: 'modify-existing-ui',
            payload: {
                modifiedJSON: this.designState.current,
                frameId: this.designState.frameId
            }
        });
    }

    /**
     * View current design JSON in debug view
     */
    viewCurrentDesignJSON() {
        if (!this.designState.current) return;
        
        this.lastGeneratedJSON = this.designState.current;
        
        if (this.elements.jsonOutput && this.elements.jsonDebugSection) {
            this.elements.jsonOutput.textContent = JSON.stringify(this.lastGeneratedJSON, null, 2);
            this.elements.jsonDebugSection.style.display = 'block';
            this.elements.jsonOutput.style.display = 'block';
        }
    }

    /**
     * Copy generated JSON to clipboard
     */
    copyGeneratedJSON() {
        if (this.lastGeneratedJSON) {
            UIFramework.copyToClipboard(JSON.stringify(this.lastGeneratedJSON, null, 2))
                .then(() => this.showStatus('📋 JSON copied to clipboard!', 'success'));
        }
    }

    /**
     * Toggle JSON debug view visibility
     */
    toggleJSONView() {
        if (this.elements.jsonOutput) {
            const isVisible = this.elements.jsonOutput.style.display !== 'none';
            this.elements.jsonOutput.style.display = isVisible ? 'none' : 'block';
        }
    }

    /**
     * Validate image file type and size
     */
    validateImageFile(file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const maxSize = 4 * 1024 * 1024; // 4MB
        
        if (!validTypes.includes(file.type)) {
            this.showStatus(`❌ Invalid file type. Please use JPG, PNG, WEBP, or GIF.`, 'error');
            return false;
        }
        
        if (file.size > maxSize) {
            this.showStatus(`❌ File is too large. Maximum size is 4MB.`, 'error');
            return false;
        }
        
        return true;
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
     * Handle image selection from upload
     */
    async handleImageSelection(file) {
        if (!this.validateImageFile(file)) {
            return;
        }
        
        try {
            const base64 = await this.fileToBase64(file);
            this.selectedImage = {
                base64: base64,
                type: file.type,
                name: file.name
            };
            
            if (this.elements.previewImg) {
                this.elements.previewImg.src = `data:${file.type};base64,${base64}`;
            }
            if (this.elements.imagePreview) {
                this.elements.imagePreview.style.display = 'flex';
            }
            if (this.elements.uploadPrompt) {
                this.elements.uploadPrompt.style.display = 'none';
            }
            if (this.elements.imageUploadArea) {
                this.elements.imageUploadArea.classList.add('has-image');
            }
            
            this.showStatus(`✅ Image "${file.name}" loaded successfully.`, 'success');
        } catch (error) {
            console.error('Error processing image:', error);
            this.showStatus('❌ Could not process the image file.', 'error');
            this.clearImageSelection();
        }
    }

    /**
     * Clear selected image
     */
    clearImageSelection() {
        this.selectedImage = null;
        
        if (this.elements.imageInput) {
            this.elements.imageInput.value = '';
        }
        if (this.elements.imagePreview) {
            this.elements.imagePreview.style.display = 'none';
        }
        if (this.elements.uploadPrompt) {
            this.elements.uploadPrompt.style.display = 'block';
        }
        if (this.elements.imageUploadArea) {
            this.elements.imageUploadArea.classList.remove('has-image');
        }
        
        this.clearStatus();
    }

    /**
     * Check if valid image is selected
     */
    isValidImageSelected() {
        return this.selectedImage && 
               this.selectedImage.base64 && 
               this.selectedImage.type && 
               this.selectedImage.base64.length > 0;
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
     * Call Gemini API with prompt and optional image
     */
    async callGeminiAPI(apiKey, fullPrompt, image) {
        this.showStatus('🤖 Calling Gemini API...', 'info');
        
        const apiParts = [{ text: fullPrompt }];
        if (image) {
            apiParts.push({ inlineData: { mimeType: image.type, data: image.base64 } });
        }
        
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: apiParts }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 8192,
                    responseMimeType: "application/json",
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'API Error');
        }

        const data = await response.json();
        if (!data.candidates || !data.candidates[0].content.parts[0].text) {
            throw new Error('Invalid response structure from Gemini API.');
        }
        
        return data.candidates[0].content.parts[0].text;
    }

    /**
     * Validate and fix JSON with enhanced error handling
     */
    validateAndFixJSONEnhanced(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            return { isValid: true, data: parsed, errors: [] };
        } catch (e) {
            console.log("🔧 JSON parsing failed, attempting fixes...");
            
            let fixed = jsonString.trim();
            fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
            fixed = fixed.replace(/}(\s*){/g, '},\n$1{');
            
            if (fixed.includes('[') && !fixed.includes(']')) {
                fixed = fixed + ']';
            }
            
            const openBraces = (fixed.match(/{/g) || []).length;
            const closeBraces = (fixed.match(/}/g) || []).length;
            if (openBraces > closeBraces) {
                fixed = fixed + '}';
            }
            
            fixed = fixed.replace(/"variants":\s*{[^}]*$/, '"variants": {}');
            
            try {
                const parsed = JSON.parse(fixed);
                console.log("✅ JSON fixed successfully!");
                return { isValid: true, data: parsed, errors: [] };
            } catch (e2) {
                console.error("❌ Could not fix JSON:", e2.message);
                return { 
                    isValid: false, 
                    data: null, 
                    errors: [e.message, "Auto-fix failed: " + e2.message] 
                };
            }
        }
    }

    /**
     * Validate AI response quality
     */
    validateAIResponse(jsonData, scanResults) {
        const validationResult = {
            isValid: true,
            errors: [],
            warnings: [],
            severity: 'none'
        };
        
        console.log('🔍 Starting AI response validation...');
        
        // Basic Structure Validation
        if (!jsonData.layoutContainer && !jsonData.items) {
            validationResult.isValid = false;
            validationResult.errors.push('Missing required layoutContainer or items');
            validationResult.severity = 'critical';
            return validationResult;
        }
        
        if (!jsonData.items || !Array.isArray(jsonData.items)) {
            validationResult.isValid = false;
            validationResult.errors.push('Missing or invalid items array');
            validationResult.severity = 'critical';
            return validationResult;
        }
        
        // Component ID Validation
        const availableComponents = new Set();
        if (scanResults && Array.isArray(scanResults)) {
            scanResults.forEach(comp => availableComponents.add(comp.id));
        }
        
        let invalidComponentCount = 0;
        jsonData.items.forEach((item, index) => {
            if (item.type && !item.type.startsWith('native-') && !item.type.startsWith('layoutContainer')) {
                if (!item.componentNodeId) {
                    validationResult.errors.push(`Item ${index}: Missing componentNodeId for type "${item.type}"`);
                    invalidComponentCount++;
                } else if (!availableComponents.has(item.componentNodeId)) {
                    validationResult.errors.push(`Item ${index}: Component ID "${item.componentNodeId}" not found in design system`);
                    invalidComponentCount++;
                }
            }
        });
        
        // Set severity based on component issues
        if (invalidComponentCount > 0) {
            validationResult.isValid = false;
            if (invalidComponentCount >= jsonData.items.length * 0.5) {
                validationResult.severity = 'critical';
            } else if (invalidComponentCount >= jsonData.items.length * 0.3) {
                validationResult.severity = 'high';
            } else {
                validationResult.severity = 'medium';
            }
        }
        
        console.log(`✅ Validation complete. Valid: ${validationResult.isValid}, Severity: ${validationResult.severity}`);
        return validationResult;
    }

    /**
     * Execute retry logic for failed validations
     */
    async executeRetry(originalPrompt, validationResult, scanResults, attemptNumber, maxRetries = 3) {
        if (attemptNumber > maxRetries) {
            throw new Error(`Failed after ${maxRetries} attempts. Last errors: ${validationResult.errors.join(', ')}`);
        }
        
        this.showStatus(`🔄 Improving result (attempt ${attemptNumber}/${maxRetries})...`, 'info');
        
        const retryData = this.createRetryPrompt(originalPrompt, validationResult, scanResults, attemptNumber);
        
        try {
            const apiKey = await this.getApiKeyFromBackend();
            const response = await this.callGeminiAPI(apiKey, retryData.prompt, this.selectedImage);
            
            const validation = this.validateAndFixJSONEnhanced(response);
            if (!validation.isValid) {
                throw new Error(`JSON parsing failed on retry ${attemptNumber}`);
            }
            
            const aiValidation = this.validateAIResponse(validation.data, scanResults);
            if (aiValidation.isValid) {
                console.log(`✅ Retry ${attemptNumber} successful!`);
                return validation.data;
            } else {
                console.log(`❌ Retry ${attemptNumber} failed validation, trying again...`);
                return await this.executeRetry(originalPrompt, aiValidation, scanResults, attemptNumber + 1, maxRetries);
            }
            
        } catch (error) {
            console.log(`❌ Retry ${attemptNumber} failed:`, error.message);
            return await this.executeRetry(originalPrompt, validationResult, scanResults, attemptNumber + 1, maxRetries);
        }
    }

    /**
     * Create retry prompt with escalating strategies
     */
    createRetryPrompt(originalPrompt, validationResult, scanResults, attemptNumber) {
        console.log(`🔄 Creating retry prompt (attempt ${attemptNumber})`);
        
        let retryStrategy = '';
        let enhancedPrompt = originalPrompt;
        
        if (attemptNumber === 1) {
            // First retry: Specific error fixes
            if (validationResult.errors.some(err => err.includes('Component ID') || err.includes('not found'))) {
                retryStrategy = 'COMPONENT_ID_FIX';
                enhancedPrompt += '\n\n// 🔧 COMPONENT ID CORRECTION NEEDED:\n';
                enhancedPrompt += '// The previous response used invalid component IDs.\n';
                enhancedPrompt += '// You MUST use ONLY the exact componentNodeId values from the design system list above.\n';
                enhancedPrompt += '// NEVER use placeholder IDs like "button_id" or "input_id".\n';
                
                if (scanResults && scanResults.length > 0) {
                    enhancedPrompt += '// Available component IDs:\n';
                    scanResults.slice(0, 5).forEach(comp => {
                        enhancedPrompt += `// - ${comp.suggestedType}: "${comp.id}"\n`;
                    });
                }
            }
            
            if (validationResult.errors.some(err => err.includes('Missing') && err.includes('layoutContainer'))) {
                retryStrategy = 'STRUCTURE_FIX';
                enhancedPrompt += '\n\n// 🔧 STRUCTURE CORRECTION NEEDED:\n';
                enhancedPrompt += '// Your response must have BOTH "layoutContainer" and "items" at the top level.\n';
                enhancedPrompt += '// Follow this exact structure:\n';
                enhancedPrompt += '// {"layoutContainer": {...}, "items": [...]}\n';
            }
            
        } else if (attemptNumber === 2) {
            // Second retry: Simplified approach
            retryStrategy = 'SIMPLIFIED';
            enhancedPrompt = `Create a SIMPLIFIED version of: ${originalPrompt}
            
// 🎯 SIMPLIFIED GENERATION RULES:
// - Use ONLY basic components (button, input, text)
// - NO variants or complex properties
// - Keep layout simple with VERTICAL layoutMode
// - Maximum 3-4 items total
// - Use exact componentNodeId values from design system`;
            
        } else {
            // Third+ retry: Basic fallback
            retryStrategy = 'BASIC_FALLBACK';
            enhancedPrompt = `Create a basic UI layout with:
- 1 text element for title
- 1-2 input elements  
- 1 button element
- Simple vertical layout
- Use ONLY exact componentNodeId values from the available design system components`;
        }
        
        console.log(`📝 Retry strategy: ${retryStrategy}`);
        return {
            prompt: enhancedPrompt,
            strategy: retryStrategy,
            attemptNumber: attemptNumber
        };
    }

    /**
     * Save current session state
     */
    saveCurrentSession() {
        if (this.designState.isIterating) {
            MessageHandler.sendMessage({
                type: 'save-current-session',
                payload: {
                    designState: this.designState,
                    scanData: this.scanResults
                }
            });
        }
    }

    /**
     * Handle successful UI generation
     */
    handleUIGeneratedSuccess(generatedJSON, frameId) {
        this.clearStatus();
        this.enterIterationMode(generatedJSON, frameId);
        if (this.elements.userPrompt) {
            this.elements.userPrompt.value = '';
        }
    }

    /**
     * Handle successful UI modification
     */
    handleUIModifiedSuccess() {
        this.clearStatus();
        this.showStatus('✅ UI updated successfully!', 'success');
    }

    /**
     * Handle UI generation error
     */
    handleUIGenerationError(error) {
        this.showStatus(`❌ Generation error: ${error}`, 'error');
    }

    /**
     * Handle session restored from backend
     */
    handleSessionRestored(designState, scanData) {
        // Restore the design state from session
        this.designState = {
            original: designState.original,
            current: designState.current,
            history: [...designState.history],
            frameId: designState.frameId,
            isIterating: designState.isIterating
        };
        
        if (scanData) {
            this.scanResults = scanData;
        }
        
        if (this.designState.isIterating) {
            this.enterIterationMode(this.designState.current, this.designState.frameId);
            // Update history display
            this.designState.history = designState.history;
            this.updateModificationHistory();
        }
        
        this.showStatus('✅ Session restored successfully!', 'success');
    }

    /**
     * Update scan results
     */
    updateScanResults(scanResults) {
        this.scanResults = scanResults || [];
        console.log(`🔄 Updated scan results: ${this.scanResults.length} components`);
    }

    /**
     * Show status message
     */
    showStatus(message, type) {
        if (this.elements.generationStatus) {
            UIFramework.showStatus(this.elements.generationStatus.id, message, type);
        }
    }

    /**
     * Clear status message
     */
    clearStatus() {
        if (this.elements.generationStatus) {
            UIFramework.clearStatus(this.elements.generationStatus.id);
        }
    }

    /**
     * Debug image state (for troubleshooting)
     */
    debugImageState() {
        console.log('🔍 DEBUG IMAGE STATE:');
        console.log('  - selectedImage:', this.selectedImage);
        console.log('  - !!selectedImage:', !!this.selectedImage);
        console.log('  - typeof selectedImage:', typeof this.selectedImage);
        console.log('  - isValidImageSelected():', this.isValidImageSelected());
        
        const input = this.elements.imageInput;
        console.log('  - input.files.length:', input ? input.files.length : 'no input');
        console.log('  - input.value:', input ? input.value : 'no input');
    }

    /**
     * Get current state for debugging
     */
    getCurrentState() {
        return {
            designState: this.designState,
            selectedImage: this.selectedImage,
            currentPlatform: this.currentPlatform,
            scanResults: this.scanResults.length
        };
    }
}

// Export global functions for backward compatibility
window.generateWithGemini = function() {
    window.aiGeneratorUI?.generateWithGemini();
};

window.generateFromJSON = function() {
    window.aiGeneratorUI?.generateFromJSON();
};

window.startFresh = function() {
    window.aiGeneratorUI?.startFresh();
};

window.copyGeneratedJSON = function() {
    window.aiGeneratorUI?.copyGeneratedJSON();
};

window.toggleJSONView = function() {
    window.aiGeneratorUI?.toggleJSONView();
};

window.viewCurrentDesignJSON = function() {
    window.aiGeneratorUI?.viewCurrentDesignJSON();
};

window.resetToOriginal = function() {
    window.aiGeneratorUI?.resetToOriginal();
};

window.clearImageSelection = function() {
    window.aiGeneratorUI?.clearImageSelection();
};

window.setActivePlatform = function(platform) {
    window.aiGeneratorUI?.setActivePlatform(platform);
};

// Debug function for troubleshooting
window.debugImageState = function() {
    window.aiGeneratorUI?.debugImageState();
};