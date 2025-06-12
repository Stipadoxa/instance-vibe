// code.ts - ПОВНА ВЕРСІЯ З ПІДТРИМКОЮ СЕСІЙ

// Existing interfaces (залишаються без змін)
interface ComponentInfo {
  id: string;
  name: string;
  suggestedType: string;
  confidence: number;
  variants?: string[];
  variantDetails?: { [key: string]: string[] };
  textLayers?: string[];
  isFromLibrary: boolean;
  pageInfo?: {
    pageName: string;
    pageId: string;
    isCurrentPage: boolean;
  };
}

interface ScanSession {
  components: ComponentInfo[];
  scanTime: number;
  version: string;
  fileKey?: string;
}

// NEW: Session management interfaces
interface SessionState {
  fileId: string;
  fileName: string;
  lastModified: number;
  designState: {
    original: any;
    current: any;
    history: string[];
    frameId: string;
    frameName: string;
    isIterating: boolean;
  };
  scanData?: ComponentInfo[];
}

interface SessionStorage {
  sessions: { [fileId: string]: SessionState };
  lastActiveSession?: string;
  version: string;
}

// NEW: Session Manager Class
class SessionManager {
  private static readonly STORAGE_KEY = 'aidesigner-sessions';
  private static readonly SESSION_VERSION = '1.0';
  private static readonly MAX_SESSION_AGE = 30 * 24 * 60 * 60 * 1000; // 30 днів

  // Зберегти поточний стан сесії
  static async saveSession(designState: any, scanData?: ComponentInfo[]): Promise<void> {
    try {
      const fileId = figma.root.id;
      const fileName = figma.root.name;
      
      // Якщо немає активної ітерації, не зберігаємо
      if (!designState.isIterating) return;
      
      console.log(`💾 Збереження сесії для файлу: ${fileName}`);
      
      const storage = await this.getSessionStorage();
      
      const session: SessionState = {
        fileId,
        fileName,
        lastModified: Date.now(),
        designState: {
          original: designState.original,
          current: designState.current,
          history: [...designState.history],
          frameId: designState.frameId,
          frameName: designState.frameId ? await this.getFrameName(designState.frameId) : '',
          isIterating: designState.isIterating
        },
        scanData
      };
      
      storage.sessions[fileId] = session;
      storage.lastActiveSession = fileId;
      
      await figma.clientStorage.setAsync(this.STORAGE_KEY, storage);
      console.log(`✅ Сесія збережена`);
      
    } catch (error) {
      console.error('❌ Помилка збереження сесії:', error);
    }
  }

  // Завантажити сесію для поточного файлу
  static async loadSession(): Promise<SessionState | null> {
    try {
      const fileId = figma.root.id;
      const storage = await this.getSessionStorage();
      
      const session = storage.sessions[fileId];
      if (!session) return null;
      
      // Перевірити, чи існує ще фрейм
      if (session.designState.frameId) {
        const frame = await figma.getNodeByIdAsync(session.designState.frameId);
        if (!frame || frame.removed) {
          console.log('⚠️ Фрейм з попередньої сесії не знайдено, очищуємо сесію');
          await this.clearSession(fileId);
          return null;
        }
      }
      
      console.log(`✅ Сесія знайдена для файлу: ${session.fileName}`);
      return session;
      
    } catch (error) {
      console.error('❌ Помилка завантаження сесії:', error);
      return null;
    }
  }

  // Отримати всі активні сесії
  static async getAllSessions(): Promise<SessionState[]> {
    try {
      const storage = await this.getSessionStorage();
      const now = Date.now();
      
      const activeSessions = Object.values(storage.sessions)
        .filter(session => (now - session.lastModified) < this.MAX_SESSION_AGE)
        .sort((a, b) => b.lastModified - a.lastModified);
      
      return activeSessions;
    } catch (error) {
      console.error('❌ Помилка завантаження всіх сесій:', error);
      return [];
    }
  }

  // Очистити сесію для файлу
  static async clearSession(fileId?: string): Promise<void> {
    try {
      const targetFileId = fileId || figma.root.id;
      const storage = await this.getSessionStorage();
      
      delete storage.sessions[targetFileId];
      
      if (storage.lastActiveSession === targetFileId) {
        delete storage.lastActiveSession;
      }
      
      await figma.clientStorage.setAsync(this.STORAGE_KEY, storage);
      console.log(`🗑️ Сесія очищена для файлу: ${targetFileId}`);
    } catch (error) {
      console.error('❌ Помилка очищення сесії:', error);
    }
  }

