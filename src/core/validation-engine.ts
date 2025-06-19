// src/core/validation-engine.ts
// Quality assurance and validation engine for AIDesigner

import { GeminiAPI, GeminiRequest } from '../ai/gemini-api';
import { ComponentScanner } from './component-scanner';

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-1 quality score
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
  autoFixAvailable: boolean;
}

export interface ValidationError {
  code: string;
  message: string;
  path: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  fixable: boolean;
}

export interface ValidationWarning {
  code: string;
  message: string;
  path: string;
  suggestion: string;
}

export interface ValidationConfig {
  enableAIValidation: boolean;
  enableStructuralValidation: boolean;
  enableComponentValidation: boolean;
  qualityThreshold: number; // 0-1, minimum score to accept
  maxRetries: number;
  autoFixEnabled: boolean;
}

export interface QualityMetrics {
  structuralIntegrity: number;
  componentConsistency: number;
  designSystemCompliance: number;
  usabilityScore: number;
  overallScore: number;
}

export class ValidationEngine {
  private static readonly DEFAULT_CONFIG: ValidationConfig = {
    enableAIValidation: true,
    enableStructuralValidation: true,
    enableComponentValidation: true,
    qualityThreshold: 0.7,
    maxRetries: 2,
    autoFixEnabled: true
  };

  private config: ValidationConfig;

  constructor(config?: Partial<ValidationConfig>) {
    this.config = { ...ValidationEngine.DEFAULT_CONFIG, ...config };
  }

  /**
   * Main validation method - comprehensive quality check
   */
  async validateJSON(jsonString: string, originalPrompt?: string): Promise<ValidationResult> {
    console.log('🔍 Starting comprehensive JSON validation...');
    
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];
    
