// Enhanced Component Scanner with Semantic Intelligence
import { SemanticMapper, ComponentSemantics } from './semantic-mapper';

export class ComponentScannerEnhanced {
  
  /**
   * Get component ID by type with intelligent semantic mapping
   */
  static async getComponentIdByType(requestedType: string): Promise<string | null> {
    console.log(`🧠 Semantic lookup for: "${requestedType}"`);
    
    const scanResults = await figma.clientStorage.getAsync('last-scan-results');
    if (!scanResults || !Array.isArray(scanResults)) {
      console.log('❌ No scan results found');
      return null;
    }
    
    // Convert to semantic format
    const semanticComponents = SemanticMapper.analyzeDesignSystem(scanResults);
    
    // Use semantic mapping to find best match
    const bestMatch = SemanticMapper.findBestMatch(requestedType, semanticComponents);
    
    if (bestMatch) {
      console.log(`✅ Semantic match found: "${requestedType}" -> "${bestMatch.suggestedType}" (${bestMatch.name})`);
      return bestMatch.id;
    }
    
    // Provide helpful suggestions if no match found
    const suggestions = SemanticMapper.getSuggestions(requestedType, semanticComponents);
    if (suggestions.length > 0) {
      console.log(`💡 Suggestions for "${requestedType}":`, suggestions);
    }
    
    console.log(`❌ No semantic match found for: "${requestedType}"`);
    return null;
  }
  
  /**
   * Get all components with their semantic analysis
   */
  static async getSemanticComponents(): Promise<ComponentSemantics[]> {
    const scanResults = await figma.clientStorage.getAsync('last-scan-results');
    if (!scanResults || !Array.isArray(scanResults)) {
      return [];
    }
    
    return SemanticMapper.analyzeDesignSystem(scanResults);
  }
  
  /**
   * Test semantic mapping with debug output
   */
  static async testSemanticMapping(): Promise<void> {
    console.log('🧪 Testing semantic mapping...');
    
    const components = await this.getSemanticComponents();
    const testCases = [
      'textfield', 'text-input', 'input', 'email-field',
      'button', 'btn', 'cta', 'primary-button',
      'text', 'label', 'title', 'heading',
      'card', 'container', 'panel', 'wrapper'
    ];
    
    for (const testType of testCases) {
      const match = SemanticMapper.findBestMatch(testType, components);
      console.log(`Test: "${testType}" -> ${match ? `"${match.suggestedType}" (${match.name})` : 'No match'}`);
    }
  }
}