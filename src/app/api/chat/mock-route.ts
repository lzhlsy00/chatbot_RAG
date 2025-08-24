import { NextRequest, NextResponse } from 'next/server';

// 模拟 API 响应，用于测试界面
export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 生成模拟回复
    const responses = [
      "这是一个模拟回复。请先在 Coze 平台发布你的 Bot 到 'Agent As API' 频道。",
      "我理解你的问题。作为模拟 AI，我会尽力帮助你。",
      "这个功能很有趣！让我为你详细解释一下...",
      "根据我的理解，你想要实现的是...",
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    return NextResponse.json({
      message: `${randomResponse}\n\n[注意：这是模拟响应。要使用真实的 Coze API，请先发布你的 Bot]`,
      conversationId: Date.now().toString()
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Mock API error' },
      { status: 500 }
    );
  }
}