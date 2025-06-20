// src/ai/gemini-api.ts
// Gemini API integration and management for AIDesigner

export interface GeminiConfig {
  apiKey: string;
  model: string;
  maxRetries: number;
  retryDelay: number;
  timeout: number;
}

export interface GeminiRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  context?: string;
}

export interface GeminiResponse {
  success: boolean;
  content?: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  retryCount?: number;
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
}

export class GeminiAPI {
  private static readonly DEFAULT_CONFIG: Partial<GeminiConfig> = {
    model: 'gemini-1.5-flash',
    maxRetries: 2,
    retryDelay: 2000,
    timeout: 60000
  };

  private static readonly API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
  
  private config: GeminiConfig;

  constructor(config: Partial<GeminiConfig>) {
    this.config = { ...GeminiAPI.DEFAULT_CONFIG, ...config } as GeminiConfig;
    
    if (!this.config.apiKey) {
      throw new Error('Gemini API key is required');
    }
  }

  /**
   * Main method to generate JSON from prompt
   */
  async generateJSON(request: GeminiRequest): Promise<GeminiResponse> {
    console.log('🤖 Starting Gemini API call for JSON generation');
    
    try {
      const response = await this.callAPIWithRetry(request);
      
      if (response.success && response.content) {
        // Validate that response contains valid JSON
        const validatedJSON = this.validateAndExtractJSON(response.content);
        if (validatedJSON) {
          response.content = validatedJSON;
          console.log('✅ Valid JSON generated and validated');
        } else {
          console.warn('⚠️ Generated content is not valid JSON, returning raw response');
        }
      }
      
      return response;
    } catch (error) {
      console.error('❌ Gemini API call failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown API error'
      };
    }
  }

  /**
   * Generate UI modification suggestions with enhanced precision
   */
  async modifyExistingUI(originalJSON: string, modificationRequest: string, systemPrompt: string): Promise<GeminiResponse> {
    console.log('🔄 Starting UI modification with Gemini');
    
    // Enhanced prompt for better property preservation
    const prompt = `TASK: Modify the provided JSON structure with absolute precision.

CRITICAL RULES:
1. RETURN ONLY VALID JSON - no explanations, no markdown, no comments
2. PRESERVE ALL UNCHANGED ELEMENTS EXACTLY - every property, every ID, every value
3. ONLY MODIFY what the user specifically requests
4. MAINTAIN EXACT COMPONENT IDs for unchanged elements
5. PRESERVE ALL PROPERTIES for unchanged components

ORIGINAL JSON TO MODIFY:
${originalJSON}

USER'S MODIFICATION REQUEST:
${modificationRequest}

INSTRUCTIONS:
- Start with the original JSON as your base
- Apply ONLY the changes requested by the user
- For unchanged elements: copy componentNodeId, properties, and structure EXACTLY
- For new elements: use appropriate componentNodeId from available design system
- Ensure the final JSON is complete and valid

Return the complete modified JSON structure:`;

    const request: GeminiRequest = {
      prompt,
      systemPrompt,
      temperature: 0.1 // Very low temperature for maximum consistency
    };

    return this.generateJSON(request);
  }

