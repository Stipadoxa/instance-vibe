// prompt-generator.js
// Expert UX Designer-based prompt generation system for AIDesigner

// Import pattern intelligence (add this near the top of the file)
// Note: Assumes component-patterns.js is in the same directory
if (typeof window !== 'undefined' && window.PatternDetector) {
    // PatternDetector already loaded
} else if (typeof require !== 'undefined') {
    const { PatternDetector } = require('./component-patterns.js');
}

class AIDesignerPromptGenerator {
    constructor() {
        this.basePersonality = this.buildUXExpertPersonality();
    }

    /**
     * Main entry point - generates complete prompt for Gemini
     */
    generatePrompt(userRequest, scanResults = [], conversationHistory = [], hasImage = false) {
        // Get the base prompt using existing logic
        if (hasImage) {
            var basePrompt = this.generateImageAnalysisPrompt(userRequest, scanResults);
        } else {
            const preprocessedRequest = this.preprocessForCommonIssues(userRequest);
            const systemPrompt = this.buildExpertSystemPrompt(scanResults);
            const contextualGuidance = this.generateContextualGuidance(preprocessedRequest);
            const enhancedRequest = this.enhanceUserRequest(preprocessedRequest, contextualGuidance);
            
            var basePrompt = {
                systemPrompt,
                userPrompt: enhancedRequest,
                fullPrompt: `${systemPrompt}\n\n${enhancedRequest}\n\nRespond ONLY with valid JSON, without any additional text, comments, or markdown.`,
                guidance: contextualGuidance
            };
        }

        // NEW: Add pattern intelligence
        if (typeof PatternDetector !== 'undefined') {
            const detectedPatterns = PatternDetector.detect(userRequest);
            if (detectedPatterns.length > 0) {
                const patternGuidance = PatternDetector.generateGuidance(detectedPatterns, userRequest);
                basePrompt.userPrompt += patternGuidance;
                basePrompt.fullPrompt = `${basePrompt.systemPrompt}\n\n${basePrompt.userPrompt}\n\nRespond ONLY with valid JSON, without any additional text, comments, or markdown.`;
            }
        }

        return basePrompt;
    }

    /**
     * NEW: Generates a prompt for modifying an existing design.
     */
    generateModificationPrompt(userRequest, currentDesignJSON, scanResults) {
        const modificationSystemPrompt = this.buildModificationSystemPrompt(currentDesignJSON, userRequest, scanResults);
        
        return {
            systemPrompt: "",
            userPrompt: "",
            fullPrompt: `${modificationSystemPrompt}\n\nRespond ONLY with valid JSON, without any additional text, comments, or markdown.`,
            guidance: []
        };
    }

    /**
     * NEW: Builds the specialized system prompt for modifications.
     */
    buildModificationSystemPrompt(currentDesign, modification, scanResults) {
        const componentInfo = this.analyzeAvailableComponents(scanResults);
        const designSystemContext = this.buildDesignSystemContext(componentInfo);

        return `You are an expert UX Designer modifying an existing UI design based on a user's request.

## Your Task:
Modify the "CURRENT DESIGN" JSON structure according to the "USER REQUEST". Return the COMPLETE, new JSON structure.

${designSystemContext}

---

## CURRENT DESIGN:
\`\`\`json
${JSON.stringify(currentDesign, null, 2)}
\`\`\`

---

## USER REQUEST:
"${modification}"

---

## MODIFICATION RULES (MANDATORY):
1.  **Preserve Unchanged Elements:** Keep ALL elements and properties that were not mentioned in the user request exactly as they are in the "CURRENT DESIGN". Do not alter or remove them.
2.  **Maintain Component IDs:** For all unchanged components, you MUST use the same \`componentNodeId\` as in the original JSON.
3.  **Apply Specific Changes:** Only modify, add, or remove the elements and properties that the user explicitly requested.
4.  **Logical Placement:** When adding new items, place them in a logical position relative to other elements.
5.  **Return Full Structure:** Your final output must be the ENTIRE JSON object, including both the modified and the preserved parts.

## 🔧 VARIANT MODIFICATION RULES:
- **When modifying variants**: Always include the complete variants object with ALL required properties
- **For leading/trailing icons**: Use "Leading": "Icon" and "Trailing": "Icon"
- **For removing icons**: Use "Leading": "None" and "Trailing": "None"  
- **Always validate**: Ensure all variant combinations are complete and valid

## ✅ CORRECT Variant Modification Example:
\`\`\`json
{
  "type": "list-item",
  "componentNodeId": "10:123",
  "properties": {
    "text": "Settings item",
    "horizontalSizing": "FILL",
    "variants": {
      "Condition": "1-line",
      "Leading": "Icon",
      "Trailing": "Icon"
    }
  }
}
\`\`\`

${this.getJSONStructureGuide()}
`;
    }

