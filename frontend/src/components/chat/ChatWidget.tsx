import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Store, Bot } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { chatApi } from '../../lib/api';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

export const ChatWidget: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Bot State
  const [botMessages, setBotMessages] = useState<any[]>([
    {
      id: 'welcome',
      text: 'Hi there! I am the shopyng Assistant. How can I help you today?',
      senderRole: 'vendor',
      createdAt: new Date().toISOString()
    }
  ]);
  const [isBotTyping, setIsBotTyping] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'buyer') return;
    
    const fetchChats = async () => {
      try {
        const res = await chatApi.buyer.list();
        if (res.success) setChats(res.data);
      } catch (err) {
        console.error('Failed to load chats', err);
      }
    };

    if (isOpen && !activeChatId) {
      fetchChats();
    }
  }, [isOpen, activeChatId, user]);

  useEffect(() => {
    const handler = (e: any) => {
      setIsOpen(true);
      if (e.detail?.chatId) {
        setActiveChatId(e.detail.chatId);
      }
    };
    window.addEventListener('open-chat', handler);
    return () => window.removeEventListener('open-chat', handler);
  }, []);

  useEffect(() => {
    if (!activeChatId || activeChatId === 'bot') return;

    const messagesRef = collection(db, 'chats', activeChatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      
      // Mark as read
      chatApi.buyer.markRead(activeChatId).catch(console.error);
    }, (error) => {
      console.error("Messages subscription error:", error);
    });

    return () => unsubscribe();
  }, [activeChatId]);

  useEffect(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [messages, botMessages, isBotTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChatId) return;

    const text = inputText.trim();
    setInputText('');

    if (activeChatId === 'bot') {
      const userMsg = { id: Date.now().toString(), text, senderRole: 'buyer', createdAt: new Date().toISOString() };
      setBotMessages(prev => [...prev, userMsg]);
      setIsBotTyping(true);

      setTimeout(() => {
        setIsBotTyping(false);
        const lowerText = text.toLowerCase();
        let reply = "I'm sorry, I didn't quite catch that. Could you please rephrase?";
        
        if (lowerText.includes('order') || lowerText.includes('track')) {
          reply = "You can track your order status in the 'Orders' section of your profile. Is there a specific order ID you're asking about?";
        } else if (lowerText.includes('return') || lowerText.includes('refund')) {
          reply = "We offer a hassle-free 7-day return policy. You can initiate a return from your Orders page.";
        } else if (lowerText.includes('hi') || lowerText.includes('hello')) {
          reply = "Hello! What can I help you find today?";
        } else if (lowerText.includes('points') || lowerText.includes('reward')) {
          reply = "You earn 10 shopyng Points for every ₹100 spent! You can use them at checkout to get discounts.";
        } else if (lowerText.includes('thank')) {
          reply = "You're very welcome! Let me know if you need anything else.";
        }

        setBotMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          text: reply,
          senderRole: 'vendor',
          createdAt: new Date().toISOString()
        }]);
      }, 1500);
      return;
    }

    try {
      await chatApi.buyer.sendMessage(activeChatId, text);
    } catch (err) {
      toast.error('Failed to send message');
      setInputText(text); // revert
    }
  };

  const totalUnread = chats.reduce((acc, c) => acc + (c.unreadCountBuyer || 0), 0);

  if (!user || user.role !== 'buyer') return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-2xl flex items-center justify-center hover:bg-primary/90 hover:scale-105 transition-all z-50"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!isOpen && totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
            {totalUnread}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 md:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between shrink-0">
            <div>
              <h3 className="font-bold">Messages</h3>
              <p className="text-xs opacity-80 text-primary-foreground/80">Support & Sellers</p>
            </div>
            {activeChatId && (
              <button 
                onClick={() => setActiveChatId(null)}
                className="text-xs font-bold underline hover:opacity-80"
              >
                Back
              </button>
            )}
          </div>

          {!activeChatId ? (
            <div className="flex-1 overflow-y-auto p-2">
              {/* Bot Chat Entry */}
              <div
                onClick={() => setActiveChatId('bot')}
                className="p-3 mb-2 rounded-xl bg-orange-50 hover:bg-orange-100 cursor-pointer flex gap-3 items-center border border-orange-200"
              >
                <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm text-orange-900 truncate pr-2">shopyng Assistant</span>
                  </div>
                  <p className="text-xs text-orange-700 truncate">Online and ready to help</p>
                </div>
              </div>

              {chats.length === 0 ? (
                <div className="text-center py-10">
                  <MessageCircle className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No active conversations</p>
                </div>
              ) : (
                chats.map(chat => (
                  <div
                    key={chat.id}
                    onClick={() => setActiveChatId(chat.id)}
                    className="p-3 rounded-xl hover:bg-gray-50 cursor-pointer flex gap-3 items-center border-b border-gray-100 last:border-0"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                      <Store className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm text-gray-900 truncate pr-2">{chat.vendorName}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
                    </div>
                    {chat.unreadCountBuyer > 0 && (
                      <span className="w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                        {chat.unreadCountBuyer}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {(activeChatId === 'bot' ? botMessages : messages).map((msg, i) => {
                  const isMine = msg.senderRole === 'buyer';
                  return (
                    <div key={msg.id || i} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      <div 
                        className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                          isMine 
                            ? 'bg-primary text-primary-foreground rounded-br-sm' 
                            : 'bg-white border text-gray-800 rounded-bl-sm shadow-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                
                {activeChatId === 'bot' && isBotTyping && (
                  <div className="flex flex-col items-start">
                    <div className="bg-white border px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex gap-1 items-center h-10">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="p-3 border-t bg-white flex gap-2 shrink-0">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-gray-100 border-transparent focus:bg-white rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4 ml-1" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};
