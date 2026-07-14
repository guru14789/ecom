import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { chatApi } from '../../lib/api';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { MessageCircle, Send, User } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const VendorMessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await chatApi.vendor.list();
        if (res.success) setChats(res.data);
      } catch (err) {
        console.error('Failed to load chats', err);
      }
    };
    fetchChats();
  }, []);

  useEffect(() => {
    if (!activeChatId) return;

    const messagesRef = collection(db, 'chats', activeChatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      
      // Mark as read
      chatApi.vendor.markRead(activeChatId).catch(console.error);
    });

    return () => unsubscribe();
  }, [activeChatId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChatId) return;

    const text = inputText.trim();
    setInputText('');

    try {
      await chatApi.vendor.sendMessage(activeChatId, text);
    } catch (err) {
      toast.error('Failed to send message');
      setInputText(text); // revert
    }
  };

  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-120px)] flex bg-white rounded-[2rem] border shadow-sm overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col bg-gray-50">
        <div className="p-6 border-b bg-white">
          <h2 className="font-black text-blue-950 text-xl tracking-tight">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              No conversations yet.
            </div>
          ) : (
            chats.map(chat => (
              <div
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`p-4 border-b cursor-pointer transition-colors flex items-center gap-3 ${
                  activeChatId === chat.id ? 'bg-orange-500/5 border-l-4 border-l-orange-500' : 'hover:bg-gray-100 border-l-4 border-l-transparent'
                }`}
              >
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 border shadow-sm">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm text-gray-900 truncate pr-2">{chat.buyerName}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
                </div>
                {chat.unreadCountVendor > 0 && (
                  <span className="w-5 h-5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                    {chat.unreadCountVendor}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {activeChat ? (
          <>
            <div className="p-4 border-b flex items-center gap-3 bg-white">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border">
                <User className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{activeChat.buyerName}</h3>
                <span className="text-xs text-gray-500">Customer</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
              {messages.map((msg, i) => {
                const isMine = msg.senderRole === 'vendor';
                return (
                  <div key={msg.id || i} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    <div 
                      className={`max-w-[70%] px-5 py-2.5 rounded-2xl text-sm ${
                        isMine 
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-br-sm shadow-sm' 
                          : 'bg-white border text-gray-800 rounded-bl-sm shadow-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t bg-white flex gap-3">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 bg-gray-100 border-transparent focus:bg-white rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 transition-all shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95"
              >
                <Send className="w-5 h-5 ml-1" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
            <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium text-gray-500">Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};
