import { CozeAPI } from '@coze/api';

export class CozeClient {
  private client: CozeAPI;
  private botId: string;

  constructor(token: string, botId: string) {
    this.client = new CozeAPI({
      token: token,
      baseURL: 'https://api.coze.cn', // 使用中国区域
    });
    this.botId = botId;
  }

  async sendMessage(query: string, conversationId: string, chatHistory: any[] = []) {
    try {
      // 创建聊天
      const chatResult = await this.client.chat.create({
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

      console.log('Chat created:', chatResult);

      // 如果状态是 in_progress，需要轮询获取结果
      if (chatResult.status === 'in_progress') {
        let attempts = 0;
        const maxAttempts = 30; // 最多等待30秒
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
          
          // 获取聊天详情
          const detail = await this.client.chat.retrieve(
            chatResult.conversation_id,
            chatResult.id
          );
          
          console.log(`Polling attempt ${attempts + 1}:`, detail);
          
          if (detail.status === 'completed') {
            // 获取消息列表
            const messages = await this.client.chat.messages.list(
              chatResult.conversation_id,
              chatResult.id
            );
            
            return {
              ...detail,
              messages: messages || []
            };
          } else if (detail.status === 'failed') {
            throw new Error(`Chat failed: ${detail.last_error?.msg || 'Unknown error'}`);
          }
          
          attempts++;
        }
        
        throw new Error('Chat timeout - no response received within 30 seconds');
      }

      return chatResult;
    } catch (error) {
      console.error('Coze chat error:', error);
      throw error;
    }
  }
}