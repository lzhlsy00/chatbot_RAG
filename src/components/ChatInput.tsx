'use client';

import { useState } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export default function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <div className="p-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-center bg-white rounded-3xl border-2 border-gray-100 focus-within:border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="向AI助手发送消息"
              className="flex-1 px-6 py-4 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400"
              disabled={isLoading}
            />
            
            {message.trim() ? (
              <button
                type="submit"
                disabled={isLoading}
                className="p-3 m-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 disabled:opacity-50 transition-all duration-200 hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            ) : (
              <div className="p-3 m-2"></div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}