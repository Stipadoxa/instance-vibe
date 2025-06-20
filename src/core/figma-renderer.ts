// src/core/figma-renderer.ts
// UI generation and rendering engine for AIDesigner

import { ComponentScanner } from './component-scanner';
import { ComponentScannerEnhanced } from './component-scanner-enhanced';

export interface RenderOptions {
  parentNode?: FrameNode | PageNode;
  replaceContent?: boolean;
}

export class FigmaRenderer {

  /**
   * Main UI generation function - creates UI from structured JSON data
   */
  static async generateUIFromData(layoutData: any, parentNode: FrameNode | PageNode): Promise<FrameNode> {
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
      
      // Enhanced layout mode parsing - case insensitive and more robust
      const layoutMode = (containerData.layoutMode || "").toString().toUpperCase();
      if (layoutMode === "HORIZONTAL" || layoutMode === "VERTICAL") {
        currentFrame.layoutMode = layoutMode as "HORIZONTAL" | "VERTICAL";
        console.log(`✅ Set auto-layout mode: ${layoutMode}`);
      } else {
        // Default to VERTICAL for mobile layouts if not specified
        currentFrame.layoutMode = "VERTICAL";
        console.log(`✅ Defaulted to VERTICAL auto-layout (original value: "${containerData.layoutMode}")`);
      }
        
      // Always set up auto-layout properties when we have a layout mode
      if (currentFrame.layoutMode !== 'NONE') {
        currentFrame.paddingTop = typeof containerData.paddingTop === 'number' ? containerData.paddingTop : 16;
        currentFrame.paddingBottom = typeof containerData.paddingBottom === 'number' ? containerData.paddingBottom : 16;
        currentFrame.paddingLeft = typeof containerData.paddingLeft === 'number' ? containerData.paddingLeft : 16;
        currentFrame.paddingRight = typeof containerData.paddingRight === 'number' ? containerData.paddingRight : 16;
        currentFrame.itemSpacing = typeof containerData.itemSpacing === 'number' ? containerData.itemSpacing : 12;
        currentFrame.primaryAxisSizingMode = "AUTO";
        
        console.log(`✅ Auto-layout configured: padding ${currentFrame.paddingTop}, spacing ${currentFrame.itemSpacing}`);
      }
      
      // Set frame dimensions
      if (containerData.width && typeof containerData.width === 'number') {
        currentFrame.resize(containerData.width, currentFrame.height);
        currentFrame.counterAxisSizingMode = "FIXED";
        console.log(`✅ Set fixed width: ${containerData.width}px`);
      } else {
        // For mobile layouts, default to 375px width with auto height
        currentFrame.resize(375, currentFrame.height);
        currentFrame.counterAxisSizingMode = "FIXED";
        console.log(`✅ Set default mobile width: 375px`);
      }
    } else {
      // Fallback: ensure we always have auto-layout for UI generation
      console.log(`⚠️ No container data found, setting up default auto-layout`);
      currentFrame.name = "Generated Frame";
      currentFrame.layoutMode = "VERTICAL";
      currentFrame.paddingTop = 16;
      currentFrame.paddingBottom = 16;
      currentFrame.paddingLeft = 16;
      currentFrame.paddingRight = 16;
      currentFrame.itemSpacing = 12;
      currentFrame.primaryAxisSizingMode = "AUTO";
      currentFrame.counterAxisSizingMode = "FIXED";
      currentFrame.resize(375, currentFrame.height);
      console.log(`✅ Applied default auto-layout configuration`);
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
        
        await this.generateUIFromData({ layoutContainer: item, items: item.items }, nestedFrame);
        
      } else if (item.type === 'frame' && item.layoutContainer) {
        const nestedFrame = figma.createFrame();
        currentFrame.appendChild(nestedFrame);
        await this.generateUIFromData(item, nestedFrame);
        
      } 
      // NATIVE ELEMENTS - Handle these BEFORE component resolution
      else if (item.type === 'native-text' || item.type === 'text') {
        await this.createTextNode(item, currentFrame);
        continue;
      }
      else if (item.type === 'native-rectangle') {
        await this.createRectangleNode(item, currentFrame);
        continue;
      }
      else if (item.type === 'native-circle') {
        await this.createEllipseNode(item, currentFrame);
        continue;
      }
      // COMPONENT ELEMENTS - All other types go through component resolution
      else {
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

        const {cleanProperties, variants} = this.separateVariantsFromProperties(item.properties, item.componentNodeId);
        const sanitizedProps = this.sanitizeProperties(cleanProperties);

        console.log(`🔧 Clean properties:`, sanitizedProps);
        console.log(`🔧 Extracted variants:`, variants);

        // Apply variants
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
        
        // Apply layout sizing
        if (sanitizedProps?.horizontalSizing === 'FILL') {
          if (currentFrame.layoutMode === 'VERTICAL') {
            instance.layoutAlign = 'STRETCH';
          } else if (currentFrame.layoutMode === 'HORIZONTAL') {
            instance.layoutGrow = 1;
          }
        }
        
        // Apply text properties to component
        await this.applyTextProperties(instance, sanitizedProps);
      }
    }
    
    if (parentNode.type === 'PAGE') {
      figma.currentPage.selection = [currentFrame];
      figma.viewport.scrollAndZoomIntoView([currentFrame]);
      figma.notify(`UI "${currentFrame.name}" generated!`, { timeout: 2500 });
    }
    return currentFrame;
  }

  /**
   * Dynamic UI generation with component ID resolution
   */
  static async generateUIFromDataDynamic(layoutData: any): Promise<FrameNode | null> {
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

    async function resolveComponentIds(items: any[]): Promise<void> {
      for (const item of items) {
        if (item.type === 'layoutContainer') {
          if (item.items && Array.isArray(item.items)) {
            await resolveComponentIds(item.items);
          }
          continue;
        }
        
        // SKIP native elements - they don't need component IDs
        if (item.type === 'native-text' || 
            item.type === 'text' || 
            item.type === 'native-rectangle' || 
            item.type === 'native-circle') {
          console.log(`ℹ️ Skipping native element: ${item.type}`);
          continue;
        }
        
        if (item.type === 'frame' && item.items) {
          await resolveComponentIds(item.items);
        } 
        else if (item.type !== 'frame') {
          if (!item.componentNodeId || isPlaceholderID(item.componentNodeId)) {
            console.log(`🧠 Intelligent semantic lookup for type: ${item.type}`);
            const resolvedId = await ComponentScannerEnhanced.getComponentIdByType(item.type);
            if (!resolvedId) {
              throw new Error(`Component for type "${item.type}" not found in design system. Please scan your design system first or check component naming.`);
            }
            item.componentNodeId = resolvedId;
            console.log(`✅ Resolved ${item.type} -> ${resolvedId}`);
          } else {
            console.log(`✅ Using existing ID for ${item.type}: ${item.componentNodeId}`);
          }
        }
      }
    }

    try {
      await resolveComponentIds(layoutData.items);
      return await this.generateUIFromData(layoutData, figma.currentPage);
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      figma.notify(errorMessage, { error: true, timeout: 4000 });
      console.error("❌ generateUIFromDataDynamic error:", e);
      return null;
    }
  }

  /**
   * Create native text element
   */
  static async createTextNode(textData: any, container: FrameNode): Promise<void> {
    console.log('Creating native text:', textData);
    
    const textNode = figma.createText();
    
    // Load default font
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    
    // Extract text content from various possible property names
    const textContent = textData.text || textData.content || textData.properties?.content || textData.characters || "Text";
    textNode.characters = textContent;
    
    // Extract and apply properties from the properties object
    const props = textData.properties || textData;
    
    // Font size
    const fontSize = props.fontSize || props.size || props.textSize || 16;
    textNode.fontSize = fontSize;
    
    // Font weight
    if (props.fontWeight === 'bold' || props.weight === 'bold' || props.style === 'bold') {
      await figma.loadFontAsync({ family: "Inter", style: "Bold" });
      textNode.fontName = { family: "Inter", style: "Bold" };
    }
    
    // Text alignment
    if (props.alignment === 'center' || props.textAlign === 'center') {
      textNode.textAlignHorizontal = 'CENTER';
    } else if (props.alignment === 'right' || props.textAlign === 'right') {
      textNode.textAlignHorizontal = 'RIGHT';
    } else {
      textNode.textAlignHorizontal = 'LEFT';
    }
    
    // Color (if available)
    if (props.color) {
      const fills = textNode.fills as Paint[];
      if (fills.length > 0 && fills[0].type === 'SOLID') {
        textNode.fills = [{ type: 'SOLID', color: props.color }];
        textNode.fills = fills;
      }
    }
    
    // Sizing behavior
    if (props.horizontalSizing === 'FILL') {
      textNode.layoutAlign = 'STRETCH';
      textNode.textAutoResize = 'HEIGHT';
    } else {
      textNode.textAutoResize = 'WIDTH_AND_HEIGHT';
    }
    
    container.appendChild(textNode);
    console.log('Native text created successfully');
  }

  /**
   * Create native rectangle element
   */
  static async createRectangleNode(rectData: any, container: FrameNode): Promise<void> {
    console.log('Creating native rectangle:', rectData);
    
    const rect = figma.createRectangle();
    
    // Set dimensions
    if (rectData.width && rectData.height) {
      rect.resize(rectData.width, rectData.height);
    } else {
      rect.resize(100, 100); // Default size
    }
    
    // Set fill color
    if (rectData.fill) {
      rect.fills = [{ type: 'SOLID', color: rectData.fill }];
    }
    
    // Set corner radius
    if (rectData.cornerRadius) {
      rect.cornerRadius = rectData.cornerRadius;
    }
    
    // Handle sizing
    if (rectData.horizontalSizing === 'FILL') {
      rect.layoutAlign = 'STRETCH';
    }
    
    container.appendChild(rect);
    console.log('Rectangle created successfully');
  }

  /**
   * Create native ellipse element
   */
  static async createEllipseNode(ellipseData: any, container: FrameNode): Promise<void> {
    console.log('Creating native ellipse:', ellipseData);
    
    const ellipse = figma.createEllipse();
    
    // Set dimensions
    if (ellipseData.width && ellipseData.height) {
      ellipse.resize(ellipseData.width, ellipseData.height);
    } else {
      ellipse.resize(50, 50); // Default size
    }
    
    // Set fill color
    if (ellipseData.fill) {
      ellipse.fills = [{ type: 'SOLID', color: ellipseData.fill }];
    }
    
    container.appendChild(ellipse);
    console.log('Ellipse created successfully');
  }

  /**
   * Apply text properties to component instances
   */
  static async applyTextProperties(instance: InstanceNode, properties: any): Promise<void> {
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
      'content': ['headline', 'title', 'text', 'label', 'primary'],
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

  /**
   * Sanitize and clean property names and values
   */
  static sanitizeProperties(properties: any): any {
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

  /**
   * Separate variant properties from regular properties
   */
  static separateVariantsFromProperties(properties: any, componentId: string): {cleanProperties: any, variants: any} {
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

  /**
   * Modify existing UI frame by replacing its content
   */
  static async modifyExistingUI(modifiedJSON: any, frameId: string): Promise<FrameNode | null> {
    try {
      const existingFrame = await figma.getNodeByIdAsync(frameId) as FrameNode;
      if (existingFrame && existingFrame.type === 'FRAME') {
        // Remove all existing children
        for (let i = existingFrame.children.length - 1; i >= 0; i--) {
          existingFrame.children[i].remove();
        }
        
        // Generate new content
        await this.generateUIFromData(modifiedJSON, existingFrame);
        
        figma.notify("UI updated successfully!", { timeout: 2000 });
        return existingFrame;
      } else {
        throw new Error("Target frame for modification not found.");
      }
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      figma.notify("Modification error: " + errorMessage, { error: true });
      console.error("❌ modifyExistingUI error:", e);
      return null;
    }
  }
}