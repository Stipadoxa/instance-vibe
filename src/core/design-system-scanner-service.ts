// src/core/design-system-scanner-service.ts
// Design System Scanner service for AIDesigner plugin - handles all component scanning logic

import { ComponentInfo } from './session-manager';

export interface ScanSession {
    components: ComponentInfo[];
    scanTime: number;
    version: string;
    fileKey?: string;
}

interface ScanProgressCallback {
    (progress: { current: number; total: number; status: string }): void;
}

export class DesignSystemScannerService {
    
    /**
     * Main scanning function - scans all pages for components
     */
    static async scanDesignSystem(progressCallback?: ScanProgressCallback): Promise<ComponentInfo[]> {
        console.log("🔍 Starting design system scan...");
        const components: ComponentInfo[] = [];
        
        try {
            // Load all pages first
            await figma.loadAllPagesAsync();
            console.log("✅ All pages loaded");
            
            const totalPages = figma.root.children.length;
            let currentPage = 0;
            
            progressCallback?.({ current: 0, total: totalPages, status: "Initializing scan..." });
            
            for (const page of figma.root.children) {
                currentPage++;
                const pageStatus = `Scanning page: "${page.name}" (${currentPage}/${totalPages})`;
                console.log(`📋 ${pageStatus}`);
                
                progressCallback?.({ 
                    current: currentPage, 
                    total: totalPages, 
                    status: pageStatus 
                });
                
                try {
                    // Find all COMPONENT and COMPONENT_SET nodes
                    const allNodes = page.findAll(node => {
                        if (node.type === 'COMPONENT_SET') {
                            return true;
                        }
                        if (node.type === 'COMPONENT') {
                            // Only include components that are not part of a component set
                            return !!(node.parent && node.parent.type !== 'COMPONENT_SET');
                        }
                        return false;
                    });
                    
                    console.log(`✅ Found ${allNodes.length} main components on page "${page.name}"`);
                    
                    // Analyze each component
                    for (const node of allNodes) {
                        try {
                            if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
                                const componentInfo = this.analyzeComponent(node as ComponentNode | ComponentSetNode);
                                if (componentInfo) {
                                    // Add page information
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
            
            progressCallback?.({ 
                current: totalPages, 
                total: totalPages, 
                status: `Scan complete! Found ${components.length} components` 
            });
            
            console.log(`🎉 Design system scan complete! Found ${components.length} unique components.`);
            return components;
            
        } catch (e) {
            console.error("❌ Critical error in design system scan:", e);
            throw e;
        }
    }

    /**
     * Analyzes a single component to extract metadata and variants
     */
    static analyzeComponent(comp: ComponentNode | ComponentSetNode): ComponentInfo {
        const name = comp.name;
        const suggestedType = this.guessComponentType(name.toLowerCase());
        const confidence = this.calculateConfidence(name.toLowerCase(), suggestedType);
        const textLayers = this.findTextLayers(comp);
        
        let variants: string[] = [];
        let variantDetails: { [key: string]: string[] } = {};
        
        // Extract variant information for COMPONENT_SET nodes
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

    /**
     * Intelligent component type detection based on naming patterns
     */
    static guessComponentType(name: string): string {
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
        
        // Priority patterns for better matching
        const priorityPatterns = [
            'icon-button', 'upload', 'form', 'context-menu', 'modal-header', 'list-item', 
            'appbar', 'dialog', 'snackbar', 'bottomsheet', 'actionsheet', 'searchbar', 
            'fab', 'breadcrumb', 'pagination', 'skeleton', 'textarea', 'checkbox', 
            'radio', 'switch', 'slider', 'tab', 'navigation', 'tooltip', 'badge', 
            'progress', 'avatar', 'chip', 'stepper', 'chart', 'table', 'calendar', 
            'timeline', 'gallery', 'rating'
        ];
        
        // Check priority patterns first
        for (const type of priorityPatterns) {
            if (patterns[type]?.test(name)) return type;
        }
        
        // Check remaining patterns
        for (const type in patterns) {
            if (patterns.hasOwnProperty(type) && !priorityPatterns.includes(type)) {
                if (patterns[type].test(name)) return type;
            }
        }
        
        return 'unknown';
    }

    /**
     * Calculates confidence score for component type detection
     */
    static calculateConfidence(name: string, suggestedType: string): number {
        if (suggestedType === 'unknown') return 0.1;
        if (name.toLowerCase() === suggestedType.toLowerCase()) return 0.95;
        if (name.includes(suggestedType)) return 0.9;
        if (name.toLowerCase().includes(suggestedType + '-') || name.toLowerCase().includes(suggestedType + '_')) return 0.85;
        return 0.7;
    }

    /**
     * Finds and catalogs text layers within a component
     */
    static findTextLayers(comp: ComponentNode | ComponentSetNode): string[] {
        const textLayers: string[] = [];
        try {
            // Use default variant for component sets, otherwise use the component directly
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

    /**
     * Generate LLM prompt based on scanned components
     */
    static generateLLMPrompt(components: ComponentInfo[]): string {
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
            
            // Add detailed variant information
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
        
        // Add comprehensive JSON structure guide
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

    /**
     * Save scan results to Figma storage
     */
    static async saveScanResults(components: ComponentInfo[]): Promise<void> {
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
                // Fallback save
                await figma.clientStorage.setAsync('last-scan-results', components);
                console.log("💾 Fallback save successful");
            } catch (fallbackError) {
                console.warn("⚠️ Could not save scan results:", fallbackError);
            }
        }
    }

    /**
     * Get component ID by type for UI generation
     */
    static async getComponentIdByType(type: string): Promise<string | null> {
        const searchType = type.toLowerCase();
        const scanResults: ComponentInfo[] | undefined = await figma.clientStorage.getAsync('last-scan-results');
        
        if (scanResults && Array.isArray(scanResults)) {
            // First try exact type match with good confidence
            const matchingComponent = scanResults.find((comp) => 
                comp.suggestedType.toLowerCase() === searchType && comp.confidence >= 0.7
            );
            if (matchingComponent) return matchingComponent.id;
            
            // Fallback to name matching
            const nameMatchingComponent = scanResults.find((comp) => 
                comp.name.toLowerCase().includes(searchType)
            );
            if (nameMatchingComponent) return nameMatchingComponent.id;
        }
        
        console.log(`❌ Component ID for type "${type}" not found`);
        return null;
    }

    /**
     * Get saved scan results from storage
     */
    static async getSavedScanResults(): Promise<ComponentInfo[] | null> {
        try {
            const scanResults: ComponentInfo[] | undefined = await figma.clientStorage.getAsync('last-scan-results');
            return scanResults || null;
        } catch (error) {
            console.error("❌ Error getting saved scan results:", error);
            return null;
        }
    }

    /**
     * Get scan session data
     */
    static async getScanSession(): Promise<ScanSession | null> {
        try {
            const scanSession: ScanSession | undefined = await figma.clientStorage.getAsync('design-system-scan');
            return scanSession || null;
        } catch (error) {
            console.error("❌ Error getting scan session:", error);
            return null;
        }
    }

    /**
     * Update component type manually
     */
    static async updateComponentType(componentId: string, newType: string): Promise<{ success: boolean; componentName?: string }> {
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
                
                await this.saveScanResults(updatedResults);
                return { success: true, componentName };
            }
            return { success: false };
        } catch (error) {
            console.error("❌ Error updating component type:", error);
            return { success: false };
        }
    }

    /**
     * Clear all scan data
     */
    static async clearScanData(): Promise<void> {
        try {
            await figma.clientStorage.setAsync('design-system-scan', null);
            await figma.clientStorage.setAsync('last-scan-results', null);
            console.log("✅ Scan data cleared");
        } catch (error) {
            console.error("❌ Error clearing scan data:", error);
        }
    }
}