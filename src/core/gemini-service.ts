// src/core/gemini-service.ts
// Gemini API service for AIDesigner plugin - handles all AI generation logic

interface GeminiGenerationConfig {
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
}

interface GeminiRequest {
    prompt: string;
    image?: {
        base64: string;
        type: string;
    };
    config?: GeminiGenerationConfig;
}

interface GeminiResponse {
    success: boolean;
    data?: string;
    error?: string;
}

export class GeminiService {
    private static readonly API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    private static readonly DEFAULT_CONFIG: GeminiGenerationConfig = {
        temperature: 0.2,
        maxOutputTokens: 8192,
        responseMimeType: "application/json"
    };

    /**
     * Get API key from storage
     */
    private static async getApiKey(): Promise<string | null> {
        try {
            const apiKey = await figma.clientStorage.getAsync('geminiApiKey');
            return apiKey || null;
        } catch (error) {
            console.error('❌ Failed to get API key:', error);
            return null;
        }
    }

    /**
     * Save API key to storage
     */
    static async saveApiKey(apiKey: string): Promise<boolean> {
        try {
            if (!apiKey || apiKey.trim().length === 0) {
                throw new Error('API key cannot be empty');
            }

            await figma.clientStorage.setAsync('geminiApiKey', apiKey.trim());
            console.log('✅ API key saved successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to save API key:', error);
            return false;
        }
    }

    /**
     * Test connection to Gemini API
     */
    static async testConnection(): Promise<GeminiResponse> {
        try {
            const apiKey = await this.getApiKey();
            if (!apiKey) {
                return {
                    success: false,
                    error: 'No API key found. Please configure your API key first.'
                };
            }

            console.log('🧪 Testing Gemini API connection...');

            const testPrompt = 'Respond with a simple JSON object containing a "status" field with value "ok"';
            const response = await this.callGeminiAPI(apiKey, testPrompt);

            if (response.success) {
                console.log('✅ Gemini API connection test successful');
                return {
                    success: true,
                    data: 'Connection successful'
                };
            } else {
                return {
                    success: false,
                    error: response.error || 'Connection test failed'
                };
            }

        } catch (error) {
            console.error('❌ Connection test failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Generate UI with Gemini API
     */
    static async generateUI(request: GeminiRequest): Promise<GeminiResponse> {
        try {
            const apiKey = await this.getApiKey();
            if (!apiKey) {
                return {
                    success: false,
                    error: 'No API key found. Please configure your API key first.'
                };
            }

            console.log('🤖 Starting UI generation with Gemini...');

            const response = await this.callGeminiAPI(
                apiKey, 
                request.prompt, 
                request.image, 
                request.config
            );

            if (response.success) {
                console.log('✅ UI generation successful');
                return {
                    success: true,
                    data: response.data
                };
            } else {
                console.error('❌ UI generation failed:', response.error);
                return {
                    success: false,
                    error: response.error || 'Generation failed'
                };
            }

        } catch (error) {
            console.error('❌ UI generation error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Core Gemini API calling function
     */
    private static async callGeminiAPI(
        apiKey: string, 
        prompt: string, 
        image?: { base64: string; type: string }, 
        config?: GeminiGenerationConfig
    ): Promise<GeminiResponse> {
        try {
            const generationConfig = { ...this.DEFAULT_CONFIG, ...config };
            
            // Prepare API request parts
            const apiParts: any[] = [{ text: prompt }];
            if (image) {
                apiParts.push({ 
                    inlineData: { 
                        mimeType: image.type, 
                        data: image.base64 
                    } 
                });
            }

            // Make API request
            const response = await fetch(`${this.API_BASE_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: apiParts }],
                    generationConfig: generationConfig
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
                return {
                    success: false,
                    error: errorMessage
                };
            }

            const data = await response.json();
            
            // Validate response structure
            if (!data.candidates || 
                !data.candidates[0] || 
                !data.candidates[0].content || 
                !data.candidates[0].content.parts || 
                !data.candidates[0].content.parts[0] ||
                !data.candidates[0].content.parts[0].text) {
                return {
                    success: false,
                    error: 'Invalid response structure from Gemini API'
                };
            }

            const responseText = data.candidates[0].content.parts[0].text;
            return {
                success: true,
                data: responseText
            };

        } catch (error) {
            console.error('❌ Gemini API call failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Network error'
            };
        }
    }

    /**
     * Clear API key from storage
     */
    static async clearApiKey(): Promise<boolean> {
        try {
            await figma.clientStorage.setAsync('geminiApiKey', null);
            console.log('✅ API key cleared');
            return true;
        } catch (error) {
            console.error('❌ Failed to clear API key:', error);
            return false;
        }
    }

    /**
     * Check if API key exists
     */
    static async hasApiKey(): Promise<boolean> {
        const apiKey = await this.getApiKey();
        return apiKey !== null && apiKey.length > 0;
    }

    /**
     * Get masked API key for display (shows only last 4 characters)
     */
    static async getMaskedApiKey(): Promise<string | null> {
        const apiKey = await this.getApiKey();
        if (!apiKey) return null;
        
        if (apiKey.length <= 4) {
            return '●'.repeat(apiKey.length);
        }
        
        return '●'.repeat(apiKey.length - 4) + apiKey.slice(-4);
    }

    /**
     * Format error message for user display
     */
    static formatErrorMessage(error: string): string {
        // Common error patterns and user-friendly messages
        if (error.includes('API_KEY_INVALID')) {
            return 'Invalid API key. Please check your Gemini API key.';
        }
        if (error.includes('QUOTA_EXCEEDED')) {
            return 'API quota exceeded. Please check your billing or try again later.';
        }
        if (error.includes('RATE_LIMIT_EXCEEDED')) {
            return 'Rate limit exceeded. Please wait a moment and try again.';
        }
        if (error.includes('Network error')) {
            return 'Network connection failed. Please check your internet connection.';
        }
        
        // Return original error for other cases
        return error;
    }
}