import { CozeAPI } from '@coze/api';
import { WebSearchClient } from './web-search-client';

interface KnowledgeChunk {
  meta?: {
    link?: {
      title?: string;
      url?: string;
    };
  };
}

interface KnowledgeRecall {
  chunks?: KnowledgeChunk[];
}

export class CozeStreamClient {
  private client: CozeAPI;
  private botId: string;
  private webSearchClient: WebSearchClient;

  constructor(token: string, botId: string) {
    this.client = new CozeAPI({
      token: token,
      baseURL: 'https://api.coze.cn',
    });
    this.botId = botId;
    this.webSearchClient = new WebSearchClient();
  }

  // 检查响应内容是否表示没有找到相关信息
  private isNoRelevantContentFound(content: string): boolean {
    const noContentKeywords = [
      '没有找到',
      '未找到',
      '无相关',
      '没有相关',
      '无法找到',
      '未能找到',
      '暂无',
      '不包含',
      'not found',
      'no relevant',
      'unable to find',
      'no information'
    ];
    
    const lowerContent = content.toLowerCase();
    return noContentKeywords.some(keyword => lowerContent.includes(keyword.toLowerCase()));
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
        // 以下参数可能控制引用显示
        // include_citations: true,
        // show_references: true,
        // include_sources: true,
      });

      let fullContent = '';
      let lastConversationId = conversationId;

      let allMessages: any[] = []; // 收集所有 assistant 消息
      let knowledgeRecall: KnowledgeRecall | null = null; // 收集知识库检索信息
      
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
                console.log('JSON 解析失败:', e instanceof Error ? e.message : String(e));
              }
            }
          }
        } else if (chunk.event === 'done') {
          break;
        }
      }
      
      // 完全清理所有引用和参考来源信息，确保内容区域干净
      let cleanedContent = fullContent
        // 移除所有形式的参考来源段落（最强力清理）
        .replace(/(\*\*)?参考来源[：:：]?\*?\*?[\s\S]*$/gm, '') // 匹配任何参考来源到末尾的内容
        .replace(/^参考来源[：:：]?.*$/gm, '') // 移除单独一行的参考来源
        .replace(/\n\s*参考来源[：:：]?[\s\S]*$/gm, '') // 移除换行后的参考来源及后续内容
        // 移除各种引用格式
        .replace(/\[\d+\]\s*[^\n]*\.(pdf|docx?|txt|md)/gi, '') // 移除 [1] xxx.pdf 等文件引用
        .replace(/\[\d+\]\s*RAG[_\s]*测试[^\n]*/g, '') // 移除 [1] RAG测试_xxx 格式
        .replace(/\[\d+\]\s*section\s*\d+[^\n]*/gi, '') // 移除 [1] section 1 等格式
        .replace(/\[\d+\]\s*[📚🌐][^\n]*/g, '') // 移除 [1] 📚 或 🌐 开头的引用
        .replace(/\[\d+\]\s*<a\s+href[^>]*>.*?<\/a>/gi, '') // 移除 [1] <a>链接</a> 格式
        // 移除URL参数
        .replace(/^\?[^\n]*expires=[^\n]*signature=[^\n]*$/gm, '') // 移除单独一行的URL参数
        .replace(/\)\s*\n\s*\?[^\n]*expires=[^\n]*signature=[^\n]*/g, ')') // 移除跟在)后面的URL参数
        // 清理多余空行
        .replace(/\n\s*\n\s*\n/g, '\n\n') // 清理多余的空行
        .trim();
      
      // 处理引用信息
      let finalMessage = cleanedContent;
      const allSources = new Map(); // 存储所有来源，包括知识库和网络搜索
      let sourceIndex = 1;

      // 检查响应内容是否表示没有找到相关信息
      const noRelevantContent = this.isNoRelevantContentFound(fullContent);
      
      // 添加调试日志
      console.log('Knowledge recall status:', {
        hasKnowledgeRecall: !!knowledgeRecall,
        chunksCount: knowledgeRecall?.chunks?.length || 0,
        noRelevantContent,
        firstChunk: knowledgeRecall?.chunks?.[0]
      });

      // 处理知识库来源 - 只有在真正找到相关内容时才添加
      if (knowledgeRecall && knowledgeRecall.chunks && !noRelevantContent) {
        knowledgeRecall.chunks.forEach((chunk: KnowledgeChunk) => {
          // 从meta字段中提取文档和链接信息
          if (chunk.meta && chunk.meta.link) {
            const linkTitle = chunk.meta.link.title;
            const linkUrl = chunk.meta.link.url;
            
            if (linkTitle && linkUrl) {
              // 清理文件名，去掉各种格式的 RAG 测试前缀
              const cleanTitle = linkTitle
                .replace(/^RAG[_\s]*测试[_\s]*/, '')  // 匹配 "RAG测试_", "RAG_测试_", "RAG 测试 " 等
                .replace(/^rag[_\s]*test[_\s]*/i, '') // 匹配 "rag_test_", "RAG_TEST_" 等（不区分大小写）
                .replace(/^测试[_\s]*/, '')           // 匹配 "测试_" 开头
                .trim();                              // 去除首尾空白
              
              // 调试日志：显示标题清理前后的对比
              if (linkTitle !== cleanTitle) {
                console.log('Title cleaned:', { original: linkTitle, cleaned: cleanTitle });
              }
              
              if (!allSources.has(cleanTitle)) {
                allSources.set(cleanTitle, {
                  url: linkUrl,
                  type: 'knowledge',
                  index: sourceIndex++
                });
              }
            }
          }
        });
      }

      // 判断是否需要网络搜索
      const shouldSearch = this.webSearchClient.shouldPerformWebSearch(knowledgeRecall, query) || noRelevantContent;
      if (shouldSearch) {
        console.log('Performing web search for query:', query);
        try {
          const webResults = await this.webSearchClient.search(query, 3);
          
          // 添加网络搜索结果到来源
          webResults.forEach(result => {
            if (!allSources.has(result.title)) {
              allSources.set(result.title, {
                url: result.url,
                type: 'web',
                index: sourceIndex++
              });
            }
          });

          // 如果有网络搜索结果，在消息中提及
          if (webResults.length > 0 && noRelevantContent) {
            finalMessage += '\n\n*注：知识库中未找到相关内容，已为您提供网络搜索结果作为参考。*';
          } else if (webResults.length > 0) {
            finalMessage += '\n\n*注：为了提供更全面的信息，已补充相关网络搜索结果。*';
          }
        } catch (error) {
          console.error('Web search failed:', error);
        }
      }
      
      // 添加所有来源到消息末尾
      if (allSources.size > 0) {
        let referencesText = '\n\n**参考来源：**\n';
        
        // 按索引排序
        const sortedSources = Array.from(allSources.entries()).sort(
          (a, b) => a[1].index - b[1].index
        );
        
        sortedSources.forEach(([title, source]) => {
          const typeLabel = source.type === 'knowledge' ? '📚' : '🌐';
          referencesText += `[${source.index}] ${typeLabel} <a href="${source.url}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: none;">${title}</a>\n`;
        });
        
        finalMessage += referencesText;
      } else if (noRelevantContent && !shouldSearch) {
        // 如果既没有知识库内容，也不需要网络搜索，说明是基于通用知识回答
        finalMessage += '\n\n*注：以上回答基于通用知识，知识库中暂无相关具体资料。*';
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