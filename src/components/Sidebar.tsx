'use client';

import { ChatHistory } from '@/types/chat';

interface SidebarProps {
  chatHistories: ChatHistory[];
  currentChatId?: string;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
}

export default function Sidebar({ 
  chatHistories, 
  currentChatId, 
  onNewChat, 
  onSelectChat 
}: SidebarProps) {
  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-screen">
      {/* 新聊天按钮 */}
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl border border-gray-200 hover:bg-white hover:shadow-sm transition-all duration-200 text-gray-700 font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新聊天
        </button>
      </div>

      {/* 聊天历史 */}
      <div className="flex-1 overflow-y-auto px-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          最近聊天
        </h3>
        <div className="space-y-2">
          {chatHistories.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-all duration-200 truncate group ${
                currentChatId === chat.id
                  ? 'bg-white shadow-sm text-gray-900 border border-gray-200'
                  : 'text-gray-600 hover:bg-white hover:shadow-sm hover:text-gray-900'
              }`}
              title={chat.title}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="truncate">{chat.title}</span>
              </div>
            </button>
          ))}
          {chatHistories.length === 0 && (
            <div className="text-center py-8">
              <svg className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-gray-400 text-xs">
                开始新对话
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 底部用户信息 */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
            用
          </div>
          <div>
            <p className="font-medium">用户</p>
            <p className="text-xs text-gray-400">免费版本</p>
          </div>
        </div>
      </div>
    </div>
  );
}