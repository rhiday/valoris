import type { ChatContext, ChatMessage } from './conversationData';

// Simple keyword-based chat service - provides helpful responses for procurement questions
export async function sendChatMessage(
  message: string,
  chatContext: ChatContext,
  conversationHistory: ChatMessage[] = []
): Promise<{ success: boolean; response?: string; error?: string }> {
  console.log('💬 Chat request (fallback):', {
    messageLength: message?.length,
    hasContext: !!chatContext,
    historyLength: conversationHistory?.length || 0
  });

  if (!message || typeof message !== 'string') {
    return {
      success: false,
      error: 'Message is required'
    };
  }

  // Simple keyword-based responses
  const lowerMessage = message.toLowerCase();
  
  let response = '';
  
  if (lowerMessage.includes('savings') || lowerMessage.includes('save')) {
    response = "I can help you identify savings opportunities! Based on typical procurement analysis, you can expect to find 5-15% savings through vendor negotiation, contract optimization, and alternative sourcing. What specific category would you like to focus on?";
  } else if (lowerMessage.includes('vendor') || lowerMessage.includes('supplier')) {
    response = "I'd be happy to discuss vendor optimization strategies. Common approaches include consolidating vendors, renegotiating contracts, and exploring alternatives. Which vendors in your analysis are you most interested in optimizing?";
  } else if (lowerMessage.includes('alternative') || lowerMessage.includes('competitor')) {
    response = "Finding vendor alternatives is a great way to reduce costs and improve service. I can suggest researching industry reports, peer networks, and procurement platforms to identify viable alternatives. What type of service or product are you looking to replace?";
  } else if (lowerMessage.includes('contract') || lowerMessage.includes('negotiate')) {
    response = "Contract negotiation is key to procurement savings. Focus on terms like volume discounts, payment schedules, service level agreements, and renewal clauses. Would you like specific negotiation strategies for any particular vendor?";
  } else if (lowerMessage.includes('roi') || lowerMessage.includes('return')) {
    response = "ROI in procurement typically ranges from 5-15x investment. The key is measuring cost savings, risk reduction, and operational efficiency gains. Are you looking to calculate ROI for a specific initiative?";
  } else {
    const fallbacks = [
      "I'm here to help with procurement analysis and optimization. What specific aspect of your vendor spending would you like to explore?",
      "Great question! I can provide procurement guidance and insights. What would you like to know about your vendor analysis?",
      "I'd be happy to help! Can you tell me more about which vendors or categories you're most interested in optimizing?",
      "That's an interesting question about procurement. I can offer insights based on your analysis. What's your main concern?"
    ];
    response = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  // Add context if available
  if (chatContext?.currentFile?.analysisResults && chatContext.currentFile.analysisResults.length > 0) {
    const totalVendors = chatContext.currentFile.analysisResults.length;
    const totalSpend = chatContext.totalSpend || 0;
    response += `\n\n📊 Context: You have ${totalVendors} vendors analyzed with €${totalSpend.toLocaleString()} total spend.`;
  }

  return {
    success: true,
    response
  };
}