  /**
   * Call API with retry logic
   */
  private async callAPIWithRetry(request: GeminiRequest): Promise<GeminiResponse> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`🔄 Retry attempt ${attempt}/${this.config.maxRetries}`);
          await this.delay(this.config.retryDelay * attempt);
        }
        
        const response = await this.makeAPICall(request);
        response.retryCount = attempt;
        return response;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        const apiError = this.parseAPIError(lastError);
        
        console.error(`❌ API call attempt ${attempt + 1} failed:`, apiError.message);
        
        // If error is not retryable, fail immediately
        if (!apiError.retryable || attempt === this.config.maxRetries) {
          return {
            success: false,
            error: apiError.message,
            retryCount: attempt
          };
        }
      }
    }
    
    return {
      success: false,
      error: lastError?.message || 'Max retries exceeded',
      retryCount: this.config.maxRetries
    };
  }

  /**
   * Make actual API call to Gemini
   */
  private async makeAPICall(request: GeminiRequest): Promise<GeminiResponse> {
    const url = `${GeminiAPI.API_BASE_URL}/${this.config.model}:generateContent?key=${this.config.apiKey}`;
    
    // Combine system prompt with user prompt since Gemini doesn't support system role
    const combinedPrompt = request.systemPrompt 
      ? `${request.systemPrompt}\n\nUser Request: ${request.prompt}${request.context ? `\n\nContext: ${request.context}` : ''}`
      : request.prompt + (request.context ? `\n\nContext: ${request.context}` : '');

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: combinedPrompt }]
        }
      ],
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 4000,
        topK: 40,
        topP: 0.95,
        responseMimeType: "application/json"
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_ONLY_HIGH'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_ONLY_HIGH'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_ONLY_HIGH'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_ONLY_HIGH'
        }
      ]
    };

    console.log('📡 Making API call to Gemini...');

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No candidates returned from API');
      }

      const candidate = data.candidates[0];
      
      if (candidate.finishReason === 'SAFETY') {
        throw new Error('Content was blocked by safety filters');
      }

      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error('No content in API response');
      }

      const content = candidate.content.parts[0].text;
      
      console.log('✅ Gemini API call successful');
      
      return {
        success: true,
        content: content.trim(),
        usage: data.usageMetadata ? {
          promptTokens: data.usageMetadata.promptTokenCount || 0,
          completionTokens: data.usageMetadata.candidatesTokenCount || 0,
          totalTokens: data.usageMetadata.totalTokenCount || 0
        } : undefined
      };
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Parse and categorize API errors
   */
  private parseAPIError(error: Error): APIError {
    const message = error.message.toLowerCase();
    
    // Rate limiting
    if (message.includes('quota') || message.includes('rate limit') || message.includes('429')) {
      return {
        code: 'RATE_LIMIT',
        message: 'Rate limit exceeded. Please try again later.',
        retryable: true
      };
    }
    
    // Authentication
    if (message.includes('401') || message.includes('unauthorized') || message.includes('api key')) {
      return {
        code: 'AUTH_ERROR',
        message: 'Invalid API key or authentication failed.',
        retryable: false
      };
    }
    
    // Network/timeout errors
    if (message.includes('timeout') || message.includes('network') || message.includes('fetch') || 
        message.includes('failed to fetch') || message.includes('networkerror') || 
        message.includes('connection') || message.includes('aborted')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network error or timeout. The Gemini API may be slow - please try again.',
        retryable: true
      };
    }
    
    // Server errors (5xx)
    if (message.includes('500') || message.includes('502') || message.includes('503')) {
      return {
        code: 'SERVER_ERROR',
        message: 'Server error. Please try again later.',
        retryable: true
      };
    }
    
    // Content filtering
    if (message.includes('safety') || message.includes('blocked')) {
      return {
        code: 'CONTENT_FILTERED',
        message: 'Content was blocked by safety filters.',
        retryable: false
      };
    }
    
    // Generic error
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      retryable: true
    };
  }

  /**
   * Validate and extract JSON from response
   */
  private validateAndExtractJSON(content: string): string | null {
    try {
      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      
      const jsonString = jsonMatch[0];
      
      // Validate JSON syntax
      JSON.parse(jsonString);
      
      return jsonString;
    } catch {
      return null;
    }
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update API configuration
   */
  updateConfig(newConfig: Partial<GeminiConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration (without API key for security)
   */
  getConfig(): Omit<GeminiConfig, 'apiKey'> {
    const { apiKey, ...safeConfig } = this.config;
    return safeConfig;
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 Starting API connection test with key:', this.config.apiKey.substring(0, 10) + '...');
      
      const testRequest: GeminiRequest = {
        prompt: 'Say "Hello, API connection successful!" and nothing else.',
        temperature: 0
      };
      
      console.log('📡 Making test API call...');
      const response = await this.makeAPICall(testRequest);
      
      console.log('📋 Test response:', {
        success: response.success,
        content: response.content?.substring(0, 100),
        error: response.error
      });
      
      if (!response.success) {
        console.error('❌ API call failed:', response.error);
        return false;
      }
      
      const isValid = response.content?.includes('Hello, API connection successful!') || false;
      console.log('✅ API test validation result:', isValid);
      
      return response.success && isValid;
    } catch (error) {
      console.error('❌ API test exception:', error);
      return false;
    }
  }

  /**
   * Static method to create instance from stored API key
   */
  static async createFromStorage(): Promise<GeminiAPI | null> {
    try {
      const apiKey = await figma.clientStorage.getAsync('geminiApiKey');
      if (!apiKey) return null;
      
      return new GeminiAPI({ apiKey });
    } catch {
      return null;
    }
  }
}