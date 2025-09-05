import type { SpendAnalysis, SummaryMetrics } from '../types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: {
    fileId?: string;
    vendorMentioned?: string[];
    savingsCalculated?: number;
  };
}

export interface ConversationData {
  fileId: string;
  fileName: string;
  uploadTimestamp: Date;
  rawData: any[];
  normalizedData: any[];
  analysisResults: SpendAnalysis[];
  summaryMetrics: SummaryMetrics;
  conversationHistory: ChatMessage[];
}

export interface ChatContext {
  currentFile?: ConversationData;
  availableFiles: ConversationData[];
  totalVendors: number;
  totalSpend: number;
  totalSavings: number;
  topCategories: string[];
  topVendors: Array<{ name: string; spend: number; category: string }>;
}

export class ConversationDataManager {
  private conversations: Map<string, ConversationData> = new Map();
  private currentFileId: string | null = null;

  /**
   * Store complete analysis results for chat access
   */
  storeAnalysis(
    fileId: string, 
    fileName: string, 
    rawData: any[], 
    analysisResults: SpendAnalysis[], 
    summaryMetrics: SummaryMetrics
  ): void {
    console.log('[ConversationData] Storing analysis for:', fileName);
    
    const conversationData: ConversationData = {
      fileId,
      fileName,
      uploadTimestamp: new Date(),
      rawData,
      normalizedData: [], // Will be populated from Stage 1 if needed
      analysisResults,
      summaryMetrics,
      conversationHistory: []
    };

    this.conversations.set(fileId, conversationData);
    this.currentFileId = fileId;
    
    console.log('[ConversationData] Stored:', {
      fileId,
      vendors: analysisResults.length,
      totalSpend: summaryMetrics.pastSpend,
      potentialSavings: summaryMetrics.potentialSavings
    });
  }

  /**
   * Build comprehensive context for AI chat
   */
  getChatContext(fileId?: string): ChatContext {
    const targetFileId = fileId || this.currentFileId;
    const currentFile = targetFileId ? this.conversations.get(targetFileId) : undefined;
    const availableFiles = Array.from(this.conversations.values());

    // Calculate aggregate metrics
    const totalVendors = availableFiles.reduce((sum, file) => sum + file.analysisResults.length, 0);
    const totalSpend = availableFiles.reduce((sum, file) => sum + file.summaryMetrics.pastSpend, 0);
    const totalSavings = availableFiles.reduce((sum, file) => 
      sum + ((file.summaryMetrics.potentialSavings.min + file.summaryMetrics.potentialSavings.max) / 2), 0
    );

    // Get top categories across all files
    const categorySpendMap = new Map<string, number>();
    const vendorSpendArray: Array<{ name: string; spend: number; category: string }> = [];

    availableFiles.forEach(file => {
      file.analysisResults.forEach(analysis => {
        // Aggregate category spend
        const currentCategorySpend = categorySpendMap.get(analysis.category) || 0;
        categorySpendMap.set(analysis.category, currentCategorySpend + analysis.pastSpend);
        
        // Collect vendor info
        vendorSpendArray.push({
          name: analysis.vendor,
          spend: analysis.pastSpend,
          category: analysis.category
        });
      });
    });

    // Sort categories by spend
    const topCategories = Array.from(categorySpendMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category]) => category);

    // Sort vendors by spend
    const topVendors = vendorSpendArray
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 10);

    const context: ChatContext = {
      currentFile,
      availableFiles,
      totalVendors,
      totalSpend,
      totalSavings,
      topCategories,
      topVendors
    };

    console.log('[ConversationData] Built chat context:', {
      currentFileId: targetFileId,
      totalFiles: availableFiles.length,
      totalVendors,
      totalSpend: `€${totalSpend.toLocaleString()}`,
      totalSavings: `€${totalSavings.toLocaleString()}`,
      topCategories: topCategories.slice(0, 3)
    });

    return context;
  }

  /**
   * Add chat message to conversation history
   */
  addChatMessage(fileId: string, message: ChatMessage): void {
    const conversation = this.conversations.get(fileId);
    if (conversation) {
      conversation.conversationHistory.push(message);
      console.log('[ConversationData] Added message:', {
        fileId,
        role: message.role,
        contentLength: message.content.length,
        totalMessages: conversation.conversationHistory.length
      });
    } else {
      console.warn('[ConversationData] Conversation not found for fileId:', fileId);
    }
  }

  /**
   * Get conversation history for a specific file
   */
  getConversationHistory(fileId: string): ChatMessage[] {
    const conversation = this.conversations.get(fileId);
    return conversation?.conversationHistory || [];
  }

  /**
   * Get all available files
   */
  getAvailableFiles(): ConversationData[] {
    return Array.from(this.conversations.values());
  }

  /**
   * Switch current file context
   */
  setCurrentFile(fileId: string): boolean {
    if (this.conversations.has(fileId)) {
      this.currentFileId = fileId;
      console.log('[ConversationData] Switched to file:', fileId);
      return true;
    }
    console.warn('[ConversationData] File not found:', fileId);
    return false;
  }

  /**
   * Get current file data
   */
  getCurrentFile(): ConversationData | undefined {
    return this.currentFileId ? this.conversations.get(this.currentFileId) : undefined;
  }

  /**
   * Clear all conversation data
   */
  clear(): void {
    this.conversations.clear();
    this.currentFileId = null;
    console.log('[ConversationData] Cleared all data');
  }

  /**
   * Export conversation data for analysis
   */
  exportConversation(fileId: string): string {
    const conversation = this.conversations.get(fileId);
    if (!conversation) return '';

    const exportData = {
      fileName: conversation.fileName,
      analysisDate: conversation.uploadTimestamp,
      vendorCount: conversation.analysisResults.length,
      totalSpend: conversation.summaryMetrics.pastSpend,
      potentialSavings: conversation.summaryMetrics.potentialSavings,
      conversationHistory: conversation.conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }
}

/**
 * Generate unique file ID
 */
export function generateFileId(fileName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const sanitized = fileName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return `${sanitized}_${timestamp}_${random}`;
}

/**
 * Generate unique message ID
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// Singleton instance for global use
export const conversationDataManager = new ConversationDataManager();