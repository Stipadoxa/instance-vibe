// Semantic Component Mapper - Maps user intent to actual design system components
// Handles the reality that every design system names things differently

export interface ComponentSemantics {
  id: string;
  name: string;
  suggestedType: string;
  semanticTags: string[];
  confidence: number;
}

export class SemanticMapper {
  private static readonly SEMANTIC_PATTERNS = {
    // Text Input patterns
    'text-input': [
      'input', 'textfield', 'text-field', 'textbox', 'text-box', 
      'field', 'form-field', 'input-field', 'text-input',
      'email-input', 'password-input', 'search-input'
    ],
    
    // Button patterns
    'button': [
      'button', 'btn', 'cta', 'call-to-action', 'action-button',
      'primary-button', 'secondary-button', 'submit', 'submit-button',
      'form-button', 'action', 'click-button'
    ],
    
    // Text/Label patterns
    'text': [
      'text', 'label', 'title', 'heading', 'paragraph', 'copy',
      'typography', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'body-text', 'caption', 'subtitle'
    ],
    
    // Container patterns
    'container': [
      'container', 'wrapper', 'box', 'panel', 'section',
      'frame', 'group', 'layout', 'card', 'card-container'
    ],
    
    // Card patterns
    'card': [
      'card', 'tile', 'panel', 'item', 'component-card',
      'content-card', 'info-card', 'product-card'
    ],
    
    // List patterns
    'list': [
      'list', 'list-item', 'item', 'row', 'entry',
      'list-row', 'table-row', 'data-row'
    ],
    
    // Icon patterns
    'icon': [
      'icon', 'symbol', 'glyph', 'pictogram', 'emoji',
      'icon-button', 'icon-component'
    ],
    
    // Navigation patterns
    'navigation': [
      'nav', 'navigation', 'navbar', 'nav-bar', 'menu',
      'tab', 'tabs', 'tab-bar', 'breadcrumb', 'sidebar'
    ]
  };

  /**
   * Find the best matching component for a requested semantic type
   */
  static findBestMatch(requestedType: string, availableComponents: ComponentSemantics[]): ComponentSemantics | null {
    const normalizedRequest = requestedType.toLowerCase().trim();
    
    // 1. Try exact match first
    const exactMatch = availableComponents.find(comp => 
      comp.suggestedType.toLowerCase() === normalizedRequest ||
      comp.name.toLowerCase() === normalizedRequest
    );
    if (exactMatch) return exactMatch;

    // 2. Try semantic pattern matching
    let bestMatch: ComponentSemantics | null = null;
    let highestScore = 0;

    for (const [semanticType, patterns] of Object.entries(this.SEMANTIC_PATTERNS)) {
      // Check if requested type matches any pattern
      const requestMatches = patterns.some(pattern => 
        normalizedRequest.includes(pattern) || pattern.includes(normalizedRequest)
      );
      
      if (requestMatches) {
        // Find components that match this semantic type
        for (const comp of availableComponents) {
          const score = this.calculateSemanticScore(comp, patterns);
          if (score > highestScore && score > 0.3) { // Minimum confidence threshold
            highestScore = score;
            bestMatch = comp;
          }
        }
      }
    }

    // 3. Try fuzzy name matching as fallback
    if (!bestMatch) {
      for (const comp of availableComponents) {
        const nameScore = this.calculateNameSimilarity(normalizedRequest, comp.name.toLowerCase());
        const typeScore = this.calculateNameSimilarity(normalizedRequest, comp.suggestedType.toLowerCase());
        const maxScore = Math.max(nameScore, typeScore);
        
        if (maxScore > highestScore && maxScore > 0.4) {
          highestScore = maxScore;
          bestMatch = comp;
        }
      }
    }

    console.log(`🎯 Semantic mapping: "${requestedType}" -> ${bestMatch?.name || 'null'} (score: ${highestScore.toFixed(2)})`);
    return bestMatch;
  }

  /**
   * Calculate how well a component matches semantic patterns
   */
  private static calculateSemanticScore(component: ComponentSemantics, patterns: string[]): number {
    const compName = component.name.toLowerCase();
    const compType = component.suggestedType.toLowerCase();
    
    let score = 0;
    let matches = 0;
    
    for (const pattern of patterns) {
      // Exact matches get highest score
      if (compType === pattern || compName === pattern) {
        score += 1.0;
        matches++;
      }
      // Substring matches get medium score
      else if (compType.includes(pattern) || compName.includes(pattern)) {
        score += 0.7;
        matches++;
      }
      // Word boundary matches get lower score
      else if (compType.split(/[-_\s]/).includes(pattern) || compName.split(/[-_\s]/).includes(pattern)) {
        score += 0.5;
        matches++;
      }
    }
    
    // Average score weighted by confidence
    const avgScore = matches > 0 ? score / matches : 0;
    return avgScore * (component.confidence || 1.0);
  }

  /**
   * Calculate string similarity using simple edit distance
   */
  private static calculateNameSimilarity(str1: string, str2: string): number {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1.0;
    
    return (maxLength - this.levenshteinDistance(str1, str2)) / maxLength;
  }

  /**
   * Simple Levenshtein distance calculation
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // insertion
          matrix[j - 1][i] + 1, // deletion
          matrix[j - 1][i - 1] + substitutionCost // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Analyze a design system and add semantic tags to components
   */
  static analyzeDesignSystem(components: any[]): ComponentSemantics[] {
    return components.map(comp => ({
      id: comp.id,
      name: comp.name,
      suggestedType: comp.suggestedType || comp.type || 'unknown',
      semanticTags: this.generateSemanticTags(comp),
      confidence: comp.confidence || 0.8
    }));
  }

  /**
   * Generate semantic tags for a component based on its name and type
   */
  private static generateSemanticTags(component: any): string[] {
    const name = (component.name || '').toLowerCase();
    const type = (component.suggestedType || component.type || '').toLowerCase();
    const combined = `${name} ${type}`;
    
    const tags: string[] = [];
    
    // Check against all semantic patterns
    for (const [semanticType, patterns] of Object.entries(this.SEMANTIC_PATTERNS)) {
      for (const pattern of patterns) {
        if (combined.includes(pattern)) {
          tags.push(semanticType);
          break; // Only add each semantic type once
        }
      }
    }
    
    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Get suggestions for unrecognized component types
   */
  static getSuggestions(requestedType: string, availableComponents: ComponentSemantics[]): string[] {
    const suggestions: string[] = [];
    const normalizedRequest = requestedType.toLowerCase();
    
    // Find semantically similar components
    for (const comp of availableComponents) {
      const similarity = this.calculateNameSimilarity(normalizedRequest, comp.suggestedType.toLowerCase());
      if (similarity > 0.3) {
        suggestions.push(`Did you mean "${comp.suggestedType}"? (${comp.name})`);
      }
    }
    
    return suggestions.slice(0, 3); // Top 3 suggestions
  }
}