    try {
      // Parse JSON first
      const layoutData = JSON.parse(jsonString);
      
      // 1. Structural validation
      if (this.config.enableStructuralValidation) {
        const structuralResult = await this.validateStructure(layoutData);
        errors.push(...structuralResult.errors);
        warnings.push(...structuralResult.warnings);
      }
      
      // 2. Component validation
      if (this.config.enableComponentValidation) {
        const componentResult = await this.validateComponents(layoutData);
        errors.push(...componentResult.errors);
        warnings.push(...componentResult.warnings);
      }
      
      // 3. AI-powered validation
      if (this.config.enableAIValidation && originalPrompt) {
        const aiResult = await this.performAIValidation(layoutData, originalPrompt);
        if (aiResult) {
          errors.push(...(aiResult.errors || []));
          warnings.push(...(aiResult.warnings || []));
          suggestions.push(...(aiResult.suggestions || []));
        }
      }
      
      // Calculate quality score
      const qualityMetrics = this.calculateQualityMetrics(layoutData, errors, warnings);
      const score = qualityMetrics.overallScore;
      
      // Determine if validation passed
      const isValid = errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0 
                     && score >= this.config.qualityThreshold;
      
      console.log(`📊 Validation complete: ${isValid ? '✅ PASSED' : '❌ FAILED'} (Score: ${(score * 100).toFixed(1)}%)`);
      
      return {
        isValid,
        score,
        errors,
        warnings,
        suggestions,
        autoFixAvailable: this.hasAutoFixableErrors(errors)
      };
      
    } catch (parseError) {
      console.error('❌ JSON parsing failed during validation:', parseError);
      return {
        isValid: false,
        score: 0,
        errors: [{
          code: 'JSON_PARSE_ERROR',
          message: 'Invalid JSON syntax',
          path: 'root',
          severity: 'critical',
          fixable: false
        }],
        warnings: [],
        suggestions: ['Check JSON syntax for missing brackets, commas, or quotes'],
        autoFixAvailable: false
      };
    }
  }

  /**
   * Validate with retry logic - attempts to fix and re-validate
   */
  async validateWithRetry(jsonString: string, originalPrompt?: string, geminiAPI?: GeminiAPI): Promise<{
    result: ValidationResult;
    finalJSON: string;
    retryCount: number;
  }> {
    let currentJSON = jsonString;
    let retryCount = 0;
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      const result = await this.validateJSON(currentJSON, originalPrompt);
      
      if (result.isValid || !geminiAPI || !this.config.autoFixEnabled) {
        return { result, finalJSON: currentJSON, retryCount: attempt };
      }
      
      // Attempt auto-fix if available
      if (result.autoFixAvailable && attempt < this.config.maxRetries) {
        console.log(`🔧 Attempting auto-fix (retry ${attempt + 1}/${this.config.maxRetries})`);
        
        const fixedJSON = await this.attemptAutoFix(currentJSON, result, originalPrompt ?? '', geminiAPI);
        if (fixedJSON && fixedJSON !== currentJSON) {
          currentJSON = fixedJSON;
          retryCount = attempt + 1;
          continue;
        }
      }
      
      // If we can't fix it, return the current result
      return { result, finalJSON: currentJSON, retryCount: attempt };
    }
    
    // Fallback - return last result
    const finalResult = await this.validateJSON(currentJSON, originalPrompt);
    return { result: finalResult, finalJSON: currentJSON, retryCount: this.config.maxRetries };
  }

  /**
   * Structural validation - check JSON schema and required fields
   */
  private async validateStructure(layoutData: any): Promise<{errors: ValidationError[], warnings: ValidationWarning[]}> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Check root structure
    if (!layoutData.layoutContainer && !layoutData.items) {
      errors.push({
        code: 'MISSING_ROOT_STRUCTURE',
        message: 'JSON must have either layoutContainer or items array',
        path: 'root',
        severity: 'critical',
        fixable: true
      });
    }
    
    // Check layoutContainer properties
    if (layoutData.layoutContainer) {
      const container = layoutData.layoutContainer;
      
      if (!container.layoutMode || !['VERTICAL', 'HORIZONTAL', 'NONE'].includes(container.layoutMode)) {
        errors.push({
          code: 'INVALID_LAYOUT_MODE',
          message: 'layoutMode must be VERTICAL, HORIZONTAL, or NONE',
          path: 'layoutContainer.layoutMode',
          severity: 'high',
          fixable: true
        });
      }
      
      if (container.width && (typeof container.width !== 'number' || container.width <= 0)) {
        warnings.push({
          code: 'INVALID_WIDTH',
          message: 'Width should be a positive number',
          path: 'layoutContainer.width',
          suggestion: 'Use a positive number like 360 for mobile or 1200 for desktop'
        });
      }
    }
    
    // Validate items array
    if (layoutData.items && Array.isArray(layoutData.items)) {
      layoutData.items.forEach((item: any, index: number) => {
        this.validateItem(item, `items[${index}]`, errors, warnings);
      });
    }
    
    return { errors, warnings };
  }

  /**
   * Validate individual items in the layout
   */
  private validateItem(item: any, path: string, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Check required type field
    if (!item.type) {
      errors.push({
        code: 'MISSING_TYPE',
        message: 'Each item must have a type field',
        path: `${path}.type`,
        severity: 'critical',
        fixable: false
      });
      return;
    }
    
    // Check for native elements (don't need componentNodeId)
    const nativeTypes = ['native-text', 'text', 'native-rectangle', 'native-circle', 'layoutContainer'];
    const isNative = nativeTypes.includes(item.type);
    
    // Check componentNodeId for non-native elements
    if (!isNative && !item.componentNodeId) {
      errors.push({
        code: 'MISSING_COMPONENT_ID',
        message: 'Non-native items must have a componentNodeId',
        path: `${path}.componentNodeId`,
        severity: 'high',
        fixable: true
      });
    }
    
    // Validate componentNodeId format
    if (item.componentNodeId && !item.componentNodeId.match(/^[0-9]+:[0-9]+$/)) {
      warnings.push({
        code: 'INVALID_COMPONENT_ID_FORMAT',
        message: 'componentNodeId should follow format "number:number"',
        path: `${path}.componentNodeId`,
        suggestion: 'Use IDs from your design system scan'
      });
    }
    
    // Check properties structure
    if (item.properties) {
      this.validateProperties(item.properties, `${path}.properties`, warnings);
    }
    
    // Recursive validation for nested items
    if (item.items && Array.isArray(item.items)) {
      item.items.forEach((nestedItem: any, index: number) => {
        this.validateItem(nestedItem, `${path}.items[${index}]`, errors, warnings);
      });
    }
  }

  /**
   * Validate properties object
   */
  private validateProperties(properties: any, path: string, warnings: ValidationWarning[]): void {
    // Check for common property issues
    if (properties.variants && typeof properties.variants !== 'object') {
      warnings.push({
        code: 'INVALID_VARIANTS_TYPE',
        message: 'variants should be an object',
        path: `${path}.variants`,
        suggestion: 'Use {"Condition": "1-line", "Leading": "Icon"} format'
      });
    }
    
    // Check for mixed variant properties (common mistake)
    const variantProperties = ['Condition', 'Leading', 'Trailing', 'State', 'Style', 'Size', 'Type'];
    const hasVariantProps = variantProperties.some(prop => properties.hasOwnProperty(prop));
    
    if (hasVariantProps && !properties.variants) {
      warnings.push({
        code: 'VARIANTS_NOT_GROUPED',
        message: 'Variant properties should be inside a variants object',
        path: path,
        suggestion: 'Move variant properties like "Condition", "Leading" into a variants object'
      });
    }
  }

  /**
   * Component validation - check if referenced components exist
   */
  private async validateComponents(layoutData: any): Promise<{errors: ValidationError[], warnings: ValidationWarning[]}> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    try {
      // Get available components from scan results
      const scanResults = await figma.clientStorage.getAsync('last-scan-results');
      if (!scanResults || !Array.isArray(scanResults)) {
        warnings.push({
          code: 'NO_SCAN_RESULTS',
          message: 'No design system scan results found',
          path: 'validation',
          suggestion: 'Run a design system scan to validate component references'
        });
        return { errors, warnings };
      }
      
      const availableComponentIds = new Set(
        scanResults
          .map((comp: any) => comp.id)
          .filter((id: any) => id && typeof id === 'string')
      );
      
      // Collect all component IDs from JSON
      const usedComponentIds = this.extractComponentIds(layoutData);
      
      // Check each used ID - FIXED: proper type handling
      usedComponentIds.forEach((componentRef) => {
        if (componentRef.id && !availableComponentIds.has(componentRef.id)) {
          errors.push({
            code: 'COMPONENT_NOT_FOUND',
            message: `Component with ID "${componentRef.id}" not found in design system`,
            path: componentRef.path,
            severity: 'high',
            fixable: true
          });
        }
      });
      
    } catch (error) {
      console.error('❌ Component validation failed:', error);
      warnings.push({
        code: 'COMPONENT_VALIDATION_ERROR',
        message: 'Could not validate component references',
        path: 'validation',
        suggestion: 'Check if design system scan is available'
      });
    }
    
    return { errors, warnings };
  }

  /**
   * AI-powered validation using LLM to check design quality
   */
  private async performAIValidation(layoutData: any, originalPrompt: string): Promise<{
    errors?: ValidationError[];
    warnings?: ValidationWarning[];
    suggestions?: string[];
  } | null> {
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

      const request: GeminiRequest = {
        prompt: validationPrompt,
        temperature: 0.3
      };
      
      const response = await geminiAPI.generateJSON(request);
      if (!response.success || !response.content) return null;
      
      // Parse AI feedback (simplified - in production you'd want structured output)
      const feedback = response.content || '';
      const suggestions: string[] = [];
      
      if (feedback.includes('SUGGESTIONS:')) {
        const suggestionsSection = feedback.split('SUGGESTIONS:')[1];
        if (suggestionsSection && suggestionsSection.trim()) {
          suggestions.push(suggestionsSection.trim());
        }
      }
      
      return { suggestions };
      
    } catch (error) {
      console.error('❌ AI validation failed:', error);
      return null;
    }
  }

  /**
   * Calculate quality metrics
   */
  private calculateQualityMetrics(layoutData: any, errors: ValidationError[], warnings: ValidationWarning[]): QualityMetrics {
    const criticalErrors = errors.filter(e => e.severity === 'critical').length;
    const highErrors = errors.filter(e => e.severity === 'high').length;
    const mediumErrors = errors.filter(e => e.severity === 'medium').length;
    const warningCount = warnings.length;
    
    // Structural integrity (0-1)
    const structuralIntegrity = Math.max(0, 1 - (criticalErrors * 0.5 + highErrors * 0.3 + mediumErrors * 0.1));
    
    // Component consistency (0-1)
    const componentErrors = errors.filter(e => e.code.includes('COMPONENT')).length;
    const componentConsistency = Math.max(0, 1 - componentErrors * 0.2);
    
    // Design system compliance (0-1)
    const variantErrors = errors.filter(e => e.code.includes('VARIANT')).length;
    const designSystemCompliance = Math.max(0, 1 - variantErrors * 0.15);
    
    // Usability score (0-1, based on warnings)
    const usabilityScore = Math.max(0, 1 - warningCount * 0.1);
    
    // Overall score (weighted average)
    const overallScore = (
      structuralIntegrity * 0.4 +
      componentConsistency * 0.3 +
      designSystemCompliance * 0.2 +
      usabilityScore * 0.1
    );
    
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
  private extractComponentIds(layoutData: any, basePath: string = 'root'): Array<{id: string, path: string}> {
    const componentIds: Array<{id: string, path: string}> = [];
    
    const traverse = (obj: any, currentPath: string) => {
      if (obj && typeof obj === 'object') {
        if (obj.componentNodeId && typeof obj.componentNodeId === 'string') {
          componentIds.push({ 
            id: obj.componentNodeId, 
            path: currentPath 
          });
        }
        
        if (Array.isArray(obj.items)) {
          obj.items.forEach((item: any, index: number) => {
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
  private hasAutoFixableErrors(errors: ValidationError[]): boolean {
    return errors.some(error => error.fixable);
  }

  /**
   * Attempt to auto-fix validation errors
   */
  private async attemptAutoFix(
    jsonString: string, 
    validationResult: ValidationResult, 
    originalPrompt: string, 
    geminiAPI: GeminiAPI
  ): Promise<string | null> {
    try {
      const fixableErrors = validationResult.errors.filter(e => e.fixable);
      if (fixableErrors.length === 0) return null;
      
      const errorDescriptions = fixableErrors.map(e => `${e.code}: ${e.message} (at ${e.path})`).join('\n');
      
      const fixPrompt = `The following JSON has validation errors that need to be fixed:

ORIGINAL JSON:
${jsonString}

ERRORS TO FIX:
${errorDescriptions}

Please provide the corrected JSON that fixes these errors while maintaining the original intent. Return ONLY the corrected JSON, no explanations.`;

      const request: GeminiRequest = {
        prompt: fixPrompt,
        temperature: 0.1 // Very low temperature for consistent fixes
      };
      
      const response = await geminiAPI.generateJSON(request);
      
      if (response.success && response.content && response.content.trim()) {
        console.log('🔧 Auto-fix attempt completed');
        return response.content;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Auto-fix failed:', error);
      return null;
    }
  }

  /**
   * Get validation summary for UI display
   */
  getValidationSummary(result: ValidationResult): string {
    const { score, errors, warnings } = result;
    const scorePercent = Math.round(score * 100);
    
    const criticalCount = errors.filter(e => e.severity === 'critical').length;
    const highCount = errors.filter(e => e.severity === 'high').length;
    
    if (result.isValid) {
      return `✅ Quality Score: ${scorePercent}% ${warnings.length > 0 ? `(${warnings.length} suggestions)` : ''}`;
    } else {
      const errorSummary = criticalCount > 0 ? `${criticalCount} critical` : `${highCount} high priority`;
      return `❌ Quality Score: ${scorePercent}% (${errorSummary} issues)`;
    }
  }

  /**
   * Update validation configuration
   */
  updateConfig(newConfig: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}