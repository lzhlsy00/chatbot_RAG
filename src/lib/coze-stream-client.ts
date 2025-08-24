import { CozeAPI } from '@coze/api';

export class CozeStreamClient {
  private client: CozeAPI;
  private botId: string;

  constructor(token: string, botId: string) {
    this.client = new CozeAPI({
      token: token,
      baseURL: 'https://api.coze.cn',
    });
    this.botId = botId;
  }

  async sendMessageStream(query: string, conversationId: string, chatHistory: any[] = []) {
    try {
      // 使用流式响应
      const stream = await this.client.chat.stream({
        bot_id: this.botId,
        user_id: 'user',
        additional_messages: [
          ...chatHistory.map(msg => ({
            role: msg.role,
            content: msg.content,
            content_type: 'text' as const
          })),
          {
            role: 'user',
            content: query,
            content_type: 'text' as const
          }
        ],
        auto_save_history: true,
      });

      let fullContent = '';
      let lastConversationId = conversationId;

      // 处理流式响应
      for await (const chunk of stream) {
        if (chunk.event === 'conversation.message.delta') {
          if (chunk.data.role === 'assistant' && chunk.data.content) {
            fullContent += chunk.data.content;
          }
        } else if (chunk.event === 'conversation.message.completed') {
          if (chunk.data.conversation_id) {
            lastConversationId = chunk.data.conversation_id;
          }
        } else if (chunk.event === 'done') {
          break;
        }
      }

      return {
        message: fullContent || '抱歉，我没有理解您的问题。',
        conversation_id: lastConversationId
      };

    } catch (error) {
      console.error('Coze stream error:', error);
      throw error;
    }
  }
}