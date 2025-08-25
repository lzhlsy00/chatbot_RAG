import { NextRequest, NextResponse } from 'next/server';
import { CozeStreamClient } from '@/lib/coze-stream-client';

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId, chatHistory } = await request.json();

    const cozeToken = process.env.COZE_API_TOKEN;
    const botId = process.env.COZE_BOT_ID;

    console.log('Stream API - Bot ID:', botId);

    if (!cozeToken || !botId || cozeToken === 'test_token') {
      // 返回模拟响应用于测试停止功能
      console.log('Using mock response for testing');
      
      // 检查请求是否被取消
      const checkAborted = () => {
        if (request.signal?.aborted) {
          throw new Error('Request aborted');
        }
      };

      // 模拟较长的处理时间，分段检查是否取消
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        checkAborted();
      }

      const responses = [
        "这是一个模拟回复。我已经成功处理了你的请求。",
        "很有趣的问题！让我详细为你解答...",
        "根据我的分析，这个功能的实现需要考虑以下几个方面：\n\n1. 用户体验\n2. 性能优化\n3. 错误处理",
        "我理解你的需求。停止功能已经成功实现了！",
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      return NextResponse.json({
        message: `${randomResponse}\n\n[注意：这是模拟响应，用于测试停止功能]`,
        conversationId: conversationId || Date.now().toString()
      });
    }

    const cozeClient = new CozeStreamClient(cozeToken, botId);
    const result = await cozeClient.sendMessageStream(message, conversationId, chatHistory || []);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Stream API error:', error);
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