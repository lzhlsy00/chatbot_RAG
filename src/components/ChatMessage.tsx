import { Message } from '@/types/chat';
import { useState } from 'react';
import MathText from './MathText';

interface ChatMessageProps {
  message: Message;
  onRegenerate?: () => void;
  onDelete?: () => void;
  generationTime?: number;
}

export default function ChatMessage({ message, onRegenerate, onDelete, generationTime }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };
  
  return (
    <div className={`group px-6 py-2 ${isUser ? 'bg-gray-50/50' : 'bg-white'} hover:bg-opacity-80 transition-colors duration-200`}>
      <div className="max-w-4xl mx-auto flex gap-6">
        {/* 头像 */}
        <div className="flex-shrink-0">
          {isUser ? (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-semibold shadow-lg">
              用户
            </div>
          ) : (
            <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center text-gray-600 text-sm font-semibold shadow-lg">
              AI
            </div>
          )}
        </div>
        
        {/* 消息内容 */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-100 rounded-2xl px-4 py-3 inline-block max-w-full">
            <MathText>{message.content}</MathText>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex items-center gap-3 mt-2">
            {/* 重新生成按钮 - 只对AI消息显示 */}
            {!isUser && onRegenerate && (
              <button 
                onClick={onRegenerate}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                title="重新生成"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            
            {/* 删除按钮 */}
            {onDelete && (
              <button 
                onClick={onDelete}
                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 transition-colors"
                title="删除消息"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            
            {/* 复制按钮 */}
            <button 
              onClick={handleCopy}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="复制消息"
            >
              {copied ? (
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
            
            {/* 生成用时 - 只对AI消息显示 */}
            {!isUser && generationTime && (
              <span className="text-xs text-gray-400">
                {generationTime < 1000 ? `${generationTime}ms` : `${(generationTime / 1000).toFixed(1)}s`}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}