import { NextRequest, NextResponse } from 'next/server';
import { CozeStreamClient } from '@/lib/coze-stream-client';

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId, chatHistory } = await request.json();

    const cozeToken = process.env.COZE_API_TOKEN;
    const botId = process.env.COZE_BOT_ID;

    console.log('Stream API - Bot ID:', botId);

    if (!cozeToken || !botId) {
      return NextResponse.json(
        { error: 'Missing Coze API configuration' },
        { status: 500 }
      );
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