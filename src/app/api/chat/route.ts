import { NextRequest, NextResponse } from 'next/server';
import { CozeClient } from '@/lib/coze-client';

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId, chatHistory } = await request.json();

    const cozeToken = process.env.COZE_API_TOKEN;
    const botId = process.env.COZE_BOT_ID;

    console.log('API Config - Bot ID:', botId);
    console.log('API Config - Token exists:', !!cozeToken);

    if (!cozeToken || !botId) {
      return NextResponse.json(
        { error: 'Missing Coze API configuration' },
        { status: 500 }
      );
    }

    const cozeClient = new CozeClient(cozeToken, botId);
    
    const cozeHistory = chatHistory || [];

    const response = await cozeClient.sendMessage(message, conversationId, cozeHistory);
    
    console.log('Coze API Response:', JSON.stringify(response, null, 2));

    // 官方 SDK 返回的响应格式
    let replyContent = '';
    let responseConversationId = response.conversation_id || conversationId;

    // 查找助手的回复
    if ('messages' in response && response.messages && Array.isArray(response.messages)) {
      const lastMessage = response.messages[response.messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        replyContent = lastMessage.content;
      }
    }
    
    // 如果没有找到，检查是否有错误
    if (!replyContent && 'msg' in response && response.msg) {
      throw new Error(`Coze API Error: ${response.msg}`);
    }
    
    if (!replyContent) {
      console.error('Could not extract reply from response:', response);
      return NextResponse.json(
        { error: 'No valid response from AI' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: replyContent,
      conversationId: responseConversationId
    });

  } catch (error) {
    console.error('Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to process chat message',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}