    /**
     * Generates a specialized prompt for image analysis.
     */
    generateImageAnalysisPrompt(userRequest, scanResults) {
        console.log("🖼️ Generating image analysis prompt.");
        const componentAnalysis = this.analyzeAvailableComponents(scanResults);
        const designSystemContext = this.buildDesignSystemContext(componentAnalysis);

        const systemPrompt = `${this.basePersonality}

## 🖼️ IMAGE ANALYSIS TASK

You are analyzing a UI screenshot, wireframe, or mockup. Your expert UX designer skills allow you to:

1.  **Understand Layout Patterns**: Identify how elements are arranged (vertical stack, horizontal sections, grid, etc.).
2.  **Map UI Components**: Recognize buttons, inputs, cards, text, images, and other common UI elements.
3.  **Read Visual Hierarchy**: Understand what's primary vs. secondary content based on size, position, and emphasis.
4.  **Extract Information Architecture**: See how content is grouped and organized into logical sections.

${designSystemContext}

## 🎯 Your Task:
Analyze the provided user interface image and the user's text request. Your goal is to recreate a similar layout and structure using the available components from the design system.

${this.getJSONStructureGuide()}

## 🧠 Image Analysis Guidelines:
- Focus on the **LAYOUT, STRUCTURE, and HIERARCHY** of the image, not the exact colors, fonts, or pixel-perfect styling.
- **Map the visual elements** in the image to the most appropriate components available in the design system.
- If the user provides a text prompt, it **overrides or clarifies** the image. For example, if the image shows a "Sign Up" button but the user asks for a "Login" page, you should create a login page.
- Maintain the same **information hierarchy and grouping** you see in the image.
- Use nested \`layoutContainer\`s to represent columns, rows, and grouped sections from the image.
- Infer appropriate **spacing and padding** based on the visual relationships in the image.

${this.getJSONExamples()}

## User's Request:
${userRequest || "Recreate the layout from the provided image."}`;

        return {
            systemPrompt: "",
            userPrompt: "",
            fullPrompt: `${systemPrompt}\n\nRespond ONLY with valid JSON, without any additional text, comments, or markdown.`,
            guidance: []
        };
    }

    /**
     * Builds expert UX designer system prompt
     */
    buildExpertSystemPrompt(scanResults) {
        const componentInfo = this.analyzeAvailableComponents(scanResults);
        const designSystemContext = this.buildDesignSystemContext(componentInfo);
        
        return `${this.basePersonality}

${designSystemContext}

${this.getJSONStructureGuide()}

${this.getUXPrinciples()}

${this.getJSONExamples(componentInfo)}`;
    }

    /**
     * Builds the core UX expert personality and role
     */
    buildUXExpertPersonality() {
        return `You are an experienced Senior UX Designer with 10+ years of experience in creating interfaces for web and mobile applications. You have deep knowledge in:

## Your Expertise:
- **User Experience Design**: You understand user needs and create intuitive interfaces
- **Information Architecture**: You can structure content logically and clearly
- **Interaction Design**: You know how to create smooth and effective interactions
- **Accessibility**: You always consider the needs of users with disabilities
- **Design Systems**: You understand the importance of consistency and scalability
- **Mobile & Responsive Design**: Expert in adaptive and mobile-first approaches
- **Modern UI Patterns**: You know modern trends and best practices (Material Design, Human Interface Guidelines, etc.)

## Your Approach:
- Always ask yourself "Why?" before creating something
- Think about the entire user journey, not just a single screen
- Balance aesthetics with functionality
- Consider technical limitations, but don't let them constrain the UX
- Create interfaces that "breathe" - with proper spacing and hierarchy

## Your Task:
Create structured JSON to generate UI in Figma, using components from the user's design system. Apply your UX knowledge to create logical, user-friendly, and beautiful interfaces.`;
    }
    
