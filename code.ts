// code.ts - MAIN PLUGIN FILE WITH MODULAR IMPORTS
import { SessionManager, SessionState, ComponentInfo } from './src/core/session-manager';
import { ComponentScanner, ScanSession } from './src/core/component-scanner';
import { FigmaRenderer } from './src/core/figma-renderer';

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

// MODIFIED: initializeSession з підтримкою сесій
async function initializeSession() {
  console.log("🔄 Ініціалізація сесії...");
  
  try {
    // Очистити старі сесії
    await SessionManager.cleanupOldSessions();
    
    // Спробувати завантажити сесію для поточного файлу
    const savedSession = await SessionManager.loadSession();
    
    if (savedSession && savedSession.designState.isIterating) {
      console.log("✅ Знайдена активна сесія для відновлення");
      figma.ui.postMessage({ 
        type: 'session-found', 
        session: savedSession,
        currentFileId: figma.root.id
      });
    }
    
    // Завантажити API ключ
    const savedApiKey = await figma.clientStorage.getAsync('geminiApiKey');
    if (savedApiKey) {
      console.log("✅ API key found in storage");
      figma.ui.postMessage({ 
        type: 'api-key-loaded', 
        payload: savedApiKey 
      });
    }
    
    // Завантажити збережені результати сканування
    const savedScan: ScanSession | undefined = await figma.clientStorage.getAsync('design-system-scan');
    const currentFileKey = figma.root.id;
    
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

        // Session management handlers
        case 'restore-session':
            try {
                const sessionData = msg.payload;
                const success = await SessionManager.restoreSessionData(sessionData);
                if (success) {
                    figma.ui.postMessage({ 
                        type: 'session-restored', 
                        designState: sessionData.designState,
                        scanData: sessionData.scanData 
                    });
                    figma.notify("Сесію відновлено!", { timeout: 2000 });
                } else {
                    throw new Error("Failed to restore session");
                }
            } catch (e: any) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                figma.notify("Помилка відновлення сесії: " + errorMessage, { error: true });
            }
            break;

        case 'clear-current-session':
            try {
                await SessionManager.clearSession();
                figma.ui.postMessage({ type: 'session-cleared' });
                figma.notify("Сесію очищено", { timeout: 1500 });
            } catch (error) {
                console.error("❌ Error clearing session:", error);
            }
            break;

        case 'get-all-sessions':
            try {
                const allSessions = await SessionManager.getAllSessions();
                figma.ui.postMessage({ 
                    type: 'all-sessions-loaded', 
                    sessions: allSessions,
                    currentFileId: figma.root.id 
                });
            } catch (error) {
                console.error("❌ Error getting all sessions:", error);
                figma.ui.postMessage({ type: 'all-sessions-loaded', sessions: [] });
            }
            break;

        case 'delete-session':
            try {
                await SessionManager.clearSession(msg.payload);
                figma.ui.postMessage({ type: 'session-deleted', fileId: msg.payload });
            } catch (error) {
                console.error("❌ Error deleting session:", error);
            }
            break;

        case 'save-current-session':
            try {
                // This will be called from UI when designState changes
                await SessionManager.saveSession(msg.payload.designState, msg.payload.scanData);
            } catch (error) {
                console.error("❌ Error saving session:", error);
            }
            break;

        case 'scan-design-system':
            try {
                const components = await ComponentScanner.scanDesignSystem();
                await ComponentScanner.saveLastScanResults(components);
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
                await figma.clientStorage.setAsync(SessionManager['STORAGE_KEY'], null);
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
  console.log("✅ Plugin fully initialized");
}

main().catch(err => {
    console.error("❌ Unhandled error:", err);
    figma.closePlugin("A critical error occurred.");
});