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
        // 尝试添加可能的参数来获取引用信息
        stream: true,
        include_usage: true,
        // 以下参数可能控制引用显示
        // include_citations: true,
        // show_references: true,
        // include_sources: true,
      });

      let fullContent = '';
      let lastConversationId = conversationId;

      let allMessages = []; // 收集所有 assistant 消息
      let knowledgeRecall = null; // 收集知识库检索信息
      
      // 处理流式响应
      for await (const chunk of stream) {
        if (chunk.event === 'conversation.message.delta') {
          if (chunk.data.role === 'assistant') {
            // 只收集 answer 类型的内容
            if (chunk.data.type === 'answer' && chunk.data.content) {
              fullContent += chunk.data.content;
            }
          }
        } else if (chunk.event === 'conversation.message.completed') {
          if (chunk.data.conversation_id) {
            lastConversationId = chunk.data.conversation_id;
          }
          
          // 如果是 assistant 消息，记录完整消息
          if (chunk.data.role === 'assistant') {
            allMessages.push(chunk.data);
            
            // 检查是否是知识库检索消息
            if (chunk.data.type === 'verbose' && chunk.data.content) {
              try {
                const parsed = JSON.parse(chunk.data.content);
                if (parsed.msg_type === 'knowledge_recall') {
                  knowledgeRecall = JSON.parse(parsed.data);
                }
              } catch (e) {
                console.log('JSON 解析失败:', e.message);
              }
            }
          }
        } else if (chunk.event === 'done') {
          break;
        }
      }
      
      // 先过滤掉内容中的 [来源:...] 格式信息
      let cleanedContent = fullContent.replace(/\[来源[：:][^\]]+\]/g, '');
      // 清理多余的空行
      cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
      
      // 处理引用信息
      let finalMessage = cleanedContent;
      if (knowledgeRecall && knowledgeRecall.chunks) {
        // 去重文档名称
        const uniqueFiles = new Map();
        
        knowledgeRecall.chunks.forEach((chunk) => {
          // 从meta字段中提取文档和链接信息
          if (chunk.meta && chunk.meta.link) {
            const linkTitle = chunk.meta.link.title;
            const linkUrl = chunk.meta.link.url;
            
            if (linkTitle && linkUrl) {
              // 清理文件名，去掉 "RAG测试_" 前缀
              const cleanTitle = linkTitle.replace(/^RAG测试_/, '');
              
              if (!uniqueFiles.has(cleanTitle)) {
                uniqueFiles.set(cleanTitle, linkUrl);
              }
            }
          }
        });
        
        // 如果有引用，添加到消息末尾（使用HTML格式的链接）
        if (uniqueFiles.size > 0) {
          let referencesText = '\n\n';
          let index = 1;
          uniqueFiles.forEach((url, title) => {
            referencesText += `[${index}] <a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: none;">${title}</a>\n`;
            index++;
          });
          finalMessage += referencesText;
        }
      }

      return {
        message: finalMessage,
        conversation_id: lastConversationId
      };

    } catch (error) {
      console.error('Coze stream error:', error);
      throw error;
    }
  }
}