    preprocessForCommonIssues(userRequest) {
        const warnings = [];
        
        if (/upload.*button|button.*upload|form.*file.*submit/i.test(userRequest)) {
            warnings.push("Keep submit/send buttons as separate items in the main items array, NOT nested inside upload containers");
        }
        
        if (/captcha.*button|verification.*submit/i.test(userRequest)) {
            warnings.push("CAPTCHA sections and submit buttons must be separate objects in the items array");
        }
        
        if (warnings.length > 0) {
            return userRequest + "\n\n// ⚠️ CRITICAL WARNINGS:\n" + warnings.map(w => `// - ${w}`).join('\n');
        }
        
        return userRequest;
    }

    /**
     * Analyzes available components and groups them meaningfully
     */
    analyzeAvailableComponents(scanResults) {
        if (!scanResults || scanResults.length === 0) {
            return { byType: {}, isEmpty: true };
        }

        const componentsByType = {};
        const componentCapabilities = {};
        
        scanResults.forEach(comp => {
            if (comp.confidence >= 0.7 || comp.isVerified) {
                if (!componentsByType[comp.suggestedType]) {
                    componentsByType[comp.suggestedType] = [];
                }
                componentsByType[comp.suggestedType].push(comp);

                componentCapabilities[comp.suggestedType] = {
                    hasVariants: comp.variants && comp.variants.length > 0,
                    hasTextLayers: comp.textLayers && comp.textLayers.length > 0,
                    variants: comp.variants || [],
                    variantDetails: comp.variantDetails || {},  // NEW: Add variant details
                    textLayers: comp.textLayers || []
                };
            }
        });

        return {
            byType: componentsByType,
            capabilities: componentCapabilities,
            totalCount: Object.keys(componentsByType).length,
            isEmpty: false
        };
    }

    /**
     * Builds design system context with UX considerations
     */
    buildDesignSystemContext(componentInfo) {
        if (componentInfo.isEmpty) {
            return `## Available Components:
*Design system not loaded. Please scan your design system first.*
    
IMPORTANT: You cannot use placeholder IDs. Each component must have a real componentNodeId from the scanned design system.`;
        }
    
        let context = `## Your Design System (${componentInfo.totalCount} component types):
    
*As a Senior UX Designer, you understand that this design system is your tool for creating a consistent experience. Use components wisely, considering their purpose and capabilities.*
    
**CRITICAL**: You MUST use the exact componentNodeId values provided below. Do NOT use placeholder IDs like "button_id" or "input_id_1".
    
`;
        
        const uxGroups = this.groupComponentsByUXPurpose(componentInfo.byType);
        
        Object.entries(uxGroups).forEach(([groupName, components]) => {
            if (components.length > 0) {
                context += `### ${groupName}\n`;
                
                components.forEach(comp => {
                    const capabilities = componentInfo.capabilities[comp.suggestedType];
                    // Show the actual component ID that should be used
                    context += `- **${comp.suggestedType}** → Use componentNodeId: "${comp.id}"`;
                    
                    // NEW: Show detailed variant options with human-friendly descriptions
                    if (capabilities?.variantDetails && Object.keys(capabilities.variantDetails).length > 0) {
                        context += `\n  - Variants available:\n`;
                        Object.entries(capabilities.variantDetails).forEach(([propName, values]) => {
                            context += `    - ${propName}: [${values.map(v => `"${v}"`).join(', ')}]\n`;
                            
                            // Add human-friendly explanations for common variants
                            if (propName.toLowerCase().includes('condition')) {
                                context += `      // "1-line" = single line layout, "2-line" = two line layout\n`;
                            }
                            if (propName.toLowerCase().includes('leading')) {
                                context += `      // "Icon" = shows icon, "None" = no icon\n`;
                            }
                            if (propName.toLowerCase().includes('trailing')) {
                                context += `      // "Icon" = shows trailing icon, "None" = no trailing element\n`;
                            }
                            if (propName.toLowerCase().includes('show')) {
                                context += `      // "True" = visible, "False" = hidden\n`;
                            }
                        });
                        
                        context += `\n  - 💡 VARIANT USAGE TIPS:\n`;
                        context += `    - You only need to specify variants you want to change\n`;
                        context += `    - Common requests: "single line" → "Condition": "1-line"\n`;
                        context += `    - "with icon" → "Leading": "Icon"\n`;
                        context += `    - "simple" or "minimal" → use defaults (don't specify variants)\n`;
                    } else if (capabilities?.hasVariants) {
                        // Fallback to old behavior if no detailed variant info
                        context += ` - Variants: ${capabilities.variants.join(', ')}`;
                    }
                    
                    if (capabilities?.hasTextLayers) {
                        context += `  - Text layers: ${capabilities.textLayers.map(l => `"${l}"`).join(', ')}`;
                    }
                    
                    context += `\n`;
                });
                context += `\n`;
            }
        });
    
        // 🔧 FIXED: Enhanced examples with actual IDs
        context += `**Remember**: Always use the exact componentNodeId values listed above. Never use placeholder IDs.

## ✅ CORRECT JSON Example (List Item):
\`\`\`json
{
  "layoutContainer": { "name": "Settings", "layoutMode": "VERTICAL", "width": 360, "itemSpacing": 8 },
  "items": [
    { 
      "type": "list-item", 
      "componentNodeId": "${this.getExampleId(componentInfo, 'list-item')}", 
      "properties": {
        "text": "Change language",
        "supporting-text": "Select your preferred language",
        "trailing-text": "English",
        "horizontalSizing": "FILL"
      } 
    }
  ]
}
  
\`\`\`

## 🎯 Property Name Guidelines:
- **Main content**: Use \`"text"\` or \`"headline"\`
- **Secondary content**: Use \`"supporting-text"\` or \`"subtitle"\`  
- **End content**: Use \`"trailing-text"\` or \`"value"\`
- **Never use**: Property names with spaces unless they match exact text layer names
    
## ❌ WRONG - Never use these:
- "input_id", "input_id_1", "button_id" (placeholder IDs)
- "component_123" (made-up IDs)`;
    
        return context;
    }

