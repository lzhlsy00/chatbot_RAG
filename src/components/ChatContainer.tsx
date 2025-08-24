'use client';

import { useState, useEffect, useRef } from 'react';
import { Message, ChatHistory } from '@/types/chat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  onRegenerate?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
}

export default function ChatContainer({ messages, isLoading, onSendMessage, onRegenerate, onDelete }: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full px-6">
            <div className="text-center max-w-md">
              <div className="text-gray-400 text-lg font-medium mx-auto mb-6">
                AI助手
              </div>
              <h2 className="text-3xl font-semibold text-gray-800 mb-3">
                在时刻准备着。
              </h2>
              <p className="text-gray-500 text-base leading-relaxed">
                我是您的AI助手，随时为您解答问题、提供帮助或进行有趣的对话。
              </p>
              <div className="mt-8 grid grid-cols-1 gap-3">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer">
                  <p className="text-sm text-gray-600">💡 解释复杂概念</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer">
                  <p className="text-sm text-gray-600">✍️ 协助写作和编辑</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer">
                  <p className="text-sm text-gray-600">🔍 分析和研究</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message}
                onRegenerate={onRegenerate ? () => onRegenerate(message.id) : undefined}
                onDelete={onDelete ? () => onDelete(message.id) : undefined}
                generationTime={message.role === 'assistant' ? Math.floor(Math.random() * 2000 + 500) : undefined}
              />
            ))}
            {isLoading && (
              <div className="px-6 py-2 bg-white">
                <div className="max-w-4xl mx-auto flex gap-6">
                  <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center text-gray-600 text-sm font-semibold shadow-lg">
                    AI
                  </div>
                  <div className="flex-1 flex items-center">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="ml-3 text-gray-500 text-sm">AI正在思考...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
    </div>
  );
}