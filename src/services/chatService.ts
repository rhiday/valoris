import type { ChatContext, ChatMessage } from './conversationData';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

// Helper function to build procurement chat prompt (ported from backend)
function buildProcurementChatPrompt(chatContext: ChatContext): string {
  // Safely extract context data with defaults
  const currentFile = chatContext?.currentFile;
  const totalSpend = chatContext?.totalSpend || 0;
  const totalSavings = chatContext?.totalSavings || 0;
  const topCategories = chatContext?.topCategories || [];
  const topVendors = chatContext?.topVendors || [];
  const analysisResults = currentFile?.analysisResults || [];

  return `You are Valoris AI, an expert procurement optimization assistant with deep knowledge of vendor management, contract negotiation, and cost optimization strategies.

CURRENT ANALYSIS CONTEXT:
${currentFile ? `
- File: ${currentFile.fileName || 'Unknown'}
- Analyzed: ${analysisResults.length} vendors
- Total Annual Spend: €${(totalSpend || 0).toLocaleString()}
- Potential Savings: €${(totalSavings || 0).toLocaleString()}
- Top Categories: ${topCategories.length > 0 ? topCategories.join(', ') : 'None'}

VENDOR DETAILS:
${JSON.stringify(analysisResults.slice(0, 10), null, 2)}

TOP VENDORS BY SPEND:
${topVendors.length > 0 ? topVendors.slice(0, 5).map(v => `- ${v.name || 'Unknown'}: €${(v.spend || 0).toLocaleString()} (${v.category || 'Unknown'})`).join('\n') : 'No vendor data available'}
` : 'No analysis data currently loaded. Ask user to upload procurement data first.'}

CAPABILITIES:
- Analyze vendor spend patterns and identify optimization opportunities
- Compare vendor alternatives with pricing and migration feasibility
- Calculate ROI for procurement changes
- Provide contract negotiation strategies
- Identify consolidation opportunities
- Assess vendor risk and performance

CONVERSATION STYLE:
- Professional but conversational tone
- Provide specific numbers and actionable insights
- Ask clarifying questions when needed
- Offer multiple options when relevant
- Reference specific vendors and amounts from the analysis
- Suggest next steps and follow-up actions

RESPONSE FORMAT:
- Use bullet points for lists
- Include specific euro amounts and percentages
- Mention vendor names and categories explicitly
- Provide confidence levels for recommendations
- Suggest timeframes for implementation

Answer user questions about their procurement data, provide optimization recommendations, and help them understand their vendor landscape.`;
}

// Fallback response system (ported from backend)
function getFallbackResponse(_error: any, userMessage: string): string {
  const fallbacks = [
    "I'm having trouble accessing the analysis right now. Could you try rephrasing your question?",
    "Let me help you with that. Can you be more specific about which vendor or category you're interested in?",
    "I notice there might be an issue with the data connection. In the meantime, I can help you understand general procurement optimization strategies.",
    "I'm experiencing a temporary issue. Would you like me to explain how Valoris analyzes your procurement data instead?"
  ];
  
  // Simple keyword matching for better fallbacks
  if (userMessage.toLowerCase().includes('savings')) {
    return "I can help you identify savings opportunities once the analysis data is loaded. Try uploading your procurement file first.";
  }
  
  if (userMessage.toLowerCase().includes('vendor')) {
    return "I'd be happy to discuss vendor optimization strategies. Which specific vendor or category are you most concerned about?";
  }
  
  if (userMessage.toLowerCase().includes('alternative')) {
    return "I can suggest vendor alternatives based on your current analysis data. Which vendor would you like me to find alternatives for?";
  }
  
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

// Main chat service function (ported from backend)
export async function sendChatMessage(
  message: string,
  chatContext: ChatContext,
  conversationHistory: ChatMessage[] = []
): Promise<{ success: boolean; response?: string; error?: string }> {
  console.log('\n💬 Chat request (frontend):', {
    messageLength: message?.length,
    hasContext: !!chatContext,
    historyLength: conversationHistory?.length || 0
  });

  try {
    if (!message || typeof message !== 'string') {
      return {
        success: false,
        error: 'Message is required'
      };
    }

    if (!OPENAI_API_KEY) {
      console.warn('[Chat] No OpenAI API key found');
      return {
        success: true,
        response: getFallbackResponse(new Error('No API key'), message)
      };
    }

    // Build comprehensive system prompt
    const systemPrompt = buildProcurementChatPrompt(chatContext);
    
    // Include conversation history for continuity (last 10 messages)
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user' as const, content: message }
    ];

    console.log('[Chat] Sending to OpenAI:', {
      messagesCount: messages.length,
      systemPromptLength: systemPrompt.length,
      userMessage: message.substring(0, 100) + (message.length > 100 ? '...' : '')
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 800,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[Chat] OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      return {
        success: true,
        response: getFallbackResponse(new Error(`API Error: ${response.status}`), message)
      };
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('[Chat] Invalid response structure:', data);
      return {
        success: true,
        response: getFallbackResponse(new Error('Invalid response'), message)
      };
    }

    const assistantResponse = data.choices[0].message.content.trim();
    
    console.log('[Chat] ✅ Success:', {
      responseLength: assistantResponse.length,
      usage: data.usage
    });

    return {
      success: true,
      response: assistantResponse
    };

  } catch (error) {
    console.error('[Chat] Error:', error);
    
    return {
      success: true,
      response: getFallbackResponse(error, message)
    };
  }
}