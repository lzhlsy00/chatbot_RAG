'use client';

import { useState, useEffect } from 'react';
import { Message, ChatHistory } from '@/types/chat';
import Sidebar from './Sidebar';
import ChatContainer from './ChatContainer';

export default function ChatApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>();
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  useEffect(() => {
    const savedHistories = localStorage.getItem('chatHistories');
    if (savedHistories) {
      const histories = JSON.parse(savedHistories).map((h: any) => ({
        ...h,
        createdAt: new Date(h.createdAt),
        updatedAt: new Date(h.updatedAt),
        messages: h.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
      }));
      setChatHistories(histories);
    }
  }, []);

  const saveToLocalStorage = (histories: ChatHistory[]) => {
    localStorage.setItem('chatHistories', JSON.stringify(histories));
  };

  const generateChatTitle = (firstMessage: string): string => {
    return firstMessage.length > 30 
      ? firstMessage.substring(0, 30) + '...'
      : firstMessage;
  };

  const startNewChat = () => {
    // 清理当前会话的异步状态
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsLoading(false);
    
    if (messages.length > 0 && currentChatId) {
      const existingChatIndex = chatHistories.findIndex(h => h.id === currentChatId);
      if (existingChatIndex !== -1) {
        const updatedHistories = [...chatHistories];
        updatedHistories[existingChatIndex] = {
          ...updatedHistories[existingChatIndex],
          messages,
          updatedAt: new Date(),
        };
        setChatHistories(updatedHistories);
        saveToLocalStorage(updatedHistories);
      }
    }

    setMessages([]);
    setCurrentChatId(undefined);
    setConversationId(Date.now().toString());
  };

  const selectChat = (chatId: string) => {
    // 清理当前会话的异步状态
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsLoading(false);
    
    const chat = chatHistories.find(h => h.id === chatId);
    if (chat) {
      setMessages(chat.messages);
      setCurrentChatId(chatId);
      setConversationId(chatId);
    }
  };

  const handleRegenerate = async (messageId: string) => {
    // 找到要重新生成的消息
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;

    const targetMessage = messages[messageIndex];
    
    // 只能重新生成 AI 的消息
    if (targetMessage.role !== 'assistant') return;

    // 找到触发这条 AI 消息的用户消息
    let userMessageIndex = messageIndex - 1;
    while (userMessageIndex >= 0 && messages[userMessageIndex].role !== 'user') {
      userMessageIndex--;
    }
    
    if (userMessageIndex === -1) return;
    
    const userMessage = messages[userMessageIndex];
    
    // 获取重新生成前的历史消息（不包括当前要重新生成的消息及其后面的消息）
    const historyBeforeRegeneration = messages.slice(0, messageIndex);
    
    // 删除要重新生成的消息及其后面的所有消息
    const updatedMessages = messages.slice(0, messageIndex);
    setMessages(updatedMessages);
    setIsLoading(true);

    // 创建新的 AbortController
    const controller = new AbortController();
    setAbortController(controller);

    try {
      // 重新发送请求
      const apiEndpoint = '/api/chat/stream';
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId,
          chatHistory: historyBeforeRegeneration.slice(0, userMessageIndex), // 只包含用户消息之前的历史
        }),
        signal: controller.signal,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to regenerate message');
      }

      const newAssistantMessage: Message = {
        id: Date.now().toString(),
        content: data.message,
        role: 'assistant',
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, newAssistantMessage];
      setMessages(finalMessages);

      // 更新历史记录
      if (currentChatId) {
        const updatedHistories = chatHistories.map(h => 
          h.id === currentChatId 
            ? { ...h, messages: finalMessages, updatedAt: new Date() }
            : h
        );
        setChatHistories(updatedHistories);
        saveToLocalStorage(updatedHistories);
      }
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // 请求被用户取消，不显示错误消息
        console.log('Regenerate request was aborted by user');
      } else {
        console.error('Error regenerating message:', error);
        const errorMessage: Message = {
          id: Date.now().toString(),
          content: '抱歉，重新生成消息时出现错误，请稍后重试。',
          role: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleDelete = (messageId: string) => {
    if (window.confirm('确定要删除这条消息吗？')) {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      // 同步更新历史记录
      if (currentChatId) {
        const updatedHistories = chatHistories.map(h => 
          h.id === currentChatId 
            ? { ...h, messages: messages.filter(msg => msg.id !== messageId), updatedAt: new Date() }
            : h
        );
        setChatHistories(updatedHistories);
        saveToLocalStorage(updatedHistories);
      }
    }
  };

  const deleteChat = (chatId: string) => {
    if (window.confirm('确定要删除这个会话吗？')) {
      const updatedHistories = chatHistories.filter(h => h.id !== chatId);
      setChatHistories(updatedHistories);
      saveToLocalStorage(updatedHistories);
      
      // 如果删除的是当前会话，清空当前消息和状态
      if (chatId === currentChatId) {
        // 清理异步状态
        if (abortController) {
          abortController.abort();
          setAbortController(null);
        }
        setIsLoading(false);
        
        setMessages([]);
        setCurrentChatId(undefined);
        setConversationId(Date.now().toString());
      }
    }
  };

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    // 创建新的 AbortController
    const controller = new AbortController();
    setAbortController(controller);

    // 创建新聊天ID（如果需要）
    let chatIdToUse = currentChatId;
    if (!currentChatId) {
      chatIdToUse = Date.now().toString();
      setCurrentChatId(chatIdToUse);
      setConversationId(chatIdToUse);
    }

    try {
      // 使用流式 API
      const apiEndpoint = '/api/chat/stream';
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          conversationId,
          chatHistory: messages,
        }),
        signal: controller.signal,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to send message');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        role: 'assistant',
        timestamp: new Date(),
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);

      // 更新或创建聊天历史
      if (chatIdToUse) {
        const existingChatIndex = chatHistories.findIndex(h => h.id === chatIdToUse);
        
        if (existingChatIndex === -1) {
          // 创建新的聊天记录
          const newChat: ChatHistory = {
            id: chatIdToUse,
            title: generateChatTitle(content),
            messages: finalMessages,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          const updatedHistories = [newChat, ...chatHistories];
          setChatHistories(updatedHistories);
          saveToLocalStorage(updatedHistories);
        } else {
          // 更新现有聊天记录
          const updatedHistories = chatHistories.map(h => 
            h.id === chatIdToUse 
              ? { ...h, messages: finalMessages, updatedAt: new Date() }
              : h
          );
          setChatHistories(updatedHistories);
          saveToLocalStorage(updatedHistories);
        }
      }
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // 请求被用户取消，不显示错误消息
        console.log('Request was aborted by user');
      } else {
        console.error('Error sending message:', error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: '抱歉，发送消息时出现错误，请稍后重试。',
          role: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar
        chatHistories={chatHistories}
        currentChatId={currentChatId}
        onNewChat={startNewChat}
        onSelectChat={selectChat}
        onDeleteChat={deleteChat}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatContainer
          messages={messages}
          isLoading={isLoading}
          onSendMessage={sendMessage}
          onRegenerate={handleRegenerate}
          onDelete={handleDelete}
          onStopGeneration={stopGeneration}
        />
      </div>
    </div>
  );
}