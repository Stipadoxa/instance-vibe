"use strict";
var AIDesignerUI = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __getProtoOf = Object.getPrototypeOf;
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
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // src/ui/core/ui-framework.js
  var require_ui_framework = __commonJS({
    "src/ui/core/ui-framework.js"(exports, module) {
      "use strict";
      var UIFramework5 = class _UIFramework {
        constructor() {
          this.components = /* @__PURE__ */ new Map();
          this.eventListeners = /* @__PURE__ */ new Map();
        }
        /**
         * DOM Query utilities
         */
        static $(selector) {
          return document.querySelector(selector);
        }
        static $$(selector) {
          return document.querySelectorAll(selector);
        }
        static byId(id) {
          return document.getElementById(id);
        }
        /**
         * Element creation utilities
         */
        static createElement(tag, attributes = {}, children = []) {
          const element = document.createElement(tag);
          Object.entries(attributes).forEach(([key, value]) => {
            if (key === "className") {
              element.className = value;
            } else if (key === "innerHTML") {
              element.innerHTML = value;
            } else if (key === "textContent") {
              element.textContent = value;
            } else if (key.startsWith("data-")) {
              element.setAttribute(key, value);
            } else if (key.startsWith("on") && typeof value === "function") {
              element.addEventListener(key.slice(2).toLowerCase(), value);
            } else {
              element.setAttribute(key, value);
            }
          });
          children.forEach((child) => {
            if (typeof child === "string") {
              element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
              element.appendChild(child);
            }
          });
          return element;
        }
        /**
         * Status message utilities
         */
        static showStatus(containerId, message, type = "info") {
          const container = _UIFramework.byId(containerId);
          if (!container) {
            console.warn(`Status container '${containerId}' not found`);
            return;
          }
          container.innerHTML = `<div class="status ${type}">${message}</div>`;
          if (type === "success") {
            setTimeout(() => {
              _UIFramework.clearStatus(containerId);
            }, 5e3);
          }
        }
        static clearStatus(containerId) {
          const container = _UIFramework.byId(containerId);
          if (container) {
            container.innerHTML = "";
          }
        }
        static updateStatus(containerId, message, type = "info") {
          const container = _UIFramework.byId(containerId);
          if (!container) return;
          const existingStatus = container.querySelector(".status");
          if (existingStatus) {
            existingStatus.textContent = message;
            existingStatus.className = `status ${type}`;
          } else {
            _UIFramework.showStatus(containerId, message, type);
          }
        }
        /**
         * Clipboard utilities
         */
        static async copyToClipboard(text) {
          try {
            await navigator.clipboard.writeText(text);
            return true;
          } catch (err) {
            console.error("Failed to copy to clipboard:", err);
            try {
              const textArea = document.createElement("textarea");
              textArea.value = text;
              textArea.style.position = "fixed";
              textArea.style.left = "-999999px";
              textArea.style.top = "-999999px";
              document.body.appendChild(textArea);
              textArea.focus();
              textArea.select();
              const successful = document.execCommand("copy");
              textArea.remove();
              return successful;
            } catch (fallbackErr) {
              console.error("Clipboard fallback failed:", fallbackErr);
              return false;
            }
          }
        }
        /**
         * Tab management utilities
         */
        static switchTab(tabId) {
          _UIFramework.$$(".tab-btn").forEach((btn) => btn.classList.remove("active"));
          const targetBtn = _UIFramework.$(`[onclick*="${tabId}"]`) || _UIFramework.$(`[data-tab="${tabId}"]`);
          if (targetBtn) {
            targetBtn.classList.add("active");
          }
          _UIFramework.$$(".tab-content").forEach((content) => content.classList.remove("active"));
          const targetContent = _UIFramework.byId(tabId);
          if (targetContent) {
            targetContent.classList.add("active");
          }
          if (window.StateManager) {
            window.StateManager.setState("currentTab", tabId);
          }
          console.log(`\u{1F4D1} Switched to tab: ${tabId}`);
        }
        /**
         * Form utilities
         */
        static getFormData(formElement) {
          const formData = new FormData(formElement);
          const data = {};
          for (const [key, value] of formData.entries()) {
            data[key] = value;
          }
          return data;
        }
        static setFormData(formElement, data) {
          Object.entries(data).forEach(([key, value]) => {
            const element = formElement.querySelector(`[name="${key}"]`);
            if (element) {
              element.value = value;
            }
          });
        }
        static clearForm(formElement) {
          const inputs = formElement.querySelectorAll("input, textarea, select");
          inputs.forEach((input) => {
            if (input.type === "checkbox" || input.type === "radio") {
              input.checked = false;
            } else {
              input.value = "";
            }
          });
        }
        /**
         * Loading state utilities
         */
        static setLoading(buttonElement, loading = true, originalText = null) {
          if (loading) {
            buttonElement.dataset.originalText = originalText || buttonElement.textContent;
            buttonElement.disabled = true;
            buttonElement.textContent = "\u23F3 Loading...";
          } else {
            buttonElement.disabled = false;
            buttonElement.textContent = buttonElement.dataset.originalText || originalText || "Submit";
            delete buttonElement.dataset.originalText;
          }
        }
        /**
         * Modal utilities
         */
        static showModal(modalId) {
          const modal = _UIFramework.byId(modalId);
          if (modal) {
            modal.style.display = "flex";
            document.body.style.overflow = "hidden";
          }
        }
        static hideModal(modalId) {
          const modal = _UIFramework.byId(modalId);
          if (modal) {
            modal.style.display = "none";
            document.body.style.overflow = "";
          }
        }
        /**
         * Animation utilities
         */
        static fadeIn(element, duration = 300) {
          element.style.opacity = "0";
          element.style.display = "block";
          let start = performance.now();
          function animate(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            element.style.opacity = progress;
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          }
          requestAnimationFrame(animate);
        }
        static fadeOut(element, duration = 300) {
          let start = performance.now();
          const initialOpacity = parseFloat(getComputedStyle(element).opacity);
          function animate(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            element.style.opacity = initialOpacity * (1 - progress);
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              element.style.display = "none";
            }
          }
          requestAnimationFrame(animate);
        }
        /**
         * Event handling utilities
         */
        static on(selector, event, handler, useCapture = false) {
          const elements = typeof selector === "string" ? _UIFramework.$$(selector) : [selector];
          elements.forEach((element) => {
            element.addEventListener(event, handler, useCapture);
            if (!this.eventListeners.has(element)) {
              this.eventListeners.set(element, []);
            }
            this.eventListeners.get(element).push({ event, handler, useCapture });
          });
        }
        static off(selector, event, handler) {
          const elements = typeof selector === "string" ? _UIFramework.$$(selector) : [selector];
          elements.forEach((element) => {
            element.removeEventListener(event, handler);
            const listeners = this.eventListeners.get(element);
            if (listeners) {
              const index = listeners.findIndex((l) => l.event === event && l.handler === handler);
              if (index > -1) {
                listeners.splice(index, 1);
              }
            }
          });
        }
        /**
         * Validation utilities
         */
        static validateEmail(email) {
          const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return re.test(email);
        }
        static validateRequired(value) {
          return value && value.trim().length > 0;
        }
        static validateMinLength(value, minLength) {
          return value && value.length >= minLength;
        }
        /**
         * Debounce utility
         */
        static debounce(func, wait) {
          let timeout;
          return function executedFunction(...args) {
            const later = () => {
              clearTimeout(timeout);
              func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
          };
        }
        /**
         * Throttle utility
         */
        static throttle(func, limit) {
          let inThrottle;
          return function(...args) {
            if (!inThrottle) {
              func.apply(this, args);
              inThrottle = true;
              setTimeout(() => inThrottle = false, limit);
            }
          };
        }
        /**
         * Component registration system
         */
        static registerComponent(name, componentClass) {
          this.components.set(name, componentClass);
        }
        static createComponent(name, ...args) {
          const ComponentClass = this.components.get(name);
          if (ComponentClass) {
            return new ComponentClass(...args);
          }
          throw new Error(`Component '${name}' not found`);
        }
        /**
         * Cleanup utilities
         */
        static cleanup() {
          this.eventListeners.forEach((listeners, element) => {
            listeners.forEach(({ event, handler, useCapture }) => {
              element.removeEventListener(event, handler, useCapture);
            });
          });
          this.eventListeners.clear();
          this.components.clear();
        }
        /**
         * Utility for safe DOM operations
         */
        static safeOperation(operation, fallback = null) {
          try {
            return operation();
          } catch (error) {
            console.error("DOM operation failed:", error);
            return fallback;
          }
        }
        /**
         * Format time utility
         */
        static formatTime(timestamp) {
          const now = Date.now();
          const diff = now - timestamp;
          const minutes = Math.floor(diff / (1e3 * 60));
          const hours = Math.floor(diff / (1e3 * 60 * 60));
          const days = Math.floor(diff / (1e3 * 60 * 60 * 24));
          if (minutes < 1) return "just now";
          if (minutes < 60) return `${minutes}m ago`;
          if (hours < 24) return `${hours}h ago`;
          return `${days}d ago`;
        }
      };
      if (typeof window !== "undefined") {
        window.UIFramework = UIFramework5;
        window.$ = UIFramework5.$;
        window.$$ = UIFramework5.$$;
        window.byId = UIFramework5.byId;
        window.showStatus = UIFramework5.showStatus;
        window.clearStatus = UIFramework5.clearStatus;
        window.copyToClipboard = UIFramework5.copyToClipboard;
        window.switchTab = UIFramework5.switchTab;
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = UIFramework5;
      }
    }
  });

  // src/ui/core/state-manager.js
  var require_state_manager = __commonJS({
    "src/ui/core/state-manager.js"(exports, module) {
      "use strict";
      var StateManager5 = class {
        constructor() {
          this.state = {
            // Tab management
            currentTab: "design-system",
            // Design system data
            scanResults: [],
            currentFilter: "all",
            searchQuery: "",
            // AI Generator data
            lastGeneratedJSON: null,
            selectedImage: null,
            currentPlatform: "mobile",
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
          this.subscribers = /* @__PURE__ */ new Map();
          this.eventListeners = /* @__PURE__ */ new Map();
        }
        /**
         * Get current state value
         */
        getState(key) {
          if (key) {
            return this.state[key];
          }
          return __spreadValues({}, this.state);
        }
        /**
         * Set state value and notify subscribers
         */
        setState(key, value) {
          const oldValue = this.state[key];
          this.state[key] = value;
          this.notifySubscribers(key, value, oldValue);
          this.notifyStateChange(key, value, oldValue);
          console.log(`\u{1F504} State updated: ${key}`, value);
        }
        /**
         * Update nested state (like designState properties)
         */
        updateNestedState(parentKey, childKey, value) {
          if (this.state[parentKey] && typeof this.state[parentKey] === "object") {
            const oldParentValue = __spreadValues({}, this.state[parentKey]);
            this.state[parentKey][childKey] = value;
            this.notifySubscribers(parentKey, this.state[parentKey], oldParentValue);
            this.notifySubscribers(`${parentKey}.${childKey}`, value);
            console.log(`\u{1F504} Nested state updated: ${parentKey}.${childKey}`, value);
          }
        }
        /**
         * Subscribe to state changes for a specific key
         */
        subscribe(key, callback) {
          if (!this.subscribers.has(key)) {
            this.subscribers.set(key, /* @__PURE__ */ new Set());
          }
          this.subscribers.get(key).add(callback);
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
          return this.subscribe("*", callback);
        }
        /**
         * Notify subscribers of state changes
         */
        notifySubscribers(key, newValue, oldValue) {
          const keySubscribers = this.subscribers.get(key);
          if (keySubscribers) {
            keySubscribers.forEach((callback) => {
              try {
                callback(newValue, oldValue, key);
              } catch (error) {
                console.error(`Error in state subscriber for ${key}:`, error);
              }
            });
          }
          const allSubscribers = this.subscribers.get("*");
          if (allSubscribers) {
            allSubscribers.forEach((callback) => {
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
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("aidesigner-state-change", {
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
          changes.forEach(({ key, value, oldValue }) => {
            this.notifySubscribers(key, value, oldValue);
          });
          console.log(`\u{1F504} Batch state update:`, changes.map((c) => c.key));
        }
        /**
         * Design state specific helpers
         */
        startIteration(generatedJSON, frameId) {
          this.setState("designState", {
            original: JSON.parse(JSON.stringify(generatedJSON)),
            current: generatedJSON,
            frameId,
            isIterating: true,
            history: ["Original design generated."]
          });
        }
        addToHistory(action) {
          const currentDesignState = __spreadValues({}, this.state.designState);
          currentDesignState.history.push(action);
          this.setState("designState", currentDesignState);
        }
        updateCurrentDesign(modifiedJSON) {
          const currentDesignState = __spreadValues({}, this.state.designState);
          currentDesignState.current = modifiedJSON;
          this.setState("designState", currentDesignState);
        }
        resetToOriginal() {
          const currentDesignState = __spreadValues({}, this.state.designState);
          currentDesignState.current = JSON.parse(JSON.stringify(currentDesignState.original));
          currentDesignState.history = ["Original design generated."];
          this.setState("designState", currentDesignState);
        }
        /**
         * Image state helpers
         */
        setSelectedImage(imageData) {
          this.setState("selectedImage", imageData);
        }
        clearSelectedImage() {
          this.setState("selectedImage", null);
        }
        isValidImageSelected() {
          const image = this.state.selectedImage;
          return image && image.base64 && image.type && image.base64.length > 0;
        }
        /**
         * Component scanning helpers
         */
        updateScanResults(components) {
          this.setState("scanResults", components || []);
        }
        getFilteredComponents() {
          const { scanResults, currentFilter, searchQuery } = this.state;
          let filtered = scanResults;
          if (searchQuery) {
            filtered = filtered.filter(
              (comp) => comp.name.toLowerCase().includes(searchQuery.toLowerCase()) || comp.suggestedType.toLowerCase().includes(searchQuery.toLowerCase())
            );
          }
          switch (currentFilter) {
            case "unknown":
              return filtered.filter((comp) => comp.suggestedType === "unknown");
            case "low":
              return filtered.filter((comp) => comp.confidence < 0.6 && !comp.isVerified);
            case "verified":
              return filtered.filter((comp) => comp.isVerified);
            default:
              return filtered;
          }
        }
        /**
         * Platform helpers
         */
        switchPlatform(platform) {
          this.setState("currentPlatform", platform);
        }
        /**
         * Debug helpers
         */
        dumpState() {
          console.log("\u{1F4CA} Current State:", this.state);
          console.log(
            "\u{1F4CA} Active Subscribers:",
            Array.from(this.subscribers.keys()).map((key) => ({
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
            sessionStorage.setItem("aidesigner-ui-state", JSON.stringify(persistentState));
          } catch (error) {
            console.warn("Could not save state to session:", error);
          }
        }
        loadFromSession() {
          try {
            const saved = sessionStorage.getItem("aidesigner-ui-state");
            if (saved) {
              const persistentState = JSON.parse(saved);
              this.batchUpdate(persistentState);
            }
          } catch (error) {
            console.warn("Could not load state from session:", error);
          }
        }
      };
      var stateManager = new StateManager5();
      stateManager.subscribe("currentTab", () => stateManager.saveToSession());
      stateManager.subscribe("currentPlatform", () => stateManager.saveToSession());
      stateManager.subscribe("currentFilter", () => stateManager.saveToSession());
      stateManager.subscribe("searchQuery", () => stateManager.saveToSession());
      if (typeof window !== "undefined") {
        window.StateManager = stateManager;
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = stateManager;
      }
    }
  });

  // src/ui/core/message-handler.js
  var require_message_handler = __commonJS({
    "src/ui/core/message-handler.js"(exports, module) {
      "use strict";
      var MessageHandler5 = class {
        constructor(stateManager) {
          this.stateManager = stateManager;
          this.handlers = /* @__PURE__ */ new Map();
          this.middleware = [];
          this.isInitialized = false;
          this.handleMessage = this.handleMessage.bind(this);
        }
        /**
         * Initialize message handling
         */
        initialize() {
          if (this.isInitialized) return;
          window.addEventListener("message", this.handleMessage);
          this.isInitialized = true;
          console.log("\u{1F4E8} Message handler initialized");
        }
        /**
         * Register a handler for a specific message type
         */
        register(messageType, handler) {
          if (!this.handlers.has(messageType)) {
            this.handlers.set(messageType, []);
          }
          this.handlers.get(messageType).push(handler);
          console.log(`\u{1F4DD} Handler registered for: ${messageType}`);
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
          console.log("\u{1F4E8} Message from plugin:", msg.type);
          try {
            let shouldContinue = true;
            for (const middleware of this.middleware) {
              const result = await middleware(msg, this.stateManager);
              if (result === false) {
                shouldContinue = false;
                break;
              }
            }
            if (!shouldContinue) return;
            const handlers = this.handlers.get(msg.type);
            if (handlers && handlers.length > 0) {
              for (const handler of handlers) {
                try {
                  await handler(msg, this.stateManager);
                } catch (error) {
                  console.error(`\u274C Handler error for ${msg.type}:`, error);
                }
              }
            } else {
              this.handleUnknownMessage(msg);
            }
          } catch (error) {
            console.error("\u274C Message handling error:", error);
          }
        }
        /**
         * Handle unknown message types
         */
        handleUnknownMessage(msg) {
          console.warn(`\u26A0\uFE0F No handler registered for message type: ${msg.type}`);
        }
        /**
         * Send message to plugin backend
         */
        sendToPlugin(message) {
          try {
            parent.postMessage({
              pluginMessage: message
            }, "*");
            console.log("\u{1F4E4} Message sent to plugin:", message.type);
          } catch (error) {
            console.error("\u274C Failed to send message:", error);
          }
        }
        /**
         * Send message and wait for response
         */
        async sendAndWait(message, responseType, timeout = 5e3) {
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
            window.removeEventListener("message", this.handleMessage);
            this.handlers.clear();
            this.middleware = [];
            this.isInitialized = false;
            console.log("\u{1F4E8} Message handler destroyed");
          }
        }
      };
      var CoreMessageHandlers = class _CoreMessageHandlers {
        static registerAll(messageHandler, stateManager) {
          messageHandler.register("api-key-loaded", (msg, state) => {
            console.log("\u2705 API key loaded from storage");
            state.setState("apiKeyLoaded", true);
            const apiKeyInput = document.getElementById("apiKey");
            if (apiKeyInput) {
              apiKeyInput.value = "\u25CF".repeat(40);
              apiKeyInput.setAttribute("data-has-key", "true");
            }
            state.setState("generatorTabEnabled", true);
            _CoreMessageHandlers.showStatus("connectionStatus", "\u2705 API key loaded from previous session", "success");
          });
          messageHandler.register("api-key-saved", (msg, state) => {
            const saveBtn = document.getElementById("saveBtn");
            if (saveBtn) {
              saveBtn.disabled = false;
              saveBtn.textContent = "\u{1F4BE} Save API Key";
            }
            _CoreMessageHandlers.showStatus("connectionStatus", "\u2705 API key saved successfully!", "success");
            const keyInput = document.getElementById("apiKey");
            if (keyInput) {
              keyInput.value = "\u25CF".repeat(40);
              keyInput.setAttribute("data-has-key", "true");
            }
            state.setState("generatorTabEnabled", true);
            state.setState("apiKeyLoaded", true);
          });
          messageHandler.register("api-key-found", (msg, state) => {
            state.setState("apiKeyLoaded", true);
          });
          messageHandler.register("api-key-not-found", (msg, state) => {
            state.setState("apiKeyLoaded", false);
          });
          messageHandler.register("api-key-error", (msg, state) => {
            state.setState("apiKeyLoaded", false);
            _CoreMessageHandlers.showStatus("connectionStatus", `\u274C API key error: ${msg.payload}`, "error");
          });
          messageHandler.register("ui-generation-error", (msg, state) => {
            _CoreMessageHandlers.showStatus("generationStatus", `\u274C Generation error: ${msg.error}`, "error");
          });
          messageHandler.register("component-navigation-success", (msg, state) => {
            console.log("\u2705 Navigated to component successfully");
          });
          console.log("\u2705 Core message handlers registered");
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
          if (container) container.innerHTML = "";
        }
      };
      function createMessageHandler(stateManager) {
        const messageHandler = new MessageHandler5(stateManager);
        CoreMessageHandlers.registerAll(messageHandler, stateManager);
        return messageHandler;
      }
      if (typeof window !== "undefined") {
        window.MessageHandler = MessageHandler5;
        window.createMessageHandler = createMessageHandler;
        window.CoreMessageHandlers = CoreMessageHandlers;
      }
      if (typeof module !== "undefined" && module.exports) {
        module.exports = {
          MessageHandler: MessageHandler5,
          createMessageHandler,
          CoreMessageHandlers
        };
      }
    }
  });

  // ui-main.js
  var import_ui_framework4 = __toESM(require_ui_framework());
  var import_state_manager4 = __toESM(require_state_manager());

  // src/ui/core/tab-manager.js
  var import_state_manager = __toESM(require_state_manager());
  var TabManager = class {
    constructor() {
      this.currentTab = "design-system";
      this.tabs = {
        "design-system": {
          button: null,
          content: null,
          title: "\u{1F50D} Design System",
          enabled: true
        },
        "api-settings": {
          button: null,
          content: null,
          title: "\u2699\uFE0F API Settings",
          enabled: true
        },
        "ai-generator": {
          button: null,
          content: null,
          title: "\u{1F4AC} AI Generator",
          enabled: false
          // Initially disabled until scan completes
        }
      };
      this.initializeEventListeners();
    }
    /**
     * Initialize tab navigation event listeners
     */
    initializeEventListeners() {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
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
      Object.keys(this.tabs).forEach((tabId) => {
        const button = document.querySelector(`[onclick="switchTab('${tabId}')"]`) || document.querySelector(`[data-tab="${tabId}"]`);
        const content = document.getElementById(tabId);
        if (button && content) {
          this.tabs[tabId].button = button;
          this.tabs[tabId].content = content;
          button.removeAttribute("onclick");
          button.addEventListener("click", (e) => {
            e.preventDefault();
            this.switchTab(tabId);
          });
          console.log(`\u2705 Tab "${tabId}" initialized`);
        } else {
          console.warn(`\u26A0\uFE0F Tab elements not found for "${tabId}"`);
        }
      });
      this.switchTab(this.currentTab);
    }
    /**
     * Switch to specified tab
     * @param {string} tabId - ID of tab to switch to
     */
    switchTab(tabId) {
      if (!this.tabs[tabId]) {
        console.error(`\u274C Unknown tab: ${tabId}`);
        return;
      }
      if (!this.tabs[tabId].enabled) {
        console.log(`\u26A0\uFE0F Tab "${tabId}" is disabled`);
        return;
      }
      console.log(`\u{1F504} Switching to tab: ${tabId}`);
      this.currentTab = tabId;
      import_state_manager.StateManager.updateState({ currentTab: tabId });
      Object.keys(this.tabs).forEach((id) => {
        const tab = this.tabs[id];
        if (tab.button) {
          tab.button.classList.remove("active");
          if (id === tabId) {
            tab.button.classList.add("active");
          }
        }
      });
      Object.keys(this.tabs).forEach((id) => {
        const tab = this.tabs[id];
        if (tab.content) {
          tab.content.classList.remove("active");
          if (id === tabId) {
            tab.content.classList.add("active");
          }
        }
      });
      this.emitTabChangeEvent(tabId);
    }
    /**
     * Enable a specific tab
     * @param {string} tabId - ID of tab to enable
     */
    enableTab(tabId) {
      if (!this.tabs[tabId]) {
        console.error(`\u274C Unknown tab: ${tabId}`);
        return;
      }
      this.tabs[tabId].enabled = true;
      if (this.tabs[tabId].button) {
        this.tabs[tabId].button.disabled = false;
        this.tabs[tabId].button.classList.remove("disabled");
      }
      console.log(`\u2705 Tab "${tabId}" enabled`);
    }
    /**
     * Disable a specific tab
     * @param {string} tabId - ID of tab to disable
     */
    disableTab(tabId) {
      if (!this.tabs[tabId]) {
        console.error(`\u274C Unknown tab: ${tabId}`);
        return;
      }
      this.tabs[tabId].enabled = false;
      if (this.tabs[tabId].button) {
        this.tabs[tabId].button.disabled = true;
        this.tabs[tabId].button.classList.add("disabled");
      }
      if (this.currentTab === tabId) {
        const firstEnabledTab = Object.keys(this.tabs).find((id) => this.tabs[id].enabled);
        if (firstEnabledTab) {
          this.switchTab(firstEnabledTab);
        }
      }
      console.log(`\u274C Tab "${tabId}" disabled`);
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
      var _a;
      return ((_a = this.tabs[tabId]) == null ? void 0 : _a.enabled) || false;
    }
    /**
     * Get all tab information
     * @returns {Object} Tab configuration object
     */
    getAllTabs() {
      return __spreadValues({}, this.tabs);
    }
    /**
     * Update tab title
     * @param {string} tabId - ID of tab to update
     * @param {string} newTitle - New title for the tab
     */
    updateTabTitle(tabId, newTitle) {
      if (!this.tabs[tabId]) {
        console.error(`\u274C Unknown tab: ${tabId}`);
        return;
      }
      this.tabs[tabId].title = newTitle;
      if (this.tabs[tabId].button) {
        const button = this.tabs[tabId].button;
        const iconMatch = button.textContent.match(/^[🔍⚙️💬]\s*/);
        const icon = iconMatch ? iconMatch[0] : "";
        button.textContent = icon + newTitle.replace(/^[🔍⚙️💬]\s*/, "");
      }
      console.log(`\u{1F4DD} Tab "${tabId}" title updated to: ${newTitle}`);
    }
    /**
     * Emit custom tab change event
     * @param {string} tabId - ID of newly active tab
     */
    emitTabChangeEvent(tabId) {
      const event = new CustomEvent("tabChanged", {
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
      document.addEventListener("tabChanged", (event) => {
        callback(event.detail);
      });
    }
    /**
     * Enable the AI Generator tab (called after successful scan)
     */
    enableGeneratorTab() {
      this.enableTab("ai-generator");
      const currentTitle = this.tabs["ai-generator"].title;
      if (!currentTitle.includes("\u2713")) {
        this.updateTabTitle("ai-generator", currentTitle.replace("\u{1F4AC}", "\u{1F4AC}\u2713"));
      }
    }
    /**
     * Reset AI Generator tab state
     */
    resetGeneratorTab() {
      this.disableTab("ai-generator");
      this.updateTabTitle("ai-generator", "\u{1F4AC} AI Generator");
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
        button.classList.add("loading");
        button.style.opacity = "0.7";
        button.style.pointerEvents = "none";
      } else {
        button.classList.remove("loading");
        button.style.opacity = "";
        button.style.pointerEvents = "";
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
      const existingBadge = button.querySelector(".tab-badge");
      if (existingBadge) {
        existingBadge.remove();
      }
      const badge = document.createElement("span");
      badge.className = "tab-badge";
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
      button.style.position = "relative";
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
      const badge = button.querySelector(".tab-badge");
      if (badge) {
        badge.remove();
      }
    }
    /**
     * Destroy tab manager and clean up event listeners
     */
    destroy() {
      Object.keys(this.tabs).forEach((tabId) => {
        const tab = this.tabs[tabId];
        if (tab.button) {
          const newButton = tab.button.cloneNode(true);
          tab.button.parentNode.replaceChild(newButton, tab.button);
        }
      });
      console.log("\u{1F5D1}\uFE0F TabManager destroyed");
    }
  };
  window.switchTab = function(tabId) {
    if (window.tabManager) {
      window.tabManager.switchTab(tabId);
    } else {
      console.warn("\u26A0\uFE0F TabManager not initialized, using fallback");
      document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach((content) => content.classList.remove("active"));
      const targetBtn = document.querySelector(`[onclick*="${tabId}"]`);
      const targetContent = document.getElementById(tabId);
      if (targetBtn && targetContent) {
        targetBtn.classList.add("active");
        targetContent.classList.add("active");
      }
    }
  };

  // ui-main.js
  var import_message_handler4 = __toESM(require_message_handler());

  // src/ui/core/features/design-system-ui.js
  var import_message_handler = __toESM(require_message_handler());
  var import_ui_framework = __toESM(require_ui_framework());
  var import_state_manager2 = __toESM(require_state_manager());
  var DesignSystemUI = class {
    constructor() {
      console.log("\u{1F680} NEW DesignSystemUI constructor called - Export button version!");
      this.componentTypes = {
        "Navigation": ["appbar", "navbar", "tab", "tabs", "breadcrumb", "pagination", "navigation", "sidebar", "bottom-navigation", "menu"],
        "Input": ["button", "input", "textarea", "select", "checkbox", "radio", "switch", "slider", "searchbar", "chip"],
        "Display": ["card", "list", "list-item", "avatar", "image", "icon", "text", "header", "badge", "tooltip"],
        "Feedback": ["snackbar", "alert", "dialog", "modal", "progress", "skeleton", "loading", "toast"],
        "Layout": ["container", "frame", "grid", "divider", "spacer"],
        "Specialized": ["fab", "actionsheet", "bottomsheet", "chart", "table", "calendar", "timeline", "upload", "gallery", "map", "rating", "cart", "price"]
      };
      this.scanResults = [];
      this.currentFilter = "all";
      this.searchQuery = "";
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
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => this.setupElements());
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
        scanBtn: document.getElementById("scanBtn"),
        rescanBtn: document.getElementById("rescanBtn"),
        exportRawBtn: document.getElementById("exportRawBtn"),
        scanStatusContainer: document.getElementById("scanStatusContainer"),
        scanStatusText: document.getElementById("scanStatusText"),
        componentsSection: document.getElementById("componentsSection"),
        promptSection: document.getElementById("promptSection"),
        componentsList: document.getElementById("componentsList"),
        searchInput: document.getElementById("searchInput"),
        statsBar: document.getElementById("statsBar"),
        totalCount: document.getElementById("totalCount"),
        highConfCount: document.getElementById("highConfCount"),
        lowConfCount: document.getElementById("lowConfCount"),
        verifiedCount: document.getElementById("verifiedCount")
      };
      this.setupEventListeners();
      console.log("\u2705 Design System UI initialized");
    }
    /**
     * Setup event listeners
     */
    setupEventListeners() {
      if (this.elements.scanBtn) {
        this.elements.scanBtn.addEventListener("click", () => this.scanDesignSystem());
      }
      if (this.elements.rescanBtn) {
        this.elements.rescanBtn.addEventListener("click", () => this.rescanDesignSystem());
      }
      if (this.elements.exportRawBtn) {
        this.elements.exportRawBtn.addEventListener("click", () => this.exportRawScanData());
      }
      if (this.elements.searchInput) {
        this.elements.searchInput.addEventListener("input", (e) => {
          this.searchQuery = e.target.value;
          this.renderComponentList();
        });
      }
      this.setupFilterButtons();
      const promptBtn = document.querySelector('[onclick="generateLLMPrompt()"]');
      if (promptBtn) {
        promptBtn.removeAttribute("onclick");
        promptBtn.addEventListener("click", () => this.generateLLMPrompt());
      }
    }
    /**
     * Setup filter button event listeners
     */
    setupFilterButtons() {
      const filterButtons = document.querySelectorAll(".filter-btn");
      filterButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          filterButtons.forEach((b) => b.classList.remove("active"));
          e.target.classList.add("active");
          this.currentFilter = e.target.dataset.filter;
          this.renderComponentList();
        });
      });
    }
    /**
     * Register message handlers for design system events
     */
    registerMessageHandlers() {
      if (window.messageHandler) {
        window.messageHandler.register("scan-results", (msg) => {
          this.handleScanResults(msg.components);
        });
        window.messageHandler.register("saved-scan-loaded", (msg) => {
          this.displaySavedScan(msg.components, msg.scanTime);
        });
        window.messageHandler.register("component-type-updated", (msg) => {
          this.handleComponentTypeUpdated(msg.componentId, msg.newType, msg.componentName);
        });
        window.messageHandler.register("llm-prompt-generated", (msg) => {
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
        this.elements.scanBtn.textContent = "\u{1F50D} Scanning...";
      }
      import_message_handler.MessageHandler.sendMessage({ type: "scan-design-system" });
      console.log("\u{1F50D} Starting design system scan");
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
        this.elements.scanBtn.textContent = "\u{1F50D} Scan Design System";
      }
      this.displaySavedScan(components, Date.now());
      console.log(`\u2705 Scan completed: ${(components == null ? void 0 : components.length) || 0} components found`);
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
        if (statusContainer) statusContainer.classList.add("loaded");
        if (statusText) {
          const timeAgo = scanTime ? this.getTimeAgo(scanTime) : "recently";
          statusText.textContent = `\u2705 ${this.scanResults.length} components loaded (scanned ${timeAgo})`;
        }
        if (rescanBtn) rescanBtn.style.display = "inline-block";
        if (this.elements.exportRawBtn) {
          this.elements.exportRawBtn.style.display = "inline-block";
        }
        this.displayComponents();
        this.enableGeneratorTab();
      } else {
        if (statusText) statusText.textContent = "No design system scanned yet";
        if (rescanBtn) rescanBtn.style.display = "none";
        if (this.elements.exportRawBtn) this.elements.exportRawBtn.style.display = "none";
      }
    }
    /**
     * Display components section and render list
     */
    displayComponents() {
      if (this.scanResults.length === 0) {
        if (this.elements.componentsSection) this.elements.componentsSection.style.display = "none";
        if (this.elements.promptSection) this.elements.promptSection.style.display = "none";
        return;
      }
      this.scanResults.forEach((comp) => {
        if (comp.isVerified === void 0) {
          comp.isVerified = false;
        }
      });
      this.renderComponentList();
      this.updateComponentStats();
      if (this.elements.componentsSection) this.elements.componentsSection.style.display = "block";
      if (this.elements.promptSection) this.elements.promptSection.style.display = "block";
    }
    /**
     * Render the component list based on current filters
     */
    renderComponentList() {
      const container = this.elements.componentsList;
      if (!container) return;
      const filteredComponents = this.getFilteredComponents();
      container.innerHTML = "";
      filteredComponents.forEach((comp) => {
        const item = this.createComponentItem(comp);
        container.appendChild(item);
      });
      this.setupComponentItemListeners();
    }
    /**
     * Setup event listeners for component items
     */
    setupComponentItemListeners() {
      const container = this.elements.componentsList;
      if (!container) return;
      container.querySelectorAll(".type-select").forEach((select) => {
        select.addEventListener("change", (e) => {
          const componentId = e.target.getAttribute("data-component-id");
          const newType = e.target.value;
          this.handleTypeChange(componentId, newType);
        });
      });
      container.querySelectorAll(".navigate-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const componentId = e.target.getAttribute("data-component-id");
          const pageName = e.target.getAttribute("data-page-name");
          this.handleNavigation(componentId, pageName);
        });
      });
    }
    /**
     * Create a component item DOM element
     */
    createComponentItem(comp) {
      var _a, _b;
      const item = document.createElement("div");
      item.className = "component-item";
      item.dataset.componentId = comp.id;
      const confidence = Math.round(comp.confidence * 100);
      let confidenceClass = "confidence-low";
      if (comp.isVerified) confidenceClass = "confidence-verified";
      else if (confidence >= 80) confidenceClass = "confidence-high";
      else if (confidence >= 60) confidenceClass = "confidence-medium";
      const statusIcon = comp.isVerified ? "\u2713" : comp.suggestedType === "unknown" ? "\u2753" : "\u{1F916}";
      const statusClass = comp.isVerified ? "icon-verified" : comp.suggestedType === "unknown" ? "icon-unknown" : "icon-auto";
      const selectOptions = this.createSelectOptions(comp.suggestedType);
      item.innerHTML = `
            <div class="component-info">
                <div class="component-name">${comp.name}</div>
                <div class="component-meta">
                    <div class="type-selector">
                        <span class="status-icon ${statusClass}">${statusIcon}</span>
                        <select class="type-select" data-component-id="${comp.id}">${selectOptions}</select>
                    </div>
                    <span class="confidence-badge ${confidenceClass}">${comp.isVerified ? "Manual" : confidence + "%"}</span>
                    <span class="page-info">\u{1F4C4} ${((_a = comp.pageInfo) == null ? void 0 : _a.pageName) || "Unknown"}</span>
                </div>
            </div>
            <div class="component-actions">
                <button class="btn-action navigate-btn" data-component-id="${comp.id}" data-page-name="${((_b = comp.pageInfo) == null ? void 0 : _b.pageName) || ""}" title="View in Figma">\u{1F441}\uFE0F</button>
            </div>
        `;
      return item;
    }
    /**
     * Create select options for component type dropdown
     */
    createSelectOptions(selectedType) {
      let options = "";
      Object.keys(this.componentTypes).forEach((category) => {
        options += `<optgroup label="${category}">`;
        this.componentTypes[category].forEach((type) => {
          const isSelected = type === selectedType ? "selected" : "";
          options += `<option value="${type}" ${isSelected}>${type}</option>`;
        });
        options += "</optgroup>";
      });
      const unknownSelected = selectedType === "unknown" ? "selected" : "";
      options += `<optgroup label="Other"><option value="unknown" ${unknownSelected}>unknown</option></optgroup>`;
      return options;
    }
    /**
     * Get filtered components based on search and filter
     */
    getFilteredComponents() {
      let filtered = this.scanResults;
      if (this.searchQuery) {
        filtered = filtered.filter(
          (comp) => comp.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || comp.suggestedType.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      }
      switch (this.currentFilter) {
        case "unknown":
          return filtered.filter((comp) => comp.suggestedType === "unknown");
        case "low":
          return filtered.filter((comp) => comp.confidence < 0.6 && !comp.isVerified);
        case "verified":
          return filtered.filter((comp) => comp.isVerified);
        default:
          return filtered;
      }
    }
    /**
     * Update component statistics in the stats bar
     */
    updateComponentStats() {
      const total = this.scanResults.length;
      const highConf = this.scanResults.filter((comp) => comp.confidence >= 0.8 && !comp.isVerified).length;
      const lowConf = this.scanResults.filter((comp) => (comp.confidence < 0.6 || comp.suggestedType === "unknown") && !comp.isVerified).length;
      const verified = this.scanResults.filter((comp) => comp.isVerified).length;
      if (this.elements.totalCount) this.elements.totalCount.textContent = total;
      if (this.elements.highConfCount) this.elements.highConfCount.textContent = highConf;
      if (this.elements.lowConfCount) this.elements.lowConfCount.textContent = lowConf;
      if (this.elements.verifiedCount) this.elements.verifiedCount.textContent = verified;
    }
    /**
     * Handle component type change
     */
    handleTypeChange(componentId, newType) {
      const component = this.scanResults.find((comp) => comp.id === componentId);
      if (component) {
        component.suggestedType = newType;
        component.confidence = 1;
        component.isVerified = true;
        this.renderComponentList();
        this.updateComponentStats();
        import_message_handler.MessageHandler.sendMessage({
          type: "update-component-type",
          payload: { componentId, newType }
        });
        console.log(`\u2705 Updated component ${componentId} to type: ${newType}`);
      }
    }
    /**
     * Handle navigation to component in Figma
     */
    handleNavigation(componentId, pageName) {
      import_message_handler.MessageHandler.sendMessage({
        type: "navigate-to-component",
        componentId,
        pageName
      });
      console.log(`\u{1F9ED} Navigating to component: ${componentId} on page: ${pageName}`);
    }
    /**
     * Handle component type updated from backend
     */
    handleComponentTypeUpdated(componentId, newType, componentName) {
      console.log(`\u2705 Component type updated: ${componentName} \u2192 ${newType}`);
    }
    /**
     * Generate LLM prompt for the design system
     */
    generateLLMPrompt() {
      import_message_handler.MessageHandler.sendMessage({ type: "generate-llm-prompt" });
      console.log("\u{1F4CB} Generating LLM prompt for design system");
    }
    /**
     * Handle generated LLM prompt
     */
    handleLLMPromptGenerated(prompt) {
      import_ui_framework.UIFramework.copyToClipboard(prompt).then(() => {
        if (this.elements.scanStatusText) {
          this.showScanStatus("\u{1F4CB} Prompt copied to clipboard!", "success");
        }
      });
    }
    /**
     * Enable the generator tab after successful scan
     */
    enableGeneratorTab() {
      import_state_manager2.StateManager.setState("generatorTabEnabled", true);
      if (window.tabManager) {
        window.tabManager.enableGeneratorTab();
      } else {
        const generatorTab = document.getElementById("generatorTab");
        if (generatorTab) {
          generatorTab.disabled = false;
        }
      }
      console.log("\u2705 Generator tab enabled");
    }
    /**
     * Show scan status message
     */
    showScanStatus(message, type) {
      if (this.elements.scanStatusContainer) {
        const statusDiv = document.createElement("div");
        statusDiv.className = `status ${type}`;
        statusDiv.textContent = message;
        this.elements.scanStatusContainer.appendChild(statusDiv);
        setTimeout(() => {
          if (statusDiv.parentNode) {
            statusDiv.parentNode.removeChild(statusDiv);
          }
        }, 3e3);
      }
    }
    /**
     * Get time ago string for display
     */
    getTimeAgo(timestamp) {
      if (!timestamp) return "some time ago";
      const now = Date.now();
      const diff = now - timestamp;
      const minutes = Math.floor(diff / (1e3 * 60));
      const hours = Math.floor(diff / (1e3 * 60 * 60));
      const days = Math.floor(diff / (1e3 * 60 * 60 * 24));
      if (minutes < 1) return "just now";
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
      this.currentFilter = "all";
      this.searchQuery = "";
      if (this.elements.searchInput) {
        this.elements.searchInput.value = "";
      }
      document.querySelectorAll(".filter-btn").forEach((btn) => {
        btn.classList.remove("active");
        if (btn.dataset.filter === "all") {
          btn.classList.add("active");
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
      if (!this.elements.exportRawBtn) {
        const exportBtn = document.createElement("button");
        exportBtn.id = "exportRawBtn";
        exportBtn.className = "btn btn-secondary";
        exportBtn.innerHTML = "\u{1F4E5} Export Raw Data";
        exportBtn.style.display = "none";
        exportBtn.style.marginLeft = "8px";
        exportBtn.title = "Export raw scan results as JSON";
        exportBtn.setAttribute("aria-label", "Export raw scan data as JSON file");
        scanBtn.parentNode.insertBefore(exportBtn, scanBtn.nextSibling);
        this.elements.exportRawBtn = exportBtn;
        exportBtn.addEventListener("click", () => this.exportRawScanData());
      }
    }
    /**
     * Export raw scan data as JSON file
     */
    exportRawScanData() {
      if (!this.scanResults || this.scanResults.length === 0) {
        this.showScanStatus("\u274C No scan data available to export", "error");
        return;
      }
      try {
        const exportData = {
          metadata: {
            exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
            componentCount: this.scanResults.length,
            exportVersion: "1.0",
            source: "Figma Design System Scanner"
          },
          components: this.scanResults
        };
        const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, -5);
        const filename = `design-system-raw-data-${timestamp}.json`;
        this.downloadJsonFile(exportData, filename);
        this.showScanStatus("\u2705 Raw data exported successfully", "success");
        console.log(`\u{1F4E5} Exported ${this.scanResults.length} components to ${filename}`);
      } catch (error) {
        console.error("Export failed:", error);
        this.showScanStatus("\u274C Export failed. Please try again.", "error");
      }
    }
    /**
     * Download data as JSON file
     */
    downloadJsonFile(data, filename) {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }
    /**
     * Refresh the component display
     */
    refresh() {
      this.renderComponentList();
      this.updateComponentStats();
    }
  };
  window.scanDesignSystem = function() {
    var _a;
    (_a = window.designSystemUI) == null ? void 0 : _a.scanDesignSystem();
  };
  window.rescanDesignSystem = function() {
    var _a;
    (_a = window.designSystemUI) == null ? void 0 : _a.rescanDesignSystem();
  };
  window.generateLLMPrompt = function() {
    var _a;
    (_a = window.designSystemUI) == null ? void 0 : _a.generateLLMPrompt();
  };
  window.enableGeneratorTab = function() {
    var _a;
    (_a = window.designSystemUI) == null ? void 0 : _a.enableGeneratorTab();
  };

  // src/ui/core/features/ai-generator-ui.js
  var import_message_handler2 = __toESM(require_message_handler());
  var import_ui_framework2 = __toESM(require_ui_framework());
  var import_state_manager3 = __toESM(require_state_manager());
  var AIGeneratorUI = class {
    constructor() {
      this.lastGeneratedJSON = null;
      this.promptGenerator = null;
      this.selectedImage = null;
      this.currentPlatform = "mobile";
      this.scanResults = [];
      this.designState = {
        original: null,
        current: null,
        history: [],
        frameId: null,
        isIterating: false
      };
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
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => this.setupElements());
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
        userPrompt: document.getElementById("userPrompt"),
        generateBtn: document.getElementById("generateBtn"),
        contextBar: document.getElementById("contextBar"),
        currentContext: document.getElementById("currentContext"),
        resetBtn: document.getElementById("resetBtn"),
        generationStatus: document.getElementById("generationStatus"),
        // Platform toggle
        mobileToggle: document.getElementById("mobile-toggle"),
        desktopToggle: document.getElementById("desktop-toggle"),
        // Image upload
        imageUploadArea: document.getElementById("imageUploadArea"),
        imageInput: document.getElementById("imageInput"),
        imagePreview: document.getElementById("imagePreview"),
        previewImg: document.getElementById("previewImg"),
        uploadPrompt: document.getElementById("uploadPrompt"),
        // Iteration mode
        iterationContext: document.getElementById("iterationContext"),
        currentDesignName: document.getElementById("currentDesignName"),
        modHistory: document.getElementById("modHistory"),
        userPromptLabel: document.getElementById("userPromptLabel"),
        // JSON debug
        jsonInput: document.getElementById("jsonInput"),
        jsonOutput: document.getElementById("jsonOutput"),
        jsonDebugSection: document.getElementById("jsonDebugSection")
      };
      this.setupEventListeners();
      this.setupImageUploadListeners();
      this.setupPlatformToggle();
      console.log("\u2705 AI Generator UI initialized");
    }
    /**
     * Setup event listeners
     */
    setupEventListeners() {
      if (this.elements.generateBtn) {
        this.elements.generateBtn.addEventListener("click", () => this.generateWithGemini());
      }
      if (this.elements.resetBtn) {
        this.elements.resetBtn.addEventListener("click", () => this.startFresh());
      }
      const manualBtn = document.querySelector('[onclick="generateFromJSON()"]');
      if (manualBtn) {
        manualBtn.removeAttribute("onclick");
        manualBtn.addEventListener("click", () => this.generateFromJSON());
      }
      const copyBtn = document.querySelector('[onclick="copyGeneratedJSON()"]');
      if (copyBtn) {
        copyBtn.removeAttribute("onclick");
        copyBtn.addEventListener("click", () => this.copyGeneratedJSON());
      }
      const toggleBtn = document.querySelector('[onclick="toggleJSONView()"]');
      if (toggleBtn) {
        toggleBtn.removeAttribute("onclick");
        toggleBtn.addEventListener("click", () => this.toggleJSONView());
      }
      const viewJSONBtn = document.querySelector('[onclick="viewCurrentDesignJSON()"]');
      if (viewJSONBtn) {
        viewJSONBtn.removeAttribute("onclick");
        viewJSONBtn.addEventListener("click", () => this.viewCurrentDesignJSON());
      }
      const resetToOriginalBtn = document.querySelector('[onclick="resetToOriginal()"]');
      if (resetToOriginalBtn) {
        resetToOriginalBtn.removeAttribute("onclick");
        resetToOriginalBtn.addEventListener("click", () => this.resetToOriginal());
      }
      const clearImageBtn = document.querySelector('[onclick="clearImageSelection()"]');
      if (clearImageBtn) {
        clearImageBtn.removeAttribute("onclick");
        clearImageBtn.addEventListener("click", () => this.clearImageSelection());
      }
    }
    /**
     * Setup platform toggle functionality
     */
    setupPlatformToggle() {
      if (this.elements.mobileToggle) {
        this.elements.mobileToggle.addEventListener("click", () => {
          this.setActivePlatform("mobile");
        });
      }
      if (this.elements.desktopToggle) {
        this.elements.desktopToggle.addEventListener("click", () => {
          this.setActivePlatform("desktop");
        });
      }
      this.setActivePlatform("mobile");
    }
    /**
     * Set active platform and update UI
     */
    setActivePlatform(platform) {
      this.currentPlatform = platform;
      if (this.elements.mobileToggle && this.elements.desktopToggle) {
        this.elements.mobileToggle.classList.remove("active");
        this.elements.desktopToggle.classList.remove("active");
        if (platform === "mobile") {
          this.elements.mobileToggle.classList.add("active");
        } else {
          this.elements.desktopToggle.classList.add("active");
        }
      }
      console.log("Platform switched to:", platform);
    }
    /**
     * Setup image upload listeners (drag/drop and file input)
     */
    setupImageUploadListeners() {
      const area = this.elements.imageUploadArea;
      const input = this.elements.imageInput;
      if (area && input) {
        area.addEventListener("click", (e) => {
          if (e.target.tagName !== "BUTTON") {
            input.click();
          }
        });
        area.addEventListener("dragover", (e) => {
          e.preventDefault();
          e.stopPropagation();
          area.style.borderColor = "#0366d6";
        });
        area.addEventListener("dragleave", (e) => {
          e.preventDefault();
          e.stopPropagation();
          area.style.borderColor = "#d1d5da";
        });
        area.addEventListener("drop", (e) => {
          e.preventDefault();
          e.stopPropagation();
          area.style.borderColor = "#d1d5da";
          const files = e.dataTransfer.files;
          if (files.length > 0) {
            this.handleImageSelection(files[0]);
          } else {
            console.log("\u{1F4DD} No files dropped, ensuring selectedImage is null");
            this.selectedImage = null;
          }
        });
        input.addEventListener("change", (e) => {
          console.log("\u{1F50D} File input change event fired");
          const files = e.target.files;
          console.log("\u{1F50D} Files count:", files.length);
          if (files.length > 0) {
            console.log("\u{1F4C1} File selected:", files[0].name);
            this.handleImageSelection(files[0]);
          } else {
            console.log("\u274C File dialog canceled, clearing selectedImage");
            this.selectedImage = null;
            console.log("\u2705 selectedImage after clearing:", this.selectedImage);
          }
        });
      }
    }
    /**
     * Initialize prompt generator
     */
    initializePromptGenerator() {
      try {
        console.log("\u{1F50D} DEBUG: About to create AIDesignerPromptGenerator");
        if (window.AIDesignerPromptGenerator) {
          this.promptGenerator = new window.AIDesignerPromptGenerator();
          console.log("\u{1F50D} DEBUG: Prompt generator created successfully:", !!this.promptGenerator);
        } else {
          console.error("\u274C AIDesignerPromptGenerator not available");
        }
      } catch (error) {
        console.error("\u274C ERROR creating prompt generator:", error);
      }
    }
    /**
     * Register message handlers for AI generator events
     */
    registerMessageHandlers() {
      if (window.messageHandler) {
        window.messageHandler.register("ui-generated-success", (msg) => {
          this.handleUIGeneratedSuccess(msg.generatedJSON, msg.frameId);
        });
        window.messageHandler.register("ui-modified-success", (msg) => {
          this.handleUIModifiedSuccess();
        });
        window.messageHandler.register("ui-generation-error", (msg) => {
          this.handleUIGenerationError(msg.error);
        });
        window.messageHandler.register("session-restored", (msg) => {
          this.handleSessionRestored(msg.designState, msg.scanData);
        });
        window.messageHandler.register("session-cleared", () => {
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
      var _a;
      const userPrompt = ((_a = this.elements.userPrompt) == null ? void 0 : _a.value.trim()) || "";
      const generateBtn = this.elements.generateBtn;
      const hasValidImage = this.isValidImageSelected();
      console.log("\u{1F50D} Image validation:");
      console.log("  - selectedImage:", this.selectedImage);
      console.log("  - hasValidImage:", hasValidImage);
      if (!userPrompt && !hasValidImage) {
        this.showStatus("\u274C Please describe the UI or upload a reference image", "error");
        return;
      }
      if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.textContent = "\u{1FA84} Generating...";
      }
      this.showStatus("\u{1F916} Gemini is generating UI...", "info");
      try {
        const apiKey = await this.getApiKeyFromBackend();
        const promptData = this.promptGenerator.generatePrompt(
          userPrompt,
          this.scanResults,
          [],
          hasValidImage,
          this.currentPlatform
        );
        console.log("\u{1F50D} Using hasValidImage:", hasValidImage);
        console.log("\u{1F50D} Prompt type:", hasValidImage ? "IMAGE ANALYSIS" : "TEXT ONLY");
        const imageToSend = hasValidImage ? this.selectedImage : null;
        const response = await this.callGeminiAPI(apiKey, promptData.fullPrompt, imageToSend);
        console.log("\u{1F50D} Raw LLM response:", response);
        console.log("\u{1F50D} Response length:", response.length);
        const basicValidation = this.validateAndFixJSONEnhanced(response);
        if (!basicValidation.isValid) {
          throw new Error(`JSON parsing failed: ${basicValidation.errors.join(", ")}`);
        }
        const aiValidation = this.validateAIResponse(basicValidation.data, this.scanResults);
        let layoutData;
        if (aiValidation.isValid) {
          console.log("\u2705 First attempt passed AI validation");
          layoutData = basicValidation.data;
        } else {
          console.log("\u274C AI validation failed, starting retry system...");
          console.log("Errors:", aiValidation.errors);
          try {
            layoutData = await this.executeRetry(userPrompt, aiValidation, this.scanResults, 1);
            this.showStatus("\u2705 Retry successful! UI improved and validated.", "success");
          } catch (retryError) {
            throw new Error(`AI validation and all retries failed: ${retryError.message}`);
          }
        }
        this.lastGeneratedJSON = layoutData;
        if (this.elements.jsonDebugSection) {
          this.elements.jsonDebugSection.style.display = "block";
        }
        if (this.elements.jsonOutput) {
          this.elements.jsonOutput.textContent = JSON.stringify(layoutData, null, 2);
        }
        this.showStatus("\u2728 Creating UI in Figma...", "success");
        import_message_handler2.MessageHandler.sendMessage({
          type: "generate-ui-from-json",
          payload: JSON.stringify(layoutData)
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.showStatus(`\u274C Error: ${errorMessage}`, "error");
      } finally {
        if (generateBtn) {
          generateBtn.disabled = false;
          generateBtn.textContent = "\u{1FA84} Generate UI";
        }
      }
    }
    /**
     * Iterate on existing design with modifications
     */
    async iterateOnDesign() {
      var _a;
      const userPrompt = ((_a = this.elements.userPrompt) == null ? void 0 : _a.value.trim()) || "";
      const generateBtn = this.elements.generateBtn;
      if (!userPrompt) {
        this.showStatus("\u274C Please describe the changes you want to make.", "error");
        return;
      }
      console.log("\u{1F50D} Before generating modification prompt:");
      console.log("  - selectedImage:", this.selectedImage);
      console.log("  - !!selectedImage:", !!this.selectedImage);
      console.log("  - isValidImageSelected():", this.isValidImageSelected());
      console.log("  - Should use modification prompt (not image prompt)");
      if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.textContent = "\u{1FA84} Applying...";
      }
      this.showStatus("\u{1F916} Gemini is analyzing your changes...", "info");
      try {
        const apiKey = await this.getApiKeyFromBackend();
        const promptData = this.promptGenerator.generateModificationPrompt(
          userPrompt,
          this.designState.current,
          this.scanResults,
          this.currentPlatform
        );
        console.log("\u2705 Using modification prompt with platform:", this.currentPlatform);
        const response = await this.callGeminiAPI(apiKey, promptData.fullPrompt, null);
        const basicValidation = this.validateAndFixJSONEnhanced(response);
        if (!basicValidation.isValid) {
          throw new Error(`JSON parsing failed: ${basicValidation.errors.join(", ")}`);
        }
        const aiValidation = this.validateAIResponse(basicValidation.data, this.scanResults);
        let validatedData;
        if (aiValidation.isValid) {
          console.log("\u2705 Modification passed AI validation on first attempt");
          validatedData = basicValidation.data;
        } else {
          console.log("\u274C Modification validation failed, starting retry system...");
          try {
            validatedData = await this.executeRetry(userPrompt, aiValidation, this.scanResults, 1);
            this.showStatus("\u2705 Modification retry successful! Changes validated.", "success");
          } catch (retryError) {
            throw new Error(`Modification validation failed: ${retryError.message}`);
          }
        }
        const modifiedJSON = validatedData;
        this.lastGeneratedJSON = modifiedJSON;
        this.designState.current = modifiedJSON;
        this.designState.history.push(userPrompt);
        this.updateModificationHistory();
        this.saveCurrentSession();
        if (this.elements.jsonDebugSection) {
          this.elements.jsonDebugSection.style.display = "block";
        }
        if (this.elements.jsonOutput) {
          this.elements.jsonOutput.textContent = JSON.stringify(modifiedJSON, null, 2);
        }
        import_message_handler2.MessageHandler.sendMessage({
          type: "modify-existing-ui",
          payload: {
            modifiedJSON,
            frameId: this.designState.frameId
          }
        });
        if (this.elements.userPrompt) {
          this.elements.userPrompt.value = "";
        }
        this.showStatus("\u2705 Changes applied successfully!", "success");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.showStatus(`\u274C Error: ${errorMessage}`, "error");
      } finally {
        if (generateBtn) {
          generateBtn.disabled = false;
          generateBtn.textContent = "\u{1FA84} Apply Changes";
        }
      }
    }
    /**
     * Generate UI from manual JSON input
     */
    generateFromJSON() {
      const jsonInput = this.elements.jsonInput;
      if (!jsonInput || !jsonInput.value.trim()) {
        this.showStatus("Please paste JSON data", "error");
        return;
      }
      this.startFresh();
      import_message_handler2.MessageHandler.sendMessage({
        type: "generate-ui-from-json",
        payload: jsonInput.value.trim()
      });
    }
    /**
     * Start fresh - reset to new design mode
     */
    startFresh() {
      this.designState = {
        original: null,
        current: null,
        history: [],
        frameId: null,
        isIterating: false
      };
      this.selectedImage = null;
      console.log("\u{1F504} startFresh called, selectedImage reset to:", this.selectedImage);
      if (this.elements.iterationContext) {
        this.elements.iterationContext.style.display = "none";
      }
      if (this.elements.userPromptLabel) {
        this.elements.userPromptLabel.textContent = "Describe the UI you want to create:";
      }
      if (this.elements.userPrompt) {
        this.elements.userPrompt.placeholder = "create a login form with email and password fields...";
        this.elements.userPrompt.value = "";
      }
      if (this.elements.currentContext) {
        this.elements.currentContext.textContent = "Ready for new UI";
      }
      if (this.elements.generateBtn) {
        this.elements.generateBtn.textContent = "\u{1FA84} Generate UI";
      }
      if (this.elements.imageUploadArea) {
        this.elements.imageUploadArea.style.display = "block";
      }
      this.clearStatus();
      this.clearImageSelection();
    }
    /**
     * Enter iteration mode after successful generation
     */
    enterIterationMode(generatedJSON, frameId) {
      var _a;
      this.designState.original = JSON.parse(JSON.stringify(generatedJSON));
      this.designState.current = generatedJSON;
      this.designState.frameId = frameId;
      this.designState.isIterating = true;
      this.designState.history = ["Original design generated."];
      this.saveCurrentSession();
      if (this.elements.currentDesignName) {
        this.elements.currentDesignName.textContent = ((_a = generatedJSON.layoutContainer) == null ? void 0 : _a.name) || "Generated UI";
      }
      this.updateModificationHistory();
      if (this.elements.iterationContext) {
        this.elements.iterationContext.style.display = "block";
      }
      if (this.elements.userPromptLabel) {
        this.elements.userPromptLabel.textContent = "Describe the changes you want to make:";
      }
      if (this.elements.userPrompt) {
        this.elements.userPrompt.placeholder = 'e.g., "add a forgot password link" or "change the button to secondary"';
      }
      if (this.elements.generateBtn) {
        this.elements.generateBtn.textContent = "\u{1FA84} Apply Changes";
      }
      if (this.elements.imageUploadArea) {
        this.elements.imageUploadArea.style.display = "none";
      }
    }
    /**
     * Update modification history display
     */
    updateModificationHistory() {
      const historyList = this.elements.modHistory;
      if (historyList && this.designState.history) {
        historyList.innerHTML = this.designState.history.map((item) => `<li>${item}</li>`).join("");
      }
    }
    /**
     * Reset to original generated design
     */
    async resetToOriginal() {
      if (!this.designState.isIterating || !this.designState.original) return;
      this.showStatus("\u{1F504} Resetting to original design...", "info");
      this.designState.current = JSON.parse(JSON.stringify(this.designState.original));
      this.designState.history = ["Original design generated."];
      this.updateModificationHistory();
      this.saveCurrentSession();
      import_message_handler2.MessageHandler.sendMessage({
        type: "modify-existing-ui",
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
        this.elements.jsonDebugSection.style.display = "block";
        this.elements.jsonOutput.style.display = "block";
      }
    }
    /**
     * Copy generated JSON to clipboard
     */
    copyGeneratedJSON() {
      if (this.lastGeneratedJSON) {
        import_ui_framework2.UIFramework.copyToClipboard(JSON.stringify(this.lastGeneratedJSON, null, 2)).then(() => this.showStatus("\u{1F4CB} JSON copied to clipboard!", "success"));
      }
    }
    /**
     * Toggle JSON debug view visibility
     */
    toggleJSONView() {
      if (this.elements.jsonOutput) {
        const isVisible = this.elements.jsonOutput.style.display !== "none";
        this.elements.jsonOutput.style.display = isVisible ? "none" : "block";
      }
    }
    /**
     * Validate image file type and size
     */
    validateImageFile(file) {
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      const maxSize = 4 * 1024 * 1024;
      if (!validTypes.includes(file.type)) {
        this.showStatus(`\u274C Invalid file type. Please use JPG, PNG, WEBP, or GIF.`, "error");
        return false;
      }
      if (file.size > maxSize) {
        this.showStatus(`\u274C File is too large. Maximum size is 4MB.`, "error");
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
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = (error) => reject(error);
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
          base64,
          type: file.type,
          name: file.name
        };
        if (this.elements.previewImg) {
          this.elements.previewImg.src = `data:${file.type};base64,${base64}`;
        }
        if (this.elements.imagePreview) {
          this.elements.imagePreview.style.display = "flex";
        }
        if (this.elements.uploadPrompt) {
          this.elements.uploadPrompt.style.display = "none";
        }
        if (this.elements.imageUploadArea) {
          this.elements.imageUploadArea.classList.add("has-image");
        }
        this.showStatus(`\u2705 Image "${file.name}" loaded successfully.`, "success");
      } catch (error) {
        console.error("Error processing image:", error);
        this.showStatus("\u274C Could not process the image file.", "error");
        this.clearImageSelection();
      }
    }
    /**
     * Clear selected image
     */
    clearImageSelection() {
      this.selectedImage = null;
      if (this.elements.imageInput) {
        this.elements.imageInput.value = "";
      }
      if (this.elements.imagePreview) {
        this.elements.imagePreview.style.display = "none";
      }
      if (this.elements.uploadPrompt) {
        this.elements.uploadPrompt.style.display = "block";
      }
      if (this.elements.imageUploadArea) {
        this.elements.imageUploadArea.classList.remove("has-image");
      }
      this.clearStatus();
    }
    /**
     * Check if valid image is selected
     */
    isValidImageSelected() {
      return this.selectedImage && this.selectedImage.base64 && this.selectedImage.type && this.selectedImage.base64.length > 0;
    }
    /**
     * Get API key from backend
     */
    async getApiKeyFromBackend() {
      this.showStatus("\u{1F504} Getting API key...", "info");
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          window.removeEventListener("message", handler);
          reject(new Error("Timeout getting API key."));
        }, 3e3);
        const handler = (event) => {
          const msg = event.data.pluginMessage;
          if (msg && (msg.type === "api-key-found" || msg.type === "api-key-not-found")) {
            clearTimeout(timeout);
            window.removeEventListener("message", handler);
            resolve(msg.payload || null);
          }
        };
        window.addEventListener("message", handler);
        import_message_handler2.MessageHandler.sendMessage({ type: "get-api-key" });
      });
    }
    /**
     * Call Gemini API with prompt and optional image
     */
    async callGeminiAPI(apiKey, fullPrompt, image) {
      var _a;
      this.showStatus("\u{1F916} Calling Gemini API...", "info");
      const apiParts = [{ text: fullPrompt }];
      if (image) {
        apiParts.push({ inlineData: { mimeType: image.type, data: image.base64 } });
      }
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: apiParts }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192,
            responseMimeType: "application/json"
          }
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(((_a = errorData.error) == null ? void 0 : _a.message) || "API Error");
      }
      const data = await response.json();
      if (!data.candidates || !data.candidates[0].content.parts[0].text) {
        throw new Error("Invalid response structure from Gemini API.");
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
        console.log("\u{1F527} JSON parsing failed, attempting fixes...");
        let fixed = jsonString.trim();
        fixed = fixed.replace(/,(\s*[}\]])/g, "$1");
        fixed = fixed.replace(/}(\s*){/g, "},\n$1{");
        if (fixed.includes("[") && !fixed.includes("]")) {
          fixed = fixed + "]";
        }
        const openBraces = (fixed.match(/{/g) || []).length;
        const closeBraces = (fixed.match(/}/g) || []).length;
        if (openBraces > closeBraces) {
          fixed = fixed + "}";
        }
        fixed = fixed.replace(/"variants":\s*{[^}]*$/, '"variants": {}');
        try {
          const parsed = JSON.parse(fixed);
          console.log("\u2705 JSON fixed successfully!");
          return { isValid: true, data: parsed, errors: [] };
        } catch (e2) {
          console.error("\u274C Could not fix JSON:", e2.message);
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
        severity: "none"
      };
      console.log("\u{1F50D} Starting AI response validation...");
      if (!jsonData.layoutContainer && !jsonData.items) {
        validationResult.isValid = false;
        validationResult.errors.push("Missing required layoutContainer or items");
        validationResult.severity = "critical";
        return validationResult;
      }
      if (!jsonData.items || !Array.isArray(jsonData.items)) {
        validationResult.isValid = false;
        validationResult.errors.push("Missing or invalid items array");
        validationResult.severity = "critical";
        return validationResult;
      }
      const availableComponents = /* @__PURE__ */ new Set();
      if (scanResults && Array.isArray(scanResults)) {
        scanResults.forEach((comp) => availableComponents.add(comp.id));
      }
      let invalidComponentCount = 0;
      jsonData.items.forEach((item, index) => {
        if (item.type && !item.type.startsWith("native-") && !item.type.startsWith("layoutContainer")) {
          if (!item.componentNodeId) {
            validationResult.errors.push(`Item ${index}: Missing componentNodeId for type "${item.type}"`);
            invalidComponentCount++;
          } else if (!availableComponents.has(item.componentNodeId)) {
            validationResult.errors.push(`Item ${index}: Component ID "${item.componentNodeId}" not found in design system`);
            invalidComponentCount++;
          }
        }
      });
      if (invalidComponentCount > 0) {
        validationResult.isValid = false;
        if (invalidComponentCount >= jsonData.items.length * 0.5) {
          validationResult.severity = "critical";
        } else if (invalidComponentCount >= jsonData.items.length * 0.3) {
          validationResult.severity = "high";
        } else {
          validationResult.severity = "medium";
        }
      }
      console.log(`\u2705 Validation complete. Valid: ${validationResult.isValid}, Severity: ${validationResult.severity}`);
      return validationResult;
    }
    /**
     * Execute retry logic for failed validations
     */
    async executeRetry(originalPrompt, validationResult, scanResults, attemptNumber, maxRetries = 3) {
      if (attemptNumber > maxRetries) {
        throw new Error(`Failed after ${maxRetries} attempts. Last errors: ${validationResult.errors.join(", ")}`);
      }
      this.showStatus(`\u{1F504} Improving result (attempt ${attemptNumber}/${maxRetries})...`, "info");
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
          console.log(`\u2705 Retry ${attemptNumber} successful!`);
          return validation.data;
        } else {
          console.log(`\u274C Retry ${attemptNumber} failed validation, trying again...`);
          return await this.executeRetry(originalPrompt, aiValidation, scanResults, attemptNumber + 1, maxRetries);
        }
      } catch (error) {
        console.log(`\u274C Retry ${attemptNumber} failed:`, error.message);
        return await this.executeRetry(originalPrompt, validationResult, scanResults, attemptNumber + 1, maxRetries);
      }
    }
    /**
     * Create retry prompt with escalating strategies
     */
    createRetryPrompt(originalPrompt, validationResult, scanResults, attemptNumber) {
      console.log(`\u{1F504} Creating retry prompt (attempt ${attemptNumber})`);
      let retryStrategy = "";
      let enhancedPrompt = originalPrompt;
      if (attemptNumber === 1) {
        if (validationResult.errors.some((err) => err.includes("Component ID") || err.includes("not found"))) {
          retryStrategy = "COMPONENT_ID_FIX";
          enhancedPrompt += "\n\n// \u{1F527} COMPONENT ID CORRECTION NEEDED:\n";
          enhancedPrompt += "// The previous response used invalid component IDs.\n";
          enhancedPrompt += "// You MUST use ONLY the exact componentNodeId values from the design system list above.\n";
          enhancedPrompt += '// NEVER use placeholder IDs like "button_id" or "input_id".\n';
          if (scanResults && scanResults.length > 0) {
            enhancedPrompt += "// Available component IDs:\n";
            scanResults.slice(0, 5).forEach((comp) => {
              enhancedPrompt += `// - ${comp.suggestedType}: "${comp.id}"
`;
            });
          }
        }
        if (validationResult.errors.some((err) => err.includes("Missing") && err.includes("layoutContainer"))) {
          retryStrategy = "STRUCTURE_FIX";
          enhancedPrompt += "\n\n// \u{1F527} STRUCTURE CORRECTION NEEDED:\n";
          enhancedPrompt += '// Your response must have BOTH "layoutContainer" and "items" at the top level.\n';
          enhancedPrompt += "// Follow this exact structure:\n";
          enhancedPrompt += '// {"layoutContainer": {...}, "items": [...]}\n';
        }
      } else if (attemptNumber === 2) {
        retryStrategy = "SIMPLIFIED";
        enhancedPrompt = `Create a SIMPLIFIED version of: ${originalPrompt}
            
// \u{1F3AF} SIMPLIFIED GENERATION RULES:
// - Use ONLY basic components (button, input, text)
// - NO variants or complex properties
// - Keep layout simple with VERTICAL layoutMode
// - Maximum 3-4 items total
// - Use exact componentNodeId values from design system`;
      } else {
        retryStrategy = "BASIC_FALLBACK";
        enhancedPrompt = `Create a basic UI layout with:
- 1 text element for title
- 1-2 input elements  
- 1 button element
- Simple vertical layout
- Use ONLY exact componentNodeId values from the available design system components`;
      }
      console.log(`\u{1F4DD} Retry strategy: ${retryStrategy}`);
      return {
        prompt: enhancedPrompt,
        strategy: retryStrategy,
        attemptNumber
      };
    }
    /**
     * Save current session state
     */
    saveCurrentSession() {
      if (this.designState.isIterating) {
        import_message_handler2.MessageHandler.sendMessage({
          type: "save-current-session",
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
        this.elements.userPrompt.value = "";
      }
    }
    /**
     * Handle successful UI modification
     */
    handleUIModifiedSuccess() {
      this.clearStatus();
      this.showStatus("\u2705 UI updated successfully!", "success");
    }
    /**
     * Handle UI generation error
     */
    handleUIGenerationError(error) {
      this.showStatus(`\u274C Generation error: ${error}`, "error");
    }
    /**
     * Handle session restored from backend
     */
    handleSessionRestored(designState, scanData) {
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
        this.designState.history = designState.history;
        this.updateModificationHistory();
      }
      this.showStatus("\u2705 Session restored successfully!", "success");
    }
    /**
     * Update scan results
     */
    updateScanResults(scanResults) {
      this.scanResults = scanResults || [];
      console.log(`\u{1F504} Updated scan results: ${this.scanResults.length} components`);
    }
    /**
     * Show status message
     */
    showStatus(message, type) {
      if (this.elements.generationStatus) {
        import_ui_framework2.UIFramework.showStatus(this.elements.generationStatus.id, message, type);
      }
    }
    /**
     * Clear status message
     */
    clearStatus() {
      if (this.elements.generationStatus) {
        import_ui_framework2.UIFramework.clearStatus(this.elements.generationStatus.id);
      }
    }
    /**
     * Debug image state (for troubleshooting)
     */
    debugImageState() {
      console.log("\u{1F50D} DEBUG IMAGE STATE:");
      console.log("  - selectedImage:", this.selectedImage);
      console.log("  - !!selectedImage:", !!this.selectedImage);
      console.log("  - typeof selectedImage:", typeof this.selectedImage);
      console.log("  - isValidImageSelected():", this.isValidImageSelected());
      const input = this.elements.imageInput;
      console.log("  - input.files.length:", input ? input.files.length : "no input");
      console.log("  - input.value:", input ? input.value : "no input");
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
  };
  window.generateWithGemini = function() {
    var _a;
    (_a = window.aiGeneratorUI) == null ? void 0 : _a.generateWithGemini();
  };
  window.generateFromJSON = function() {
    var _a;
    (_a = window.aiGeneratorUI) == null ? void 0 : _a.generateFromJSON();
  };
  window.startFresh = function() {
    var _a;
    (_a = window.aiGeneratorUI) == null ? void 0 : _a.startFresh();
  };
  window.copyGeneratedJSON = function() {
    var _a;
    (_a = window.aiGeneratorUI) == null ? void 0 : _a.copyGeneratedJSON();
  };
  window.toggleJSONView = function() {
    var _a;
    (_a = window.aiGeneratorUI) == null ? void 0 : _a.toggleJSONView();
  };
  window.viewCurrentDesignJSON = function() {
    var _a;
    (_a = window.aiGeneratorUI) == null ? void 0 : _a.viewCurrentDesignJSON();
  };
  window.resetToOriginal = function() {
    var _a;
    (_a = window.aiGeneratorUI) == null ? void 0 : _a.resetToOriginal();
  };
  window.clearImageSelection = function() {
    var _a;
    (_a = window.aiGeneratorUI) == null ? void 0 : _a.clearImageSelection();
  };
  window.setActivePlatform = function(platform) {
    var _a;
    (_a = window.aiGeneratorUI) == null ? void 0 : _a.setActivePlatform(platform);
  };
  window.debugImageState = function() {
    var _a;
    (_a = window.aiGeneratorUI) == null ? void 0 : _a.debugImageState();
  };

  // src/ui/core/features/api-settings-ui.js
  var import_message_handler3 = __toESM(require_message_handler());
  var import_ui_framework3 = __toESM(require_ui_framework());
  var APISettingsUI = class {
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
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => this.setupElements());
      } else {
        this.setupElements();
      }
    }
    /**
     * Setup DOM elements and event listeners
     */
    setupElements() {
      this.elements = {
        apiKeyInput: document.getElementById("apiKey"),
        saveBtn: document.getElementById("saveBtn"),
        testBtn: document.getElementById("testBtn"),
        statusContainer: document.getElementById("connectionStatus")
      };
      if (this.elements.apiKeyInput && this.elements.saveBtn && this.elements.testBtn) {
        this.setupEventListeners();
        this.setupApiKeyHandling();
        console.log("\u2705 API Settings UI initialized");
      } else {
        console.warn("\u26A0\uFE0F API Settings elements not found");
      }
    }
    /**
     * Setup event listeners
     */
    setupEventListeners() {
      var _a, _b;
      (_a = this.elements.saveBtn) == null ? void 0 : _a.addEventListener("click", () => this.saveApiKey());
      (_b = this.elements.testBtn) == null ? void 0 : _b.addEventListener("click", () => this.testConnection());
      this.setupApiKeyHandling();
    }
    /**
     * Setup API key input behavior
     */
    setupApiKeyHandling() {
      const input = this.elements.apiKeyInput;
      if (!input) return;
      input.addEventListener("focus", function() {
        if (this.getAttribute("data-has-key") === "true") {
          this.value = "";
          this.setAttribute("data-has-key", "false");
        }
      });
      input.addEventListener("input", function() {
        if (this.value.length > 0) {
          this.setAttribute("data-has-key", "false");
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
      if (input.getAttribute("data-has-key") === "true" && apiKey.includes("\u25CF")) {
        this.showStatus("\u2139\uFE0F API key already saved", "info");
        return;
      }
      if (!apiKey) {
        this.showStatus("\u274C Please enter an API key", "error");
        return;
      }
      saveBtn.disabled = true;
      saveBtn.textContent = "\u{1F4BE} Saving...";
      import_message_handler3.MessageHandler.sendMessage({
        type: "save-api-key",
        payload: apiKey
      });
    }
    /**
     * Test API connection
     */
    async testConnection() {
      var _a;
      const testBtn = this.elements.testBtn;
      if (!testBtn) return;
      testBtn.disabled = true;
      testBtn.textContent = "\u{1F50C} Testing...";
      this.showStatus("\u{1F504} Requesting API key...", "info");
      try {
        const apiKey = await this.getApiKeyFromBackend();
        if (!apiKey) {
          throw new Error("API key not found. Please save it.");
        }
        this.showStatus("\u{1F504} Testing connection with Gemini API...", "info");
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Hello" }] }]
          })
        });
        if (response.ok) {
          this.showStatus("\u2705 Connection successful!", "success");
        } else {
          const errorData = await response.json();
          throw new Error(`HTTP ${response.status}: ${((_a = errorData.error) == null ? void 0 : _a.message) || "Unknown error"}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.showStatus(`\u274C Error: ${errorMessage}`, "error");
      } finally {
        testBtn.disabled = false;
        testBtn.textContent = "\u{1F50C} Test Connection";
      }
    }
    /**
     * Get API key from backend
     */
    async getApiKeyFromBackend() {
      this.showStatus("\u{1F504} Getting API key...", "info");
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          window.removeEventListener("message", handler);
          reject(new Error("Timeout getting API key."));
        }, 3e3);
        const handler = (event) => {
          const msg = event.data.pluginMessage;
          if (msg && (msg.type === "api-key-found" || msg.type === "api-key-not-found")) {
            clearTimeout(timeout);
            window.removeEventListener("message", handler);
            resolve(msg.payload || null);
          }
        };
        window.addEventListener("message", handler);
        import_message_handler3.MessageHandler.sendMessage({ type: "get-api-key" });
      });
    }
    /**
     * Handle API key loaded from storage
     */
    handleApiKeyLoaded(apiKey) {
      const input = this.elements.apiKeyInput;
      if (!input) return;
      input.value = "\u25CF".repeat(40);
      input.setAttribute("data-has-key", "true");
      this.showStatus("\u2705 API key loaded from previous session", "success");
    }
    /**
     * Handle API key saved successfully
     */
    handleApiKeySaved() {
      const saveBtn = this.elements.saveBtn;
      const input = this.elements.apiKeyInput;
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = "\u{1F4BE} Save API Key";
      }
      if (input) {
        input.value = "\u25CF".repeat(40);
        input.setAttribute("data-has-key", "true");
      }
      this.showStatus("\u2705 API key saved successfully!", "success");
    }
    /**
     * Clear all data
     */
    clearAllData() {
      if (confirm("Clear all saved data? This will remove API key and design system cache.")) {
        import_message_handler3.MessageHandler.sendMessage({ type: "clear-storage" });
        location.reload();
      }
    }
    /**
     * Show status message
     */
    showStatus(message, type) {
      if (this.elements.statusContainer) {
        import_ui_framework3.UIFramework.showStatus(this.elements.statusContainer.id, message, type);
      }
    }
    /**
     * Clear status message
     */
    clearStatus() {
      if (this.elements.statusContainer) {
        import_ui_framework3.UIFramework.clearStatus(this.elements.statusContainer.id);
      }
    }
  };
  window.saveApiKey = function() {
    var _a;
    (_a = window.apiSettingsUI) == null ? void 0 : _a.saveApiKey();
  };
  window.testGeminiConnection = function() {
    var _a;
    (_a = window.apiSettingsUI) == null ? void 0 : _a.testConnection();
  };
  window.clearAllData = function() {
    var _a;
    (_a = window.apiSettingsUI) == null ? void 0 : _a.clearAllData();
  };

  // ui-main.js
  window.UIFramework = import_ui_framework4.UIFramework;
  window.StateManager = import_state_manager4.StateManager;
  window.TabManager = TabManager;
  window.MessageHandler = import_message_handler4.MessageHandler;
  window.DesignSystemUI = DesignSystemUI;
  window.AIGeneratorUI = AIGeneratorUI;
  window.APISettingsUI = APISettingsUI;
  window.$ = import_ui_framework4.UIFramework.$;
  window.byId = import_ui_framework4.UIFramework.byId;
  window.showStatus = import_ui_framework4.UIFramework.showStatus;
  window.clearStatus = import_ui_framework4.UIFramework.clearStatus;
  window.switchTab = import_ui_framework4.UIFramework.switchTab;
  window.copyToClipboard = import_ui_framework4.UIFramework.copyToClipboard;
  function initializeUIModules() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        try {
          if (window.DesignSystemUI) {
            window.designSystemUI = new window.DesignSystemUI();
          }
          if (window.TabManager) {
            window.tabManager = new window.TabManager();
          }
          console.log("\u2705 UI modules initialized individually");
        } catch (error) {
          console.error("\u274C Module initialization failed:", error);
        }
      });
    } else {
      try {
        if (window.DesignSystemUI) {
          window.designSystemUI = new window.DesignSystemUI();
        }
        if (window.TabManager) {
          window.tabManager = new window.TabManager();
        }
        console.log("\u2705 UI modules initialized individually");
      } catch (error) {
        console.error("\u274C Module initialization failed:", error);
      }
    }
  }
  initializeUIModules();
  console.log("\u2705 UI modules loaded and ready");
})();