    /**
     * Groups components by their UX purpose rather than technical categories
     */
    groupComponentsByUXPurpose(componentsByType) {
        const groups = {
            '🎯 User Actions': [],
            '📝 Data Input': [],
            '🧭 Navigation': [],
            '📋 Content Display': [],
            '💬 Feedback': [],
            '📐 Page Structure': []
        };

        const groupMapping = {
            '🎯 User Actions': ['button', 'fab', 'chip', 'link', 'icon-button'],
            '📝 Data Input': ['input', 'textarea', 'select', 'checkbox', 'radio', 'switch', 'slider', 'searchbar', 'form', 'upload'],
            '🧭 Navigation': ['appbar', 'tab', 'tabs', 'breadcrumb', 'pagination', 'navigation', 'sidebar', 'menu'],
            '📋 Content Display': ['card', 'list', 'list-item', 'avatar', 'image', 'text', 'header', 'badge', 'icon'],
            '💬 Feedback': ['snackbar', 'alert', 'dialog', 'modal', 'progress', 'skeleton', 'tooltip'],
            '📐 Page Structure': ['container', 'grid', 'divider', 'spacer', 'frame']
        };

        Object.entries(componentsByType).forEach(([type, components]) => {
            let assigned = false;
            for (const [groupName, types] of Object.entries(groupMapping)) {
                if (types.includes(type)) {
                    groups[groupName].push(...components);
                    assigned = true;
                    break;
                }
            }
            if (!assigned) {
                groups['📐 Page Structure'].push(...components);
            }
        });

        return groups;
    }

