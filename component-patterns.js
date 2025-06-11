// component-patterns.js
// Universal UI Pattern Intelligence for AIDesigner

const COMPONENT_PATTERNS = {
    settings: {
        // Pattern Recognition
        triggers: {
            primary: ['settings', 'preferences', 'account', 'options', 'configure'],
            secondary: ['change', 'manage', 'personal', 'business', 'language', 'notifications', 'privacy'],
            context: ['screen', 'page', 'menu', 'list']
        },
        
        // Universal Content Intelligence
        contentRules: {
            structure: {
                layout: 'Vertical stack of settings options',
                spacing: 'Consistent spacing between items', 
                grouping: 'Group related settings when logical'
            },
            
            elements: {
                leading: 'Contextual icons for easy recognition (globe for language, bell for notifications)',
                title: 'Clear setting name (Change language, Notifications, Personal info)',
                trailing: {
                    currentValue: {
                        when: 'Setting has current state user needs to see quickly (language, phone, email)',
                        action: 'Show current value',
                        examples: ['English', '07062255305', 'john@email.com']
                    },
                    actionHint: {
                        when: 'Setting leads to premium/paid feature needing promotion',
                        action: 'Show action hint',
                        examples: ['Get it', 'Upgrade', 'Learn more', 'What is it?']
                    },
                    simpleNavigation: {
                        when: 'Setting is simple navigation to sub-screen',
                        action: 'No trailing text (just navigation indicator)',
                        examples: ['Personal info', 'Business info']
                    }
                }
            }
        },
        
        // Implementation Templates (Design System Agnostic)
        templates: {
            currentValue: {
                description: 'Setting that shows current state',
                json: {
                    type: 'list-item',
                    componentNodeId: 'ACTUAL_LIST_ITEM_ID',
                    properties: {
                        text: 'Change language',
                        'trailing-text': 'English',
                        horizontalSizing: 'FILL'
                    }
                }
            },
            
            actionHint: {
                description: 'Setting that promotes premium feature',
                json: {
                    type: 'list-item',
                    componentNodeId: 'ACTUAL_LIST_ITEM_ID',
                    properties: {
                        text: 'Premium features', 
                        'trailing-text': 'Get it',
                        horizontalSizing: 'FILL'
                    }
                }
            },
            
            simpleNavigation: {
                description: 'Basic navigation setting',
                json: {
                    type: 'list-item',
                    componentNodeId: 'ACTUAL_LIST_ITEM_ID',
                    properties: {
                        text: 'Personal info',
                        horizontalSizing: 'FILL'
                    }
                }
            }
        },
        
        // LLM Training Examples
        examples: [
            {
                userRequest: 'create a settings screen with language and notification preferences',
                expectedReasoning: [
                    'Recognize "settings screen" → use settings pattern',
                    '"language" → needs current value display', 
                    '"notification preferences" → likely needs current state',
                    'Structure as vertical list of settings items',
                    'Use trailing text for current values where helpful'
                ],
                expectedStructure: 'Vertical list with language showing current value, notifications showing state'
            }
        ]
    }
    
    // Future patterns will be added here:
    // orders: { ... },
    // chat: { ... },
    // dashboard: { ... }
};

// Pattern Detection Engine
class PatternDetector {
    static detect(userRequest) {
        const request = userRequest.toLowerCase();
        const detectedPatterns = [];
        
        for (const [patternName, pattern] of Object.entries(COMPONENT_PATTERNS)) {
            const allKeywords = [
                ...pattern.triggers.primary,
                ...pattern.triggers.secondary,
                ...pattern.triggers.context
            ];
            
            const matches = allKeywords.filter(keyword => request.includes(keyword));
            
            if (matches.length > 0) {
                detectedPatterns.push({
                    name: patternName,
                    confidence: matches.length / allKeywords.length,
                    matches: matches,
                    data: pattern
                });
            }
        }
        
        return detectedPatterns.sort((a, b) => b.confidence - a.confidence);
    }
    
    static generateGuidance(patterns, userRequest) {
        if (patterns.length === 0) return '';
        
        const topPattern = patterns[0];
        const pattern = topPattern.data;
        
        let guidance = `\n// 🎯 ${topPattern.name.toUpperCase()} PATTERN DETECTED (${Math.round(topPattern.confidence * 100)}% confidence)\n`;
        guidance += `// Matched keywords: ${topPattern.matches.join(', ')}\n\n`;
        
        // Add content rules
        guidance += `// CONTENT STRUCTURE:\n`;
        guidance += `// Layout: ${pattern.contentRules.structure.layout}\n`;
        guidance += `// Leading: ${pattern.contentRules.elements.leading}\n`;
        guidance += `// Title: ${pattern.contentRules.elements.title}\n\n`;
        
        // Add trailing text logic
        guidance += `// TRAILING TEXT LOGIC:\n`;
        Object.entries(pattern.contentRules.elements.trailing).forEach(([type, rule]) => {
            guidance += `// - ${type}: ${rule.when} → ${rule.action}\n`;
            if (rule.examples) {
                guidance += `//   Examples: ${rule.examples.join(', ')}\n`;
            }
        });
        
        // Add template example
        guidance += `\n// TEMPLATE EXAMPLE:\n`;
        guidance += `// ${JSON.stringify(pattern.templates.currentValue.json, null, 2).replace(/\n/g, '\n// ')}\n`;
        
        return guidance;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { COMPONENT_PATTERNS, PatternDetector };
}

if (typeof window !== 'undefined') {
    window.COMPONENT_PATTERNS = COMPONENT_PATTERNS;
    window.PatternDetector = PatternDetector;
}