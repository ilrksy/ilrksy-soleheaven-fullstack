import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Chat, Message } from '../types';
import { translations, Language } from '../lib/translations';
import { getChats, getMessages, sendMessage } from '../lib/dbHelper';
import { X, Send, User, Sparkles, MessageCircle, RefreshCw } from 'lucide-react';

interface ChatModalProps {
  currentUser: UserProfile;
  initialSellerUid?: string; // Auto-target a specific seller if launched from details/profile
  initialSellerName?: string;
  onClose: () => void;
  lang: Language;
}

export default function ChatModal({
  currentUser,
  initialSellerUid,
  initialSellerName,
  onClose,
  lang
}: ChatModalProps) {
  const t = translations[lang];
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsgContent, setNewMsgContent] = useState<string>('');
  const [loadingChats, setLoadingChats] = useState<boolean>(true);
  const [loadingMsgs, setLoadingMsgs] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Poll chats list and current thread messages to simulate websocket real-time updates!
  useEffect(() => {
    let isMounted = true;
    
    async function loadUserChats() {
      try {
        const userChats = await getChats(currentUser.uid);
        if (isMounted) {
          setChats(userChats);
          setLoadingChats(false);

          // If targeted via listing/profile, auto-select or initiate chat
          if (initialSellerUid && initialSellerUid !== currentUser.uid) {
            const chatId = `${currentUser.uid}_${initialSellerUid}`;
            const existing = userChats.find(c => c.id === chatId);
            if (existing) {
              setSelectedChat(existing);
            } else if (initialSellerName) {
              // Initiate new temporary local chat object
              const tempChat: Chat = {
                id: chatId,
                buyerUid: currentUser.uid,
                buyerName: currentUser.displayName,
                sellerUid: initialSellerUid,
                sellerName: initialSellerName,
                lastMessage: lang === 'ms' ? 'Mulakan sembang...' : 'Start chat...',
                updatedAt: new Date().toISOString()
              };
              setChats(prev => [tempChat, ...prev]);
              setSelectedChat(tempChat);
            }
          } else if (userChats.length > 0 && !selectedChat) {
            setSelectedChat(userChats[0]);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadUserChats();
    const interval = setInterval(loadUserChats, 6000); // refresh list every 6 seconds

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentUser, initialSellerUid, initialSellerName]);

  // Handle message thread polling for active chat
  useEffect(() => {
    if (!selectedChat) return;

    let isMounted = true;
    async function loadThread() {
      try {
        const msgs = await getMessages(selectedChat.id);
        if (isMounted) {
          setMessages(msgs);
          setLoadingMsgs(false);
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadThread();
    const interval = setInterval(loadThread, 3000); // poll active messages every 3 seconds for instant response vibe!

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedChat]);

  // Scroll to bottom when messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !newMsgContent.trim()) return;

    const content = newMsgContent.trim();
    setNewMsgContent('');

    const receiverUid = currentUser.uid === selectedChat.buyerUid ? selectedChat.sellerUid : selectedChat.buyerUid;
    const receiverName = currentUser.uid === selectedChat.buyerUid ? selectedChat.sellerName : selectedChat.buyerName;

    // Optimistic local state update
    const tempMsg: Message = {
      id: `msg_temp_${Date.now()}`,
      chatId: selectedChat.id,
      senderUid: currentUser.uid,
      senderName: currentUser.displayName,
      content,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await sendMessage(
        selectedChat.id,
        currentUser.uid,
        currentUser.displayName,
        content,
        receiverUid,
        receiverName
      );
      
      // Refresh chats list to show latest updated message
      const updatedChats = await getChats(currentUser.uid);
      setChats(updatedChats);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-xs" onClick={onClose} />

      {/* Main Container */}
      <div className="w-full max-w-4xl h-[80vh] bg-[#121214] border border-zinc-800 rounded-2xl overflow-hidden flex relative z-10 text-white shadow-2xl">
        
        {/* Chats Sidebar */}
        <div className="w-1/3 border-r border-zinc-800 flex flex-col bg-zinc-950/40">
          <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
            <MessageCircle size={18} className="text-purple-400" />
            <h3 className="text-sm font-serif font-bold uppercase tracking-wider">{t.chatTitle}</h3>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-900 custom-scrollbar">
            {loadingChats ? (
              <div className="p-8 text-center text-zinc-500 flex flex-col items-center gap-2">
                <RefreshCw size={16} className="animate-spin text-zinc-600" />
                <span className="text-xs uppercase tracking-widest text-[9px]">{t.loadingRegistry}</span>
              </div>
            ) : chats.length === 0 ? (
              <p className="p-6 text-center text-xs text-zinc-600 font-light">{t.noChatsYet}</p>
            ) : (
              chats.map((chat) => {
                const isSelected = selectedChat?.id === chat.id;
                const partnerName = currentUser.uid === chat.buyerUid ? chat.sellerName : chat.buyerName;
                
                return (
                  <button
                    key={chat.id}
                    onClick={() => {
                      setSelectedChat(chat);
                      setLoadingMsgs(true);
                    }}
                    className={`w-full p-4 text-left transition-all flex items-center gap-3 ${
                      isSelected 
                        ? 'bg-purple-950/20 border-l-2 border-purple-500' 
                        : 'hover:bg-zinc-900/40'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs text-purple-400 font-bold font-serif shadow-sm">
                      {partnerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h4 className="text-xs font-semibold text-white truncate">{partnerName}</h4>
                        <span className="text-[8px] text-zinc-500">
                          {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate mt-0.5">{chat.lastMessage}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Messaging Area */}
        <div className="flex-1 flex flex-col bg-zinc-900/10">
          
          {/* Active Chat Header */}
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/60">
            {selectedChat ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/50 flex items-center justify-center text-xs text-purple-300 font-bold font-serif">
                  {(currentUser.uid === selectedChat.buyerUid ? selectedChat.sellerName : selectedChat.buyerName).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    {currentUser.uid === selectedChat.buyerUid ? selectedChat.sellerName : selectedChat.buyerName}
                  </h4>
                  <p className="text-[9px] uppercase tracking-wider text-purple-400 font-bold font-mono">
                    {currentUser.uid === selectedChat.buyerUid ? t.statusSellerLabel : (lang === 'ms' ? 'Pengumpul Sah' : 'Collector')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-xs text-zinc-500">{lang === 'ms' ? 'Sila pilih sembang' : 'Please select a conversation'}</div>
            )}

            <button 
              onClick={onClose}
              className="p-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all"
            >
              <X size={14} />
            </button>
          </div>

          {/* Messages List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar">
            {!selectedChat ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <MessageCircle size={32} className="text-zinc-700 mb-2" />
                <p className="text-xs text-zinc-500 font-light">{lang === 'ms' ? 'Pilih rakan sembang di menu kiri untuk berinteraksi secara terus.' : 'Select a conversation on the left to start direct interaction.'}</p>
              </div>
            ) : loadingMsgs ? (
              <div className="h-full flex items-center justify-center">
                <RefreshCw size={20} className="animate-spin text-zinc-700" />
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-600">
                <p className="text-xs">{t.noMessagesYet}</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe = msg.senderUid === currentUser.uid;
                return (
                  <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-2xl text-xs leading-relaxed ${
                      isMe 
                        ? 'bg-gradient-to-r from-purple-600/80 to-purple-800/80 border border-purple-500/30 text-white rounded-br-none' 
                        : 'bg-zinc-850/80 border border-zinc-800 text-zinc-100 rounded-bl-none'
                    }`}>
                      <p>{msg.content}</p>
                      <span className="block text-[8px] text-zinc-400 mt-1.5 text-right font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input bar */}
          {selectedChat && (
            <form onSubmit={handleSend} className="p-4 border-t border-zinc-800 bg-zinc-950/60 flex gap-2">
              <input
                type="text"
                value={newMsgContent}
                onChange={(e) => setNewMsgContent(e.target.value)}
                placeholder={t.typeMessagePlaceholder}
                className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-purple-500/80 rounded-xl px-4 py-2.5 text-xs outline-none transition-colors placeholder:text-zinc-600"
              />
              <button
                type="submit"
                disabled={!newMsgContent.trim()}
                className="p-3 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all text-white rounded-xl"
              >
                <Send size={14} />
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