  // Очистити старі сесії
  static async cleanupOldSessions(): Promise<void> {
    try {
      const storage = await this.getSessionStorage();
      const now = Date.now();
      let cleaned = 0;
      
      Object.entries(storage.sessions).forEach(([fileId, session]) => {
        if ((now - session.lastModified) > this.MAX_SESSION_AGE) {
          delete storage.sessions[fileId];
          cleaned++;
        }
      });
      
      if (cleaned > 0) {
        await figma.clientStorage.setAsync(this.STORAGE_KEY, storage);
        console.log(`🧹 Очищено ${cleaned} старих сесій`);
      }
    } catch (error) {
      console.error('❌ Помилка очищення старих сесій:', error);
    }
  }

  // Отримати storage з ініціалізацією
  private static async getSessionStorage(): Promise<SessionStorage> {
    try {
      const storage = await figma.clientStorage.getAsync(this.STORAGE_KEY);
      
      if (!storage || storage.version !== this.SESSION_VERSION) {
        return {
          sessions: {},
          version: this.SESSION_VERSION
        };
      }
      
      return storage;
    } catch (error) {
      console.error('❌ Помилка отримання storage:', error);
      return {
        sessions: {},
        version: this.SESSION_VERSION
      };
    }
  }

  // Отримати назву фрейму за ID
  private static async getFrameName(frameId: string): Promise<string> {
    try {
      const frame = await figma.getNodeByIdAsync(frameId);
      return frame?.name || 'Unknown Frame';
    } catch {
      return 'Unknown Frame';
    }
  }