    /**
     * Generates contextual UX guidance based on the request
     */
    generateContextualGuidance(userRequest) {
        const guidance = [];
        const request = userRequest.toLowerCase();

        if (this.containsKeywords(request, ['form', 'login', 'register', 'signin', 'password', 'email'])) {
            guidance.push("Forms should be simple and clear. Place required fields first, and group related fields.");
        }
        if (this.containsKeywords(request, ['navigat', 'menu', 'tab', 'section'])) {
            guidance.push("Navigation should be intuitive. No more than 7±2 items per level. Indicate the current location.");
        }
        if (this.containsKeywords(request, ['list', 'card', 'item', 'product'])) {
            guidance.push("Lists should have a scannable structure: important information at the top, secondary at the bottom. Ensure sufficient spacing between items.");
        }
        if (this.containsKeywords(request, ['mobile', 'phone', 'adaptive', 'responsive'])) {
            guidance.push("Mobile-first approach: large touch targets (min. 44px), easy thumb access, vertical orientation.");
        }
        if (this.containsKeywords(request, ['dashboard', 'panel', 'stat', 'analytic'])) {
            guidance.push("Dashboards: most important information at the top and left, use progressive disclosure for details.");
        }
        if (this.containsKeywords(request, ['settings', 'preferences', 'account', 'options', 'configure'])) {
            guidance.push("Settings screens should show current values for quick reference. Use 'trailing-text' to display current language, phone number, email, notification status, etc.");
            guidance.push("Group related settings logically. Show action hints like 'What is it?' for premium features, current values for user data.");
        }

        // NEW: Add variant mapping guidance
        if (this.containsKeywords(request, ['single line', 'one line', '1 line', 'minimal', 'simple'])) {
            guidance.push('For single line layouts, use "Condition": "1-line" variant.');
        }
        if (this.containsKeywords(request, ['two line', 'double line', '2 line', 'detailed'])) {
            guidance.push('For two line layouts, use "Condition": "2-line" variant.');
        }
        if (this.containsKeywords(request, ['with icon', 'show icon', 'icon before'])) {
            guidance.push('To show leading icons, use "Leading": "Icon" variant.');
        }
        if (this.containsKeywords(request, ['no icon', 'without icon', 'text only'])) {
            guidance.push('To hide icons, use "Leading": "None" variant.');
        }
        if (this.containsKeywords(request, ['trailing', 'end icon', 'arrow', 'chevron'])) {
            guidance.push('To show trailing elements, use "Trailing": "Icon" variant.');
        }
        
        return guidance;
    }

    /**
     * Enhances user request with UX thinking
     */
    enhanceUserRequest(userRequest, guidance) {
        let enhanced = userRequest;
        
        if (guidance.length > 0) {
            enhanced += "\n\n// As an experienced UX designer, consider these principles:";
            guidance.forEach(tip => {
                enhanced += `\n// - ${tip}`;
            });
        }

        enhanced += "\n\n// Apply your UX knowledge to create a logical, user-friendly, and aesthetically pleasing interface.";

        return enhanced;
    }

    /**
     * Core UX principles to guide design decisions
     */
    getUXPrinciples() {
        return `## Your UX Principles (always follow them):

### 1. Hierarchy and Importance
- The most important elements are the largest and highest
- Use size, color, and position to create a visual hierarchy
- The primary action (Primary CTA) must be obvious

### 2. Spacing and Breathing Room
- Use consistent spacing: 8px, 16px, 24px, 32px
- Let the content "breathe" - don't cram everything onto one screen
- Group related elements through proximity

### 3. Cognitive Load
- Don't overload the user with options
- Progressive disclosure: show the main things, hide the details
- Make the next steps obvious

### 4. Accessibility
- Minimum touch target size: 44px
- Sufficient contrast for text
- Logical tabbing order

### 5. User Mental Models
- Use familiar patterns (don't reinvent the wheel)
- Place elements where they are expected
- Consistency throughout the entire product`;
    }

