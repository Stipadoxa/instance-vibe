// code.ts - COMPLETE MODULAR VERSION WITH VALIDATION ENGINE
import { SessionManager, SessionState, ComponentInfo } from './src/core/session-manager';
import { SessionService } from './src/core/session-service';
import { ComponentScanner, ScanSession } from './src/core/component-scanner';
import { FigmaRenderer } from './src/core/figma-renderer';
import { GeminiAPI, GeminiRequest } from './src/ai/gemini-api';
import { ValidationEngine, ValidationResult } from './src/core/validation-engine';

// Global validation engine instance
let validationEngine: ValidationEngine;

async function navigateToComponent(componentId: string, pageName?: string): Promise<void> {
    try {
        const node = await figma.getNodeByIdAsync(componentId);
        if (!node) {
            figma.notify("Component not found", { error: true });
            return;
        }
        if (pageName) {
            const targetPage = figma.root.children.find(p => p.name === pageName) as PageNode | undefined;
            if (targetPage && targetPage.id !== figma.currentPage.id) {
                figma.currentPage = targetPage;
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        figma.currentPage.selection = [node as SceneNode];
        figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
        figma.notify(`Navigated to: ${node.name}`, { timeout: 2000 });
    } catch (e) {
        figma.notify("Navigation error", { error: true });
        console.error("❌ Navigation error:", e);
    }
}

// ENHANCED: API-driven UI generation with validation
async function generateUIFromAPI(prompt: string, systemPrompt: string, enableValidation: boolean = true): Promise<{
  layoutData: any;
  validationResult?: ValidationResult;
  finalJSON: string;
  retryCount: number;
}> {
    try {
        const geminiAPI = await GeminiAPI.createFromStorage();
        if (!geminiAPI) {
            throw new Error("No API key found. Please configure your Gemini API key first.");
        }

        const request: GeminiRequest = {
            prompt,
            systemPrompt,
            temperature: 0.7
        };

        console.log("🤖 Calling Gemini API for UI generation...");
        const response = await geminiAPI.generateJSON(request);

        if (!response.success) {
            throw new Error(response.error || "API call failed");
        }

        if (!response.content) {
            throw new Error("No content received from API");
        }

        let finalJSON = response.content;
        let validationResult: ValidationResult | undefined;
        let retryCount = 0;

        // Validate and potentially retry
        if (enableValidation && validationEngine) {
            console.log("🔍 Validating generated JSON...");
            const validationData = await validationEngine.validateWithRetry(
                response.content, 
                prompt, 
                geminiAPI
            );
            
            validationResult = validationData.result;
            finalJSON = validationData.finalJSON;
            retryCount = validationData.retryCount;
            
            console.log(`📊 Validation complete: ${validationEngine.getValidationSummary(validationResult)}`);
            
            // Notify user about validation
            if (validationResult.isValid) {
                if (retryCount > 0) {
                    figma.notify(`✅ Generated with ${retryCount} auto-fixes applied`, { timeout: 3000 });
                }
            } else {
                const summary = validationEngine.getValidationSummary(validationResult);
                figma.notify(`⚠️ ${summary}`, { timeout: 4000 });
            }
        }

        // Parse final JSON
        const layoutData = JSON.parse(finalJSON);
        
        return { layoutData, validationResult, finalJSON, retryCount };

    } catch (error) {
        console.error("❌ API-driven generation failed:", error);
        throw error;
    }
}

// UPDATED: initializeSession with new SessionService
async function initializeSession() {
  console.log("🔄 Initializing session...");
  
  try {
    // Initialize validation engine
    validationEngine = new ValidationEngine({
      enableAIValidation: true,
      enableStructuralValidation: true,
      enableComponentValidation: true,
      qualityThreshold: 0.7,
      maxRetries: 2,
      autoFixEnabled: true
    });
    console.log("✅ Validation engine initialized");
    
    // Check for existing session using new SessionService
    const hasSession = await SessionService.hasCurrentSession();
    
    if (hasSession) {
      const currentSession = await SessionService.getCurrentSession();
      if (currentSession) {
        console.log("✅ Found active session for restoration");
        
        // Send session data to UI for modal display
        const sessionForUI = SessionService.formatSessionForUI(currentSession);
        figma.ui.postMessage({ 
          type: 'session-found', 
          session: sessionForUI,
          currentFileId: figma.fileKey || figma.root.id
        });
      }
    }
    
    // Load API key
    const savedApiKey = await figma.clientStorage.getAsync('geminiApiKey');
    if (savedApiKey) {
      console.log("✅ API key found in storage");
      figma.ui.postMessage({ 
        type: 'api-key-loaded', 
        payload: savedApiKey 
      });
    }
    
    // Load saved scan results
    const savedScan: ScanSession | undefined = await figma.clientStorage.getAsync('design-system-scan');
    const currentFileKey = figma.fileKey || figma.root.id;
    
    if (savedScan && savedScan.components && savedScan.components.length > 0) {
      if (savedScan.fileKey === currentFileKey) {
        console.log(`✅ Design system loaded: ${savedScan.components.length} components`);
        figma.ui.postMessage({ 
          type: 'saved-scan-loaded', 
          components: savedScan.components,
          scanTime: savedScan.scanTime 
        });
      } else {
        console.log("ℹ️ Scan from different file, clearing cache");
        await figma.clientStorage.setAsync('design-system-scan', null);
        await figma.clientStorage.setAsync('last-scan-results', null);
      }
    } else {
      console.log("ℹ️ No saved design system found");
    }
  } catch (error) {
    console.error("❌ Error loading session:", error);
  }
}

async function main() {
  console.log("🚀 AIDesigner plugin started");
  figma.showUI(__html__, { width: 400, height: 720 });
  
  await initializeSession();
  
  figma.ui.onmessage = async (msg: any) => {
    console.log("📨 Message from UI:", msg.type); 

    switch (msg.type) {
        case 'generate-ui-from-json':
            try {
                const layoutData = JSON.parse(msg.payload);
                const newFrame = await FigmaRenderer.generateUIFromDataDynamic(layoutData);
                if (newFrame) {
                    figma.ui.postMessage({ 
                        type: 'ui-generated-success', 
                        frameId: newFrame.id, 
                        generatedJSON: layoutData 
                    });
                }
            } catch (e: any) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                figma.notify("JSON parsing error: " + errorMessage, { error: true });
                figma.ui.postMessage({ type: 'ui-generation-error', error: errorMessage });
            }
            break;

        // ENHANCED: API-driven UI generation with validation
        case 'generate-ui-from-prompt':
            try {
                const { prompt, systemPrompt, enableValidation = true } = msg.payload;
                const generationResult = await generateUIFromAPI(prompt, systemPrompt, enableValidation);
                const newFrame = await FigmaRenderer.generateUIFromDataDynamic(generationResult.layoutData);
                
                if (newFrame) {
                    figma.ui.postMessage({ 
                        type: 'ui-generated-success', 
                        frameId: newFrame.id, 
                        generatedJSON: generationResult.layoutData,
                        validationResult: generationResult.validationResult,
                        retryCount: generationResult.retryCount
                    });
                }
            } catch (e: any) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                figma.notify("API generation error: " + errorMessage, { error: true });
                figma.ui.postMessage({ type: 'ui-generation-error', error: errorMessage });
            }
            break;

        case 'modify-existing-ui':
            try {
                const { modifiedJSON, frameId } = msg.payload;
                const modifiedFrame = await FigmaRenderer.modifyExistingUI(modifiedJSON, frameId);
                if (modifiedFrame) {
                    figma.ui.postMessage({ 
                        type: 'ui-modified-success', 
                        frameId: modifiedFrame.id, 
                        modifiedJSON: modifiedJSON 
                    });
                }
            } catch (e: any) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                figma.notify("Modification error: " + errorMessage, { error: true });
                figma.ui.postMessage({ type: 'ui-generation-error', error: errorMessage });
            }
            break;

        // ENHANCED: API-driven UI modification with validation
        case 'modify-ui-from-prompt':
            try {
                const { originalJSON, modificationRequest, systemPrompt, frameId, enableValidation = true } = msg.payload;
                
                const geminiAPI = await GeminiAPI.createFromStorage();
                if (!geminiAPI) {
                    throw new Error("No API key configured");
                }

                console.log("🔄 Modifying UI with API...");
                const response = await geminiAPI.modifyExistingUI(originalJSON, modificationRequest, systemPrompt);
                
                if (!response.success) {
                    throw new Error(response.error || "API modification failed");
                }

                let finalJSON = response.content || "{}";
                let validationResult: ValidationResult | undefined;
                let retryCount = 0;

                // Validate modification
                if (enableValidation && validationEngine) {
                    console.log("🔍 Validating modified JSON...");
                    const validationData = await validationEngine.validateWithRetry(
                        finalJSON, 
                        modificationRequest, 
                        geminiAPI
                    );
                    
                    validationResult = validationData.result;
                    finalJSON = validationData.finalJSON;
                    retryCount = validationData.retryCount;
                    
                    console.log(`📊 Modification validation: ${validationEngine.getValidationSummary(validationResult)}`);
                }

                const modifiedJSON = JSON.parse(finalJSON);
                const modifiedFrame = await FigmaRenderer.modifyExistingUI(modifiedJSON, frameId);
                
                if (modifiedFrame) {
                    figma.ui.postMessage({ 
                        type: 'ui-modified-success', 
                        frameId: modifiedFrame.id, 
                        modifiedJSON: modifiedJSON,
                        validationResult: validationResult,
                        retryCount: retryCount
                    });
                }
            } catch (e: any) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                figma.notify("API modification error: " + errorMessage, { error: true });
                figma.ui.postMessage({ type: 'ui-generation-error', error: errorMessage });
            }
            break;

        // NEW: Standalone JSON validation
        case 'validate-json':
            try {
                const { jsonString, originalPrompt } = msg.payload;
                
                if (!validationEngine) {
                    throw new Error("Validation engine not initialized");
                }
                
                const validationResult = await validationEngine.validateJSON(jsonString, originalPrompt);
                const summary = validationEngine.getValidationSummary(validationResult);
                
                figma.ui.postMessage({ 
                    type: 'validation-result', 
                    result: validationResult,
                    summary: summary
                });
                
                figma.notify(summary, { 
                    timeout: 3000,
                    error: !validationResult.isValid 
                });
                
            } catch (e: any) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                figma.notify("Validation error: " + errorMessage, { error: true });
                figma.ui.postMessage({ type: 'validation-error', error: errorMessage });
            }
            break;

        // NEW: Update validation settings
        case 'update-validation-config':
            try {
                const newConfig = msg.payload;
                if (validationEngine) {
                    validationEngine.updateConfig(newConfig);
                    figma.ui.postMessage({ type: 'validation-config-updated' });
                    figma.notify("Validation settings updated", { timeout: 2000 });
                }
            } catch (e: any) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                figma.notify("Config update error: " + errorMessage, { error: true });
            }
            break;

        // Test API connection
        case 'test-api-connection':
            try {
                const geminiAPI = await GeminiAPI.createFromStorage();
                if (!geminiAPI) {
                    figma.ui.postMessage({ 
                        type: 'api-test-result', 
                        success: false, 
                        error: "No API key found" 
                    });
                    return;
                }

                console.log("🧪 Testing API connection...");
                const isConnected = await geminiAPI.testConnection();
                
                figma.ui.postMessage({ 
                    type: 'api-test-result', 
                    success: isConnected,
                    error: isConnected ? null : "Connection test failed"
                });
                
                if (isConnected) {
                    figma.notify("✅ API connection successful!", { timeout: 2000 });
                } else {
                    figma.notify("❌ API connection failed", { error: true });
                }
            } catch (e: any) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                figma.ui.postMessage({ 
                    type: 'api-test-result', 
                    success: false, 
                    error: errorMessage 
                });
            }
            break;

        // Session management handlers - Updated to use SessionService
        case 'restore-session':
            try {
                const sessionData = msg.payload;
                
                // Restore session using SessionService
                await SessionService.saveSession({
                    designState: sessionData.designState,
                    scanResults: sessionData.scanResults || [],
                    currentTab: sessionData.currentTab || 'design-system',
                    currentPlatform: sessionData.currentPlatform || 'mobile'
                });
                
                figma.ui.postMessage({ 
                    type: 'session-restored', 
                    designState: sessionData.designState,
                    scanData: sessionData.scanResults || []
                });
                figma.notify("Session restored!", { timeout: 2000 });
                
            } catch (e: any) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                figma.notify("Session restore error: " + errorMessage, { error: true });
            }
            break;

        case 'clear-current-session':
            try {
                await SessionService.clearCurrentSession();
                figma.ui.postMessage({ type: 'session-cleared' });
                figma.notify("Session cleared", { timeout: 1500 });
            } catch (error) {
                console.error("❌ Error clearing session:", error);
                figma.notify("Failed to clear session", { error: true });
            }
            break;

        case 'get-all-sessions':
            try {
                const allSessions = await SessionService.getAllSessions();
                const formattedSessions = allSessions.map(session => 
                    SessionService.formatSessionForUI(session)
                );
                
                figma.ui.postMessage({ 
                    type: 'all-sessions-loaded', 
                    sessions: formattedSessions,
                    currentFileId: figma.fileKey || figma.root.id
                });
            } catch (error) {
                console.error("❌ Error getting all sessions:", error);
                figma.ui.postMessage({ type: 'all-sessions-loaded', sessions: [] });
            }
            break;

        case 'delete-session':
            try {
                const fileId = msg.payload;
                await SessionService.deleteSession(fileId);
                figma.ui.postMessage({ type: 'session-deleted', fileId: fileId });
                figma.notify("Session deleted", { timeout: 1500 });
            } catch (error) {
                console.error("❌ Error deleting session:", error);
                figma.notify("Failed to delete session", { error: true });
            }
            break;

        case 'save-current-session':
            try {
                const { designState, scanData, currentTab, currentPlatform } = msg.payload;
                
                await SessionService.saveSession({
                    designState: designState,
                    scanResults: scanData || [],
                    currentTab: currentTab || 'design-system',
                    currentPlatform: currentPlatform || 'mobile'
                });
                
                console.log("✅ Session saved successfully");
            } catch (error) {
                console.error("❌ Error saving session:", error);
            }
            break;

        case 'scan-design-system':
            try {
                const components = await ComponentScanner.scanDesignSystem();
                await ComponentScanner.saveLastScanResults(components);
                
                // Auto-save session with scan results
                await SessionService.saveSession({
                    scanResults: components,
                    designState: {
                        history: ['Design system scanned']
                    }
                });
                
                figma.ui.postMessage({ type: 'scan-results', components });
            } catch (e) {
                figma.notify("Scanning error", { error: true });
            }
            break;

        case 'generate-llm-prompt':
            const scanResultsForPrompt: ComponentInfo[] | undefined = await figma.clientStorage.getAsync('last-scan-results');
            if (scanResultsForPrompt?.length) {
                const llmPrompt = ComponentScanner.generateLLMPrompt(scanResultsForPrompt);
                figma.ui.postMessage({ type: 'llm-prompt-generated', prompt: llmPrompt });
            } else {
                figma.notify("Scan components first", { error: true });
            }
            break;

        case 'update-component-type':
            const { componentId, newType } = msg.payload;
            try {
                const scanResults: ComponentInfo[] | undefined = await figma.clientStorage.getAsync('last-scan-results');
                if (scanResults && Array.isArray(scanResults)) {
                    let componentName = '';
                    const updatedResults = scanResults.map(comp => {
                        if (comp.id === componentId) {
                            componentName = comp.name;
                            return { ...comp, suggestedType: newType, confidence: 1.0 };
                        }
                        return comp;
                    });
                    await ComponentScanner.saveLastScanResults(updatedResults);
                    figma.ui.postMessage({ type: 'component-type-updated', componentId, newType, componentName });
                }
            } catch (e) {
                figma.notify("Error updating type", { error: true });
            }
            break;

        case 'navigate-to-component':
            await navigateToComponent(msg.componentId, msg.pageName);
            break;
        
        case 'save-api-key':
            try {
                await figma.clientStorage.setAsync('geminiApiKey', msg.payload);
                figma.ui.postMessage({ type: 'api-key-saved' });
            } catch (e) {
                console.error("❌ Error saving API key:", e);
                figma.notify("Error saving API key", { error: true });
            }
            break;

        case 'get-api-key':
            try {
                const key = await figma.clientStorage.getAsync('geminiApiKey');
                if (key) {
                    figma.ui.postMessage({ type: 'api-key-found', payload: key });
                } else {
                    figma.ui.postMessage({ type: 'api-key-not-found' });
                }
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                figma.ui.postMessage({ type: 'api-key-error', payload: errorMessage });
            }
            break;
        
        case 'get-saved-scan':
            try {
                const savedScan: ScanSession | undefined = await figma.clientStorage.getAsync('design-system-scan');
                if (savedScan && savedScan.components && savedScan.fileKey === figma.root.id) {
                    figma.ui.postMessage({ 
                        type: 'saved-scan-loaded', 
                        components: savedScan.components,
                        scanTime: savedScan.scanTime 
                    });
                } else {
                    figma.ui.postMessage({ type: 'no-saved-scan' });
                }
            } catch (error) {
                console.error("❌ Error loading saved scan:", error);
                figma.ui.postMessage({ type: 'no-saved-scan' });
            }
            break;

        case 'clear-storage':
            try {
                await figma.clientStorage.setAsync('design-system-scan', null);
                await figma.clientStorage.setAsync('last-scan-results', null);
                await figma.clientStorage.setAsync('geminiApiKey', null);
                
                // Clear all sessions using new SessionService
                await SessionService.clearAllSessions();
                
                figma.notify("Storage cleared");
            } catch (error) {
                console.error("Error clearing storage:", error);
            }
            break;

        case 'cancel':
            figma.closePlugin();
            break;
            
        default:
            // Ignore unknown messages
    }
  };
  console.log("✅ Plugin fully initialized with complete modular architecture");
}

main().catch(err => {
    console.error("❌ Unhandled error:", err);
    figma.closePlugin("A critical error occurred.");
});