export interface CozeMessage {
  role: 'user' | 'assistant';
  content: string;
  content_type: 'text';
}

export interface CozeRequest {
  conversation_id: string;
  bot_id: string;
  user: string;
  query: string;
  chat_history: CozeMessage[];
  stream: boolean;
}

export interface CozeResponse {
  messages: Array<{
    role: 'assistant';
    type: 'answer';
    content: string;
    content_type: 'text';
  }>;
  conversation_id: string;
}

export class CozeAPI {
  // 尝试使用 v3 API
  private baseURL = 'https://api.coze.cn/v3/chat';
  private token: string;
  private botId: string;

  constructor(token: string, botId: string) {
    this.token = token;
    this.botId = botId;
  }

  async sendMessage(query: string, conversationId: string, chatHistory: CozeMessage[] = []): Promise<CozeResponse> {
    const requestBody: CozeRequest = {
      conversation_id: conversationId,
      bot_id: this.botId,
      user: 'user',
      query,
      chat_history: chatHistory,
      stream: false
    };

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log('Coze API Raw Response:', responseText);

      if (!response.ok) {
        let errorMessage = `Coze API error: ${response.status} ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.message || errorData.error) {
            errorMessage += ` - ${errorData.message || errorData.error}`;
          }
        } catch (e) {
          // 忽略解析错误
        }
        throw new Error(errorMessage);
      }

      try {
        return JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse Coze API response:', e);
        throw new Error('Invalid JSON response from Coze API');
      }
    } catch (error) {
      console.error('Coze API request failed:', error);
      throw error;
    }
  }
}