    /**
     * JSON structure guide with UX considerations
     */
    getJSONStructureGuide() {
        return `## JSON Structure & Rules:

### Basic structure:
\`\`\`json
{
  "layoutContainer": {
    "name": "Container Name",
    "layoutMode": "VERTICAL",
    "width": 360,           // Always specify width for mobile
    "paddingTop": 24,
    "paddingBottom": 24,
    "paddingLeft": 16,
    "paddingRight": 16,
    "itemSpacing": 16
  },
  "items": [
    // ... components go here
  ]
}
  // Add this to your existing JSON examples:

// NATIVE TEXT ELEMENTS (no design system component needed):
{
  "type": "text",
  "content": "Welcome Back!",
  "alignment": "center",        // Options: "left", "center", "right"
  "fontSize": 24,              // Optional: specific font size
  "fontWeight": "bold",        // Optional: "normal", "bold"
  "horizontalSizing": "HUG",   // Options: "FILL", "HUG", or specific width
  "verticalSizing": "HUG"      // Usually "HUG" for text
}

// Example in a container:
{
  "layoutContainer": {
    "name": "Welcome Screen",
    "layoutMode": "VERTICAL",
    "itemSpacing": 16,
    "paddingHorizontal": 24
  },
  "items": [
    {
      "type": "text",
      "content": "Welcome Back!",
      "alignment": "center",
      "fontSize": 32,
      "fontWeight": "bold",
      "horizontalSizing": "FILL"
    },
    {
      "type": "text", 
      "content": "Sign in to continue your journey with us.",
      "alignment": "left",
      "fontSize": 16,
      "fontWeight": "normal",
      "horizontalSizing": "FILL"
    }
  ]
}
\`\`\`

### UX Considerations for JSON:
- **layoutMode**: VERTICAL is easier to scan for most content.
- **itemSpacing**: Use 16px for related items, 24px+ for separating sections.
- **horizontalSizing**: "FILL" is crucial for primary actions (buttons) and inputs.
- **items order**: This defines the visual and accessibility order. Top-to-bottom matters.

### Component Selection Rules:
- **ALWAYS use the exact componentNodeId from the design system list above**
- Never use placeholder IDs like "button_id", "input_id", etc.
- File upload areas: Use layoutContainer with icon + text, NOT image component
- Secondary buttons: Use button with variants like "Medium" emphasis
- CAPTCHA/forms: Use input or form components, NOT list-item
- All form inputs: Must have horizontalSizing: "FILL"
- Icon actions: Use icon-button if available, or button with icon property

### Text Property Rules:
- **Primary text**: Use \`"text"\` or \`"headline"\` for main content
- **Secondary text**: Use \`"supporting-text"\` for descriptions
- **Action/Value text**: Use \`"trailing-text"\` for status, values, or action hints
- **Property names should be lowercase with hyphens**: \`"supporting-text"\` not \`"Supporting text"\`
- **Avoid variant names as text content**: Don't use \`"Headline": "text content"\`

### Enhanced List Item Example:
\`\`\`json
{
  "type": "list-item",
  "componentNodeId": "10:123",
  "properties": {
    "text": "Change language",           // Main headline
    "supporting-text": "Select your preferred language",  // Optional description
    "trailing-text": "English",   // Current value or action hint
    "horizontalSizing": "FILL",
    "variants": {
      "Condition": "1-line",       // Component variants in separate object
      "Leading": "Icon",
      "Trailing": "Icon"
    }
  }
}
\`\`\`

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

### Example with variants:
\`\`\`json
{
  "type": "button",
  "componentNodeId": "10:123",
  "properties": {
    "text": "Submit",
    "horizontalSizing": "FILL",
    "variants": {
      "Type": "Primary",    // Must match exactly from available options
      "Size": "Large",      // Case-sensitive!
      "State": "enabled"    // Default states are usually "enabled" or "default"
    }
  }
}
\`\`\`

### Button Hierarchy:
- Primary actions (Submit, Send): "High" emphasis, horizontalSizing: "FILL"
- Secondary actions (Add more): "Medium" emphasis, horizontalSizing: "AUTO"
- Icon actions: icon-button or button with icon

### CRITICAL OBJECT SEPARATION RULES:
Each item in the "items" array must be a complete, separate object.

✅ CORRECT - Separate objects:
\`\`\`json
{
  "items": [
    { 
      "type": "layoutContainer",
      "name": "Section1",
      "items": []
    },
    { 
      "type": "button",
      "componentNodeId": "10:3907",  // Real ID from design system
      "properties": {}
    }
  ]
}
\`\`\`

❌ WRONG - Placeholder IDs:
\`\`\`json
{
  "items": [
    { 
      "type": "button",
      "componentNodeId": "button_id",  // NEVER use placeholder IDs!
      "properties": {}
    }
  ]
}
\`\`\``;
    }

