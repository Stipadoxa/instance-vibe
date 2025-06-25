// src/core/figma-renderer.ts
// UI generation and rendering engine for AIDesigner

import { ComponentScanner } from './component-scanner';
import { ComponentInfo, TextHierarchy, ComponentInstance, VectorNode, ImageNode } from './session-manager';

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
        
        // Apply media properties to component
        await this.applyMediaProperties(instance, sanitizedProps);
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
            console.log(`🔧 Resolving component ID for type: ${item.type}`);
            const resolvedId = await ComponentScanner.getComponentIdByType(item.type);
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
   * Apply text properties to component instances using enhanced scan data
   */
  static async applyTextProperties(instance: InstanceNode, properties: any): Promise<void> {
    if (!properties) return;
    
    console.log("🔍 Applying text properties:", properties);
    
    // Get all text nodes in the instance
    const allTextNodes = instance.findAll(n => n.type === 'TEXT') as TextNode[];
    console.log("🔍 Available text nodes in component:", 
      allTextNodes.map(textNode => ({ 
        name: textNode.name, 
        id: textNode.id,
        visible: textNode.visible,
        chars: textNode.characters || '[empty]'
      }))
    );

    // Get the component's textHierarchy data from scan results
    const componentTextHierarchy = await this.getComponentTextHierarchy(instance);
    console.log("🔍 Text hierarchy from scan data:", componentTextHierarchy);
    
    // Define semantic classification mappings
    const semanticMappings: {[key: string]: string[]} = {
      'primary-text': ['primary'],
      'secondary-text': ['secondary'], 
      'tertiary-text': ['tertiary'],
      'headline': ['primary', 'secondary'],
      'title': ['primary', 'secondary'],
      'content': ['primary', 'secondary'],
      'text': ['primary', 'secondary'],
      'supporting-text': ['secondary', 'tertiary'],
      'supporting': ['secondary', 'tertiary'],
      'subtitle': ['secondary', 'tertiary'],
      'trailing-text': ['tertiary', 'secondary'],
      'trailing': ['tertiary', 'secondary'],
      'caption': ['tertiary'],
      'overline': ['tertiary']
    };

    // Define legacy text mappings for backward compatibility
    const legacyMappings: {[key: string]: string[]} = {
      'content': ['headline', 'title', 'text', 'label'],
      'headline': ['headline', 'title', 'text', 'label'],
      'text': ['headline', 'title', 'text', 'label'],
      'supporting-text': ['supporting', 'subtitle', 'description', 'body'],
      'supporting': ['supporting', 'subtitle', 'description', 'body'],
      'trailing-text': ['trailing', 'value', 'action', 'status', 'end'],
      'trailing': ['trailing', 'value', 'action', 'status', 'end'],
      'title': ['title', 'headline', 'text'],
      'subtitle': ['subtitle', 'supporting', 'description']
    };
    
    for (const [propKey, propValue] of Object.entries(properties)) {
      if (!propValue || typeof propValue !== 'string' || !propValue.trim()) continue;
      if (propKey === 'horizontalSizing' || propKey === 'variants') continue;
      
      console.log(`🔧 Trying to set ${propKey} = "${propValue}"`);
      
      let textNode: TextNode | null = null;
      let matchMethod = 'none';
      
      // Method 1: Try exact node name match from scan data
      if (componentTextHierarchy) {
        const hierarchyEntry = componentTextHierarchy.find(entry => 
          entry.nodeName.toLowerCase() === propKey.toLowerCase() ||
          entry.nodeName.toLowerCase().replace(/\s+/g, '-') === propKey.toLowerCase()
        );
        
        if (hierarchyEntry) {
          textNode = allTextNodes.find(n => n.id === hierarchyEntry.nodeId) || null;
          if (textNode) {
            matchMethod = 'exact-name';
            console.log(`✅ Found text node by exact name match: "${textNode.name}" (${hierarchyEntry.classification})`);
          }
        }
      }
      
      // Method 2: Try semantic classification match
      if (!textNode && componentTextHierarchy && semanticMappings[propKey.toLowerCase()]) {
        const targetClassifications = semanticMappings[propKey.toLowerCase()];
        
        for (const classification of targetClassifications) {
          const hierarchyEntry = componentTextHierarchy.find(entry => 
            entry.classification === classification
          );
          
          if (hierarchyEntry) {
            textNode = allTextNodes.find(n => n.id === hierarchyEntry.nodeId) || null;
            if (textNode) {
              matchMethod = 'semantic-classification';
              console.log(`✅ Found text node by semantic classification: "${textNode.name}" (${classification})`);
              break;
            }
          }
        }
      }
      
      // Method 3: Try partial node name match from scan data
      if (!textNode && componentTextHierarchy) {
        const hierarchyEntry = componentTextHierarchy.find(entry => 
          entry.nodeName.toLowerCase().includes(propKey.toLowerCase()) ||
          propKey.toLowerCase().includes(entry.nodeName.toLowerCase())
        );
        
        if (hierarchyEntry) {
          textNode = allTextNodes.find(n => n.id === hierarchyEntry.nodeId) || null;
          if (textNode) {
            matchMethod = 'partial-name';
            console.log(`✅ Found text node by partial name match: "${textNode.name}"`);
          }
        }
      }
      
      // Method 4: Fallback to legacy name-based matching
      if (!textNode) {
        const possibleNames = legacyMappings[propKey.toLowerCase()] || [propKey.toLowerCase()];
        
        for (const targetName of possibleNames) {
          textNode = allTextNodes.find(
            n => n.name.toLowerCase().includes(targetName.toLowerCase())
          ) || null;
          
          if (textNode) {
            matchMethod = 'legacy-mapping';
            console.log(`✅ Found text node by legacy mapping: "${textNode.name}"`);
            break;
          }
        }
      }
      
      // Method 5: Position-based fallback
      if (!textNode) {
        if (propKey.toLowerCase().includes('headline') || propKey.toLowerCase().includes('title') || propKey.toLowerCase().includes('primary')) {
          textNode = allTextNodes[0] || null;
          matchMethod = 'position-first';
          console.log(`🔄 Using first text node as fallback for "${propKey}"`);
        } else if (propKey.toLowerCase().includes('trailing') || propKey.toLowerCase().includes('tertiary')) {
          textNode = allTextNodes[allTextNodes.length - 1] || null;
          matchMethod = 'position-last';
          console.log(`🔄 Using last text node as fallback for "${propKey}"`);
        } else if (propKey.toLowerCase().includes('supporting') || propKey.toLowerCase().includes('secondary')) {
          textNode = allTextNodes[1] || allTextNodes[0] || null;
          matchMethod = 'position-second';
          console.log(`🔄 Using second text node as fallback for "${propKey}"`);
        }
      }
      
      // Apply the text and activate hidden nodes if needed
      if (textNode) {
        try {
          // Activate hidden text node if needed
          if (!textNode.visible) {
            textNode.visible = true;
            console.log(`👁️ Activated hidden text node: "${textNode.name}"`);
          }
          
          // Load font and set text
          if (typeof textNode.fontName !== 'symbol') {
            await figma.loadFontAsync(textNode.fontName as FontName);
            textNode.characters = propValue;
            console.log(`✅ Successfully set "${textNode.name}" to "${propValue}" (method: ${matchMethod})`);
          }
        } catch (fontError) {
          console.error(`❌ Font loading failed for "${textNode.name}":`, fontError);
        }
      } else {
        console.warn(`❌ No text node found for property "${propKey}" with value "${propValue}"`);
      }
    }
  }

  /**
   * Get text hierarchy data for a component instance from scan results
   */
  static async getComponentTextHierarchy(instance: InstanceNode): Promise<TextHierarchy[] | null> {
    try {
      // Get the main component to find its scan data
      const mainComponent = await instance.getMainComponentAsync();
      if (!mainComponent) return null;
      
      // Get scan results from storage
      const scanResults: ComponentInfo[] | undefined = await figma.clientStorage.getAsync('last-scan-results');
      if (!scanResults || !Array.isArray(scanResults)) return null;
      
      // Find the component in scan results
      const componentInfo = scanResults.find(comp => comp.id === mainComponent.id);
      return componentInfo?.textHierarchy || null;
      
    } catch (error) {
      console.warn("Could not get text hierarchy data:", error);
      return null;
    }
  }

  /**
   * Apply media properties to component instances using enhanced scan data validation
   */
  static async applyMediaProperties(instance: InstanceNode, properties: any): Promise<void> {
    if (!properties) return;
    
    console.log("🖼️ Validating media properties:", properties);
    
    // Get the component's media structure from scan data
    const componentMediaData = await this.getComponentMediaData(instance);
    console.log("🖼️ Media data from scan results:", componentMediaData);
    
    // Define media property patterns to look for
    const mediaPropertyPatterns = [
      'icon', 'image', 'avatar', 'photo', 'logo', 'media',
      'leading-icon', 'trailing-icon', 'start-icon', 'end-icon',
      'profile-image', 'user-avatar', 'cover-image', 'thumbnail'
    ];
    
    // Extract media-related properties
    const mediaProperties: {[key: string]: any} = {};
    Object.entries(properties).forEach(([key, value]) => {
      const keyLower = key.toLowerCase();
      if (mediaPropertyPatterns.some(pattern => keyLower.includes(pattern))) {
        mediaProperties[key] = value;
      }
    });
    
    if (Object.keys(mediaProperties).length === 0) {
      console.log("🖼️ No media properties found to validate");
      return;
    }
    
    console.log("🖼️ Found media properties to validate:", Object.keys(mediaProperties));
    
    // Validate each media property against scan data
    for (const [propKey, propValue] of Object.entries(mediaProperties)) {
      if (!propValue || typeof propValue !== 'string' || !propValue.trim()) continue;
      
      console.log(`🔍 Validating media property: ${propKey} = "${propValue}"`);
      
      let validationResult = this.validateMediaProperty(propKey, propValue, componentMediaData);
      
      if (validationResult.isValid) {
        console.log(`✅ ${propKey} → would set to "${propValue}" (${validationResult.targetType}: "${validationResult.targetName}")`);
      } else {
        console.warn(`❌ Invalid media property: "${propKey}" = "${propValue}" - ${validationResult.reason}`);
        
        // Suggest alternatives if available
        if (validationResult.suggestions?.length) {
          console.log(`💡 Available media slots: ${validationResult.suggestions.join(', ')}`);
        }
      }
    }
  }

  /**
   * Get media structure data for a component instance from scan results
   */
  static async getComponentMediaData(instance: InstanceNode): Promise<{
    componentInstances: ComponentInstance[],
    vectorNodes: VectorNode[],
    imageNodes: ImageNode[]
  } | null> {
    try {
      // Get the main component to find its scan data
      const mainComponent = await instance.getMainComponentAsync();
      if (!mainComponent) {
        console.warn("Could not get main component from instance");
        return null;
      }
      
      console.log("🔍 Looking for media data for main component ID:", mainComponent.id);
      
      // Get scan results from storage
      const scanResults: ComponentInfo[] | undefined = await figma.clientStorage.getAsync('last-scan-results');
      if (!scanResults || !Array.isArray(scanResults)) {
        console.warn("No scan results found in storage");
        return null;
      }
      
      console.log("🔍 Available component IDs in scan data:", scanResults.map(c => c.id));
      
      // Find the component in scan results
      const componentInfo = scanResults.find(comp => comp.id === mainComponent.id);
      if (!componentInfo) {
        console.warn(`Component ${mainComponent.id} not found in scan results`);
        return null;
      }
      
      console.log("🔍 Found component info:", componentInfo.name);
      console.log("🔍 Component instances:", componentInfo.componentInstances);
      console.log("🔍 Vector nodes:", componentInfo.vectorNodes);
      console.log("🔍 Image nodes:", componentInfo.imageNodes);
      
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
  static validateMediaProperty(propKey: string, propValue: string, mediaData: {
    componentInstances: ComponentInstance[],
    vectorNodes: VectorNode[],
    imageNodes: ImageNode[]
  } | null): {
    isValid: boolean,
    targetType?: 'component-instance' | 'vector-node' | 'image-node',
    targetName?: string,
    reason?: string,
    suggestions?: string[]
  } {
    if (!mediaData) {
      return {
        isValid: false,
        reason: "No media scan data available"
      };
    }
    
    const { componentInstances, vectorNodes, imageNodes } = mediaData;
    
    // Create a list of all available media slots
    const allMediaSlots = [
      ...componentInstances.map(c => ({ name: c.nodeName, type: 'component-instance' as const })),
      ...vectorNodes.map(v => ({ name: v.nodeName, type: 'vector-node' as const })),
      ...imageNodes.map(i => ({ name: i.nodeName, type: 'image-node' as const }))
    ];
    
    if (allMediaSlots.length === 0) {
      return {
        isValid: false,
        reason: "No media slots found in component"
      };
    }
    
    // Try exact name match
    const exactMatch = allMediaSlots.find(slot => 
      slot.name.toLowerCase() === propKey.toLowerCase() ||
      slot.name.toLowerCase().replace(/\s+/g, '-') === propKey.toLowerCase()
    );
    
    if (exactMatch) {
      return {
        isValid: true,
        targetType: exactMatch.type,
        targetName: exactMatch.name
      };
    }
    
    // Try partial name match
    const partialMatch = allMediaSlots.find(slot =>
      slot.name.toLowerCase().includes(propKey.toLowerCase()) ||
      propKey.toLowerCase().includes(slot.name.toLowerCase())
    );
    
    if (partialMatch) {
      return {
        isValid: true,
        targetType: partialMatch.type,
        targetName: partialMatch.name
      };
    }
    
    // Try semantic matching based on property type
    const semanticMatch = this.findSemanticMediaMatch(propKey, allMediaSlots);
    if (semanticMatch) {
      return {
        isValid: true,
        targetType: semanticMatch.type,
        targetName: semanticMatch.name
      };
    }
    
    // Return suggestions for invalid properties
    return {
      isValid: false,
      reason: `No matching media slot found for "${propKey}"`,
      suggestions: allMediaSlots.map(slot => slot.name)
    };
  }

  /**
   * Find semantic matches for media properties using intelligent classification
   */
  static findSemanticMediaMatch(propKey: string, mediaSlots: Array<{name: string, type: 'component-instance' | 'vector-node' | 'image-node'}>): {name: string, type: 'component-instance' | 'vector-node' | 'image-node'} | null {
    const keyLower = propKey.toLowerCase();
    
    // Enhanced semantic classification with multiple strategies
    const classifications = this.classifyMediaSlots(mediaSlots);
    
    // Strategy 1: Direct semantic category matching
    if (keyLower.includes('avatar') || keyLower.includes('profile') || keyLower.includes('user')) {
      return classifications.avatars[0] || classifications.images[0] || classifications.circles[0] || null;
    }
    
    if (keyLower.includes('icon') && !keyLower.includes('leading') && !keyLower.includes('trailing')) {
      return classifications.icons[0] || classifications.vectors[0] || classifications.smallImages[0] || null;
    }
    
    if (keyLower.includes('image') || keyLower.includes('photo') || keyLower.includes('picture')) {
      return classifications.images[0] || classifications.rectangularImages[0] || classifications.avatars[0] || null;
    }
    
    if (keyLower.includes('logo') || keyLower.includes('brand')) {
      return classifications.logos[0] || classifications.vectors[0] || classifications.images[0] || null;
    }
    
    if (keyLower.includes('badge') || keyLower.includes('indicator') || keyLower.includes('status')) {
      return classifications.badges[0] || classifications.smallImages[0] || classifications.vectors[0] || null;
    }
    
    // Strategy 2: Position-based matching
    if (keyLower.includes('leading') || keyLower.includes('start') || keyLower.includes('left')) {
      const positionMatch = this.findByPosition(mediaSlots, 'leading');
      if (positionMatch) return positionMatch;
      
      // Fallback to any icon/vector for leading positions
      return classifications.icons[0] || classifications.vectors[0] || null;
    }
    
    if (keyLower.includes('trailing') || keyLower.includes('end') || keyLower.includes('right')) {
      const positionMatch = this.findByPosition(mediaSlots, 'trailing');
      if (positionMatch) return positionMatch;
      
      // Fallback to any icon/vector for trailing positions
      return classifications.icons[0] || classifications.vectors[0] || null;
    }
    
    // Strategy 3: Size-based matching
    if (keyLower.includes('large') || keyLower.includes('big') || keyLower.includes('cover')) {
      return classifications.largeImages[0] || classifications.images[0] || null;
    }
    
    if (keyLower.includes('small') || keyLower.includes('mini') || keyLower.includes('thumb')) {
      return classifications.smallImages[0] || classifications.icons[0] || classifications.vectors[0] || null;
    }
    
    // Strategy 4: Fallback based on property type patterns
    if (keyLower.includes('icon')) {
      return classifications.vectors[0] || classifications.icons[0] || null;
    }
    
    return null;
  }
  
  /**
   * Classify media slots into semantic categories based on names and types
   */
  static classifyMediaSlots(mediaSlots: Array<{name: string, type: 'component-instance' | 'vector-node' | 'image-node'}>): {
    avatars: Array<{name: string, type: 'component-instance' | 'vector-node' | 'image-node'}>,
    icons: Array<{name: string, type: 'component-instance' | 'vector-node' | 'image-node'}>,
    images: Array<{name: string, type: 'component-instance' | 'vector-node' | 'image-node'}>,
    vectors: Array<{name: string, type: 'component-instance' | 'vector-node' | 'image-node'}>,
    badges: Array<{name: string, type: 'component-instance' | 'vector-node' | 'image-node'}>,
    logos: Array<{name: string, type: 'component-instance' | 'vector-node' | 'image-node'}>,
    smallImages: Array<{name: string, type: 'component-instance' | 'vector-node' | 'image-node'}>,
    largeImages: Array<{name: string, type: 'component-instance' | 'vector-node' | 'image-node'}>,
    circles: Array<{name: string, type: 'component-instance' | 'vector-node' | 'image-node'}>,
    rectangularImages: Array<{name: string, type: 'component-instance' | 'vector-node' | 'image-node'}>
  } {
    const classifications = {
      avatars: [] as Array<{name: string, type: 'component-instance' | 'vector-node' | 'image-node'}>,
      icons: [] as Array<{name: string, type: 'component-instance' | 'vector-node' | 'image-node'}>,
      images: [] as Array<{name: string, type: 'component-instance' | 'vector-node' | 'image-node'}>,
      vectors: [] as Array<{name: string, type: 'component-instance' | 'vector-node' | 'image-node'}>,
      badges: [] as Array<{name: string, type: 'component-instance' | 'vector-node' | 'image-node'}>,
      logos: [] as Array<{name: string, type: 'component-instance' | 'vector-node' | 'image-node'}>,
      smallImages: [] as Array<{name: string, type: 'component-instance' | 'vector-node' | 'image-node'}>,
      largeImages: [] as Array<{name: string, type: 'component-instance' | 'vector-node' | 'image-node'}>,
      circles: [] as Array<{name: string, type: 'component-instance' | 'vector-node' | 'image-node'}>,
      rectangularImages: [] as Array<{name: string, type: 'component-instance' | 'vector-node' | 'image-node'}>
    };
    
    mediaSlots.forEach(slot => {
      const nameLower = slot.name.toLowerCase();
      
      // Avatar classification - look for people, faces, profiles
      if (nameLower.includes('avatar') || 
          nameLower.includes('profile') || 
          nameLower.includes('user') ||
          nameLower.includes('person') ||
          nameLower.includes('selfie') ||
          nameLower.includes('face') ||
          nameLower.includes('man') ||
          nameLower.includes('woman') ||
          nameLower.includes('people') ||
          (slot.type === 'image-node' && nameLower.includes('photo'))) {
        classifications.avatars.push(slot);
      }
      
      // Icon classification - small graphics, symbols
      else if (nameLower.includes('icon') || 
               nameLower.includes('symbol') ||
               nameLower.includes('pictogram') ||
               (slot.type === 'vector-node' && nameLower.length < 10)) {
        classifications.icons.push(slot);
      }
      
      // Badge classification - status indicators, notifications
      else if (nameLower.includes('badge') ||
               nameLower.includes('indicator') ||
               nameLower.includes('status') ||
               nameLower.includes('notification') ||
               nameLower.includes('dot') ||
               nameLower.includes('alert')) {
        classifications.badges.push(slot);
      }
      
      // Logo classification - brand elements
      else if (nameLower.includes('logo') ||
               nameLower.includes('brand') ||
               nameLower.includes('company')) {
        classifications.logos.push(slot);
      }
      
      // Vector classification - all vector nodes
      else if (slot.type === 'vector-node') {
        classifications.vectors.push(slot);
      }
      
      // Image classification - all image nodes and component instances with image-like names
      else if (slot.type === 'image-node' || 
               nameLower.includes('image') ||
               nameLower.includes('picture') ||
               nameLower.includes('photo')) {
        classifications.images.push(slot);
        
        // Sub-classify by apparent size/shape
        if (nameLower.includes('small') || nameLower.includes('mini') || nameLower.includes('thumb')) {
          classifications.smallImages.push(slot);
        } else if (nameLower.includes('large') || nameLower.includes('big') || nameLower.includes('cover')) {
          classifications.largeImages.push(slot);
        }
        
        // Shape classification
        if (nameLower.includes('circle') || nameLower.includes('round')) {
          classifications.circles.push(slot);
        } else {
          classifications.rectangularImages.push(slot);
        }
      }
      
      // Catch-all for component instances
      else if (slot.type === 'component-instance') {
        // If no specific category, put in general images category
        classifications.images.push(slot);
      }
    });
    
    return classifications;
  }
  
  /**
   * Find media slots by position keywords
   */
  static findByPosition(mediaSlots: Array<{name: string, type: 'component-instance' | 'vector-node' | 'image-node'}>, position: 'leading' | 'trailing'): {name: string, type: 'component-instance' | 'vector-node' | 'image-node'} | null {
    const positionKeywords = position === 'leading' 
      ? ['leading', 'start', 'left', 'first', 'begin']
      : ['trailing', 'end', 'right', 'last', 'final'];
    
    return mediaSlots.find(slot => 
      positionKeywords.some(keyword => 
        slot.name.toLowerCase().includes(keyword)
      )
    ) || null;
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