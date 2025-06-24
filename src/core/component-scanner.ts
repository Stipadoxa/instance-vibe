// component-scanner.ts
// Design system component scanning and analysis for AIDesigner

import { ComponentInfo, TextHierarchy, ComponentInstance, VectorNode, ImageNode } from './session-manager';

export interface ScanSession {
  components: ComponentInfo[];
  scanTime: number;
  version: string;
  fileKey?: string;
}

export class ComponentScanner {
  
  /**
   * Main scanning function - scans all pages for components
   */
  static async scanDesignSystem(): Promise<ComponentInfo[]> {
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
                const componentInfo = await this.analyzeComponent(node as ComponentNode | ComponentSetNode);
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

  /**
   * Analyzes a single component to extract metadata
   */
  static async analyzeComponent(comp: ComponentNode | ComponentSetNode): Promise<ComponentInfo> {
      const name = comp.name;
      const suggestedType = this.guessComponentType(name.toLowerCase());
      const confidence = this.calculateConfidence(name.toLowerCase(), suggestedType);
      const textLayers = this.findTextLayers(comp);
      const textHierarchy = this.analyzeTextHierarchy(comp);
      const componentInstances = await this.findComponentInstances(comp);
      const vectorNodes = this.findVectorNodes(comp);
      const imageNodes = this.findImageNodes(comp);
      
      let variants: string[] = [];
      const variantDetails: { [key: string]: string[] } = {};
      
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
          textHierarchy: textHierarchy.length > 0 ? textHierarchy : undefined,
          componentInstances: componentInstances.length > 0 ? componentInstances : undefined,
          vectorNodes: vectorNodes.length > 0 ? vectorNodes : undefined,
          imageNodes: imageNodes.length > 0 ? imageNodes : undefined,
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
      
      const priorityPatterns = [
          'icon-button', 'upload', 'form', 'context-menu', 'modal-header', 'list-item', 
          'appbar', 'dialog', 'snackbar', 'bottomsheet', 'actionsheet', 'searchbar', 
          'fab', 'breadcrumb', 'pagination', 'skeleton', 'textarea', 'checkbox', 
          'radio', 'switch', 'slider', 'tab', 'navigation', 'tooltip', 'badge', 
          'progress', 'avatar', 'chip', 'stepper', 'chart', 'table', 'calendar', 
          'timeline', 'gallery', 'rating'
      ];
      
      for (const type of priorityPatterns) {
          if (patterns[type]?.test(name)) return type;
      }
      
      for (const type in patterns) {
          if (Object.prototype.hasOwnProperty.call(patterns, type) && !priorityPatterns.includes(type)) {
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
   * Analyzes text nodes by fontSize/fontWeight and classifies by visual prominence
   */
  static analyzeTextHierarchy(comp: ComponentNode | ComponentSetNode): TextHierarchy[] {
    const textHierarchy: TextHierarchy[] = [];
    try {
      const nodeToAnalyze = comp.type === 'COMPONENT_SET' ? comp.defaultVariant : comp;
      if (nodeToAnalyze && 'findAll' in nodeToAnalyze) {
        const textNodes = (nodeToAnalyze as ComponentNode).findAll((node) => node.type === 'TEXT');
        
        // Collect font info for classification
        const fontSizes: number[] = [];
        const textNodeData: Array<{node: TextNode, fontSize: number, fontWeight: string | number}> = [];
        
        textNodes.forEach(node => {
          if (node.type === 'TEXT') {
            const textNode = node as TextNode;
            try {
              const fontSize = typeof textNode.fontSize === 'number' ? textNode.fontSize : 14;
              const fontWeight = textNode.fontWeight || 'normal';
              fontSizes.push(fontSize);
              textNodeData.push({node: textNode, fontSize, fontWeight});
            } catch (e) {
              console.warn(`Could not read font properties for text node "${textNode.name}"`);
            }
          }
        });
        
        // Sort font sizes to determine hierarchy thresholds
        const uniqueSizes = [...new Set(fontSizes)].sort((a, b) => b - a);
        
        textNodeData.forEach(({node, fontSize, fontWeight}) => {
          let classification: 'primary' | 'secondary' | 'tertiary' = 'tertiary';
          
          if (uniqueSizes.length >= 3) {
            if (fontSize >= uniqueSizes[0]) classification = 'primary';
            else if (fontSize >= uniqueSizes[1]) classification = 'secondary';
            else classification = 'tertiary';
          } else if (uniqueSizes.length === 2) {
            classification = fontSize >= uniqueSizes[0] ? 'primary' : 'secondary';
          } else {
            // Single font size or unable to determine - classify by font weight
            const weight = String(fontWeight).toLowerCase();
            if (weight.includes('bold') || weight.includes('700') || weight.includes('800') || weight.includes('900')) {
              classification = 'primary';
            } else if (weight.includes('medium') || weight.includes('500') || weight.includes('600')) {
              classification = 'secondary';
            } else {
              classification = 'tertiary';
            }
          }
          
          let characters: string | undefined;
          try {
            characters = node.characters || '[empty]';
          } catch (e) {
            characters = undefined;
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
  static async findComponentInstances(comp: ComponentNode | ComponentSetNode): Promise<ComponentInstance[]> {
    const componentInstances: ComponentInstance[] = [];
    try {
      const nodeToAnalyze = comp.type === 'COMPONENT_SET' ? comp.defaultVariant : comp;
      if (nodeToAnalyze && 'findAll' in nodeToAnalyze) {
        const instanceNodes = (nodeToAnalyze as ComponentNode).findAll((node) => 
          node.type === 'COMPONENT' || node.type === 'INSTANCE'
        );
        
        for (const node of instanceNodes) {
          if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
            const instance: ComponentInstance = {
              nodeName: node.name,
              nodeId: node.id,
              visible: node.visible
            };
            
            if (node.type === 'INSTANCE') {
              try {
                const mainComponent = await (node as InstanceNode).getMainComponentAsync();
                instance.componentId = mainComponent?.id;
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
  static findVectorNodes(comp: ComponentNode | ComponentSetNode): VectorNode[] {
    const vectorNodes: VectorNode[] = [];
    try {
      const nodeToAnalyze = comp.type === 'COMPONENT_SET' ? comp.defaultVariant : comp;
      if (nodeToAnalyze && 'findAll' in nodeToAnalyze) {
        const vectors = (nodeToAnalyze as ComponentNode).findAll((node) => node.type === 'VECTOR');
        
        vectors.forEach(node => {
          if (node.type === 'VECTOR') {
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
  static findImageNodes(comp: ComponentNode | ComponentSetNode): ImageNode[] {
    const imageNodes: ImageNode[] = [];
    try {
      const nodeToAnalyze = comp.type === 'COMPONENT_SET' ? comp.defaultVariant : comp;
      if (nodeToAnalyze && 'findAll' in nodeToAnalyze) {
        const shapeNodes = (nodeToAnalyze as ComponentNode).findAll((node) => 
          node.type === 'RECTANGLE' || node.type === 'ELLIPSE'
        );
        
        shapeNodes.forEach(node => {
          if (node.type === 'RECTANGLE' || node.type === 'ELLIPSE') {
            let hasImageFill = false;
            
            try {
              const fills = (node as RectangleNode | EllipseNode).fills;
              if (Array.isArray(fills)) {
                hasImageFill = fills.some(fill => 
                  typeof fill === 'object' && fill !== null && fill.type === 'IMAGE'
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
          
          if (bestComponent.textHierarchy?.length) {
            prompt += `- Text Hierarchy:\n`;
            bestComponent.textHierarchy.forEach(text => {
              prompt += `  - ${text.classification.toUpperCase()}: "${text.nodeName}" (${text.fontSize}px, ${text.fontWeight}${text.visible ? '' : ', hidden'})\n`;
            });
          }
          
          if (bestComponent.componentInstances?.length) {
            prompt += `- Component Instances: ${bestComponent.componentInstances.map(c => `"${c.nodeName}"${c.visible ? '' : ' (hidden)'}`).join(', ')}\n`;
          }
          
          if (bestComponent.vectorNodes?.length) {
            prompt += `- Vector Icons: ${bestComponent.vectorNodes.map(v => `"${v.nodeName}"${v.visible ? '' : ' (hidden)'}`).join(', ')}\n`;
          }
          
          if (bestComponent.imageNodes?.length) {
            prompt += `- Image Containers: ${bestComponent.imageNodes.map(i => `"${i.nodeName}" (${i.nodeType}${i.hasImageFill ? ', has image' : ''}${i.visible ? '' : ', hidden'})`).join(', ')}\n`;
          }
          
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

  /**
   * Save scan results to Figma storage
   */
  static async saveLastScanResults(components: ComponentInfo[]): Promise<void> {
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

  /**
   * Get component ID by type for UI generation
   */
  static async getComponentIdByType(type: string): Promise<string | null> {
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
}