    /**
     * Real-world examples that demonstrate good UX
     * NOW USES ACTUAL COMPONENT IDs from the scan results
     */
    getJSONExamples(componentInfo) {
        // Get actual IDs from the scanned components - with better error handling
        const getActualId = (type) => {
            // Handle case where componentInfo is undefined or empty
            if (!componentInfo || componentInfo.isEmpty || !componentInfo.byType) {
                return `${type}_actual_id`;
            }
            
            const components = componentInfo.byType[type];
            if (components && Array.isArray(components) && components.length > 0) {
                return components[0].id;
            }
            
            return `${type}_actual_id`;
        };

        // Get IDs with fallbacks
        const headerId = getActualId('header');
        const inputId = getActualId('input');
        const buttonId = getActualId('button');
        const textId = getActualId('text');
        const imageId = getActualId('image');
        const listItemId = getActualId('list-item');

        return `## Examples (with UX rationale):

### Login Form (classic user flow):
\`\`\`json
{
  "layoutContainer": {
    "name": "Login Form",
    "layoutMode": "VERTICAL",
    "width": 360,
    "paddingTop": 32,
    "paddingBottom": 32,
    "paddingLeft": 24,
    "paddingRight": 24,
    "itemSpacing": 20
  },
  "items": [
    { "type": "header", "componentNodeId": "${headerId}", "properties": {"text": "Sign In"} },
    { "type": "input", "componentNodeId": "${inputId}", "properties": {"text": "Email", "horizontalSizing": "FILL"} },
    { "type": "input", "componentNodeId": "${inputId}", "properties": {"text": "Password", "horizontalSizing": "FILL"} },
    { 
    "type": "button", 
    "componentNodeId": "${buttonId}", 
    "properties": {
        "text": "Sign In", 
        "horizontalSizing": "FILL",
        "variants": {
            "State": "enabled",
            "Style": "selected"
        }
    } 
}
  ]
}
\`\`\`
*UX decision: A title for context, full-width inputs for easy tapping, and the primary action button at the bottom for a natural flow.*

### Complex Form with File Upload and Submit Button:
\`\`\`json
{
  "layoutContainer": {
    "name": "Upload Form",
    "layoutMode": "VERTICAL",
    "width": 360,
    "paddingTop": 24,
    "paddingBottom": 24,
    "paddingLeft": 16,
    "paddingRight": 16,
    "itemSpacing": 16
  },
  "items": [
    { "type": "header", "componentNodeId": "${headerId}", "properties": {"text": "Upload Documents"} },
    {
      "type": "layoutContainer",
      "name": "FileUploadSection",
      "items": [
        { "type": "text", "componentNodeId": "${textId}", "properties": {"text": "Upload your file"} },
        { "type": "image", "componentNodeId": "${imageId}", "properties": {"icon": "upload"} }
      ]
    },
    {
      "type": "layoutContainer",
      "name": "CaptchaSection",
      "items": [
        { "type": "text", "componentNodeId": "${textId}", "properties": {"text": "CAPTCHA placeholder"} }
      ]
    },
    {
      "type": "button",
      "componentNodeId": "${buttonId}",
      "properties": { "text": "Submit", "horizontalSizing": "FILL" }
    }
  ]
}
\`\`\`
*UX decision: Each major section (file upload, captcha, submit button) is a separate item in the main "items" array. The submit button is NOT nested inside any other container.*

### Settings Screen with Smart Variants:
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
      "componentNodeId": "${listItemId}",
      "properties": {
        "text": "Personal details",
        "horizontalSizing": "FILL",
        "variants": {
          "Condition": "1-line"
        }
      }
    },
    {
      "type": "list-item",
      "componentNodeId": "${listItemId}",
      "properties": {
        "text": "Change language",
        "trailing-text": "English",
        "horizontalSizing": "FILL",
        "variants": {
          "Condition": "2-line",
          "Trailing": "Icon"
        }
      }
    }
  ]
}
\`\`\`
*UX Note: You only need to specify variants you want to change. The plugin automatically fills in defaults for other variant properties.*

**IMPORTANT**: Notice how we use the actual componentNodeId values from your design system, NOT placeholder IDs.`;
    }

    // Helper methods
    // Helper method to get example IDs for documentation
    getExampleId(componentInfo, type) {
        if (!componentInfo || componentInfo.isEmpty || !componentInfo.byType) {
            return `${type}_actual_id`;
        }
        const components = componentInfo.byType[type];
        if (components && Array.isArray(components) && components.length > 0) {
            return components[0].id;
        }
        return `${type}_actual_id`;
    }
    
    containsKeywords(text, keywords) {
        return keywords.some(keyword => text.includes(keyword));
    }
}

// Export for use in HTML
if (typeof window !== 'undefined') {
    window.AIDesignerPromptGenerator = AIDesignerPromptGenerator;
}