"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __objRest = (source, exclude) => {
    var target = {};
    for (var prop in source)
      if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
        target[prop] = source[prop];
    if (source != null && __getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(source)) {
        if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
          target[prop] = source[prop];
      }
    return target;
  };

  // src/core/session-service.ts
  var SessionService = class {
    /**
     * Get current file information
     */
    static getCurrentFileInfo() {
      const fileKey = figma.fileKey || "unknown";
      const fileName = figma.root.name || "Untitled";
      return { fileId: fileKey, fileName };
    }
    /**
     * Save session data for current file
     */
    static async saveSession(sessionData) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
      try {
        const { fileId, fileName } = this.getCurrentFileInfo();
        const existingSession = await this.getSession(fileId);
        const updatedSession = {
          fileId,
          fileName,
          designState: {
            original: ((_a = sessionData.designState) == null ? void 0 : _a.original) || ((_b = existingSession == null ? void 0 : existingSession.designState) == null ? void 0 : _b.original) || null,
            current: ((_c = sessionData.designState) == null ? void 0 : _c.current) || ((_d = existingSession == null ? void 0 : existingSession.designState) == null ? void 0 : _d.current) || null,
            history: ((_e = sessionData.designState) == null ? void 0 : _e.history) || ((_f = existingSession == null ? void 0 : existingSession.designState) == null ? void 0 : _f.history) || [],
            frameId: ((_g = sessionData.designState) == null ? void 0 : _g.frameId) || ((_h = existingSession == null ? void 0 : existingSession.designState) == null ? void 0 : _h.frameId) || null,
            frameName: ((_i = sessionData.designState) == null ? void 0 : _i.frameName) || ((_j = existingSession == null ? void 0 : existingSession.designState) == null ? void 0 : _j.frameName) || "Unknown Frame",
            isIterating: ((_k = sessionData.designState) == null ? void 0 : _k.isIterating) || ((_l = existingSession == null ? void 0 : existingSession.designState) == null ? void 0 : _l.isIterating) || false
          },
          scanResults: sessionData.scanResults || (existingSession == null ? void 0 : existingSession.scanResults) || [],
          lastModified: Date.now(),
          currentTab: sessionData.currentTab || (existingSession == null ? void 0 : existingSession.currentTab) || "design-system",
          currentPlatform: sessionData.currentPlatform || (existingSession == null ? void 0 : existingSession.currentPlatform) || "mobile"
        };
        const storageKey = this.STORAGE_PREFIX + fileId;
        await figma.clientStorage.setAsync(storageKey, updatedSession);
        await this.updateAllSessionsIndex(fileId, updatedSession);
        console.log("\u2705 Session saved for file:", fileName);
      } catch (error) {
        console.error("\u274C Failed to save session:", error);
        throw error;
      }
    }
    /**
     * Get session data for specific file
     */
    static async getSession(fileId) {
      try {
        const targetFileId = fileId || this.getCurrentFileInfo().fileId;
        const storageKey = this.STORAGE_PREFIX + targetFileId;
        const sessionData = await figma.clientStorage.getAsync(storageKey);
        return sessionData || null;
      } catch (error) {
        console.error("\u274C Failed to get session:", error);
        return null;
      }
    }
    /**
     * Get current file session data
     */
    static async getCurrentSession() {
      const { fileId } = this.getCurrentFileInfo();
      return await this.getSession(fileId);
    }
    /**
     * Check if current file has a session
     */
    static async hasCurrentSession() {
      const session = await this.getCurrentSession();
      return session !== null && (session.scanResults.length > 0 || session.designState.history.length > 0 || session.designState.current !== null);
    }
    /**
     * Clear session for current file
     */
    static async clearCurrentSession() {
      try {
        const { fileId } = this.getCurrentFileInfo();
        const storageKey = this.STORAGE_PREFIX + fileId;
        await figma.clientStorage.deleteAsync(storageKey);
        await this.removeFromAllSessionsIndex(fileId);
        console.log("\u2705 Session cleared for current file");
      } catch (error) {
        console.error("\u274C Failed to clear session:", error);
        throw error;
      }
    }
    /**
     * Get all sessions across all files
     */
    static async getAllSessions() {
      try {
        const allSessionsIndex = await figma.clientStorage.getAsync(this.ALL_SESSIONS_KEY) || {};
        const sessions = [];
        for (const fileId of Object.keys(allSessionsIndex)) {
          const session = await this.getSession(fileId);
          if (session) {
            sessions.push(session);
          }
        }
        return sessions.sort((a, b) => b.lastModified - a.lastModified);
      } catch (error) {
        console.error("\u274C Failed to get all sessions:", error);
        return [];
      }
    }
    /**
     * Delete specific session
     */
    static async deleteSession(fileId) {
      try {
        const storageKey = this.STORAGE_PREFIX + fileId;
        await figma.clientStorage.deleteAsync(storageKey);
        await this.removeFromAllSessionsIndex(fileId);
        console.log("\u2705 Session deleted for file:", fileId);
      } catch (error) {
        console.error("\u274C Failed to delete session:", error);
        throw error;
      }
    }
    /**
     * Clear all sessions (used by "Clear All Data" function)
     */
    static async clearAllSessions() {
      try {
        const allSessions = await this.getAllSessions();
        for (const session of allSessions) {
          const storageKey = this.STORAGE_PREFIX + session.fileId;
          await figma.clientStorage.deleteAsync(storageKey);
        }
        await figma.clientStorage.deleteAsync(this.ALL_SESSIONS_KEY);
        console.log("\u2705 All sessions cleared");
      } catch (error) {
        console.error("\u274C Failed to clear all sessions:", error);
        throw error;
      }
    }
    /**
     * Update the index of all sessions
     */
    static async updateAllSessionsIndex(fileId, sessionData) {
      try {
        const allSessionsIndex = await figma.clientStorage.getAsync(this.ALL_SESSIONS_KEY) || {};
        allSessionsIndex[fileId] = {
          fileName: sessionData.fileName,
          lastModified: sessionData.lastModified
        };
        await figma.clientStorage.setAsync(this.ALL_SESSIONS_KEY, allSessionsIndex);
      } catch (error) {
        console.error("\u274C Failed to update sessions index:", error);
      }
    }
    /**
     * Remove file from all sessions index
     */
    static async removeFromAllSessionsIndex(fileId) {
      try {
        const allSessionsIndex = await figma.clientStorage.getAsync(this.ALL_SESSIONS_KEY) || {};
        delete allSessionsIndex[fileId];
        await figma.clientStorage.setAsync(this.ALL_SESSIONS_KEY, allSessionsIndex);
      } catch (error) {
        console.error("\u274C Failed to remove from sessions index:", error);
      }
    }
    /**
     * Format session data for UI display
     */
    static formatSessionForUI(session) {
      return {
        fileId: session.fileId,
        fileName: session.fileName,
        designState: session.designState,
        lastModified: session.lastModified,
        frameName: session.designState.frameName,
        historyCount: session.designState.history.length,
        componentCount: session.scanResults.length
      };
    }
  };
  SessionService.STORAGE_PREFIX = "aidesigner_session_";
  SessionService.ALL_SESSIONS_KEY = "aidesigner_all_sessions";

  // src/core/gemini-service.ts
  var GeminiService = class {
    /**
     * Get API key from storage
     */
    static async getApiKey() {
      try {
        const apiKey = await figma.clientStorage.getAsync("geminiApiKey");
        return apiKey || null;
      } catch (error) {
        console.error("\u274C Failed to get API key:", error);
        return null;
      }
    }
    /**
     * Save API key to storage
     */
    static async saveApiKey(apiKey) {
      try {
        if (!apiKey || apiKey.trim().length === 0) {
          throw new Error("API key cannot be empty");
        }
        await figma.clientStorage.setAsync("geminiApiKey", apiKey.trim());
        console.log("\u2705 API key saved successfully");
        return true;
      } catch (error) {
        console.error("\u274C Failed to save API key:", error);
        return false;
      }
    }
    /**
     * Test connection to Gemini API
     */
    static async testConnection() {
      try {
        const apiKey = await this.getApiKey();
        if (!apiKey) {
          return {
            success: false,
            error: "No API key found. Please configure your API key first."
          };
        }
        console.log("\u{1F9EA} Testing Gemini API connection...");
        const testPrompt = 'Respond with a simple JSON object containing a "status" field with value "ok"';
        const response = await this.callGeminiAPI(apiKey, testPrompt);
        if (response.success) {
          console.log("\u2705 Gemini API connection test successful");
          return {
            success: true,
            data: "Connection successful"
          };
        } else {
          return {
            success: false,
            error: response.error || "Connection test failed"
          };
        }
      } catch (error) {
        console.error("\u274C Connection test failed:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        };
      }
    }
    /**
     * Generate UI with Gemini API
     */
    static async generateUI(request) {
      try {
        const apiKey = await this.getApiKey();
        if (!apiKey) {
          return {
            success: false,
            error: "No API key found. Please configure your API key first."
          };
        }
        console.log("\u{1F916} Starting UI generation with Gemini...");
        const response = await this.callGeminiAPI(
          apiKey,
          request.prompt,
          request.image,
          request.config
        );
        if (response.success) {
          console.log("\u2705 UI generation successful");
          return {
            success: true,
            data: response.data
          };
        } else {
          console.error("\u274C UI generation failed:", response.error);
          return {
            success: false,
            error: response.error || "Generation failed"
          };
        }
      } catch (error) {
        console.error("\u274C UI generation error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        };
      }
    }
    /**
     * Core Gemini API calling function
     */
    static async callGeminiAPI(apiKey, prompt, image, config) {
      var _a;
      try {
        const generationConfig = __spreadValues(__spreadValues({}, this.DEFAULT_CONFIG), config);
        const apiParts = [{ text: prompt }];
        if (image) {
          apiParts.push({
            inlineData: {
              mimeType: image.type,
              data: image.base64
            }
          });
        }
        const response = await fetch(`${this.API_BASE_URL}?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: apiParts }],
            generationConfig
          })
        });
        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = ((_a = errorData.error) == null ? void 0 : _a.message) || `HTTP ${response.status}: ${response.statusText}`;
          return {
            success: false,
            error: errorMessage
          };
        }
        const data = await response.json();
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0] || !data.candidates[0].content.parts[0].text) {
          return {
            success: false,
            error: "Invalid response structure from Gemini API"
          };
        }
        const responseText = data.candidates[0].content.parts[0].text;
        return {
          success: true,
          data: responseText
        };
      } catch (error) {
        console.error("\u274C Gemini API call failed:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Network error"
        };
      }
    }
    /**
     * Clear API key from storage
     */
    static async clearApiKey() {
      try {
        await figma.clientStorage.setAsync("geminiApiKey", null);
        console.log("\u2705 API key cleared");
        return true;
      } catch (error) {
        console.error("\u274C Failed to clear API key:", error);
        return false;
      }
    }
    /**
     * Check if API key exists
     */
    static async hasApiKey() {
      const apiKey = await this.getApiKey();
      return apiKey !== null && apiKey.length > 0;
    }
    /**
     * Get masked API key for display (shows only last 4 characters)
     */
    static async getMaskedApiKey() {
      const apiKey = await this.getApiKey();
      if (!apiKey) return null;
      if (apiKey.length <= 4) {
        return "\u25CF".repeat(apiKey.length);
      }
      return "\u25CF".repeat(apiKey.length - 4) + apiKey.slice(-4);
    }
    /**
     * Format error message for user display
     */
    static formatErrorMessage(error) {
      if (error.includes("API_KEY_INVALID")) {
        return "Invalid API key. Please check your Gemini API key.";
      }
      if (error.includes("QUOTA_EXCEEDED")) {
        return "API quota exceeded. Please check your billing or try again later.";
      }
      if (error.includes("RATE_LIMIT_EXCEEDED")) {
        return "Rate limit exceeded. Please wait a moment and try again.";
      }
      if (error.includes("Network error")) {
        return "Network connection failed. Please check your internet connection.";
      }
      return error;
    }
  };
  GeminiService.API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
  GeminiService.DEFAULT_CONFIG = {
    temperature: 0.2,
    maxOutputTokens: 8192,
    responseMimeType: "application/json"
  };

  // src/core/component-scanner.ts
  var ComponentScanner = class {
    /**
     * Main scanning function - scans all pages for components
     */
    static async scanDesignSystem() {
      console.log("\u{1F50D} Starting scan...");
      const components = [];
      try {
        await figma.loadAllPagesAsync();
        console.log("\u2705 All pages loaded");
        for (const page of figma.root.children) {
          console.log(`\u{1F4CB} Scanning page: "${page.name}"`);
          try {
            const allNodes = page.findAll((node) => {
              if (node.type === "COMPONENT_SET") {
                return true;
              }
              if (node.type === "COMPONENT") {
                return !!(node.parent && node.parent.type !== "COMPONENT_SET");
              }
              return false;
            });
            console.log(`\u2705 Found ${allNodes.length} main components on page "${page.name}"`);
            for (const node of allNodes) {
              try {
                if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
                  const componentInfo = await this.analyzeComponent(node);
                  if (componentInfo) {
                    componentInfo.pageInfo = {
                      pageName: page.name,
                      pageId: page.id,
                      isCurrentPage: page.id === figma.currentPage.id
                    };
                    components.push(componentInfo);
                  }
                }
              } catch (e) {
                console.error(`\u274C Error analyzing component "${node.name}":`, e);
              }
            }
          } catch (e) {
            console.error(`\u274C Error scanning page "${page.name}":`, e);
          }
        }
        console.log(`\u{1F389} Scan complete! Found ${components.length} unique components.`);
        return components;
      } catch (e) {
        console.error("\u274C Critical error in scanDesignSystem:", e);
        throw e;
      }
    }
    /**
     * Analyzes a single component to extract metadata
     */
    static async analyzeComponent(comp) {
      const name = comp.name;
      const suggestedType = this.guessComponentType(name.toLowerCase());
      const confidence = this.calculateConfidence(name.toLowerCase(), suggestedType);
      const textLayers = this.findTextLayers(comp);
      const textHierarchy = this.analyzeTextHierarchy(comp);
      const componentInstances = await this.findComponentInstances(comp);
      const vectorNodes = this.findVectorNodes(comp);
      const imageNodes = this.findImageNodes(comp);
      let variants = [];
      const variantDetails = {};
      if (comp.type === "COMPONENT_SET") {
        const variantProps = comp.variantGroupProperties;
        if (variantProps) {
          variants = Object.keys(variantProps);
          Object.entries(variantProps).forEach(([propName, propInfo]) => {
            if (propInfo.values && propInfo.values.length > 0) {
              variantDetails[propName] = [...propInfo.values].sort();
              console.log(`\u2705 Found variant property: ${propName} with values: [${propInfo.values.join(", ")}]`);
            }
          });
          console.log(`\u{1F3AF} Variant details for "${comp.name}":`, variantDetails);
        }
      }
      return {
        id: comp.id,
        name,
        suggestedType,
        confidence,
        variants: variants.length > 0 ? variants : void 0,
        variantDetails: Object.keys(variantDetails).length > 0 ? variantDetails : void 0,
        textLayers: textLayers.length > 0 ? textLayers : void 0,
        textHierarchy: textHierarchy.length > 0 ? textHierarchy : void 0,
        componentInstances: componentInstances.length > 0 ? componentInstances : void 0,
        vectorNodes: vectorNodes.length > 0 ? vectorNodes : void 0,
        imageNodes: imageNodes.length > 0 ? imageNodes : void 0,
        isFromLibrary: false
      };
    }
    /**
     * Intelligent component type detection based on naming patterns
     */
    static guessComponentType(name) {
      var _a;
      const patterns = {
        "icon-button": /icon.*button|button.*icon/i,
        "upload": /upload|file.*drop|drop.*zone|attach/i,
        "form": /form|captcha|verification/i,
        "context-menu": /context-menu|context menu|contextual menu|options menu/i,
        "modal-header": /modal-header|modal header|modalstack|modal_stack/i,
        "list-item": /list-item|list item|list_item|list[\s\-_]*row|list[\s\-_]*cell/i,
        "appbar": /appbar|app-bar|navbar|nav-bar|header|top bar|page header/i,
        "dialog": /dialog|dialogue|popup|modal(?!-header)/i,
        "list": /list(?!-item)/i,
        "navigation": /nav|navigation(?!-bar)/i,
        "header": /h[1-6]|title|heading(?! bar)/i,
        "button": /button|btn|cta|action/i,
        "input": /input|field|textfield|text-field|entry/i,
        "textarea": /textarea|text-area|multiline/i,
        "select": /select|dropdown|drop-down|picker/i,
        "checkbox": /checkbox|check-box/i,
        "radio": /radio|radiobutton|radio-button/i,
        "switch": /switch|toggle/i,
        "slider": /slider|range/i,
        "searchbar": /search|searchbar|search-bar/i,
        "tab": /tab|tabs|tabbar|tab-bar/i,
        "breadcrumb": /breadcrumb|bread-crumb/i,
        "pagination": /pagination|pager/i,
        "bottomsheet": /bottomsheet|bottom-sheet|drawer/i,
        "sidebar": /sidebar|side-bar/i,
        "snackbar": /snack|snackbar|toast|notification/i,
        "alert": /alert/i,
        "tooltip": /tooltip|tip|hint/i,
        "badge": /badge|indicator|count/i,
        "progress": /progress|loader|loading|spinner/i,
        "skeleton": /skeleton|placeholder/i,
        "card": /card|tile|block|panel/i,
        "avatar": /avatar|profile|user|photo/i,
        "image": /image|img|picture/i,
        "video": /video|player/i,
        "icon": /icon|pictogram|symbol/i,
        "text": /text|label|paragraph|caption|copy/i,
        "link": /link|anchor/i,
        "container": /container|wrapper|box|frame/i,
        "grid": /grid/i,
        "divider": /divider|separator|delimiter/i,
        "spacer": /spacer|space|gap/i,
        "fab": /fab|floating|float/i,
        "chip": /chip|tag/i,
        "actionsheet": /actionsheet|action-sheet/i,
        "chart": /chart|graph/i,
        "table": /table/i,
        "calendar": /calendar|date/i,
        "timeline": /timeline/i,
        "gallery": /gallery|carousel/i,
        "price": /price|cost/i,
        "rating": /rating|star/i,
        "cart": /cart|basket/i,
        "map": /map|location/i,
        "code": /code|syntax/i,
        "terminal": /terminal|console/i
      };
      const priorityPatterns = [
        "icon-button",
        "upload",
        "form",
        "context-menu",
        "modal-header",
        "list-item",
        "appbar",
        "dialog",
        "snackbar",
        "bottomsheet",
        "actionsheet",
        "searchbar",
        "fab",
        "breadcrumb",
        "pagination",
        "skeleton",
        "textarea",
        "checkbox",
        "radio",
        "switch",
        "slider",
        "tab",
        "navigation",
        "tooltip",
        "badge",
        "progress",
        "avatar",
        "chip",
        "stepper",
        "chart",
        "table",
        "calendar",
        "timeline",
        "gallery",
        "rating"
      ];
      for (const type of priorityPatterns) {
        if ((_a = patterns[type]) == null ? void 0 : _a.test(name)) return type;
      }
      for (const type in patterns) {
        if (Object.prototype.hasOwnProperty.call(patterns, type) && !priorityPatterns.includes(type)) {
          if (patterns[type].test(name)) return type;
        }
      }
      return "unknown";
    }
    /**
     * Calculates confidence score for component type detection
     */
    static calculateConfidence(name, suggestedType) {
      if (suggestedType === "unknown") return 0.1;
      if (name.toLowerCase() === suggestedType.toLowerCase()) return 0.95;
      if (name.includes(suggestedType)) return 0.9;
      if (name.toLowerCase().includes(suggestedType + "-") || name.toLowerCase().includes(suggestedType + "_")) return 0.85;
      return 0.7;
    }
    /**
     * Finds and catalogs text layers within a component
     */
    static findTextLayers(comp) {
      const textLayers = [];
      try {
        const nodeToAnalyze = comp.type === "COMPONENT_SET" ? comp.defaultVariant : comp;
        if (nodeToAnalyze && "findAll" in nodeToAnalyze) {
          const allNodes = nodeToAnalyze.findAll((node) => node.type === "TEXT");
          allNodes.forEach((node) => {
            if (node.type === "TEXT" && node.name) {
              const textNode = node;
              textLayers.push(textNode.name);
              try {
                const chars = textNode.characters || "[empty]";
                console.log(`\u{1F4DD} Found text layer: "${textNode.name}" with content: "${chars}"`);
              } catch (charError) {
                console.log(`\u{1F4DD} Found text layer: "${textNode.name}" (could not read characters)`);
              }
            }
          });
        }
      } catch (e) {
        console.error(`Error finding text layers in "${comp.name}":`, e);
      }
      return textLayers;
    }
    /**
     * Analyzes text nodes by fontSize/fontWeight and classifies by visual prominence
     */
    static analyzeTextHierarchy(comp) {
      const textHierarchy = [];
      try {
        const nodeToAnalyze = comp.type === "COMPONENT_SET" ? comp.defaultVariant : comp;
        if (nodeToAnalyze && "findAll" in nodeToAnalyze) {
          const textNodes = nodeToAnalyze.findAll((node) => node.type === "TEXT");
          const fontSizes = [];
          const textNodeData = [];
          textNodes.forEach((node) => {
            if (node.type === "TEXT") {
              const textNode = node;
              try {
                const fontSize = typeof textNode.fontSize === "number" ? textNode.fontSize : 14;
                const fontWeight = textNode.fontWeight || "normal";
                fontSizes.push(fontSize);
                textNodeData.push({ node: textNode, fontSize, fontWeight });
              } catch (e) {
                console.warn(`Could not read font properties for text node "${textNode.name}"`);
              }
            }
          });
          const uniqueSizes = [...new Set(fontSizes)].sort((a, b) => b - a);
          textNodeData.forEach(({ node, fontSize, fontWeight }) => {
            let classification = "tertiary";
            if (uniqueSizes.length >= 3) {
              if (fontSize >= uniqueSizes[0]) classification = "primary";
              else if (fontSize >= uniqueSizes[1]) classification = "secondary";
              else classification = "tertiary";
            } else if (uniqueSizes.length === 2) {
              classification = fontSize >= uniqueSizes[0] ? "primary" : "secondary";
            } else {
              const weight = String(fontWeight).toLowerCase();
              if (weight.includes("bold") || weight.includes("700") || weight.includes("800") || weight.includes("900")) {
                classification = "primary";
              } else if (weight.includes("medium") || weight.includes("500") || weight.includes("600")) {
                classification = "secondary";
              } else {
                classification = "tertiary";
              }
            }
            let characters;
            try {
              characters = node.characters || "[empty]";
            } catch (e) {
              characters = void 0;
            }
            textHierarchy.push({
              nodeName: node.name,
              nodeId: node.id,
              fontSize,
              fontWeight,
              classification,
              visible: node.visible,
              characters
            });
          });
        }
      } catch (e) {
        console.error(`Error analyzing text hierarchy in "${comp.name}":`, e);
      }
      return textHierarchy;
    }
    /**
     * Finds all nested COMPONENT/INSTANCE nodes (often icons)
     */
    static async findComponentInstances(comp) {
      const componentInstances = [];
      try {
        const nodeToAnalyze = comp.type === "COMPONENT_SET" ? comp.defaultVariant : comp;
        if (nodeToAnalyze && "findAll" in nodeToAnalyze) {
          const instanceNodes = nodeToAnalyze.findAll(
            (node) => node.type === "COMPONENT" || node.type === "INSTANCE"
          );
          for (const node of instanceNodes) {
            if (node.type === "COMPONENT" || node.type === "INSTANCE") {
              const instance = {
                nodeName: node.name,
                nodeId: node.id,
                visible: node.visible
              };
              if (node.type === "INSTANCE") {
                try {
                  const mainComponent = await node.getMainComponentAsync();
                  instance.componentId = mainComponent == null ? void 0 : mainComponent.id;
                } catch (e) {
                  console.warn(`Could not get main component ID for instance "${node.name}"`);
                }
              }
              componentInstances.push(instance);
            }
          }
        }
      } catch (e) {
        console.error(`Error finding component instances in "${comp.name}":`, e);
      }
      return componentInstances;
    }
    /**
     * Finds all VECTOR nodes (direct SVG icons)
     */
    static findVectorNodes(comp) {
      const vectorNodes = [];
      try {
        const nodeToAnalyze = comp.type === "COMPONENT_SET" ? comp.defaultVariant : comp;
        if (nodeToAnalyze && "findAll" in nodeToAnalyze) {
          const vectors = nodeToAnalyze.findAll((node) => node.type === "VECTOR");
          vectors.forEach((node) => {
            if (node.type === "VECTOR") {
              vectorNodes.push({
                nodeName: node.name,
                nodeId: node.id,
                visible: node.visible
              });
            }
          });
        }
      } catch (e) {
        console.error(`Error finding vector nodes in "${comp.name}":`, e);
      }
      return vectorNodes;
    }
    /**
     * Finds all nodes that can accept image fills (RECTANGLE, ELLIPSE with image fills)
     */
    static findImageNodes(comp) {
      const imageNodes = [];
      try {
        const nodeToAnalyze = comp.type === "COMPONENT_SET" ? comp.defaultVariant : comp;
        if (nodeToAnalyze && "findAll" in nodeToAnalyze) {
          const shapeNodes = nodeToAnalyze.findAll(
            (node) => node.type === "RECTANGLE" || node.type === "ELLIPSE"
          );
          shapeNodes.forEach((node) => {
            if (node.type === "RECTANGLE" || node.type === "ELLIPSE") {
              let hasImageFill = false;
              try {
                const fills = node.fills;
                if (Array.isArray(fills)) {
                  hasImageFill = fills.some(
                    (fill) => typeof fill === "object" && fill !== null && fill.type === "IMAGE"
                  );
                }
              } catch (e) {
                console.warn(`Could not check fills for node "${node.name}"`);
              }
              imageNodes.push({
                nodeName: node.name,
                nodeId: node.id,
                nodeType: node.type,
                visible: node.visible,
                hasImageFill
              });
            }
          });
        }
      } catch (e) {
        console.error(`Error finding image nodes in "${comp.name}":`, e);
      }
      return imageNodes;
    }
    /**
     * Generate LLM prompt based on scanned components
     */
    static generateLLMPrompt(components) {
      const componentsByType = {};
      components.forEach((comp) => {
        if (comp.confidence >= 0.7) {
          if (!componentsByType[comp.suggestedType]) componentsByType[comp.suggestedType] = [];
          componentsByType[comp.suggestedType].push(comp);
        }
      });
      let prompt = `# AIDesigner JSON Generation Instructions

## Available Components in Design System:

`;
      Object.keys(componentsByType).sort().forEach((type) => {
        var _a, _b, _c, _d, _e, _f;
        const comps = componentsByType[type];
        const bestComponent = comps.sort((a, b) => b.confidence - a.confidence)[0];
        prompt += `### ${type.toUpperCase()}
`;
        prompt += `- Component ID: "${bestComponent.id}"
`;
        prompt += `- Component Name: "${bestComponent.name}"
`;
        if ((_a = bestComponent.textLayers) == null ? void 0 : _a.length) prompt += `- Text Layers: ${bestComponent.textLayers.map((l) => `"${l}"`).join(", ")}
`;
        if ((_b = bestComponent.textHierarchy) == null ? void 0 : _b.length) {
          prompt += `- Text Hierarchy:
`;
          bestComponent.textHierarchy.forEach((text) => {
            prompt += `  - ${text.classification.toUpperCase()}: "${text.nodeName}" (${text.fontSize}px, ${text.fontWeight}${text.visible ? "" : ", hidden"})
`;
          });
        }
        if ((_c = bestComponent.componentInstances) == null ? void 0 : _c.length) {
          prompt += `- Component Instances: ${bestComponent.componentInstances.map((c) => `"${c.nodeName}"${c.visible ? "" : " (hidden)"}`).join(", ")}
`;
        }
        if ((_d = bestComponent.vectorNodes) == null ? void 0 : _d.length) {
          prompt += `- Vector Icons: ${bestComponent.vectorNodes.map((v) => `"${v.nodeName}"${v.visible ? "" : " (hidden)"}`).join(", ")}
`;
        }
        if ((_e = bestComponent.imageNodes) == null ? void 0 : _e.length) {
          prompt += `- Image Containers: ${bestComponent.imageNodes.map((i) => `"${i.nodeName}" (${i.nodeType}${i.hasImageFill ? ", has image" : ""}${i.visible ? "" : ", hidden"})`).join(", ")}
`;
        }
        if (bestComponent.variantDetails && Object.keys(bestComponent.variantDetails).length > 0) {
          prompt += `
  - \u{1F3AF} VARIANTS AVAILABLE:
`;
          Object.entries(bestComponent.variantDetails).forEach(([propName, values]) => {
            prompt += `    - **${propName}**: [${values.map((v) => `"${v}"`).join(", ")}]
`;
            const propLower = propName.toLowerCase();
            if (propLower.includes("condition") || propLower.includes("layout")) {
              prompt += `      \u{1F4A1} Layout control: ${values.includes("1-line") ? '"1-line" = single line, ' : ""}${values.includes("2-line") ? '"2-line" = detailed view' : ""}
`;
            }
            if (propLower.includes("leading") || propLower.includes("start")) {
              prompt += `      \u{1F4A1} Leading element: "Icon" = shows leading icon, "None" = text only
`;
            }
            if (propLower.includes("trailing") || propLower.includes("end")) {
              prompt += `      \u{1F4A1} Trailing element: "Icon" = shows trailing icon/chevron, "None" = no trailing element
`;
            }
            if (propLower.includes("state") || propLower.includes("status")) {
              prompt += `      \u{1F4A1} Component state: controls enabled/disabled/selected appearance
`;
            }
            if (propLower.includes("size")) {
              prompt += `      \u{1F4A1} Size control: affects padding, text size, and touch targets
`;
            }
            if (propLower.includes("type") || propLower.includes("style") || propLower.includes("emphasis")) {
              prompt += `      \u{1F4A1} Visual emphasis: controls hierarchy and visual weight
`;
            }
          });
          prompt += `
  - \u26A1 QUICK VARIANT GUIDE:
`;
          prompt += `    - "single line" request \u2192 use "Condition": "1-line"
`;
          prompt += `    - "with icon" request \u2192 use "Leading": "Icon"
`;
          prompt += `    - "arrow" or "chevron" \u2192 use "Trailing": "Icon"
`;
          prompt += `    - "simple" or "minimal" \u2192 omit variants to use defaults
`;
          prompt += `    - Only specify variants you want to change from defaults
`;
        }
        prompt += `- Page: ${((_f = bestComponent.pageInfo) == null ? void 0 : _f.pageName) || "Unknown"}

`;
      });
      prompt += `## JSON Structure & Rules:

### Variant Usage Rules:
- **Variants must be in a separate "variants" object inside properties**
- **NEVER mix variants with regular properties at the same level**
- Variant properties are case-sensitive: "Condition" not "condition"
- Variant values are case-sensitive: "1-line" not "1-Line"

### \u2705 CORRECT Variant Structure:
\`\`\`json
{
  "type": "list-item",
  "componentNodeId": "10:123",
  "properties": {
    "text": "Personal details",
    "horizontalSizing": "FILL",
    "variants": {
      "Condition": "1-line",
      "Leading": "Icon", 
      "Trailing": "Icon"
    }
  }
}
\`\`\`

### \u274C WRONG - Never do this:
\`\`\`json
{
  "properties": {
    "text": "Personal details",
    "Condition": "1-line",    // WRONG: variants mixed with properties
    "Leading": "Icon"         // WRONG: should be in variants object
  }
}
\`\`\`

### Settings Screen with Proper Variants:
\`\`\`json
{
  "layoutContainer": {
    "name": "Settings Screen",
    "layoutMode": "VERTICAL",
    "width": 360,
    "itemSpacing": 8
  },
  "items": [
    {
      "type": "list-item",
      "componentNodeId": "10:123",
      "properties": {
        "text": "Personal details",
        "horizontalSizing": "FILL",
        "variants": {
          "Condition": "1-line",
          "Leading": "Icon",
          "Trailing": "None"
        }
      }
    },
    {
      "type": "list-item",
      "componentNodeId": "10:123",
      "properties": {
        "text": "Change language",
        "trailing-text": "English",
        "horizontalSizing": "FILL",
        "variants": {
          "Condition": "1-line",
          "Leading": "Icon",
          "Trailing": "Icon"
        }
      }
    },
    {
      "type": "list-item",
      "componentNodeId": "10:123",
      "properties": {
        "text": "Notifications",
        "supporting-text": "Push notifications and email alerts",
        "trailing-text": "On",
        "horizontalSizing": "FILL",
        "variants": {
          "Condition": "2-line",
          "Leading": "Icon",
          "Trailing": "Icon"
        }
      }
    }
  ]
}
\`\`\`

### \u2705 VARIANT BEST PRACTICES:
- **Always use exact property names**: "Condition" not "condition"
- **Use exact values**: "1-line" not "1-Line" or "single-line"
- **Specify complete variant sets**: Include all required properties for that variant
- **Common patterns**:
  - Simple navigation: \`"Condition": "1-line", "Leading": "Icon", "Trailing": "None"\`
  - With current value: \`"Condition": "1-line", "Leading": "Icon", "Trailing": "Icon"\`
  - Detailed info: \`"Condition": "2-line", "Leading": "Icon", "Trailing": "Icon"\`

*\u{1F3AF} Pro tip: Study your design system's variant combinations in Figma to understand which variants work together.*
`;
      return prompt;
    }
    /**
     * Save scan results to Figma storage
     */
    static async saveLastScanResults(components) {
      try {
        const scanSession = {
          components,
          scanTime: Date.now(),
          version: "1.0",
          fileKey: figma.root.id
        };
        await figma.clientStorage.setAsync("design-system-scan", scanSession);
        await figma.clientStorage.setAsync("last-scan-results", components);
        console.log(`\u{1F4BE} Saved ${components.length} components with session data`);
      } catch (error) {
        console.error("\u274C Error saving scan results:", error);
        try {
          await figma.clientStorage.setAsync("last-scan-results", components);
          console.log("\u{1F4BE} Fallback save successful");
        } catch (fallbackError) {
          console.warn("\u26A0\uFE0F Could not save scan results:", fallbackError);
        }
      }
    }
    /**
     * Get component ID by type for UI generation
     */
    static async getComponentIdByType(type) {
      const searchType = type.toLowerCase();
      const scanResults = await figma.clientStorage.getAsync("last-scan-results");
      if (scanResults && Array.isArray(scanResults)) {
        const matchingComponent = scanResults.find((comp) => comp.suggestedType.toLowerCase() === searchType && comp.confidence >= 0.7);
        if (matchingComponent) return matchingComponent.id;
        const nameMatchingComponent = scanResults.find((comp) => comp.name.toLowerCase().includes(searchType));
        if (nameMatchingComponent) return nameMatchingComponent.id;
      }
      console.log(`\u274C ID for type ${type} not found`);
      return null;
    }
  };

  // src/core/design-system-scanner-service.ts
  var DesignSystemScannerService = class {
    /**
     * Main scanning function - scans all pages for components
     */
    static async scanDesignSystem(progressCallback) {
      console.log("\u{1F50D} Starting design system scan...");
      const components = [];
      try {
        await figma.loadAllPagesAsync();
        console.log("\u2705 All pages loaded");
        const totalPages = figma.root.children.length;
        let currentPage = 0;
        progressCallback == null ? void 0 : progressCallback({ current: 0, total: totalPages, status: "Initializing scan..." });
        for (const page of figma.root.children) {
          currentPage++;
          const pageStatus = `Scanning page: "${page.name}" (${currentPage}/${totalPages})`;
          console.log(`\u{1F4CB} ${pageStatus}`);
          progressCallback == null ? void 0 : progressCallback({
            current: currentPage,
            total: totalPages,
            status: pageStatus
          });
          try {
            const allNodes = page.findAll((node) => {
              if (node.type === "COMPONENT_SET") {
                return true;
              }
              if (node.type === "COMPONENT") {
                return !!(node.parent && node.parent.type !== "COMPONENT_SET");
              }
              return false;
            });
            console.log(`\u2705 Found ${allNodes.length} main components on page "${page.name}"`);
            for (const node of allNodes) {
              try {
                if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
                  const componentInfo = await ComponentScanner.analyzeComponent(node);
                  if (componentInfo) {
                    componentInfo.pageInfo = {
                      pageName: page.name,
                      pageId: page.id,
                      isCurrentPage: page.id === figma.currentPage.id
                    };
                    components.push(componentInfo);
                  }
                }
              } catch (e) {
                console.error(`\u274C Error analyzing component "${node.name}":`, e);
              }
            }
          } catch (e) {
            console.error(`\u274C Error scanning page "${page.name}":`, e);
          }
        }
        progressCallback == null ? void 0 : progressCallback({
          current: totalPages,
          total: totalPages,
          status: `Scan complete! Found ${components.length} components`
        });
        console.log(`\u{1F389} Design system scan complete! Found ${components.length} unique components.`);
        return components;
      } catch (e) {
        console.error("\u274C Critical error in design system scan:", e);
        throw e;
      }
    }
    /**
     * Generate LLM prompt - delegated to ComponentScanner
     */
    static generateLLMPrompt(components) {
      return ComponentScanner.generateLLMPrompt(components);
    }
    /**
     * Analyzes a single component to extract metadata and variants
     * @deprecated Use ComponentScanner.analyzeComponent instead
     */
    static analyzeComponent(comp) {
      const name = comp.name;
      const suggestedType = this.guessComponentType(name.toLowerCase());
      const confidence = this.calculateConfidence(name.toLowerCase(), suggestedType);
      const textLayers = this.findTextLayers(comp);
      let variants = [];
      let variantDetails = {};
      if (comp.type === "COMPONENT_SET") {
        const variantProps = comp.variantGroupProperties;
        if (variantProps) {
          variants = Object.keys(variantProps);
          Object.entries(variantProps).forEach(([propName, propInfo]) => {
            if (propInfo.values && propInfo.values.length > 0) {
              variantDetails[propName] = [...propInfo.values].sort();
              console.log(`\u2705 Found variant property: ${propName} with values: [${propInfo.values.join(", ")}]`);
            }
          });
          console.log(`\u{1F3AF} Variant details for "${comp.name}":`, variantDetails);
        }
      }
      return {
        id: comp.id,
        name,
        suggestedType,
        confidence,
        variants: variants.length > 0 ? variants : void 0,
        variantDetails: Object.keys(variantDetails).length > 0 ? variantDetails : void 0,
        textLayers: textLayers.length > 0 ? textLayers : void 0,
        isFromLibrary: false
      };
    }
    /**
     * Intelligent component type detection based on naming patterns
     */
    static guessComponentType(name) {
      var _a;
      const patterns = {
        "icon-button": /icon.*button|button.*icon/i,
        "upload": /upload|file.*drop|drop.*zone|attach/i,
        "form": /form|captcha|verification/i,
        "context-menu": /context-menu|context menu|contextual menu|options menu/i,
        "modal-header": /modal-header|modal header|modalstack|modal_stack/i,
        "list-item": /list-item|list item|list_item|list[\s\-_]*row|list[\s\-_]*cell/i,
        "appbar": /appbar|app-bar|navbar|nav-bar|header|top bar|page header/i,
        "dialog": /dialog|dialogue|popup|modal(?!-header)/i,
        "list": /list(?!-item)/i,
        "navigation": /nav|navigation(?!-bar)/i,
        "header": /h[1-6]|title|heading(?! bar)/i,
        "button": /button|btn|cta|action/i,
        "input": /input|field|textfield|text-field|entry/i,
        "textarea": /textarea|text-area|multiline/i,
        "select": /select|dropdown|drop-down|picker/i,
        "checkbox": /checkbox|check-box/i,
        "radio": /radio|radiobutton|radio-button/i,
        "switch": /switch|toggle/i,
        "slider": /slider|range/i,
        "searchbar": /search|searchbar|search-bar/i,
        "tab": /tab|tabs|tabbar|tab-bar/i,
        "breadcrumb": /breadcrumb|bread-crumb/i,
        "pagination": /pagination|pager/i,
        "bottomsheet": /bottomsheet|bottom-sheet|drawer/i,
        "sidebar": /sidebar|side-bar/i,
        "snackbar": /snack|snackbar|toast|notification/i,
        "alert": /alert/i,
        "tooltip": /tooltip|tip|hint/i,
        "badge": /badge|indicator|count/i,
        "progress": /progress|loader|loading|spinner/i,
        "skeleton": /skeleton|placeholder/i,
        "card": /card|tile|block|panel/i,
        "avatar": /avatar|profile|user|photo/i,
        "image": /image|img|picture/i,
        "video": /video|player/i,
        "icon": /icon|pictogram|symbol/i,
        "text": /text|label|paragraph|caption|copy/i,
        "link": /link|anchor/i,
        "container": /container|wrapper|box|frame/i,
        "grid": /grid/i,
        "divider": /divider|separator|delimiter/i,
        "spacer": /spacer|space|gap/i,
        "fab": /fab|floating|float/i,
        "chip": /chip|tag/i,
        "actionsheet": /actionsheet|action-sheet/i,
        "chart": /chart|graph/i,
        "table": /table/i,
        "calendar": /calendar|date/i,
        "timeline": /timeline/i,
        "gallery": /gallery|carousel/i,
        "price": /price|cost/i,
        "rating": /rating|star/i,
        "cart": /cart|basket/i,
        "map": /map|location/i,
        "code": /code|syntax/i,
        "terminal": /terminal|console/i
      };
      const priorityPatterns = [
        "icon-button",
        "upload",
        "form",
        "context-menu",
        "modal-header",
        "list-item",
        "appbar",
        "dialog",
        "snackbar",
        "bottomsheet",
        "actionsheet",
        "searchbar",
        "fab",
        "breadcrumb",
        "pagination",
        "skeleton",
        "textarea",
        "checkbox",
        "radio",
        "switch",
        "slider",
        "tab",
        "navigation",
        "tooltip",
        "badge",
        "progress",
        "avatar",
        "chip",
        "stepper",
        "chart",
        "table",
        "calendar",
        "timeline",
        "gallery",
        "rating"
      ];
      for (const type of priorityPatterns) {
        if ((_a = patterns[type]) == null ? void 0 : _a.test(name)) return type;
      }
      for (const type in patterns) {
        if (patterns.hasOwnProperty(type) && !priorityPatterns.includes(type)) {
          if (patterns[type].test(name)) return type;
        }
      }
      return "unknown";
    }
    /**
     * Calculates confidence score for component type detection
     */
    static calculateConfidence(name, suggestedType) {
      if (suggestedType === "unknown") return 0.1;
      if (name.toLowerCase() === suggestedType.toLowerCase()) return 0.95;
      if (name.includes(suggestedType)) return 0.9;
      if (name.toLowerCase().includes(suggestedType + "-") || name.toLowerCase().includes(suggestedType + "_")) return 0.85;
      return 0.7;
    }
    /**
     * Finds and catalogs text layers within a component
     */
    static findTextLayers(comp) {
      const textLayers = [];
      try {
        const nodeToAnalyze = comp.type === "COMPONENT_SET" ? comp.defaultVariant : comp;
        if (nodeToAnalyze && "findAll" in nodeToAnalyze) {
          const allNodes = nodeToAnalyze.findAll((node) => node.type === "TEXT");
          allNodes.forEach((node) => {
            if (node.type === "TEXT" && node.name) {
              const textNode = node;
              textLayers.push(textNode.name);
              try {
                const chars = textNode.characters || "[empty]";
                console.log(`\u{1F4DD} Found text layer: "${textNode.name}" with content: "${chars}"`);
              } catch (charError) {
                console.log(`\u{1F4DD} Found text layer: "${textNode.name}" (could not read characters)`);
              }
            }
          });
        }
      } catch (e) {
        console.error(`Error finding text layers in "${comp.name}":`, e);
      }
      return textLayers;
    }
    /**
     * Save scan results to Figma storage
     */
    static async saveScanResults(components) {
      try {
        const scanSession = {
          components,
          scanTime: Date.now(),
          version: "1.0",
          fileKey: figma.root.id
        };
        await figma.clientStorage.setAsync("design-system-scan", scanSession);
        await figma.clientStorage.setAsync("last-scan-results", components);
        console.log(`\u{1F4BE} Saved ${components.length} components with session data`);
      } catch (error) {
        console.error("\u274C Error saving scan results:", error);
        try {
          await figma.clientStorage.setAsync("last-scan-results", components);
          console.log("\u{1F4BE} Fallback save successful");
        } catch (fallbackError) {
          console.warn("\u26A0\uFE0F Could not save scan results:", fallbackError);
        }
      }
    }
    /**
     * Get component ID by type for UI generation
     */
    static async getComponentIdByType(type) {
      const searchType = type.toLowerCase();
      const scanResults = await figma.clientStorage.getAsync("last-scan-results");
      if (scanResults && Array.isArray(scanResults)) {
        const matchingComponent = scanResults.find(
          (comp) => comp.suggestedType.toLowerCase() === searchType && comp.confidence >= 0.7
        );
        if (matchingComponent) return matchingComponent.id;
        const nameMatchingComponent = scanResults.find(
          (comp) => comp.name.toLowerCase().includes(searchType)
        );
        if (nameMatchingComponent) return nameMatchingComponent.id;
      }
      console.log(`\u274C Component ID for type "${type}" not found`);
      return null;
    }
    /**
     * Get saved scan results from storage
     */
    static async getSavedScanResults() {
      try {
        const scanResults = await figma.clientStorage.getAsync("last-scan-results");
        return scanResults || null;
      } catch (error) {
        console.error("\u274C Error getting saved scan results:", error);
        return null;
      }
    }
    /**
     * Get scan session data
     */
    static async getScanSession() {
      try {
        const scanSession = await figma.clientStorage.getAsync("design-system-scan");
        return scanSession || null;
      } catch (error) {
        console.error("\u274C Error getting scan session:", error);
        return null;
      }
    }
    /**
     * Update component type manually
     */
    static async updateComponentType(componentId, newType) {
      try {
        const scanResults = await figma.clientStorage.getAsync("last-scan-results");
        if (scanResults && Array.isArray(scanResults)) {
          let componentName = "";
          const updatedResults = scanResults.map((comp) => {
            if (comp.id === componentId) {
              componentName = comp.name;
              return __spreadProps(__spreadValues({}, comp), { suggestedType: newType, confidence: 1 });
            }
            return comp;
          });
          await this.saveScanResults(updatedResults);
          return { success: true, componentName };
        }
        return { success: false };
      } catch (error) {
        console.error("\u274C Error updating component type:", error);
        return { success: false };
      }
    }
    /**
     * Clear all scan data
     */
    static async clearScanData() {
      try {
        await figma.clientStorage.setAsync("design-system-scan", null);
        await figma.clientStorage.setAsync("last-scan-results", null);
        console.log("\u2705 Scan data cleared");
      } catch (error) {
        console.error("\u274C Error clearing scan data:", error);
      }
    }
  };

  // src/core/figma-renderer.ts
  var FigmaRenderer = class {
    /**
     * Main UI generation function - creates UI from structured JSON data
     */
    static async generateUIFromData(layoutData, parentNode) {
      let currentFrame;
      const containerData = layoutData.layoutContainer || layoutData;
      if (parentNode.type === "PAGE" && containerData) {
        currentFrame = figma.createFrame();
        parentNode.appendChild(currentFrame);
      } else if (parentNode.type === "FRAME") {
        currentFrame = parentNode;
      } else {
        figma.notify("Cannot add items without a parent frame.", { error: true });
        return figma.createFrame();
      }
      if (containerData && containerData !== layoutData) {
        currentFrame.name = containerData.name || "Generated Frame";
        currentFrame.layoutMode = containerData.layoutMode === "HORIZONTAL" || containerData.layoutMode === "VERTICAL" ? containerData.layoutMode : "NONE";
        if (currentFrame.layoutMode !== "NONE") {
          currentFrame.paddingTop = typeof containerData.paddingTop === "number" ? containerData.paddingTop : 0;
          currentFrame.paddingBottom = typeof containerData.paddingBottom === "number" ? containerData.paddingBottom : 0;
          currentFrame.paddingLeft = typeof containerData.paddingLeft === "number" ? containerData.paddingLeft : 0;
          currentFrame.paddingRight = typeof containerData.paddingRight === "number" ? containerData.paddingRight : 0;
          if (containerData.itemSpacing === "AUTO") {
            currentFrame.itemSpacing = "AUTO";
          } else {
            currentFrame.itemSpacing = typeof containerData.itemSpacing === "number" ? containerData.itemSpacing : 0;
          }
          if (containerData.layoutWrap !== void 0) {
            currentFrame.layoutWrap = containerData.layoutWrap;
          }
          if (containerData.primaryAxisAlignItems) {
            currentFrame.primaryAxisAlignItems = containerData.primaryAxisAlignItems;
          }
          if (containerData.counterAxisAlignItems) {
            currentFrame.counterAxisAlignItems = containerData.counterAxisAlignItems;
          }
          if (containerData.primaryAxisSizingMode) {
            currentFrame.primaryAxisSizingMode = containerData.primaryAxisSizingMode;
          } else {
            currentFrame.primaryAxisSizingMode = "AUTO";
          }
          if (containerData.counterAxisSizingMode) {
            currentFrame.counterAxisSizingMode = containerData.counterAxisSizingMode;
          }
        }
        if (containerData.minWidth !== void 0) {
          currentFrame.minWidth = containerData.minWidth;
        }
        if (containerData.maxWidth !== void 0) {
          currentFrame.maxWidth = containerData.maxWidth;
        }
        if (containerData.minHeight !== void 0) {
          currentFrame.minHeight = containerData.minHeight;
        }
        if (containerData.maxHeight !== void 0) {
          currentFrame.maxHeight = containerData.maxHeight;
        }
        if (containerData.width) {
          currentFrame.resize(containerData.width, currentFrame.height);
          if (!containerData.counterAxisSizingMode) {
            currentFrame.counterAxisSizingMode = "FIXED";
          }
        } else if (!containerData.counterAxisSizingMode) {
          currentFrame.counterAxisSizingMode = "AUTO";
        }
      }
      const items = layoutData.items || containerData.items;
      if (!items || !Array.isArray(items)) return currentFrame;
      for (const item of items) {
        if (item.type === "layoutContainer") {
          const nestedFrame = figma.createFrame();
          currentFrame.appendChild(nestedFrame);
          this.applyChildLayoutProperties(nestedFrame, item);
          await this.generateUIFromData({ layoutContainer: item, items: item.items }, nestedFrame);
        } else if (item.type === "frame" && item.layoutContainer) {
          const nestedFrame = figma.createFrame();
          currentFrame.appendChild(nestedFrame);
          await this.generateUIFromData(item, nestedFrame);
        } else if (item.type === "native-text" || item.type === "text") {
          await this.createTextNode(item, currentFrame);
          continue;
        } else if (item.type === "native-rectangle") {
          await this.createRectangleNode(item, currentFrame);
          continue;
        } else if (item.type === "native-circle") {
          await this.createEllipseNode(item, currentFrame);
          continue;
        } else {
          if (!item.componentNodeId) continue;
          const componentNode = await figma.getNodeByIdAsync(item.componentNodeId);
          if (!componentNode) {
            console.warn(`\u26A0\uFE0F Component with ID ${item.componentNodeId} not found. Skipping.`);
            continue;
          }
          const masterComponent = componentNode.type === "COMPONENT_SET" ? componentNode.defaultVariant : componentNode;
          if (!masterComponent || masterComponent.type !== "COMPONENT") {
            console.warn(`\u26A0\uFE0F Could not find a valid master component for ID ${item.componentNodeId}. Skipping.`);
            continue;
          }
          const instance = masterComponent.createInstance();
          currentFrame.appendChild(instance);
          console.log(`\u{1F527} Creating instance of component: ${masterComponent.name}`);
          console.log(`\u{1F527} Raw properties:`, item.properties);
          const { cleanProperties, variants } = this.separateVariantsFromProperties(item.properties, item.componentNodeId);
          const sanitizedProps = this.sanitizeProperties(cleanProperties);
          console.log(`\u{1F527} Clean properties:`, sanitizedProps);
          console.log(`\u{1F527} Extracted variants:`, variants);
          if (Object.keys(variants).length > 0) {
            try {
              if (componentNode && componentNode.type === "COMPONENT_SET") {
                const availableVariants = componentNode.variantGroupProperties;
                console.log(`\u{1F50D} Available variants for ${componentNode.name}:`, Object.keys(availableVariants || {}));
                console.log(`\u{1F50D} Requested variants:`, variants);
                if (!availableVariants) {
                  console.warn("\u26A0\uFE0F No variant properties found on component, skipping variant application.");
                } else {
                  const validVariants = {};
                  let hasValidVariants = false;
                  Object.entries(variants).forEach(([propName, propValue]) => {
                    const availableProp = availableVariants[propName];
                    if (availableProp && availableProp.values) {
                      const stringValue = String(propValue);
                      if (availableProp.values.includes(stringValue)) {
                        validVariants[propName] = stringValue;
                        hasValidVariants = true;
                        console.log(`\u2705 Valid variant: ${propName} = "${stringValue}"`);
                      } else {
                        console.warn(`\u26A0\uFE0F Invalid value for "${propName}": "${stringValue}". Available: [${availableProp.values.join(", ")}]`);
                      }
                    } else {
                      console.warn(`\u26A0\uFE0F Unknown variant property: "${propName}". Available: [${Object.keys(availableVariants).join(", ")}]`);
                    }
                  });
                  if (hasValidVariants) {
                    console.log(`\u{1F527} Applying variants:`, validVariants);
                    instance.setProperties(validVariants);
                    console.log("\u2705 Variants applied successfully");
                  } else {
                    console.warn("\u26A0\uFE0F No valid variants to apply, using default variant");
                  }
                }
              } else {
                console.log("\u2139\uFE0F Component is not a variant set, skipping variant application");
              }
            } catch (e) {
              console.error("\u274C Error applying variants:", e);
              console.log("\u2139\uFE0F Continuing with default variant");
            }
          }
          this.applyChildLayoutProperties(instance, sanitizedProps);
          await this.applyTextProperties(instance, sanitizedProps);
          await this.applyMediaProperties(instance, sanitizedProps);
        }
      }
      if (parentNode.type === "PAGE") {
        figma.currentPage.selection = [currentFrame];
        figma.viewport.scrollAndZoomIntoView([currentFrame]);
        figma.notify(`UI "${currentFrame.name}" generated!`, { timeout: 2500 });
      }
      return currentFrame;
    }
    /**
     * Dynamic UI generation with component ID resolution
     */
    static async generateUIFromDataDynamic(layoutData) {
      if (!layoutData || !layoutData.items) {
        figma.notify("Invalid JSON structure", { error: true });
        return null;
      }
      const isPlaceholderID = (id) => {
        if (!id) return true;
        return id.includes("_id") || id.includes("placeholder") || !id.match(/^[0-9]+:[0-9]+$/);
      };
      async function resolveComponentIds(items) {
        for (const item of items) {
          if (item.type === "layoutContainer") {
            if (item.items && Array.isArray(item.items)) {
              await resolveComponentIds(item.items);
            }
            continue;
          }
          if (item.type === "native-text" || item.type === "text" || item.type === "native-rectangle" || item.type === "native-circle") {
            console.log(`\u2139\uFE0F Skipping native element: ${item.type}`);
            continue;
          }
          if (item.type === "frame" && item.items) {
            await resolveComponentIds(item.items);
          } else if (item.type !== "frame") {
            if (!item.componentNodeId || isPlaceholderID(item.componentNodeId)) {
              console.log(`\u{1F527} Resolving component ID for type: ${item.type}`);
              const resolvedId = await ComponentScanner.getComponentIdByType(item.type);
              if (!resolvedId) {
                throw new Error(`Component for type "${item.type}" not found in design system. Please scan your design system first.`);
              }
              item.componentNodeId = resolvedId;
              console.log(`\u2705 Resolved ${item.type} -> ${resolvedId}`);
            } else {
              console.log(`\u2705 Using existing ID for ${item.type}: ${item.componentNodeId}`);
            }
          }
        }
      }
      try {
        await resolveComponentIds(layoutData.items);
        return await this.generateUIFromData(layoutData, figma.currentPage);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        figma.notify(errorMessage, { error: true, timeout: 4e3 });
        console.error("\u274C generateUIFromDataDynamic error:", e);
        return null;
      }
    }
    /**
     * Create native text element
     */
    static async createTextNode(textData, container) {
      var _a;
      console.log("Creating native text:", textData);
      const textNode = figma.createText();
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      const textContent = textData.text || textData.content || ((_a = textData.properties) == null ? void 0 : _a.content) || textData.characters || "Text";
      textNode.characters = textContent;
      const props = textData.properties || textData;
      const fontSize = props.fontSize || props.size || props.textSize || 16;
      textNode.fontSize = fontSize;
      if (props.fontWeight === "bold" || props.weight === "bold" || props.style === "bold") {
        await figma.loadFontAsync({ family: "Inter", style: "Bold" });
        textNode.fontName = { family: "Inter", style: "Bold" };
      }
      if (props.alignment === "center" || props.textAlign === "center") {
        textNode.textAlignHorizontal = "CENTER";
      } else if (props.alignment === "right" || props.textAlign === "right") {
        textNode.textAlignHorizontal = "RIGHT";
      } else {
        textNode.textAlignHorizontal = "LEFT";
      }
      if (props.color) {
        const fills = textNode.fills;
        if (fills.length > 0 && fills[0].type === "SOLID") {
          textNode.fills = [{ type: "SOLID", color: props.color }];
          textNode.fills = fills;
        }
      }
      this.applyChildLayoutProperties(textNode, props);
      if (props.horizontalSizing === "FILL") {
        textNode.textAutoResize = "HEIGHT";
      } else {
        textNode.textAutoResize = "WIDTH_AND_HEIGHT";
      }
      container.appendChild(textNode);
      console.log("Native text created successfully");
    }
    /**
     * Create native rectangle element
     */
    static async createRectangleNode(rectData, container) {
      console.log("Creating native rectangle:", rectData);
      const rect = figma.createRectangle();
      if (rectData.width && rectData.height) {
        rect.resize(rectData.width, rectData.height);
      } else {
        rect.resize(100, 100);
      }
      if (rectData.fill) {
        rect.fills = [{ type: "SOLID", color: rectData.fill }];
      }
      if (rectData.cornerRadius) {
        rect.cornerRadius = rectData.cornerRadius;
      }
      if (rectData.horizontalSizing === "FILL") {
        rect.layoutAlign = "STRETCH";
      }
      container.appendChild(rect);
      console.log("Rectangle created successfully");
    }
    /**
     * Create native ellipse element
     */
    static async createEllipseNode(ellipseData, container) {
      console.log("Creating native ellipse:", ellipseData);
      const ellipse = figma.createEllipse();
      if (ellipseData.width && ellipseData.height) {
        ellipse.resize(ellipseData.width, ellipseData.height);
      } else {
        ellipse.resize(50, 50);
      }
      if (ellipseData.fill) {
        ellipse.fills = [{ type: "SOLID", color: ellipseData.fill }];
      }
      container.appendChild(ellipse);
      console.log("Ellipse created successfully");
    }
    /**
     * Apply text properties to component instances using enhanced scan data
     */
    static async applyTextProperties(instance, properties) {
      if (!properties) return;
      console.log("\u{1F50D} Applying text properties:", properties);
      const allTextNodes = instance.findAll((n) => n.type === "TEXT");
      console.log(
        "\u{1F50D} Available text nodes in component:",
        allTextNodes.map((textNode) => ({
          name: textNode.name,
          id: textNode.id,
          visible: textNode.visible,
          chars: textNode.characters || "[empty]"
        }))
      );
      const componentTextHierarchy = await this.getComponentTextHierarchy(instance);
      console.log("\u{1F50D} Text hierarchy from scan data:", componentTextHierarchy);
      const semanticMappings = {
        "primary-text": ["primary"],
        "secondary-text": ["secondary"],
        "tertiary-text": ["tertiary"],
        "headline": ["primary", "secondary"],
        "title": ["primary", "secondary"],
        "content": ["primary", "secondary"],
        "text": ["primary", "secondary"],
        "supporting-text": ["secondary", "tertiary"],
        "supporting": ["secondary", "tertiary"],
        "subtitle": ["secondary", "tertiary"],
        "trailing-text": ["tertiary", "secondary"],
        "trailing": ["tertiary", "secondary"],
        "caption": ["tertiary"],
        "overline": ["tertiary"]
      };
      const legacyMappings = {
        "content": ["headline", "title", "text", "label"],
        "headline": ["headline", "title", "text", "label"],
        "text": ["headline", "title", "text", "label"],
        "supporting-text": ["supporting", "subtitle", "description", "body"],
        "supporting": ["supporting", "subtitle", "description", "body"],
        "trailing-text": ["trailing", "value", "action", "status", "end"],
        "trailing": ["trailing", "value", "action", "status", "end"],
        "title": ["title", "headline", "text"],
        "subtitle": ["subtitle", "supporting", "description"]
      };
      for (const [propKey, propValue] of Object.entries(properties)) {
        if (!propValue || typeof propValue !== "string" || !propValue.trim()) continue;
        if (propKey === "horizontalSizing" || propKey === "variants") continue;
        console.log(`\u{1F527} Trying to set ${propKey} = "${propValue}"`);
        let textNode = null;
        let matchMethod = "none";
        if (componentTextHierarchy) {
          const hierarchyEntry = componentTextHierarchy.find(
            (entry) => entry.nodeName.toLowerCase() === propKey.toLowerCase() || entry.nodeName.toLowerCase().replace(/\s+/g, "-") === propKey.toLowerCase()
          );
          if (hierarchyEntry) {
            textNode = allTextNodes.find((n) => n.id === hierarchyEntry.nodeId) || null;
            if (textNode) {
              matchMethod = "exact-name";
              console.log(`\u2705 Found text node by exact name match: "${textNode.name}" (${hierarchyEntry.classification})`);
            }
          }
        }
        if (!textNode && componentTextHierarchy && semanticMappings[propKey.toLowerCase()]) {
          const targetClassifications = semanticMappings[propKey.toLowerCase()];
          for (const classification of targetClassifications) {
            const hierarchyEntry = componentTextHierarchy.find(
              (entry) => entry.classification === classification
            );
            if (hierarchyEntry) {
              textNode = allTextNodes.find((n) => n.id === hierarchyEntry.nodeId) || null;
              if (textNode) {
                matchMethod = "semantic-classification";
                console.log(`\u2705 Found text node by semantic classification: "${textNode.name}" (${classification})`);
                break;
              }
            }
          }
        }
        if (!textNode && componentTextHierarchy) {
          const hierarchyEntry = componentTextHierarchy.find(
            (entry) => entry.nodeName.toLowerCase().includes(propKey.toLowerCase()) || propKey.toLowerCase().includes(entry.nodeName.toLowerCase())
          );
          if (hierarchyEntry) {
            textNode = allTextNodes.find((n) => n.id === hierarchyEntry.nodeId) || null;
            if (textNode) {
              matchMethod = "partial-name";
              console.log(`\u2705 Found text node by partial name match: "${textNode.name}"`);
            }
          }
        }
        if (!textNode) {
          const possibleNames = legacyMappings[propKey.toLowerCase()] || [propKey.toLowerCase()];
          for (const targetName of possibleNames) {
            textNode = allTextNodes.find(
              (n) => n.name.toLowerCase().includes(targetName.toLowerCase())
            ) || null;
            if (textNode) {
              matchMethod = "legacy-mapping";
              console.log(`\u2705 Found text node by legacy mapping: "${textNode.name}"`);
              break;
            }
          }
        }
        if (!textNode) {
          if (propKey.toLowerCase().includes("headline") || propKey.toLowerCase().includes("title") || propKey.toLowerCase().includes("primary")) {
            textNode = allTextNodes[0] || null;
            matchMethod = "position-first";
            console.log(`\u{1F504} Using first text node as fallback for "${propKey}"`);
          } else if (propKey.toLowerCase().includes("trailing") || propKey.toLowerCase().includes("tertiary")) {
            textNode = allTextNodes[allTextNodes.length - 1] || null;
            matchMethod = "position-last";
            console.log(`\u{1F504} Using last text node as fallback for "${propKey}"`);
          } else if (propKey.toLowerCase().includes("supporting") || propKey.toLowerCase().includes("secondary")) {
            textNode = allTextNodes[1] || allTextNodes[0] || null;
            matchMethod = "position-second";
            console.log(`\u{1F504} Using second text node as fallback for "${propKey}"`);
          }
        }
        if (textNode) {
          try {
            if (!textNode.visible) {
              textNode.visible = true;
              console.log(`\u{1F441}\uFE0F Activated hidden text node: "${textNode.name}"`);
            }
            if (typeof textNode.fontName !== "symbol") {
              await figma.loadFontAsync(textNode.fontName);
              textNode.characters = propValue;
              console.log(`\u2705 Successfully set "${textNode.name}" to "${propValue}" (method: ${matchMethod})`);
            }
          } catch (fontError) {
            console.error(`\u274C Font loading failed for "${textNode.name}":`, fontError);
          }
        } else {
          console.warn(`\u274C No text node found for property "${propKey}" with value "${propValue}"`);
        }
      }
    }
    /**
     * Get text hierarchy data for a component instance from scan results
     */
    static async getComponentTextHierarchy(instance) {
      try {
        const mainComponent = await instance.getMainComponentAsync();
        if (!mainComponent) return null;
        const scanResults = await figma.clientStorage.getAsync("last-scan-results");
        if (!scanResults || !Array.isArray(scanResults)) return null;
        const componentInfo = scanResults.find((comp) => comp.id === mainComponent.id);
        return (componentInfo == null ? void 0 : componentInfo.textHierarchy) || null;
      } catch (error) {
        console.warn("Could not get text hierarchy data:", error);
        return null;
      }
    }
    /**
     * Apply media properties to component instances using enhanced scan data validation
     */
    static async applyMediaProperties(instance, properties) {
      var _a;
      if (!properties) return;
      console.log("\u{1F5BC}\uFE0F Validating media properties:", properties);
      const componentMediaData = await this.getComponentMediaData(instance);
      console.log("\u{1F5BC}\uFE0F Media data from scan results:", componentMediaData);
      const mediaPropertyPatterns = [
        "icon",
        "image",
        "avatar",
        "photo",
        "logo",
        "media",
        "leading-icon",
        "trailing-icon",
        "start-icon",
        "end-icon",
        "profile-image",
        "user-avatar",
        "cover-image",
        "thumbnail"
      ];
      const mediaProperties = {};
      Object.entries(properties).forEach(([key, value]) => {
        const keyLower = key.toLowerCase();
        if (mediaPropertyPatterns.some((pattern) => keyLower.includes(pattern))) {
          mediaProperties[key] = value;
        }
      });
      if (Object.keys(mediaProperties).length === 0) {
        console.log("\u{1F5BC}\uFE0F No media properties found to validate");
        return;
      }
      console.log("\u{1F5BC}\uFE0F Found media properties to validate:", Object.keys(mediaProperties));
      for (const [propKey, propValue] of Object.entries(mediaProperties)) {
        if (!propValue || typeof propValue !== "string" || !propValue.trim()) continue;
        console.log(`\u{1F50D} Validating media property: ${propKey} = "${propValue}"`);
        let validationResult = this.validateMediaProperty(propKey, propValue, componentMediaData);
        if (validationResult.isValid) {
          console.log(`\u2705 ${propKey} \u2192 would set to "${propValue}" (${validationResult.targetType}: "${validationResult.targetName}")`);
        } else {
          console.warn(`\u274C Invalid media property: "${propKey}" = "${propValue}" - ${validationResult.reason}`);
          if ((_a = validationResult.suggestions) == null ? void 0 : _a.length) {
            console.log(`\u{1F4A1} Available media slots: ${validationResult.suggestions.join(", ")}`);
          }
        }
      }
    }
    /**
     * Get media structure data for a component instance from scan results
     */
    static async getComponentMediaData(instance) {
      try {
        const mainComponent = await instance.getMainComponentAsync();
        if (!mainComponent) {
          console.warn("Could not get main component from instance");
          return null;
        }
        console.log("\u{1F50D} Looking for media data for main component ID:", mainComponent.id);
        const scanResults = await figma.clientStorage.getAsync("last-scan-results");
        if (!scanResults || !Array.isArray(scanResults)) {
          console.warn("No scan results found in storage");
          return null;
        }
        console.log("\u{1F50D} Available component IDs in scan data:", scanResults.map((c) => c.id));
        const componentInfo = scanResults.find((comp) => comp.id === mainComponent.id);
        if (!componentInfo) {
          console.warn(`Component ${mainComponent.id} not found in scan results`);
          return null;
        }
        console.log("\u{1F50D} Found component info:", componentInfo.name);
        console.log("\u{1F50D} Component instances:", componentInfo.componentInstances);
        console.log("\u{1F50D} Vector nodes:", componentInfo.vectorNodes);
        console.log("\u{1F50D} Image nodes:", componentInfo.imageNodes);
        return {
          componentInstances: componentInfo.componentInstances || [],
          vectorNodes: componentInfo.vectorNodes || [],
          imageNodes: componentInfo.imageNodes || []
        };
      } catch (error) {
        console.warn("Could not get media data:", error);
        return null;
      }
    }
    /**
     * Validate a media property against available media slots in scan data
     */
    static validateMediaProperty(propKey, propValue, mediaData) {
      if (!mediaData) {
        return {
          isValid: false,
          reason: "No media scan data available"
        };
      }
      const { componentInstances, vectorNodes, imageNodes } = mediaData;
      const allMediaSlots = [
        ...componentInstances.map((c) => ({ name: c.nodeName, type: "component-instance" })),
        ...vectorNodes.map((v) => ({ name: v.nodeName, type: "vector-node" })),
        ...imageNodes.map((i) => ({ name: i.nodeName, type: "image-node" }))
      ];
      if (allMediaSlots.length === 0) {
        return {
          isValid: false,
          reason: "No media slots found in component"
        };
      }
      const exactMatch = allMediaSlots.find(
        (slot) => slot.name.toLowerCase() === propKey.toLowerCase() || slot.name.toLowerCase().replace(/\s+/g, "-") === propKey.toLowerCase()
      );
      if (exactMatch) {
        return {
          isValid: true,
          targetType: exactMatch.type,
          targetName: exactMatch.name
        };
      }
      const partialMatch = allMediaSlots.find(
        (slot) => slot.name.toLowerCase().includes(propKey.toLowerCase()) || propKey.toLowerCase().includes(slot.name.toLowerCase())
      );
      if (partialMatch) {
        return {
          isValid: true,
          targetType: partialMatch.type,
          targetName: partialMatch.name
        };
      }
      const semanticMatch = this.findSemanticMediaMatch(propKey, allMediaSlots);
      if (semanticMatch) {
        return {
          isValid: true,
          targetType: semanticMatch.type,
          targetName: semanticMatch.name
        };
      }
      return {
        isValid: false,
        reason: `No matching media slot found for "${propKey}"`,
        suggestions: allMediaSlots.map((slot) => slot.name)
      };
    }
    /**
     * Find semantic matches for media properties using intelligent classification
     */
    static findSemanticMediaMatch(propKey, mediaSlots) {
      const keyLower = propKey.toLowerCase();
      const classifications = this.classifyMediaSlots(mediaSlots);
      if (keyLower.includes("avatar") || keyLower.includes("profile") || keyLower.includes("user")) {
        return classifications.avatars[0] || classifications.images[0] || classifications.circles[0] || null;
      }
      if (keyLower.includes("icon") && !keyLower.includes("leading") && !keyLower.includes("trailing")) {
        return classifications.icons[0] || classifications.vectors[0] || classifications.smallImages[0] || null;
      }
      if (keyLower.includes("image") || keyLower.includes("photo") || keyLower.includes("picture")) {
        return classifications.images[0] || classifications.rectangularImages[0] || classifications.avatars[0] || null;
      }
      if (keyLower.includes("logo") || keyLower.includes("brand")) {
        return classifications.logos[0] || classifications.vectors[0] || classifications.images[0] || null;
      }
      if (keyLower.includes("badge") || keyLower.includes("indicator") || keyLower.includes("status")) {
        return classifications.badges[0] || classifications.smallImages[0] || classifications.vectors[0] || null;
      }
      if (keyLower.includes("leading") || keyLower.includes("start") || keyLower.includes("left")) {
        const positionMatch = this.findByPosition(mediaSlots, "leading");
        if (positionMatch) return positionMatch;
        return classifications.icons[0] || classifications.vectors[0] || null;
      }
      if (keyLower.includes("trailing") || keyLower.includes("end") || keyLower.includes("right")) {
        const positionMatch = this.findByPosition(mediaSlots, "trailing");
        if (positionMatch) return positionMatch;
        return classifications.icons[0] || classifications.vectors[0] || null;
      }
      if (keyLower.includes("large") || keyLower.includes("big") || keyLower.includes("cover")) {
        return classifications.largeImages[0] || classifications.images[0] || null;
      }
      if (keyLower.includes("small") || keyLower.includes("mini") || keyLower.includes("thumb")) {
        return classifications.smallImages[0] || classifications.icons[0] || classifications.vectors[0] || null;
      }
      if (keyLower.includes("icon")) {
        return classifications.vectors[0] || classifications.icons[0] || null;
      }
      return null;
    }
    /**
     * Classify media slots into semantic categories based on names and types
     */
    static classifyMediaSlots(mediaSlots) {
      const classifications = {
        avatars: [],
        icons: [],
        images: [],
        vectors: [],
        badges: [],
        logos: [],
        smallImages: [],
        largeImages: [],
        circles: [],
        rectangularImages: []
      };
      mediaSlots.forEach((slot) => {
        const nameLower = slot.name.toLowerCase();
        if (nameLower.includes("avatar") || nameLower.includes("profile") || nameLower.includes("user") || nameLower.includes("person") || nameLower.includes("selfie") || nameLower.includes("face") || nameLower.includes("man") || nameLower.includes("woman") || nameLower.includes("people") || slot.type === "image-node" && nameLower.includes("photo")) {
          classifications.avatars.push(slot);
        } else if (nameLower.includes("icon") || nameLower.includes("symbol") || nameLower.includes("pictogram") || slot.type === "vector-node" && nameLower.length < 10) {
          classifications.icons.push(slot);
        } else if (nameLower.includes("badge") || nameLower.includes("indicator") || nameLower.includes("status") || nameLower.includes("notification") || nameLower.includes("dot") || nameLower.includes("alert")) {
          classifications.badges.push(slot);
        } else if (nameLower.includes("logo") || nameLower.includes("brand") || nameLower.includes("company")) {
          classifications.logos.push(slot);
        } else if (slot.type === "vector-node") {
          classifications.vectors.push(slot);
        } else if (slot.type === "image-node" || nameLower.includes("image") || nameLower.includes("picture") || nameLower.includes("photo")) {
          classifications.images.push(slot);
          if (nameLower.includes("small") || nameLower.includes("mini") || nameLower.includes("thumb")) {
            classifications.smallImages.push(slot);
          } else if (nameLower.includes("large") || nameLower.includes("big") || nameLower.includes("cover")) {
            classifications.largeImages.push(slot);
          }
          if (nameLower.includes("circle") || nameLower.includes("round")) {
            classifications.circles.push(slot);
          } else {
            classifications.rectangularImages.push(slot);
          }
        } else if (slot.type === "component-instance") {
          classifications.images.push(slot);
        }
      });
      return classifications;
    }
    /**
     * Find media slots by position keywords
     */
    static findByPosition(mediaSlots, position) {
      const positionKeywords = position === "leading" ? ["leading", "start", "left", "first", "begin"] : ["trailing", "end", "right", "last", "final"];
      return mediaSlots.find(
        (slot) => positionKeywords.some(
          (keyword) => slot.name.toLowerCase().includes(keyword)
        )
      ) || null;
    }
    /**
     * Sanitize and clean property names and values
     */
    static sanitizeProperties(properties) {
      if (!properties) return {};
      return Object.entries(properties).reduce((acc, [key, value]) => {
        const cleanKey = key.replace(/\s+/g, "-");
        if (key.toLowerCase().includes("text") && value !== null && value !== void 0) {
          acc[cleanKey] = String(value);
        } else {
          acc[cleanKey] = value;
        }
        return acc;
      }, {});
    }
    /**
     * Separate variant properties from regular properties
     */
    static separateVariantsFromProperties(properties, componentId) {
      if (!properties) return { cleanProperties: {}, variants: {} };
      const cleanProperties = {};
      const variants = {};
      const knownTextProperties = ["text", "supporting-text", "trailing-text", "headline", "subtitle", "value"];
      const knownLayoutProperties = ["horizontalSizing", "verticalSizing", "layoutAlign", "layoutGrow"];
      const variantPropertyNames = [
        "condition",
        "Condition",
        "leading",
        "Leading",
        "trailing",
        "Trailing",
        "state",
        "State",
        "style",
        "Style",
        "size",
        "Size",
        "type",
        "Type",
        "emphasis",
        "Emphasis",
        "variant",
        "Variant"
      ];
      Object.entries(properties).forEach(([key, value]) => {
        if (key === "variants") {
          Object.assign(variants, value);
          console.log(`\u{1F527} Found existing variants object:`, value);
          return;
        }
        if (knownTextProperties.some((prop) => key.toLowerCase().includes(prop.toLowerCase()))) {
          cleanProperties[key] = value;
          return;
        }
        if (knownLayoutProperties.some((prop) => key.toLowerCase().includes(prop.toLowerCase()))) {
          cleanProperties[key] = value;
          return;
        }
        if (variantPropertyNames.includes(key)) {
          const properKey = key.charAt(0).toUpperCase() + key.slice(1);
          variants[properKey] = value;
          console.log(`\u{1F527} Moved "${key}" -> "${properKey}" from properties to variants`);
          return;
        }
        cleanProperties[key] = value;
      });
      console.log(`\u{1F50D} Final separation for ${componentId}:`);
      console.log(`   Clean properties:`, cleanProperties);
      console.log(`   Variants:`, variants);
      return { cleanProperties, variants };
    }
    /**
     * Apply child layout properties for auto-layout items
     */
    static applyChildLayoutProperties(node, properties) {
      if (!properties) return;
      if (properties.layoutAlign) {
        node.layoutAlign = properties.layoutAlign;
      } else if (properties.horizontalSizing === "FILL") {
        node.layoutAlign = "STRETCH";
      }
      if (properties.layoutGrow !== void 0) {
        node.layoutGrow = properties.layoutGrow;
      } else if (properties.horizontalSizing === "FILL") {
        const parent = node.parent;
        if (parent && "layoutMode" in parent && parent.layoutMode === "HORIZONTAL") {
          node.layoutGrow = 1;
        }
      }
      if (properties.layoutPositioning) {
        node.layoutPositioning = properties.layoutPositioning;
      }
      if (properties.minWidth !== void 0 && "minWidth" in node) {
        node.minWidth = properties.minWidth;
      }
      if (properties.maxWidth !== void 0 && "maxWidth" in node) {
        node.maxWidth = properties.maxWidth;
      }
      if (properties.minHeight !== void 0 && "minHeight" in node) {
        node.minHeight = properties.minHeight;
      }
      if (properties.maxHeight !== void 0 && "maxHeight" in node) {
        node.maxHeight = properties.maxHeight;
      }
    }
    /**
     * Modify existing UI frame by replacing its content
     */
    static async modifyExistingUI(modifiedJSON, frameId) {
      try {
        const existingFrame = await figma.getNodeByIdAsync(frameId);
        if (existingFrame && existingFrame.type === "FRAME") {
          for (let i = existingFrame.children.length - 1; i >= 0; i--) {
            existingFrame.children[i].remove();
          }
          await this.generateUIFromData(modifiedJSON, existingFrame);
          figma.notify("UI updated successfully!", { timeout: 2e3 });
          return existingFrame;
        } else {
          throw new Error("Target frame for modification not found.");
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        figma.notify("Modification error: " + errorMessage, { error: true });
        console.error("\u274C modifyExistingUI error:", e);
        return null;
      }
    }
  };

  // src/ai/gemini-api.ts
  var _GeminiAPI = class _GeminiAPI {
    constructor(config) {
      this.config = __spreadValues(__spreadValues({}, _GeminiAPI.DEFAULT_CONFIG), config);
      if (!this.config.apiKey) {
        throw new Error("Gemini API key is required");
      }
    }
    /**
     * Main method to generate JSON from prompt
     */
    async generateJSON(request) {
      console.log("\u{1F916} Starting Gemini API call for JSON generation");
      try {
        const response = await this.callAPIWithRetry(request);
        if (response.success && response.content) {
          const validatedJSON = this.validateAndExtractJSON(response.content);
          if (validatedJSON) {
            response.content = validatedJSON;
            console.log("\u2705 Valid JSON generated and validated");
          } else {
            console.warn("\u26A0\uFE0F Generated content is not valid JSON, returning raw response");
          }
        }
        return response;
      } catch (error) {
        console.error("\u274C Gemini API call failed:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown API error"
        };
      }
    }
    /**
     * Generate UI modification suggestions
     */
    async modifyExistingUI(originalJSON, modificationRequest, systemPrompt) {
      console.log("\u{1F504} Starting UI modification with Gemini");
      const prompt = `You are tasked with modifying an existing UI JSON structure based on user feedback.

ORIGINAL JSON:
${originalJSON}

MODIFICATION REQUEST:
${modificationRequest}

Please provide the complete modified JSON structure. Make sure to:
1. Keep the same overall structure
2. Maintain all existing componentNodeId values
3. Only modify the requested elements
4. Ensure all JSON is valid and complete

Return ONLY the modified JSON, no explanation needed.`;
      const request = {
        prompt,
        systemPrompt,
        temperature: 0.3
        // Lower temperature for more consistent modifications
      };
      return this.generateJSON(request);
    }
    /**
     * Call API with retry logic
     */
    async callAPIWithRetry(request) {
      let lastError = null;
      for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            console.log(`\u{1F504} Retry attempt ${attempt}/${this.config.maxRetries}`);
            await this.delay(this.config.retryDelay * attempt);
          }
          const response = await this.makeAPICall(request);
          response.retryCount = attempt;
          return response;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error("Unknown error");
          const apiError = this.parseAPIError(lastError);
          console.error(`\u274C API call attempt ${attempt + 1} failed:`, apiError.message);
          if (!apiError.retryable || attempt === this.config.maxRetries) {
            return {
              success: false,
              error: apiError.message,
              retryCount: attempt
            };
          }
        }
      }
      return {
        success: false,
        error: (lastError == null ? void 0 : lastError.message) || "Max retries exceeded",
        retryCount: this.config.maxRetries
      };
    }
    /**
     * Make actual API call to Gemini
     */
    async makeAPICall(request) {
      var _a, _b;
      const url = `${_GeminiAPI.API_BASE_URL}/${this.config.model}:generateContent?key=${this.config.apiKey}`;
      const systemInstruction = request.systemPrompt ? {
        role: "system",
        parts: [{ text: request.systemPrompt }]
      } : null;
      const requestBody = {
        contents: [
          ...systemInstruction ? [systemInstruction] : [],
          {
            role: "user",
            parts: [{ text: request.prompt + (request.context ? `

Context: ${request.context}` : "") }]
          }
        ],
        generationConfig: {
          temperature: (_a = request.temperature) != null ? _a : 0.7,
          maxOutputTokens: (_b = request.maxTokens) != null ? _b : 4e3,
          topK: 40,
          topP: 0.95
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_ONLY_HIGH"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_ONLY_HIGH"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_ONLY_HIGH"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_ONLY_HIGH"
          }
        ]
      };
      console.log("\u{1F4E1} Making API call to Gemini...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        if (!data.candidates || data.candidates.length === 0) {
          throw new Error("No candidates returned from API");
        }
        const candidate = data.candidates[0];
        if (candidate.finishReason === "SAFETY") {
          throw new Error("Content was blocked by safety filters");
        }
        if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
          throw new Error("No content in API response");
        }
        const content = candidate.content.parts[0].text;
        console.log("\u2705 Gemini API call successful");
        return {
          success: true,
          content: content.trim(),
          usage: data.usageMetadata ? {
            promptTokens: data.usageMetadata.promptTokenCount || 0,
            completionTokens: data.usageMetadata.candidatesTokenCount || 0,
            totalTokens: data.usageMetadata.totalTokenCount || 0
          } : void 0
        };
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    }
    /**
     * Parse and categorize API errors
     */
    parseAPIError(error) {
      const message = error.message.toLowerCase();
      if (message.includes("quota") || message.includes("rate limit") || message.includes("429")) {
        return {
          code: "RATE_LIMIT",
          message: "Rate limit exceeded. Please try again later.",
          retryable: true
        };
      }
      if (message.includes("401") || message.includes("unauthorized") || message.includes("api key")) {
        return {
          code: "AUTH_ERROR",
          message: "Invalid API key or authentication failed.",
          retryable: false
        };
      }
      if (message.includes("timeout") || message.includes("network") || message.includes("fetch")) {
        return {
          code: "NETWORK_ERROR",
          message: "Network error or timeout. Please check your connection.",
          retryable: true
        };
      }
      if (message.includes("500") || message.includes("502") || message.includes("503")) {
        return {
          code: "SERVER_ERROR",
          message: "Server error. Please try again later.",
          retryable: true
        };
      }
      if (message.includes("safety") || message.includes("blocked")) {
        return {
          code: "CONTENT_FILTERED",
          message: "Content was blocked by safety filters.",
          retryable: false
        };
      }
      return {
        code: "UNKNOWN_ERROR",
        message: error.message,
        retryable: true
      };
    }
    /**
     * Validate and extract JSON from response
     */
    validateAndExtractJSON(content) {
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;
        const jsonString = jsonMatch[0];
        JSON.parse(jsonString);
        return jsonString;
      } catch (e) {
        return null;
      }
    }
    /**
     * Simple delay utility
     */
    delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * Update API configuration
     */
    updateConfig(newConfig) {
      this.config = __spreadValues(__spreadValues({}, this.config), newConfig);
    }
    /**
     * Get current configuration (without API key for security)
     */
    getConfig() {
      const _a = this.config, { apiKey } = _a, safeConfig = __objRest(_a, ["apiKey"]);
      return safeConfig;
    }
    /**
     * Test API connection
     */
    async testConnection() {
      var _a;
      try {
        const testRequest = {
          prompt: 'Say "Hello, API connection successful!" and nothing else.',
          temperature: 0
        };
        const response = await this.makeAPICall(testRequest);
        return response.success && (((_a = response.content) == null ? void 0 : _a.includes("Hello, API connection successful!")) || false);
      } catch (e) {
        return false;
      }
    }
    /**
     * Static method to create instance from stored API key
     */
    static async createFromStorage() {
      try {
        const apiKey = await figma.clientStorage.getAsync("geminiApiKey");
        if (!apiKey) return null;
        return new _GeminiAPI({ apiKey });
      } catch (e) {
        return null;
      }
    }
  };
  _GeminiAPI.DEFAULT_CONFIG = {
    model: "gemini-1.5-flash",
    maxRetries: 3,
    retryDelay: 1e3,
    timeout: 3e4
  };
  _GeminiAPI.API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
  var GeminiAPI = _GeminiAPI;

  // src/core/validation-engine.ts
  var _ValidationEngine = class _ValidationEngine {
    constructor(config) {
      this.config = __spreadValues(__spreadValues({}, _ValidationEngine.DEFAULT_CONFIG), config);
    }
    /**
     * Main validation method - comprehensive quality check
     */
    async validateJSON(jsonString, originalPrompt) {
      console.log("\u{1F50D} Starting comprehensive JSON validation...");
      const errors = [];
      const warnings = [];
      const suggestions = [];
      try {
        const layoutData = JSON.parse(jsonString);
        if (this.config.enableStructuralValidation) {
          const structuralResult = await this.validateStructure(layoutData);
          errors.push(...structuralResult.errors);
          warnings.push(...structuralResult.warnings);
        }
        if (this.config.enableComponentValidation) {
          const componentResult = await this.validateComponents(layoutData);
          errors.push(...componentResult.errors);
          warnings.push(...componentResult.warnings);
        }
        if (this.config.enableAIValidation && originalPrompt) {
          const aiResult = await this.performAIValidation(layoutData, originalPrompt);
          if (aiResult) {
            errors.push(...aiResult.errors || []);
            warnings.push(...aiResult.warnings || []);
            suggestions.push(...aiResult.suggestions || []);
          }
        }
        const qualityMetrics = this.calculateQualityMetrics(layoutData, errors, warnings);
        const score = qualityMetrics.overallScore;
        const isValid = errors.filter((e) => e.severity === "critical" || e.severity === "high").length === 0 && score >= this.config.qualityThreshold;
        console.log(`\u{1F4CA} Validation complete: ${isValid ? "\u2705 PASSED" : "\u274C FAILED"} (Score: ${(score * 100).toFixed(1)}%)`);
        return {
          isValid,
          score,
          errors,
          warnings,
          suggestions,
          autoFixAvailable: this.hasAutoFixableErrors(errors)
        };
      } catch (parseError) {
        console.error("\u274C JSON parsing failed during validation:", parseError);
        return {
          isValid: false,
          score: 0,
          errors: [{
            code: "JSON_PARSE_ERROR",
            message: "Invalid JSON syntax",
            path: "root",
            severity: "critical",
            fixable: false
          }],
          warnings: [],
          suggestions: ["Check JSON syntax for missing brackets, commas, or quotes"],
          autoFixAvailable: false
        };
      }
    }
    /**
     * Validate with retry logic - attempts to fix and re-validate
     */
    async validateWithRetry(jsonString, originalPrompt, geminiAPI) {
      let currentJSON = jsonString;
      let retryCount = 0;
      for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
        const result = await this.validateJSON(currentJSON, originalPrompt);
        if (result.isValid || !geminiAPI || !this.config.autoFixEnabled) {
          return { result, finalJSON: currentJSON, retryCount: attempt };
        }
        if (result.autoFixAvailable && attempt < this.config.maxRetries) {
          console.log(`\u{1F527} Attempting auto-fix (retry ${attempt + 1}/${this.config.maxRetries})`);
          const fixedJSON = await this.attemptAutoFix(currentJSON, result, originalPrompt != null ? originalPrompt : "", geminiAPI);
          if (fixedJSON && fixedJSON !== currentJSON) {
            currentJSON = fixedJSON;
            retryCount = attempt + 1;
            continue;
          }
        }
        return { result, finalJSON: currentJSON, retryCount: attempt };
      }
      const finalResult = await this.validateJSON(currentJSON, originalPrompt);
      return { result: finalResult, finalJSON: currentJSON, retryCount: this.config.maxRetries };
    }
    /**
     * Structural validation - check JSON schema and required fields
     */
    async validateStructure(layoutData) {
      const errors = [];
      const warnings = [];
      if (!layoutData.layoutContainer && !layoutData.items) {
        errors.push({
          code: "MISSING_ROOT_STRUCTURE",
          message: "JSON must have either layoutContainer or items array",
          path: "root",
          severity: "critical",
          fixable: true
        });
      }
      if (layoutData.layoutContainer) {
        const container = layoutData.layoutContainer;
        if (!container.layoutMode || !["VERTICAL", "HORIZONTAL", "NONE"].includes(container.layoutMode)) {
          errors.push({
            code: "INVALID_LAYOUT_MODE",
            message: "layoutMode must be VERTICAL, HORIZONTAL, or NONE",
            path: "layoutContainer.layoutMode",
            severity: "high",
            fixable: true
          });
        }
        if (container.width && (typeof container.width !== "number" || container.width <= 0)) {
          warnings.push({
            code: "INVALID_WIDTH",
            message: "Width should be a positive number",
            path: "layoutContainer.width",
            suggestion: "Use a positive number like 360 for mobile or 1200 for desktop"
          });
        }
      }
      if (layoutData.items && Array.isArray(layoutData.items)) {
        layoutData.items.forEach((item, index) => {
          this.validateItem(item, `items[${index}]`, errors, warnings);
        });
      }
      return { errors, warnings };
    }
    /**
     * Validate individual items in the layout
     */
    validateItem(item, path, errors, warnings) {
      if (!item.type) {
        errors.push({
          code: "MISSING_TYPE",
          message: "Each item must have a type field",
          path: `${path}.type`,
          severity: "critical",
          fixable: false
        });
        return;
      }
      const nativeTypes = ["native-text", "text", "native-rectangle", "native-circle", "layoutContainer"];
      const isNative = nativeTypes.includes(item.type);
      if (!isNative && !item.componentNodeId) {
        errors.push({
          code: "MISSING_COMPONENT_ID",
          message: "Non-native items must have a componentNodeId",
          path: `${path}.componentNodeId`,
          severity: "high",
          fixable: true
        });
      }
      if (item.componentNodeId && !item.componentNodeId.match(/^[0-9]+:[0-9]+$/)) {
        warnings.push({
          code: "INVALID_COMPONENT_ID_FORMAT",
          message: 'componentNodeId should follow format "number:number"',
          path: `${path}.componentNodeId`,
          suggestion: "Use IDs from your design system scan"
        });
      }
      if (item.properties) {
        this.validateProperties(item.properties, `${path}.properties`, warnings);
      }
      if (item.items && Array.isArray(item.items)) {
        item.items.forEach((nestedItem, index) => {
          this.validateItem(nestedItem, `${path}.items[${index}]`, errors, warnings);
        });
      }
    }
    /**
     * Validate properties object
     */
    validateProperties(properties, path, warnings) {
      if (properties.variants && typeof properties.variants !== "object") {
        warnings.push({
          code: "INVALID_VARIANTS_TYPE",
          message: "variants should be an object",
          path: `${path}.variants`,
          suggestion: 'Use {"Condition": "1-line", "Leading": "Icon"} format'
        });
      }
      const variantProperties = ["Condition", "Leading", "Trailing", "State", "Style", "Size", "Type"];
      const hasVariantProps = variantProperties.some((prop) => properties.hasOwnProperty(prop));
      if (hasVariantProps && !properties.variants) {
        warnings.push({
          code: "VARIANTS_NOT_GROUPED",
          message: "Variant properties should be inside a variants object",
          path,
          suggestion: 'Move variant properties like "Condition", "Leading" into a variants object'
        });
      }
    }
    /**
     * Component validation - check if referenced components exist
     */
    async validateComponents(layoutData) {
      const errors = [];
      const warnings = [];
      try {
        const scanResults = await figma.clientStorage.getAsync("last-scan-results");
        if (!scanResults || !Array.isArray(scanResults)) {
          warnings.push({
            code: "NO_SCAN_RESULTS",
            message: "No design system scan results found",
            path: "validation",
            suggestion: "Run a design system scan to validate component references"
          });
          return { errors, warnings };
        }
        const availableComponentIds = new Set(
          scanResults.map((comp) => comp.id).filter((id) => id && typeof id === "string")
        );
        const usedComponentIds = this.extractComponentIds(layoutData);
        usedComponentIds.forEach((componentRef) => {
          if (componentRef.id && !availableComponentIds.has(componentRef.id)) {
            errors.push({
              code: "COMPONENT_NOT_FOUND",
              message: `Component with ID "${componentRef.id}" not found in design system`,
              path: componentRef.path,
              severity: "high",
              fixable: true
            });
          }
        });
      } catch (error) {
        console.error("\u274C Component validation failed:", error);
        warnings.push({
          code: "COMPONENT_VALIDATION_ERROR",
          message: "Could not validate component references",
          path: "validation",
          suggestion: "Check if design system scan is available"
        });
      }
      return { errors, warnings };
    }
    /**
     * AI-powered validation using LLM to check design quality
     */
    async performAIValidation(layoutData, originalPrompt) {
      try {
        const geminiAPI = await GeminiAPI.createFromStorage();
        if (!geminiAPI) return null;
        const validationPrompt = `You are a UX design expert. Please analyze this JSON layout and provide feedback.

ORIGINAL USER REQUEST:
${originalPrompt}

GENERATED JSON:
${JSON.stringify(layoutData, null, 2)}

Please evaluate:
1. Does the JSON match the user's request?
2. Are there any UX problems or missing elements?
3. Is the layout logical and well-structured?
4. Any suggestions for improvement?

Respond in this format:
EVALUATION: [Pass/Fail]
SCORE: [0-100]
ISSUES: [List any problems]
SUGGESTIONS: [List improvements]`;
        const request = {
          prompt: validationPrompt,
          temperature: 0.3
        };
        const response = await geminiAPI.generateJSON(request);
        if (!response.success || !response.content) return null;
        const feedback = response.content || "";
        const suggestions = [];
        if (feedback.includes("SUGGESTIONS:")) {
          const suggestionsSection = feedback.split("SUGGESTIONS:")[1];
          if (suggestionsSection && suggestionsSection.trim()) {
            suggestions.push(suggestionsSection.trim());
          }
        }
        return { suggestions };
      } catch (error) {
        console.error("\u274C AI validation failed:", error);
        return null;
      }
    }
    /**
     * Calculate quality metrics
     */
    calculateQualityMetrics(layoutData, errors, warnings) {
      const criticalErrors = errors.filter((e) => e.severity === "critical").length;
      const highErrors = errors.filter((e) => e.severity === "high").length;
      const mediumErrors = errors.filter((e) => e.severity === "medium").length;
      const warningCount = warnings.length;
      const structuralIntegrity = Math.max(0, 1 - (criticalErrors * 0.5 + highErrors * 0.3 + mediumErrors * 0.1));
      const componentErrors = errors.filter((e) => e.code.includes("COMPONENT")).length;
      const componentConsistency = Math.max(0, 1 - componentErrors * 0.2);
      const variantErrors = errors.filter((e) => e.code.includes("VARIANT")).length;
      const designSystemCompliance = Math.max(0, 1 - variantErrors * 0.15);
      const usabilityScore = Math.max(0, 1 - warningCount * 0.1);
      const overallScore = structuralIntegrity * 0.4 + componentConsistency * 0.3 + designSystemCompliance * 0.2 + usabilityScore * 0.1;
      return {
        structuralIntegrity,
        componentConsistency,
        designSystemCompliance,
        usabilityScore,
        overallScore: Math.max(0, Math.min(1, overallScore))
      };
    }
    /**
     * Extract all component IDs from layout data - FIXED: Proper type safety
     */
    extractComponentIds(layoutData, basePath = "root") {
      const componentIds = [];
      const traverse = (obj, currentPath) => {
        if (obj && typeof obj === "object") {
          if (obj.componentNodeId && typeof obj.componentNodeId === "string") {
            componentIds.push({
              id: obj.componentNodeId,
              path: currentPath
            });
          }
          if (Array.isArray(obj.items)) {
            obj.items.forEach((item, index) => {
              traverse(item, `${currentPath}.items[${index}]`);
            });
          }
          if (obj.layoutContainer) {
            traverse(obj.layoutContainer, `${currentPath}.layoutContainer`);
          }
        }
      };
      traverse(layoutData, basePath);
      return componentIds;
    }
    /**
     * Check if errors can be auto-fixed
     */
    hasAutoFixableErrors(errors) {
      return errors.some((error) => error.fixable);
    }
    /**
     * Attempt to auto-fix validation errors
     */
    async attemptAutoFix(jsonString, validationResult, originalPrompt, geminiAPI) {
      try {
        const fixableErrors = validationResult.errors.filter((e) => e.fixable);
        if (fixableErrors.length === 0) return null;
        const errorDescriptions = fixableErrors.map((e) => `${e.code}: ${e.message} (at ${e.path})`).join("\n");
        const fixPrompt = `The following JSON has validation errors that need to be fixed:

ORIGINAL JSON:
${jsonString}

ERRORS TO FIX:
${errorDescriptions}

Please provide the corrected JSON that fixes these errors while maintaining the original intent. Return ONLY the corrected JSON, no explanations.`;
        const request = {
          prompt: fixPrompt,
          temperature: 0.1
          // Very low temperature for consistent fixes
        };
        const response = await geminiAPI.generateJSON(request);
        if (response.success && response.content && response.content.trim()) {
          console.log("\u{1F527} Auto-fix attempt completed");
          return response.content;
        }
        return null;
      } catch (error) {
        console.error("\u274C Auto-fix failed:", error);
        return null;
      }
    }
    /**
     * Get validation summary for UI display
     */
    getValidationSummary(result) {
      const { score, errors, warnings } = result;
      const scorePercent = Math.round(score * 100);
      const criticalCount = errors.filter((e) => e.severity === "critical").length;
      const highCount = errors.filter((e) => e.severity === "high").length;
      if (result.isValid) {
        return `\u2705 Quality Score: ${scorePercent}% ${warnings.length > 0 ? `(${warnings.length} suggestions)` : ""}`;
      } else {
        const errorSummary = criticalCount > 0 ? `${criticalCount} critical` : `${highCount} high priority`;
        return `\u274C Quality Score: ${scorePercent}% (${errorSummary} issues)`;
      }
    }
    /**
     * Update validation configuration
     */
    updateConfig(newConfig) {
      this.config = __spreadValues(__spreadValues({}, this.config), newConfig);
    }
  };
  _ValidationEngine.DEFAULT_CONFIG = {
    enableAIValidation: true,
    enableStructuralValidation: true,
    enableComponentValidation: true,
    qualityThreshold: 0.7,
    maxRetries: 2,
    autoFixEnabled: true
  };
  var ValidationEngine = _ValidationEngine;

  // code.ts
  var validationEngine;
  async function navigateToComponent(componentId, pageName) {
    try {
      const node = await figma.getNodeByIdAsync(componentId);
      if (!node) {
        figma.notify("Component not found", { error: true });
        return;
      }
      if (pageName) {
        const targetPage = figma.root.children.find((p) => p.name === pageName);
        if (targetPage && targetPage.id !== figma.currentPage.id) {
          figma.currentPage = targetPage;
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
      figma.currentPage.selection = [node];
      figma.viewport.scrollAndZoomIntoView([node]);
      figma.notify(`Navigated to: ${node.name}`, { timeout: 2e3 });
    } catch (e) {
      figma.notify("Navigation error", { error: true });
      console.error("\u274C Navigation error:", e);
    }
  }
  async function generateUIFromAPI(prompt, systemPrompt, enableValidation = true) {
    try {
      const geminiAPI = await GeminiAPI.createFromStorage();
      if (!geminiAPI) {
        throw new Error("No API key found. Please configure your Gemini API key first.");
      }
      const request = {
        prompt,
        systemPrompt,
        temperature: 0.7
      };
      console.log("\u{1F916} Calling Gemini API for UI generation...");
      const response = await geminiAPI.generateJSON(request);
      if (!response.success) {
        throw new Error(response.error || "API call failed");
      }
      if (!response.content) {
        throw new Error("No content received from API");
      }
      let finalJSON = response.content;
      let validationResult;
      let retryCount = 0;
      if (enableValidation && validationEngine) {
        console.log("\u{1F50D} Validating generated JSON...");
        const validationData = await validationEngine.validateWithRetry(
          response.content,
          prompt,
          geminiAPI
        );
        validationResult = validationData.result;
        finalJSON = validationData.finalJSON;
        retryCount = validationData.retryCount;
        console.log(`\u{1F4CA} Validation complete: ${validationEngine.getValidationSummary(validationResult)}`);
        if (validationResult.isValid) {
          if (retryCount > 0) {
            figma.notify(`\u2705 Generated with ${retryCount} auto-fixes applied`, { timeout: 3e3 });
          }
        } else {
          const summary = validationEngine.getValidationSummary(validationResult);
          figma.notify(`\u26A0\uFE0F ${summary}`, { timeout: 4e3 });
        }
      }
      const layoutData = JSON.parse(finalJSON);
      return { layoutData, validationResult, finalJSON, retryCount };
    } catch (error) {
      console.error("\u274C API-driven generation failed:", error);
      throw error;
    }
  }
  async function initializeSession() {
    console.log("\u{1F504} Initializing session...");
    try {
      validationEngine = new ValidationEngine({
        enableAIValidation: true,
        enableStructuralValidation: true,
        enableComponentValidation: true,
        qualityThreshold: 0.7,
        maxRetries: 2,
        autoFixEnabled: true
      });
      console.log("\u2705 Validation engine initialized");
      const hasSession = await SessionService.hasCurrentSession();
      if (hasSession) {
        const currentSession = await SessionService.getCurrentSession();
        if (currentSession) {
          console.log("\u2705 Found active session for restoration");
          const sessionForUI = SessionService.formatSessionForUI(currentSession);
          figma.ui.postMessage({
            type: "session-found",
            session: sessionForUI,
            currentFileId: figma.fileKey || figma.root.id
          });
        }
      }
      const savedApiKey = await figma.clientStorage.getAsync("geminiApiKey");
      if (savedApiKey) {
        console.log("\u2705 API key found in storage");
        figma.ui.postMessage({
          type: "api-key-loaded",
          payload: savedApiKey
        });
      }
      const savedScan = await DesignSystemScannerService.getScanSession();
      const currentFileKey = figma.fileKey || figma.root.id;
      if (savedScan && savedScan.components && savedScan.components.length > 0) {
        if (savedScan.fileKey === currentFileKey) {
          console.log(`\u2705 Design system loaded: ${savedScan.components.length} components`);
          figma.ui.postMessage({
            type: "saved-scan-loaded",
            components: savedScan.components,
            scanTime: savedScan.scanTime
          });
        } else {
          console.log("\u2139\uFE0F Scan from different file, clearing cache");
          await DesignSystemScannerService.clearScanData();
        }
      } else {
        console.log("\u2139\uFE0F No saved design system found");
      }
    } catch (error) {
      console.error("\u274C Error loading session:", error);
    }
  }
  async function main() {
    console.log("\u{1F680} AIDesigner plugin started");
    figma.showUI(__html__, { width: 400, height: 720 });
    await initializeSession();
    figma.ui.onmessage = async (msg) => {
      console.log("\u{1F4E8} Message from UI:", msg.type);
      switch (msg.type) {
        case "generate-ui-from-json":
          try {
            const layoutData = JSON.parse(msg.payload);
            const newFrame = await FigmaRenderer.generateUIFromDataDynamic(layoutData);
            if (newFrame) {
              figma.ui.postMessage({
                type: "ui-generated-success",
                frameId: newFrame.id,
                generatedJSON: layoutData
              });
            }
          } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            figma.notify("JSON parsing error: " + errorMessage, { error: true });
            figma.ui.postMessage({ type: "ui-generation-error", error: errorMessage });
          }
          break;
        // ENHANCED: API-driven UI generation with validation
        case "generate-ui-from-prompt":
          try {
            const { prompt, systemPrompt, enableValidation = true } = msg.payload;
            const generationResult = await generateUIFromAPI(prompt, systemPrompt, enableValidation);
            const newFrame = await FigmaRenderer.generateUIFromDataDynamic(generationResult.layoutData);
            if (newFrame) {
              figma.ui.postMessage({
                type: "ui-generated-success",
                frameId: newFrame.id,
                generatedJSON: generationResult.layoutData,
                validationResult: generationResult.validationResult,
                retryCount: generationResult.retryCount
              });
            }
          } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            figma.notify("API generation error: " + errorMessage, { error: true });
            figma.ui.postMessage({ type: "ui-generation-error", error: errorMessage });
          }
          break;
        case "modify-existing-ui":
          try {
            const { modifiedJSON, frameId } = msg.payload;
            const modifiedFrame = await FigmaRenderer.modifyExistingUI(modifiedJSON, frameId);
            if (modifiedFrame) {
              figma.ui.postMessage({
                type: "ui-modified-success",
                frameId: modifiedFrame.id,
                modifiedJSON
              });
            }
          } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            figma.notify("Modification error: " + errorMessage, { error: true });
            figma.ui.postMessage({ type: "ui-generation-error", error: errorMessage });
          }
          break;
        // ENHANCED: API-driven UI modification with validation
        case "modify-ui-from-prompt":
          try {
            const { originalJSON, modificationRequest, systemPrompt, frameId, enableValidation = true } = msg.payload;
            const geminiAPI = await GeminiAPI.createFromStorage();
            if (!geminiAPI) {
              throw new Error("No API key configured");
            }
            console.log("\u{1F504} Modifying UI with API...");
            const response = await geminiAPI.modifyExistingUI(originalJSON, modificationRequest, systemPrompt);
            if (!response.success) {
              throw new Error(response.error || "API modification failed");
            }
            let finalJSON = response.content || "{}";
            let validationResult;
            let retryCount = 0;
            if (enableValidation && validationEngine) {
              console.log("\u{1F50D} Validating modified JSON...");
              const validationData = await validationEngine.validateWithRetry(
                finalJSON,
                modificationRequest,
                geminiAPI
              );
              validationResult = validationData.result;
              finalJSON = validationData.finalJSON;
              retryCount = validationData.retryCount;
              console.log(`\u{1F4CA} Modification validation: ${validationEngine.getValidationSummary(validationResult)}`);
            }
            const modifiedJSON = JSON.parse(finalJSON);
            const modifiedFrame = await FigmaRenderer.modifyExistingUI(modifiedJSON, frameId);
            if (modifiedFrame) {
              figma.ui.postMessage({
                type: "ui-modified-success",
                frameId: modifiedFrame.id,
                modifiedJSON,
                validationResult,
                retryCount
              });
            }
          } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            figma.notify("API modification error: " + errorMessage, { error: true });
            figma.ui.postMessage({ type: "ui-generation-error", error: errorMessage });
          }
          break;
        // NEW: Standalone JSON validation
        case "validate-json":
          try {
            const { jsonString, originalPrompt } = msg.payload;
            if (!validationEngine) {
              throw new Error("Validation engine not initialized");
            }
            const validationResult = await validationEngine.validateJSON(jsonString, originalPrompt);
            const summary = validationEngine.getValidationSummary(validationResult);
            figma.ui.postMessage({
              type: "validation-result",
              result: validationResult,
              summary
            });
            figma.notify(summary, {
              timeout: 3e3,
              error: !validationResult.isValid
            });
          } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            figma.notify("Validation error: " + errorMessage, { error: true });
            figma.ui.postMessage({ type: "validation-error", error: errorMessage });
          }
          break;
        // NEW: Update validation settings
        case "update-validation-config":
          try {
            const newConfig = msg.payload;
            if (validationEngine) {
              validationEngine.updateConfig(newConfig);
              figma.ui.postMessage({ type: "validation-config-updated" });
              figma.notify("Validation settings updated", { timeout: 2e3 });
            }
          } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            figma.notify("Config update error: " + errorMessage, { error: true });
          }
          break;
        // Test API connection - Updated to use GeminiService
        case "test-gemini-connection":
        case "test-api-connection":
          try {
            console.log("\u{1F9EA} Testing Gemini API connection...");
            const result = await GeminiService.testConnection();
            figma.ui.postMessage({
              type: "connection-test-result",
              success: result.success,
              error: result.error || null,
              data: result.data || null
            });
            if (result.success) {
              figma.notify("\u2705 API connection successful!", { timeout: 2e3 });
            } else {
              const errorMsg = GeminiService.formatErrorMessage(result.error || "Connection failed");
              figma.notify(`\u274C ${errorMsg}`, { error: true });
            }
          } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            figma.ui.postMessage({
              type: "connection-test-result",
              success: false,
              error: errorMessage
            });
            figma.notify("\u274C Connection test failed", { error: true });
          }
          break;
        // Session management handlers - Updated to use SessionService
        case "restore-session":
          try {
            const sessionData = msg.payload;
            await SessionService.saveSession({
              designState: sessionData.designState,
              scanResults: sessionData.scanResults || [],
              currentTab: sessionData.currentTab || "design-system",
              currentPlatform: sessionData.currentPlatform || "mobile"
            });
            figma.ui.postMessage({
              type: "session-restored",
              designState: sessionData.designState,
              scanData: sessionData.scanResults || []
            });
            figma.notify("Session restored!", { timeout: 2e3 });
          } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            figma.notify("Session restore error: " + errorMessage, { error: true });
          }
          break;
        case "clear-current-session":
          try {
            await SessionService.clearCurrentSession();
            figma.ui.postMessage({ type: "session-cleared" });
            figma.notify("Session cleared", { timeout: 1500 });
          } catch (error) {
            console.error("\u274C Error clearing session:", error);
            figma.notify("Failed to clear session", { error: true });
          }
          break;
        case "get-all-sessions":
          try {
            const allSessions = await SessionService.getAllSessions();
            const formattedSessions = allSessions.map(
              (session) => SessionService.formatSessionForUI(session)
            );
            figma.ui.postMessage({
              type: "all-sessions-loaded",
              sessions: formattedSessions,
              currentFileId: figma.fileKey || figma.root.id
            });
          } catch (error) {
            console.error("\u274C Error getting all sessions:", error);
            figma.ui.postMessage({ type: "all-sessions-loaded", sessions: [] });
          }
          break;
        case "delete-session":
          try {
            const fileId = msg.payload;
            await SessionService.deleteSession(fileId);
            figma.ui.postMessage({ type: "session-deleted", fileId });
            figma.notify("Session deleted", { timeout: 1500 });
          } catch (error) {
            console.error("\u274C Error deleting session:", error);
            figma.notify("Failed to delete session", { error: true });
          }
          break;
        case "save-current-session":
          try {
            const { designState, scanData, currentTab, currentPlatform } = msg.payload;
            await SessionService.saveSession({
              designState,
              scanResults: scanData || [],
              currentTab: currentTab || "design-system",
              currentPlatform: currentPlatform || "mobile"
            });
            console.log("\u2705 Session saved successfully");
          } catch (error) {
            console.error("\u274C Error saving session:", error);
          }
          break;
        case "scan-design-system":
          try {
            console.log("\u{1F50D} Starting design system scan via backend service...");
            const components = await DesignSystemScannerService.scanDesignSystem((progress) => {
              figma.ui.postMessage({
                type: "scan-progress",
                progress
              });
            });
            await DesignSystemScannerService.saveScanResults(components);
            await SessionService.saveSession({
              scanResults: components,
              designState: {
                history: ["Design system scanned"]
              }
            });
            components.forEach((comp, index) => {
              var _a, _b, _c, _d, _e, _f, _g, _h;
              console.log(`\u{1F50D} ENHANCED STRUCTURE DEBUG ${index + 1}/${components.length}: ${comp.name}`);
              if ((_a = comp.textHierarchy) == null ? void 0 : _a.length) {
                console.log("  \u{1F4DD} Text Hierarchy:", comp.textHierarchy);
                console.log("  \u{1F4DD} EXACT NODE NAMES TO USE IN JSON:");
                comp.textHierarchy.forEach((text) => {
                  console.log(`    \u2022 ${text.classification.toUpperCase()}: "${text.nodeName}" (${text.fontSize}px, weight: ${text.fontWeight}, visible: ${text.visible})`);
                  console.log(`      JSON property: "${text.nodeName}": "Your text here"`);
                  if (text.characters) console.log(`      Current content: "${text.characters}"`);
                });
              }
              if ((_b = comp.componentInstances) == null ? void 0 : _b.length) {
                console.log("  \u{1F9E9} Component Instances:", comp.componentInstances);
                comp.componentInstances.forEach((inst) => {
                  console.log(`    \u2022 "${inst.nodeName}" (ID: ${inst.nodeId}, visible: ${inst.visible})`);
                });
              }
              if ((_c = comp.vectorNodes) == null ? void 0 : _c.length) {
                console.log("  \u{1F3A8} Vector Nodes:", comp.vectorNodes);
                comp.vectorNodes.forEach((vec) => {
                  console.log(`    \u2022 "${vec.nodeName}" (visible: ${vec.visible})`);
                });
              }
              if ((_d = comp.imageNodes) == null ? void 0 : _d.length) {
                console.log("  \u{1F5BC}\uFE0F Image Nodes:", comp.imageNodes);
                comp.imageNodes.forEach((img) => {
                  console.log(`    \u2022 "${img.nodeName}" (${img.nodeType}, hasImage: ${img.hasImageFill}, visible: ${img.visible})`);
                });
              }
              if (!((_e = comp.textHierarchy) == null ? void 0 : _e.length) && !((_f = comp.componentInstances) == null ? void 0 : _f.length) && !((_g = comp.vectorNodes) == null ? void 0 : _g.length) && !((_h = comp.imageNodes) == null ? void 0 : _h.length)) {
                console.log("  \u{1F4CB} No enhanced structure data found");
              }
              console.log("");
            });
            figma.ui.postMessage({ type: "scan-results", components });
            figma.notify(`\u2705 Found ${components.length} components!`, { timeout: 2e3 });
          } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            console.error("\u274C Design system scan error:", errorMessage);
            figma.notify("Scanning error", { error: true });
            figma.ui.postMessage({ type: "scan-error", error: errorMessage });
          }
          break;
        case "generate-llm-prompt":
          try {
            const scanResultsForPrompt = await DesignSystemScannerService.getSavedScanResults();
            if (scanResultsForPrompt == null ? void 0 : scanResultsForPrompt.length) {
              const llmPrompt = DesignSystemScannerService.generateLLMPrompt(scanResultsForPrompt);
              figma.ui.postMessage({ type: "llm-prompt-generated", prompt: llmPrompt });
            } else {
              figma.notify("Scan components first", { error: true });
            }
          } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            console.error("\u274C Error generating LLM prompt:", errorMessage);
            figma.notify("Error generating prompt", { error: true });
          }
          break;
        case "update-component-type":
          const { componentId, newType } = msg.payload;
          try {
            const result = await DesignSystemScannerService.updateComponentType(componentId, newType);
            if (result.success) {
              figma.ui.postMessage({
                type: "component-type-updated",
                componentId,
                newType,
                componentName: result.componentName
              });
              figma.notify(`Updated "${result.componentName}" to ${newType}`, { timeout: 2e3 });
            } else {
              figma.notify("Component not found for update", { error: true });
            }
          } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            console.error("\u274C Error updating component type:", errorMessage);
            figma.notify("Error updating type", { error: true });
          }
          break;
        case "navigate-to-component":
          await navigateToComponent(msg.componentId, msg.pageName);
          break;
        case "save-api-key":
          try {
            const apiKey = msg.payload.apiKey || msg.payload;
            const success = await GeminiService.saveApiKey(apiKey);
            if (success) {
              figma.ui.postMessage({ type: "api-key-saved" });
              figma.notify("\u2705 API key saved successfully!", { timeout: 2e3 });
            } else {
              throw new Error("Failed to save API key");
            }
          } catch (e) {
            console.error("\u274C Error saving API key:", e);
            const errorMessage = e instanceof Error ? e.message : String(e);
            figma.ui.postMessage({
              type: "api-key-save-error",
              error: errorMessage
            });
            figma.notify("\u274C Error saving API key", { error: true });
          }
          break;
        case "get-api-key":
          try {
            const key = await figma.clientStorage.getAsync("geminiApiKey");
            if (key) {
              figma.ui.postMessage({ type: "api-key-found", payload: key });
            } else {
              figma.ui.postMessage({ type: "api-key-not-found" });
            }
          } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            figma.ui.postMessage({ type: "api-key-error", payload: errorMessage });
          }
          break;
        // Generate UI with Gemini - New handler using GeminiService
        case "generate-with-gemini":
          try {
            const { prompt, scanResults, platform, image } = msg.payload;
            console.log("\u{1F916} Generating UI with Gemini...");
            const result = await GeminiService.generateUI({
              prompt,
              image: image || void 0
            });
            if (result.success) {
              await SessionService.saveSession({
                scanResults: scanResults || [],
                currentPlatform: platform || "mobile",
                designState: {
                  history: ["AI generation completed"],
                  current: result.data
                }
              });
              figma.ui.postMessage({
                type: "gemini-response",
                success: true,
                data: result.data
              });
              figma.notify("\u2705 UI generated successfully!", { timeout: 2e3 });
            } else {
              const errorMsg = GeminiService.formatErrorMessage(result.error || "Generation failed");
              figma.ui.postMessage({
                type: "gemini-response",
                success: false,
                error: errorMsg
              });
              figma.notify(`\u274C ${errorMsg}`, { error: true });
            }
          } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            console.error("\u274C Generation error:", errorMessage);
            figma.ui.postMessage({
              type: "gemini-response",
              success: false,
              error: errorMessage
            });
            figma.notify("\u274C Generation failed", { error: true });
          }
          break;
        case "get-saved-scan":
          try {
            const savedScan = await DesignSystemScannerService.getScanSession();
            if (savedScan && savedScan.components && savedScan.fileKey === figma.root.id) {
              figma.ui.postMessage({
                type: "saved-scan-loaded",
                components: savedScan.components,
                scanTime: savedScan.scanTime
              });
            } else {
              figma.ui.postMessage({ type: "no-saved-scan" });
            }
          } catch (error) {
            console.error("\u274C Error loading saved scan:", error);
            figma.ui.postMessage({ type: "no-saved-scan" });
          }
          break;
        case "clear-storage":
        case "clear-all-data":
          try {
            await DesignSystemScannerService.clearScanData();
            await GeminiService.clearApiKey();
            await SessionService.clearAllSessions();
            figma.notify("All data cleared successfully", { timeout: 2e3 });
            figma.ui.postMessage({ type: "all-data-cleared" });
          } catch (error) {
            console.error("Error clearing storage:", error);
            figma.notify("Failed to clear some data", { error: true });
          }
          break;
        case "cancel":
          figma.closePlugin();
          break;
        default:
      }
    };
    console.log("\u2705 Plugin fully initialized with complete modular architecture");
  }
  main().catch((err) => {
    console.error("\u274C Unhandled error:", err);
    figma.closePlugin("A critical error occurred.");
  });
})();