  // Відновити сесію з даних
  static async restoreSessionData(sessionData: SessionState): Promise<boolean> {
    try {
      // Перевірити, чи існує фрейм
      if (sessionData.designState.frameId) {
        const frame = await figma.getNodeByIdAsync(sessionData.designState.frameId);
        if (!frame || frame.removed) {
          throw new Error('Фрейм не знайдено');
        }
        
        // Перейти до фрейму
        figma.currentPage.selection = [frame as SceneNode];
        figma.viewport.scrollAndZoomIntoView([frame as SceneNode]);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Помилка відновлення сесії:', error);
      return false;
    }
  }
}

// Existing functions (залишаються без змін, додаємо тільки session saving)
async function scanDesignSystem(): Promise<ComponentInfo[]> {
  console.log("🔍 Starting scan...");
  const components: ComponentInfo[] = [];
  try {
    await figma.loadAllPagesAsync();
    console.log("✅ All pages loaded");
    for (const page of figma.root.children) {
      console.log(`📋 Scanning page: "${page.name}"`);
      try {
        const allNodes = page.findAll(node => {
            if (node.type === 'COMPONENT_SET') {
                return true;
            }
            if (node.type === 'COMPONENT') {
                return !!(node.parent && node.parent.type !== 'COMPONENT_SET');
            }
            return false;
        });
        console.log(`✅ Found ${allNodes.length} main components on page "${page.name}"`);
        for (const node of allNodes) {
          try {
            if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
              const componentInfo = analyzeComponent(node as ComponentNode | ComponentSetNode);
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
            console.error(`❌ Error analyzing component "${node.name}":`, e);
          }
        }
      } catch (e) {
        console.error(`❌ Error scanning page "${page.name}":`, e);
      }
    }
    console.log(`🎉 Scan complete! Found ${components.length} unique components.`);
    return components;
  } catch (e) {
    console.error("❌ Critical error in scanDesignSystem:", e);
    throw e;
  }
}

function analyzeComponent(comp: ComponentNode | ComponentSetNode): ComponentInfo {
    const name = comp.name;
    const suggestedType = guessComponentType(name.toLowerCase());
    const confidence = calculateConfidence(name.toLowerCase(), suggestedType);
    const textLayers = findTextLayers(comp);
    
    let variants: string[] = [];
    let variantDetails: { [key: string]: string[] } = {};
    
    if (comp.type === 'COMPONENT_SET') {
        const variantProps = comp.variantGroupProperties;
        if (variantProps) {
            variants = Object.keys(variantProps);
            
            Object.entries(variantProps).forEach(([propName, propInfo]) => {
                if (propInfo.values && propInfo.values.length > 0) {
                    variantDetails[propName] = [...propInfo.values].sort();
                    console.log(`✅ Found variant property: ${propName} with values: [${propInfo.values.join(', ')}]`);
                }
            });
            
            console.log(`🎯 Variant details for "${comp.name}":`, variantDetails);
        }
    }
    
    return {
        id: comp.id,
        name: name,
        suggestedType,
        confidence,
        variants: variants.length > 0 ? variants : undefined,
        variantDetails: Object.keys(variantDetails).length > 0 ? variantDetails : undefined,
        textLayers: textLayers.length > 0 ? textLayers : undefined,
        isFromLibrary: false
    };
}

function guessComponentType(name: string): string {
    const patterns: {[key: string]: RegExp} = {
        'icon-button': /icon.*button|button.*icon/i,
        'upload': /upload|file.*drop|drop.*zone|attach/i,
        'form': /form|captcha|verification/i,
        'context-menu': /context-menu|context menu|contextual menu|options menu/i,
        'modal-header': /modal-header|modal header|modalstack|modal_stack/i,
        'list-item': /list-item|list item|list_item|list[\s\-_]*row|list[\s\-_]*cell/i,
        'appbar': /appbar|app-bar|navbar|nav-bar|header|top bar|page header/i,
        'dialog': /dialog|dialogue|popup|modal(?!-header)/i,
        'list': /list(?!-item)/i,
        'navigation': /nav|navigation(?!-bar)/i,
        'header': /h[1-6]|title|heading(?! bar)/i,
        'button': /button|btn|cta|action/i,
        'input': /input|field|textfield|text-field|entry/i,
        'textarea': /textarea|text-area|multiline/i,
        'select': /select|dropdown|drop-down|picker/i,
        'checkbox': /checkbox|check-box/i,
        'radio': /radio|radiobutton|radio-button/i,
        'switch': /switch|toggle/i,
        'slider': /slider|range/i,
        'searchbar': /search|searchbar|search-bar/i,
        'tab': /tab|tabs|tabbar|tab-bar/i,
        'breadcrumb': /breadcrumb|bread-crumb/i,
        'pagination': /pagination|pager/i,
        'bottomsheet': /bottomsheet|bottom-sheet|drawer/i,
        'sidebar': /sidebar|side-bar/i,
        'snackbar': /snack|snackbar|toast|notification/i,
        'alert': /alert/i,
        'tooltip': /tooltip|tip|hint/i,
        'badge': /badge|indicator|count/i,
        'progress': /progress|loader|loading|spinner/i,
        'skeleton': /skeleton|placeholder/i,
        'card': /card|tile|block|panel/i,
        'avatar': /avatar|profile|user|photo/i,
        'image': /image|img|picture/i,
        'video': /video|player/i,
        'icon': /icon|pictogram|symbol/i,
        'text': /text|label|paragraph|caption|copy/i,
        'link': /link|anchor/i,
        'container': /container|wrapper|box|frame/i,
        'grid': /grid/i,
        'divider': /divider|separator|delimiter/i,
        'spacer': /spacer|space|gap/i,
        'fab': /fab|floating|float/i,
        'chip': /chip|tag/i,
        'actionsheet': /actionsheet|action-sheet/i,
        'chart': /chart|graph/i,
        'table': /table/i,
        'calendar': /calendar|date/i,
        'timeline': /timeline/i,
        'gallery': /gallery|carousel/i,
        'price': /price|cost/i,
        'rating': /rating|star/i,
        'cart': /cart|basket/i,
        'map': /map|location/i,
        'code': /code|syntax/i,
        'terminal': /terminal|console/i
    };
    const priorityPatterns = [
        'icon-button', 'upload', 'form', 'context-menu', 'modal-header', 'list-item', 'appbar', 'dialog', 'snackbar', 'bottomsheet', 'actionsheet', 'searchbar', 'fab', 'breadcrumb', 'pagination', 'skeleton', 'textarea', 'checkbox', 'radio', 'switch', 'slider', 'tab', 'navigation', 'tooltip', 'badge', 'progress', 'avatar', 'chip', 'stepper', 'chart', 'table', 'calendar', 'timeline', 'gallery', 'rating'
    ];
    for (const type of priorityPatterns) {
        if (patterns[type]?.test(name)) return type;
    }
    for (const type in patterns) {
        if (patterns.hasOwnProperty(type) && !priorityPatterns.includes(type)) {
            if (patterns[type].test(name)) return type;
        }
    }
    return 'unknown';
}

function calculateConfidence(name: string, suggestedType: string): number {
    if (suggestedType === 'unknown') return 0.1;
    if (name.toLowerCase() === suggestedType.toLowerCase()) return 0.95;
    if (name.includes(suggestedType)) return 0.9;
    if (name.toLowerCase().includes(suggestedType + '-') || name.toLowerCase().includes(suggestedType + '_')) return 0.85;
    return 0.7;
}

function findTextLayers(comp: ComponentNode | ComponentSetNode): string[] {
    const textLayers: string[] = [];
    try {
        const nodeToAnalyze = comp.type === 'COMPONENT_SET' ? comp.defaultVariant : comp;
        if (nodeToAnalyze && 'findAll' in nodeToAnalyze) {
            const allNodes = (nodeToAnalyze as ComponentNode).findAll((node) => node.type === 'TEXT');
            
            allNodes.forEach(node => {
                if (node.type === 'TEXT' && node.name) {
                    const textNode = node as TextNode;
                    textLayers.push(textNode.name);
                    
                    try {
                        const chars = textNode.characters || '[empty]';
                        console.log(`📝 Found text layer: "${textNode.name}" with content: "${chars}"`);
                    } catch (charError) {
                        console.log(`📝 Found text layer: "${textNode.name}" (could not read characters)`);
                    }
                }
            });
        }
    } catch (e) {
        console.error(`Error finding text layers in "${comp.name}":`, e);
    }
    return textLayers;
}

function generateLLMPrompt(components: ComponentInfo[]): string {
    const componentsByType: { [key: string]: ComponentInfo[] } = {};
    components.forEach(comp => {
        if (comp.confidence >= 0.7) {
            if (!componentsByType[comp.suggestedType]) componentsByType[comp.suggestedType] = [];
            componentsByType[comp.suggestedType].push(comp);
        }
    });
    let prompt = `# AIDesigner JSON Generation Instructions\n\n## Available Components in Design System:\n\n`;
    Object.keys(componentsByType).sort().forEach(type => {
        const comps = componentsByType[type];
        const bestComponent = comps.sort((a, b) => b.confidence - a.confidence)[0];
        prompt += `### ${type.toUpperCase()}\n`;
        prompt += `- Component ID: "${bestComponent.id}"\n`;
        prompt += `- Component Name: "${bestComponent.name}"\n`;
        if (bestComponent.textLayers?.length) prompt += `- Text Layers: ${bestComponent.textLayers.map(l => `"${l}"`).join(', ')}\n`;
        
        if (bestComponent.variantDetails && Object.keys(bestComponent.variantDetails).length > 0) {
            prompt += `\n  - 🎯 VARIANTS AVAILABLE:\n`;
            Object.entries(bestComponent.variantDetails).forEach(([propName, values]) => {
                prompt += `    - **${propName}**: [${values.map(v => `"${v}"`).join(', ')}]\n`;
                
                const propLower = propName.toLowerCase();
                if (propLower.includes('condition') || propLower.includes('layout')) {
                    prompt += `      💡 Layout control: ${values.includes('1-line') ? '"1-line" = single line, ' : ''}${values.includes('2-line') ? '"2-line" = detailed view' : ''}\n`;
                }
                if (propLower.includes('leading') || propLower.includes('start')) {
                    prompt += `      💡 Leading element: "Icon" = shows leading icon, "None" = text only\n`;
                }
                if (propLower.includes('trailing') || propLower.includes('end')) {
                    prompt += `      💡 Trailing element: "Icon" = shows trailing icon/chevron, "None" = no trailing element\n`;
                }
                if (propLower.includes('state') || propLower.includes('status')) {
                    prompt += `      💡 Component state: controls enabled/disabled/selected appearance\n`;
                }
                if (propLower.includes('size')) {
                    prompt += `      💡 Size control: affects padding, text size, and touch targets\n`;
                }
                if (propLower.includes('type') || propLower.includes('style') || propLower.includes('emphasis')) {
                    prompt += `      💡 Visual emphasis: controls hierarchy and visual weight\n`;
                }
            });
            
            prompt += `\n  - ⚡ QUICK VARIANT GUIDE:\n`;
            prompt += `    - "single line" request → use "Condition": "1-line"\n`;
            prompt += `    - "with icon" request → use "Leading": "Icon"\n`;
            prompt += `    - "arrow" or "chevron" → use "Trailing": "Icon"\n`;
            prompt += `    - "simple" or "minimal" → omit variants to use defaults\n`;
            prompt += `    - Only specify variants you want to change from defaults\n`;
        }

        prompt += `- Page: ${bestComponent.pageInfo?.pageName || 'Unknown'}\n\n`;
    });
    prompt += `## JSON Structure & Rules:

### Variant Usage Rules:
- **Variants must be in a separate "variants" object inside properties**
- **NEVER mix variants with regular properties at the same level**
- Variant properties are case-sensitive: "Condition" not "condition"
- Variant values are case-sensitive: "1-line" not "1-Line"

### ✅ CORRECT Variant Structure:
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

### ❌ WRONG - Never do this:
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

### ✅ VARIANT BEST PRACTICES:
- **Always use exact property names**: "Condition" not "condition"
- **Use exact values**: "1-line" not "1-Line" or "single-line"
- **Specify complete variant sets**: Include all required properties for that variant
- **Common patterns**:
  - Simple navigation: \`"Condition": "1-line", "Leading": "Icon", "Trailing": "None"\`
  - With current value: \`"Condition": "1-line", "Leading": "Icon", "Trailing": "Icon"\`
  - Detailed info: \`"Condition": "2-line", "Leading": "Icon", "Trailing": "Icon"\`

*🎯 Pro tip: Study your design system's variant combinations in Figma to understand which variants work together.*
`;
    return prompt;
}

async function getComponentIdByType(type: string): Promise<string | null> {
    const searchType = type.toLowerCase();
    const scanResults: ComponentInfo[] | undefined = await figma.clientStorage.getAsync('last-scan-results');
    if (scanResults && Array.isArray(scanResults)) {
        const matchingComponent = scanResults.find((comp) => comp.suggestedType.toLowerCase() === searchType && comp.confidence >= 0.7);
        if (matchingComponent) return matchingComponent.id;
        const nameMatchingComponent = scanResults.find((comp) => comp.name.toLowerCase().includes(searchType));
        if (nameMatchingComponent) return nameMatchingComponent.id;
    }
    console.log(`❌ ID for type ${type} not found`);
    return null;
}

async function saveLastScanResults(components: ComponentInfo[]): Promise<void> {
  try {
    const scanSession: ScanSession = {
      components,
      scanTime: Date.now(),
      version: "1.0",
      fileKey: figma.root.id
    };
    
    await figma.clientStorage.setAsync('design-system-scan', scanSession);
    await figma.clientStorage.setAsync('last-scan-results', components);
    
    console.log(`💾 Saved ${components.length} components with session data`);
  } catch (error) {
    console.error("❌ Error saving scan results:", error);
    try {
      await figma.clientStorage.setAsync('last-scan-results', components);
      console.log("💾 Fallback save successful");
    } catch (fallbackError) {
      console.warn("⚠️ Could not save scan results:", fallbackError);
    }
  }
}

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

function sanitizeProperties(properties: any): any {
    if (!properties) return {};
    
    return Object.entries(properties).reduce((acc: {[key: string]: any}, [key, value]) => {
        const cleanKey = key.replace(/\s+/g, '-');
        if (key.toLowerCase().includes('text') && value !== null && value !== undefined) {
            acc[cleanKey] = String(value);
        } else {
            acc[cleanKey] = value;
        }
        return acc;
    }, {});
}

function separateVariantsFromProperties(properties: any, componentId: string): {cleanProperties: any, variants: any} {
    if (!properties) return {cleanProperties: {}, variants: {}};
    
    const cleanProperties: any = {};
    const variants: any = {};
    
    const knownTextProperties = ['text', 'supporting-text', 'trailing-text', 'headline', 'subtitle', 'value'];
    const knownLayoutProperties = ['horizontalSizing', 'verticalSizing', 'layoutAlign', 'layoutGrow'];
    
    const variantPropertyNames = [
        'condition', 'Condition',
        'leading', 'Leading', 
        'trailing', 'Trailing',
        'state', 'State',
        'style', 'Style',
        'size', 'Size',
        'type', 'Type',
        'emphasis', 'Emphasis',
        'variant', 'Variant'
    ];
    
    Object.entries(properties).forEach(([key, value]) => {
        if (key === 'variants') {
            Object.assign(variants, value);
            console.log(`🔧 Found existing variants object:`, value);
            return;
        }
        
        if (knownTextProperties.some(prop => key.toLowerCase().includes(prop.toLowerCase()))) {
            cleanProperties[key] = value;
            return;
        }
        
        if (knownLayoutProperties.some(prop => key.toLowerCase().includes(prop.toLowerCase()))) {
            cleanProperties[key] = value;
            return;
        }
        
        if (variantPropertyNames.includes(key)) {
            const properKey = key.charAt(0).toUpperCase() + key.slice(1);
            variants[properKey] = value;
            console.log(`🔧 Moved "${key}" -> "${properKey}" from properties to variants`);
            return;
        }
        
        cleanProperties[key] = value;
    });
    
    console.log(`🔍 Final separation for ${componentId}:`);
    console.log(`   Clean properties:`, cleanProperties);
    console.log(`   Variants:`, variants);
    
    return {cleanProperties, variants};
}

async function applyTextProperties(instance: InstanceNode, properties: any): Promise<void> {
    if (!properties) return;
    
    console.log("🔍 Applying text properties:", properties);
    
    const allTextNodes = instance.findAll(n => n.type === 'TEXT') as TextNode[];
    console.log("🔍 Available text nodes in component:", 
        allTextNodes.map(textNode => ({ 
            name: textNode.name, 
            chars: textNode.characters || '[empty]'
        }))
    );
    
    const textMappings: {[key: string]: string[]} = {
        'headline': ['headline', 'title', 'text', 'label', 'primary'],
        'text': ['headline', 'title', 'text', 'label', 'primary'],
        'supporting-text': ['supporting', 'subtitle', 'description', 'secondary', 'body'],
        'supporting': ['supporting', 'subtitle', 'description', 'secondary', 'body'],
        'trailing-text': ['trailing', 'value', 'action', 'status', 'end'],
        'trailing': ['trailing', 'value', 'action', 'status', 'end'],
        'label-text': ['label', 'headline', 'title', 'text'],
        'value': ['value', 'trailing', 'status'],
        'title': ['title', 'headline', 'text'],
        'subtitle': ['subtitle', 'supporting', 'description'],
        'Headline': ['headline', 'title', 'text', 'label'],
        'Supporting': ['supporting', 'subtitle', 'description'],
        'Trailing': ['trailing', 'value', 'action']
    };
    
    for (const [propKey, propValue] of Object.entries(properties)) {
        if (!propValue || typeof propValue !== 'string' || !propValue.trim()) continue;
        if (propKey === 'horizontalSizing' || propKey === 'variants') continue;
        
        console.log(`🔧 Trying to set ${propKey} = "${propValue}"`);
        
        let possibleNames = textMappings[propKey] || [propKey.toLowerCase()];
        
        let textNode: TextNode | null = null;
        
        for (const targetName of possibleNames) {
            textNode = allTextNodes.find(
                n => n.name.toLowerCase().includes(targetName.toLowerCase())
            ) || null;
            
            if (textNode) {
                console.log(`✅ Found text node "${textNode.name}" for property "${propKey}"`);
                break;
            }
        }
        
        if (!textNode) {
            if (propKey.toLowerCase().includes('headline') || propKey.toLowerCase().includes('text')) {
                textNode = allTextNodes[0] || null;
                console.log(`🔄 Using first text node as fallback for "${propKey}"`);
            } else if (propKey.toLowerCase().includes('trailing')) {
                textNode = allTextNodes[allTextNodes.length - 1] || null;
                console.log(`🔄 Using last text node as fallback for trailing "${propKey}"`);
            } else if (propKey.toLowerCase().includes('supporting')) {
                textNode = allTextNodes[1] || allTextNodes[0] || null;
                console.log(`🔄 Using second text node as fallback for supporting "${propKey}"`);
            }
        }
        
        if (textNode && typeof textNode.fontName !== 'symbol') {
            try {
                await figma.loadFontAsync(textNode.fontName as FontName);
                textNode.characters = propValue;
                console.log(`✅ Successfully set "${textNode.name}" to "${propValue}"`);
            } catch (fontError) {
                console.error(`❌ Font loading failed for "${textNode.name}":`, fontError);
            }
        } else {
            console.warn(`❌ No text node found for property "${propKey}" with value "${propValue}"`);
        }
    }
}

async function generateUIFromData(layoutData: any, parentNode: FrameNode | PageNode): Promise<FrameNode> {
    let currentFrame: FrameNode;
    const containerData = layoutData.layoutContainer || layoutData;
    
    if (parentNode.type === 'PAGE' && containerData) {
        currentFrame = figma.createFrame();
        parentNode.appendChild(currentFrame);
    } else if (parentNode.type === 'FRAME') {
        currentFrame = parentNode;
    } else {
        figma.notify("Cannot add items without a parent frame.", { error: true });
        return figma.createFrame();
    }
    
    if (containerData && containerData !== layoutData) {
        currentFrame.name = containerData.name || "Generated Frame";
        currentFrame.layoutMode = containerData.layoutMode === "HORIZONTAL" || containerData.layoutMode === "VERTICAL" 
            ? containerData.layoutMode : "NONE";
            
        if (currentFrame.layoutMode !== 'NONE') {
            currentFrame.paddingTop = typeof containerData.paddingTop === 'number' ? containerData.paddingTop : 0;
            currentFrame.paddingBottom = typeof containerData.paddingBottom === 'number' ? containerData.paddingBottom : 0;
            currentFrame.paddingLeft = typeof containerData.paddingLeft === 'number' ? containerData.paddingLeft : 0;
            currentFrame.paddingRight = typeof containerData.paddingRight === 'number' ? containerData.paddingRight : 0;
            currentFrame.itemSpacing = typeof containerData.itemSpacing === 'number' ? containerData.itemSpacing : 0;
            currentFrame.primaryAxisSizingMode = "AUTO";
        }
        
        if (containerData.width) {
            currentFrame.resize(containerData.width, currentFrame.height);
            currentFrame.counterAxisSizingMode = "FIXED";
        } else {
            currentFrame.counterAxisSizingMode = "AUTO";
        }
    }
    
    const items = layoutData.items || containerData.items;
    if (!items || !Array.isArray(items)) return currentFrame;
    
    for (const item of items) {
        if (item.type === 'layoutContainer') {
            const nestedFrame = figma.createFrame();
            currentFrame.appendChild(nestedFrame);
            
            if (item.horizontalSizing === 'FILL') {
                nestedFrame.layoutAlign = 'STRETCH';
            }
            
            await generateUIFromData({ layoutContainer: item, items: item.items }, nestedFrame);
            
        } else if (item.type === 'frame' && item.layoutContainer) {
            const nestedFrame = figma.createFrame();
            currentFrame.appendChild(nestedFrame);
            await generateUIFromData(item, nestedFrame);
            
        } else {
            if (!item.componentNodeId) continue;
            
            const componentNode = await figma.getNodeByIdAsync(item.componentNodeId);
            if (!componentNode) {
                console.warn(`⚠️ Component with ID ${item.componentNodeId} not found. Skipping.`);
                continue;
            }
            
            const masterComponent = (componentNode.type === 'COMPONENT_SET' 
                ? componentNode.defaultVariant 
                : componentNode) as ComponentNode | null;
                
            if (!masterComponent || masterComponent.type !== 'COMPONENT') {
                console.warn(`⚠️ Could not find a valid master component for ID ${item.componentNodeId}. Skipping.`);
                continue;
            }
            
            const instance = masterComponent.createInstance();
            currentFrame.appendChild(instance);
            
            console.log(`🔧 Creating instance of component: ${masterComponent.name}`);
            console.log(`🔧 Raw properties:`, item.properties);

            const {cleanProperties, variants} = separateVariantsFromProperties(item.properties, item.componentNodeId);
            const sanitizedProps = sanitizeProperties(cleanProperties);

            console.log(`🔧 Clean properties:`, sanitizedProps);
            console.log(`🔧 Extracted variants:`, variants);

            if (Object.keys(variants).length > 0) {
                try {
                    if (componentNode && componentNode.type === 'COMPONENT_SET') {
                        const availableVariants = componentNode.variantGroupProperties;
                        console.log(`🔍 Available variants for ${componentNode.name}:`, Object.keys(availableVariants || {}));
                        console.log(`🔍 Requested variants:`, variants);
                        
                        if (!availableVariants) {
                            console.warn('⚠️ No variant properties found on component, skipping variant application.');
                        } else {
                            const validVariants: { [key: string]: string } = {};
                            let hasValidVariants = false;
                            
                            Object.entries(variants).forEach(([propName, propValue]) => {
                                const availableProp = availableVariants[propName];
                                if (availableProp && availableProp.values) {
                                    const stringValue = String(propValue);
                                    if (availableProp.values.includes(stringValue)) {
                                        validVariants[propName] = stringValue;
                                        hasValidVariants = true;
                                        console.log(`✅ Valid variant: ${propName} = "${stringValue}"`);
                                    } else {
                                        console.warn(`⚠️ Invalid value for "${propName}": "${stringValue}". Available: [${availableProp.values.join(', ')}]`);
                                    }
                                } else {
                                    console.warn(`⚠️ Unknown variant property: "${propName}". Available: [${Object.keys(availableVariants).join(', ')}]`);
                                }
                            });
                            
                            if (hasValidVariants) {
                                console.log(`🔧 Applying variants:`, validVariants);
                                instance.setProperties(validVariants);
                                console.log('✅ Variants applied successfully');
                            } else {
                                console.warn('⚠️ No valid variants to apply, using default variant');
                            }
                        }
                    } else {
                        console.log('ℹ️ Component is not a variant set, skipping variant application');
                    }
                } catch (e) {
                    console.error("❌ Error applying variants:", e);
                    console.log("ℹ️ Continuing with default variant");
                }
            }
            
            if (sanitizedProps?.horizontalSizing === 'FILL') {
                if (currentFrame.layoutMode === 'VERTICAL') {
                    instance.layoutAlign = 'STRETCH';
                } else if (currentFrame.layoutMode === 'HORIZONTAL') {
                    instance.layoutGrow = 1;
                }
            }
            
            await applyTextProperties(instance, sanitizedProps);
        }
    }
    
    if (parentNode.type === 'PAGE') {
        figma.currentPage.selection = [currentFrame];
        figma.viewport.scrollAndZoomIntoView([currentFrame]);
        figma.notify(`UI "${currentFrame.name}" generated!`, { timeout: 2500 });
    }
    return currentFrame;
}

async function generateUIFromDataDynamic(layoutData: any): Promise<FrameNode | null> {
    if (!layoutData || !layoutData.items) {
        figma.notify("Invalid JSON structure", { error: true });
        return null;
    }

    const isPlaceholderID = (id: string): boolean => {
        if (!id) return true;
        return id.includes('_id') || 
               id.includes('placeholder') || 
               !id.match(/^[0-9]+:[0-9]+$/);
    };

    const resolveComponentIds = async (items: any[]) => {
        for (const item of items) {
            if (item.type === 'layoutContainer') {
                if (item.items && Array.isArray(item.items)) {
                    await resolveComponentIds(item.items);
                }
                continue;
            }
            
            if (item.type === 'frame' && item.items) {
                await resolveComponentIds(item.items);
            } 
            else if (item.type !== 'frame') {
                if (!item.componentNodeId || isPlaceholderID(item.componentNodeId)) {
                    console.log(`🔧 Resolving component ID for type: ${item.type}`);
                    const resolvedId = await getComponentIdByType(item.type);
                    if (!resolvedId) {
                        throw new Error(`Component for type "${item.type}" not found in design system. Please scan your design system first.`);
                    }
                    item.componentNodeId = resolvedId;
                    console.log(`✅ Resolved ${item.type} -> ${resolvedId}`);
                } else {
                    console.log(`✅ Using existing ID for ${item.type}: ${item.componentNodeId}`);
                }
            }
        }
    };

    try {
        await resolveComponentIds(layoutData.items);
        return await generateUIFromData(layoutData, figma.currentPage);
    } catch (e: any) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        figma.notify(errorMessage, { error: true, timeout: 4000 });
        console.error("❌ generateUIFromDataDynamic error:", e);
        return null;
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
                const newFrame = await generateUIFromDataDynamic(layoutData);
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
                const existingFrame = await figma.getNodeByIdAsync(frameId) as FrameNode;
                if (existingFrame && existingFrame.type === 'FRAME') {
                    for (let i = existingFrame.children.length - 1; i >= 0; i--) {
                        existingFrame.children[i].remove();
                    }
                    await generateUIFromData(modifiedJSON, existingFrame);
                    figma.ui.postMessage({ 
                        type: 'ui-modified-success', 
                        frameId: existingFrame.id, 
                        modifiedJSON: modifiedJSON 
                    });
                    figma.notify("UI updated successfully!", { timeout: 2000 });
                } else {
                    throw new Error("Target frame for modification not found.");
                }
            } catch (e: any) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                figma.notify("Modification error: " + errorMessage, { error: true });
                figma.ui.postMessage({ type: 'ui-generation-error', error: errorMessage });
            }
            break;

        // NEW: Session management handlers
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
                const components = await scanDesignSystem();
                await saveLastScanResults(components);
                figma.ui.postMessage({ type: 'scan-results', components });
            } catch (e) {
                figma.notify("Scanning error", { error: true });
            }
            break;

        case 'generate-llm-prompt':
            const scanResultsForPrompt: ComponentInfo[] | undefined = await figma.clientStorage.getAsync('last-scan-results');
            if (scanResultsForPrompt?.length) {
                const llmPrompt = generateLLMPrompt(scanResultsForPrompt);
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
                    await saveLastScanResults(updatedResults);
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