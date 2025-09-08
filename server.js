import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = 3001; // Different port from Vite (5173)

// OpenAI API key - MUST be set in environment variable
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY_HERE';

// Middleware
app.use(cors());
app.use(express.json());

// Store the latest webhook data
let latestWebhookData = null;

// Helper function to build procurement chat prompt
function buildProcurementChatPrompt(chatContext) {
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

// Fallback response system
function getFallbackResponse(error, userMessage) {
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

// Enhanced chat endpoint with context awareness
app.post('/api/chat', async (req, res) => {
  console.log('\n💬 Chat request received:', {
    messageLength: req.body.message?.length,
    hasContext: !!req.body.chatContext,
    historyLength: req.body.conversationHistory?.length || 0
  });

  try {
    const { message, chatContext, conversationHistory = [] } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Build comprehensive system prompt
    const systemPrompt = buildProcurementChatPrompt(chatContext);
    
    // Include conversation history for continuity (last 10 messages)
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10),
      { role: 'user', content: message }
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
      const errorText = await response.text();
      console.error('[Chat] OpenAI API error:', response.status, errorText);
      
      const fallbackMessage = getFallbackResponse(new Error(`API Error: ${response.status}`), message);
      
      return res.json({
        success: true,
        message: fallbackMessage,
        type: 'fallback_response'
      });
    }

    const result = await response.json();
    const aiMessage = result.choices[0].message.content;
    
    console.log('[Chat] OpenAI response received:', {
      messageLength: aiMessage.length,
      tokensUsed: result.usage?.total_tokens || 'unknown'
    });
    
    res.json({
      success: true,
      message: aiMessage,
      type: 'ai_response',
      usage: result.usage
    });
    
  } catch (error) {
    console.error('[Chat] Error:', error);
    
    // Fallback responses for different error types
    const fallbackResponse = getFallbackResponse(error, req.body.message || '');
    
    res.json({
      success: true,
      message: fallbackResponse,
      type: 'fallback_response'
    });
  }
});

// Webhook endpoint - Your colleague will POST data here
app.post('/api/webhook', (req, res) => {
  console.log('\n🎯 Received webhook data:', JSON.stringify(req.body, null, 2));
  
  // Store the data
  latestWebhookData = {
    ...req.body,
    timestamp: new Date().toISOString()
  };
  
  console.log('✅ Webhook data stored successfully');
  
  res.json({ 
    success: true, 
    message: 'Webhook data received',
    dataReceived: Object.keys(req.body),
    timestamp: new Date().toISOString()
  });
});

// Endpoint for your frontend to fetch the webhook data
app.get('/api/webhook-data', (req, res) => {
  console.log('📤 Frontend requesting webhook data...');
  
  if (!latestWebhookData) {
    return res.status(404).json({ 
      error: 'No webhook data available',
      message: 'Your colleague needs to send data to /api/webhook first'
    });
  }
  
  console.log('✅ Returning webhook data to frontend');
  res.json(latestWebhookData);
});

// Test endpoint to simulate your colleague's data
app.post('/api/test-webhook', (req, res) => {
  const testData = {
    vendors: [
      {
        "vendor": "Microsoft",
        "category": "Software",
        "annual_spend": 450000,
        "contract_end": "2025-12-31",
        "licenses": 500,
        "segment": "IT"
      },
      {
        "vendor": "Salesforce", 
        "category": "CRM",
        "annual_spend": 185000,
        "contract_end": "2025-03-31",
        "users": 300,
        "segment": "Sales"
      },
      {
        "vendor": "AWS",
        "category": "Cloud",
        "annual_spend": 320000,
        "contract_end": "2024-06-30",
        "segment": "IT"
      }
    ],
    source: "zapier_webhook",
    processed_at: new Date().toISOString()
  };
  
  // Store as if it came from real webhook
  latestWebhookData = testData;
  
  console.log('🧪 Test data stored');
  res.json({ success: true, message: 'Test data created', data: testData });
});

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    server: 'running',
    hasWebhookData: !!latestWebhookData,
    lastUpdate: latestWebhookData?.timestamp || null,
    endpoints: {
      'POST /api/webhook': 'Receive data from your colleague',
      'GET /api/webhook-data': 'Frontend fetches data',
      'POST /api/test-webhook': 'Create test data'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Webhook server running on http://localhost:${PORT}`);
  console.log(`\n📝 Tell your colleague to send data to:`);
  console.log(`   POST http://localhost:${PORT}/api/webhook`);
  console.log(`\n🧪 For testing, you can use:`);
  console.log(`   POST http://localhost:${PORT}/api/test-webhook`);
  console.log(`\n📊 Check status at:`);
  console.log(`   GET http://localhost:${PORT}/api/status`);
  console.log('\n');
});