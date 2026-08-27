import React, { useState, useEffect, useRef } from 'react';
import { User, Message, ChatConversation, AppNotification, Listing, ProductReference } from '../../types';
import { db } from '../../firebaseConfig';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, doc, setDoc, updateDoc, limit } from 'firebase/firestore';
import { useLanguage } from '../../src/context/LanguageContext';

interface ChatPageProps {
  currentUser: User;
  targetUser: { id: string; name: string } | null;
  contextListing?: Listing | null;
  onNavigate: (view: 'home') => void;
  onViewListing?: (listing: Listing | ProductReference) => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ currentUser, targetUser, contextListing, onNavigate, onViewListing }) => {
  const { isUrdu } = useLanguage();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  
  // Calculate initial conversation ID immediately if targetUser is provided
  const initialConvId = (() => {
    if (targetUser && targetUser.id && currentUser?.id) {
      const otherId = targetUser.id;
      const myId = currentUser.id;
      const sortedIds = [myId, otherId].sort();
      return sortedIds[0] === sortedIds[1] ? `${myId}_self` : `${sortedIds[0]}_${sortedIds[1]}`;
    }
    return null;
  })();

  const [activeConversationId, setActiveConversationId] = useState<string | null>(initialConvId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  
  // Product context attached to active chat
  const [activeProduct, setActiveProduct] = useState<ProductReference | null>(() => {
    if (contextListing) {
      return {
        id: contextListing.id,
        title: contextListing.title,
        price: contextListing.price,
        imageUrl: contextListing.imageUrl || (contextListing.images && contextListing.images[0]) || '',
        location: contextListing.location,
        category: contextListing.category
      };
    }
    return null;
  });
  const [showProductBanner, setShowProductBanner] = useState(true);
  const [attachProductToNextMessage, setAttachProductToNextMessage] = useState(true);

  const [activeTab, setActiveTab] = useState<'messages' | 'alerts'>('messages');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize active product reference from contextListing prop if provided
  useEffect(() => {
    if (contextListing) {
      const prodRef: ProductReference = {
        id: contextListing.id,
        title: contextListing.title,
        price: contextListing.price,
        imageUrl: contextListing.imageUrl || (contextListing.images && contextListing.images[0]) || '',
        location: contextListing.location,
        category: contextListing.category
      };
      setActiveProduct(prodRef);
      setShowProductBanner(true);
      setAttachProductToNextMessage(true);
    }
  }, [contextListing]);

  useEffect(() => {
    if (targetUser && targetUser.id && currentUser?.id) {
      const otherId = targetUser.id;
      const myId = currentUser.id;
      const sortedIds = [myId, otherId].sort();
      const convId = sortedIds[0] === sortedIds[1] ? `${myId}_self` : `${sortedIds[0]}_${sortedIds[1]}`;
      setActiveConversationId(convId);
      setActiveTab('messages'); 
    }
  }, [targetUser, currentUser?.id]);

  // Sync conversations list
  useEffect(() => {
    if (!currentUser?.id || !db) {
        setLoadingChats(false);
        return;
    }

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', currentUser.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatConversation));
      
      convs.sort((a, b) => {
          const tA = a.lastMessageTimestamp?.seconds || 0;
          const tB = b.lastMessageTimestamp?.seconds || 0;
          return tB - tA;
      });

      setConversations(convs);
      setLoadingChats(false);
    }, (err) => {
        if (!err.message.includes('permission')) console.error("Conversations error", err.message);
        setLoadingChats(false);
    });

    return () => unsubscribe();
  }, [currentUser?.id]);

  // Sync notifications for System Alerts tab
  useEffect(() => {
      if (!currentUser?.id || !db) return;
      setLoadingNotifs(true);

      const q = query(
          collection(db, 'notifications'),
          where('userId', '==', currentUser.id)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
          data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setNotifications(data);
          setLoadingNotifs(false);
      }, (err) => {
          if (!err.message.includes('permission')) console.error("Chat alerts error", err.message);
          setLoadingNotifs(false);
      });

      return () => unsubscribe();
  }, [currentUser?.id]);

  // Sync messages for active conversation
  useEffect(() => {
    if (!activeConversationId || !db) return;

    // Check if the conversation has a context listing saved
    const currConv = conversations.find(c => c.id === activeConversationId);
    if (currConv?.contextListing && !contextListing) {
      setActiveProduct(currConv.contextListing);
      setShowProductBanner(true);
    }

    const q = query(
      collection(db, `conversations/${activeConversationId}/messages`),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
      setMessages(msgs);

      // If activeProduct is not set yet, check if any recent message had an attached listing
      if (!activeProduct && !contextListing) {
        const lastMsgWithListing = [...msgs].reverse().find(m => m.listing);
        if (lastMsgWithListing?.listing) {
          setActiveProduct(lastMsgWithListing.listing);
        }
      }

      // If messages already exist with this listing, don't force-attach to every reply unless toggled
      if (msgs.some(m => m.listing?.id === activeProduct?.id)) {
        setAttachProductToNextMessage(false);
      }

      const unreadIds = msgs
        .filter(m => !m.read && m.receiverId === currentUser.id)
        .map(m => m.id);

      if (unreadIds.length > 0) {
        unreadIds.forEach(id => {
            const msgRef = doc(db, `conversations/${activeConversationId}/messages`, id);
            updateDoc(msgRef, { read: true }).catch(() => {});
        });

        const convRef = doc(db, 'conversations', activeConversationId);
        updateDoc(convRef, {
            [`unreadCounts.${currentUser.id}`]: 0
        }).catch(() => {});
      }
    }, (err) => {
        if (!err.message.includes('permission')) console.error("Messages error", err.message);
    });

    return () => unsubscribe();
  }, [activeConversationId, currentUser?.id]);

  useEffect(() => {
      scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessageWithText = async (textToSend: string, attachCurrentProduct: boolean = attachProductToNextMessage) => {
    if (!textToSend.trim() || !activeConversationId || !db) return;

    const text = textToSend.trim();
    setNewMessage(''); 

    try {
        const parts = activeConversationId.split('_');
        const receiverId = parts[0] === currentUser.id ? parts[1] : parts[0];
        
        let receiverName = targetUser?.name || 'User';
        if (!targetUser) {
           const currentConv = conversations.find(c => c.id === activeConversationId);
           if (currentConv) {
               receiverName = currentConv.participantNames[receiverId] || 'User';
           }
        }

        const messageData: any = {
            text,
            senderId: currentUser.id,
            receiverId,
            timestamp: serverTimestamp(),
            read: false
        };

        if (attachCurrentProduct && activeProduct) {
            messageData.listing = activeProduct;
        }

        await addDoc(collection(db, `conversations/${activeConversationId}/messages`), messageData);

        const convRef = doc(db, 'conversations', activeConversationId);
        const currentConv = conversations.find(c => c.id === activeConversationId);
        const currentUnread = currentConv?.unreadCounts?.[receiverId] || 0;

        const convUpdateData: any = {
            participants: [currentUser.id, receiverId],
            participantNames: {
                [currentUser.id]: currentUser.name,
                [receiverId]: receiverName
            },
            lastMessage: text,
            lastMessageTimestamp: serverTimestamp(),
            unreadCounts: {
                [receiverId]: currentUnread + 1,
                [currentUser.id]: 0 
            }
        };

        if (activeProduct) {
            convUpdateData.contextListing = activeProduct;
        }

        await setDoc(convRef, convUpdateData, { merge: true });
        
        // After sending with attachment once, turn off auto-attach for regular continuous typing
        if (attachCurrentProduct) {
            setAttachProductToNextMessage(false);
        }

    } catch (error: any) {
        console.error("Error sending message:", error.message);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSendMessageWithText(newMessage);
  };

  const handleQuickQuestion = async (questionText: string) => {
    setNewMessage(questionText);
    // Directly send with product attached for fast UX
    await handleSendMessageWithText(questionText, true);
  };

  const handleMarkNotificationRead = async (notif: AppNotification) => {
      if(!notif.isRead && db) {
          const ref = doc(db, 'notifications', notif.id);
          await updateDoc(ref, { isRead: true }).catch(() => {});
      }
  };

  const getChatName = (conv: ChatConversation) => {
      const otherId = conv.participants.find(p => p !== currentUser.id);
      return otherId ? conv.participantNames[otherId] : 'Unknown';
  };

  const getTimeAgo = (isoString: string) => {
      const date = new Date(isoString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100dvh-120px)] md:h-[calc(100vh-160px)] bg-white dark:bg-dark-surface rounded-2xl shadow-xl overflow-hidden animate-fade-in border border-gray-100 dark:border-gray-800">
      
      {/* Sidebar / Conversation List */}
      <div className={`w-full md:w-1/3 lg:w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col min-h-0 ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/80 space-y-3 flex-shrink-0">
           <div className="flex items-center gap-2">
               <button onClick={() => onNavigate('home')} className="md:hidden p-1.5 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7 7-7" /></svg>
               </button>
               <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">{isUrdu ? "پیغامات اور رابطے" : "Messages & Chats"}</h2>
           </div>
           <div className="flex bg-gray-200/70 dark:bg-gray-700/60 p-1 rounded-xl">
               <button 
                onClick={() => setActiveTab('messages')}
                className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all ${activeTab === 'messages' ? 'bg-white dark:bg-dark-surface shadow-sm text-primary dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}
               >
                   {isUrdu ? "پیغامات" : "Chats"}
               </button>
               <button 
                onClick={() => setActiveTab('alerts')}
                className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'alerts' ? 'bg-white dark:bg-dark-surface shadow-sm text-primary dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}
               >
                   {isUrdu ? "نوٹیفکیشنز" : "Alerts"}
                   {notifications.some(n => !n.isRead) && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
               </button>
           </div>
        </div>
        
        {/* Scrollable List Container */}
        <div className="flex-grow overflow-y-auto min-h-0 overscroll-contain divide-y divide-gray-100 dark:divide-gray-800/60">
           {activeTab === 'messages' && (
                <div className="flex flex-col">
                    {loadingChats ? (
                        <div className="flex justify-center p-8"><span className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></span></div>
                    ) : conversations.length === 0 ? (
                        <div className="p-8 text-center space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </div>
                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{isUrdu ? "کوئی گفتگو موجود نہیں" : "No conversations yet"}</p>
                            <p className="text-xs text-gray-400 max-w-[200px] mx-auto leading-relaxed">{isUrdu ? "کسی بھی اشتہار پر جا کر 'Chat Now' پر کلک کریں" : "Visit any listing and click 'Chat Now' to inquire."}</p>
                        </div>
                    ) : (
                        conversations.map(conv => {
                            const isSelected = activeConversationId === conv.id;
                            const hasListing = !!conv.contextListing;

                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => {
                                        setActiveConversationId(conv.id);
                                        if (conv.contextListing) {
                                            setActiveProduct(conv.contextListing);
                                            setShowProductBanner(true);
                                        }
                                    }}
                                    className={`w-full text-left p-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all ${isSelected ? 'bg-primary/5 dark:bg-primary/10 border-l-4 border-primary' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Avatar or Product Icon */}
                                        <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center font-black text-sm flex-shrink-0 overflow-hidden border border-primary/20">
                                            {conv.contextListing?.imageUrl ? (
                                                <img src={conv.contextListing.imageUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{getChatName(conv).charAt(0).toUpperCase()}</span>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <span className="font-black text-sm text-gray-900 dark:text-white truncate">
                                                    {getChatName(conv)}
                                                </span>
                                                {conv.lastMessageTimestamp && (
                                                    <span className="text-[10px] text-gray-400 font-medium">
                                                        {new Date(conv.lastMessageTimestamp?.seconds * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Product Reference Tag if present */}
                                            {hasListing && (
                                                <div className="flex items-center gap-1 text-[11px] font-bold text-primary dark:text-blue-400 mb-0.5 truncate">
                                                    <span className="text-[10px]">📌</span>
                                                    <span className="truncate">{conv.contextListing?.title}</span>
                                                    <span className="text-[10px] opacity-80 flex-shrink-0">• Rs. {conv.contextListing?.price.toLocaleString()}</span>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex-grow pr-2">
                                                    {conv.lastMessage}
                                                </p>
                                                {conv.unreadCounts?.[currentUser.id] > 0 && (
                                                    <span className="bg-primary text-white text-[10px] font-black h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full flex-shrink-0 shadow-sm">
                                                        {conv.unreadCounts[currentUser.id]}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
           )}

           {activeTab === 'alerts' && (
               <div className="flex flex-col">
                   {loadingNotifs ? (
                       <div className="flex justify-center p-8"><span className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></span></div>
                   ) : notifications.length === 0 ? (
                       <div className="p-8 text-center space-y-2">
                           <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center mx-auto">
                               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                           </div>
                           <p className="text-gray-500 text-xs font-bold">{isUrdu ? "کوئی نوٹیفکیشن موجود نہیں" : "No new alerts"}</p>
                       </div>
                   ) : (
                       notifications.map(notif => (
                           <div 
                                key={notif.id}
                                onClick={() => handleMarkNotificationRead(notif)}
                                className={`p-4 border-b border-gray-100 dark:border-gray-800 transition-colors cursor-pointer relative ${notif.isRead ? 'bg-white dark:bg-dark-surface' : 'bg-primary/5 dark:bg-primary/10'}`}
                           >
                               <div className="flex items-start gap-3">
                                   <div className={`mt-0.5 p-2 rounded-xl flex-shrink-0 ${
                                       notif.type === 'success' ? 'bg-green-100 text-green-600' :
                                       notif.type === 'error' ? 'bg-red-100 text-red-600' :
                                       notif.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                                       'bg-blue-100 text-blue-600'
                                   }`}>
                                       {notif.type === 'success' ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> :
                                        notif.type === 'error' || notif.type === 'warning' ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> :
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                       }
                                   </div>
                                   <div className="flex-1 min-w-0">
                                       <div className="flex justify-between items-start">
                                           <h4 className={`text-xs font-black mb-0.5 ${notif.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>{notif.title}</h4>
                                           {!notif.isRead && <span className="w-2 h-2 bg-primary rounded-full mt-1 ml-2 flex-shrink-0"></span>}
                                       </div>
                                       <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">{notif.message}</p>
                                       <p className="text-[10px] text-gray-400 font-bold mt-1.5">{getTimeAgo(notif.createdAt)}</p>
                                   </div>
                               </div>
                           </div>
                       ))
                   )}
               </div>
           )}
        </div>
      </div>

      {/* Main Chat Column */}
      <div className={`w-full md:w-2/3 lg:flex-1 flex flex-col h-full min-h-0 ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
        {activeTab === 'alerts' && !activeConversationId ? (
             <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6 text-center bg-gray-50/50 dark:bg-gray-900/50">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl mb-4 shadow-sm border border-gray-100 dark:border-gray-800">
                    <svg className="w-12 h-12 text-primary/60 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </div>
                <h3 className="text-lg font-black text-gray-800 dark:text-white">{isUrdu ? "سسٹم نوٹیفکیشنز" : "System Notifications"}</h3>
                <p className="text-xs text-gray-500 max-w-sm mt-1">
                    {isUrdu ? "ایڈمن کے اعلانات اور والٹ اپڈیٹس یہاں ظاہر ہوں گی۔" : "Admin announcements and transaction updates will appear here."}
                </p>
            </div>
        ) : activeConversationId ? (
            <>
                {/* Chat Header */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-dark-surface flex-shrink-0 z-10">
                    <div className="flex items-center gap-3 min-w-0">
                        <button onClick={() => setActiveConversationId(null)} className="md:hidden p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div className="min-w-0">
                            <h3 className="font-black text-sm sm:text-base text-gray-900 dark:text-white truncate">
                                {targetUser?.name || (conversations.find(c => c.id === activeConversationId) ? getChatName(conversations.find(c => c.id === activeConversationId)!) : 'Chat')}
                            </h3>
                            <div className="flex items-center gap-1.5 text-[11px] text-green-600 font-bold">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span>{isUrdu ? "آن لائن رابطہ" : "Online on RizqDaan"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Active product quick action badge in header */}
                    {activeProduct && (
                        <button 
                            onClick={() => {
                                if (onViewListing) onViewListing(activeProduct);
                            }}
                            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary dark:text-white text-xs font-black rounded-xl transition-all border border-primary/20 flex-shrink-0"
                            title={activeProduct.title}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            <span>{isUrdu ? "اشتہار دیکھیں" : "View Listing"}</span>
                        </button>
                    )}
                </div>

                {/* 🌟 PINNED ITEM INQUIRY BANNER (Buyer & Seller Context) */}
                {activeProduct && showProductBanner && (
                    <div className="bg-gradient-to-r from-amber-500/10 via-primary/10 to-primary/5 dark:from-amber-500/20 dark:via-primary/20 dark:to-dark-surface border-b border-primary/20 p-3 sm:p-4 flex-shrink-0 transition-all">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                {activeProduct.imageUrl ? (
                                    <img 
                                        src={activeProduct.imageUrl} 
                                        alt={activeProduct.title} 
                                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-white dark:border-gray-700 shadow-sm flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
                                        onClick={() => onViewListing && onViewListing(activeProduct)}
                                    />
                                ) : (
                                    <div className="w-14 h-14 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-black flex-shrink-0">
                                        📦
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="bg-primary text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                                            {isUrdu ? "زیرِ بحث پروڈکٹ" : "Inquired Item"}
                                        </span>
                                        {activeProduct.location && (
                                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold truncate">
                                                📍 {activeProduct.location}
                                            </span>
                                        )}
                                    </div>
                                    <h4 
                                        className="text-sm sm:text-base font-black text-gray-900 dark:text-white truncate cursor-pointer hover:text-primary transition-colors mt-0.5"
                                        onClick={() => onViewListing && onViewListing(activeProduct)}
                                    >
                                        {activeProduct.title}
                                    </h4>
                                    <div className="flex items-baseline gap-2 mt-0.5">
                                        <span className="text-xs sm:text-sm font-black text-primary dark:text-white">
                                            Rs. {activeProduct.price.toLocaleString()}
                                        </span>
                                        <button 
                                            onClick={() => onViewListing && onViewListing(activeProduct)}
                                            className="text-[11px] font-bold text-primary dark:text-blue-400 underline ml-1 hover:opacity-80"
                                        >
                                            {isUrdu ? "مکمل تفصیلات دیکھیں" : "View Full Ad →"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => setShowProductBanner(false)}
                                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex-shrink-0"
                                title="Dismiss banner"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Quick Inquiry Action Chips */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 mt-2 border-t border-primary/10 no-scrollbar">
                            <span className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 whitespace-nowrap mr-1">
                                {isUrdu ? "فوری سوالات:" : "Quick Questions:"}
                            </span>
                            <button 
                                onClick={() => handleQuickQuestion(isUrdu ? "السلام علیکم! کیا یہ آئٹم ابھی دستیاب ہے؟" : "Assalam o Alaikum! Is this item still available?")}
                                className="px-2.5 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[11px] font-bold rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary whitespace-nowrap shadow-2xs hover:scale-102 active:scale-95 transition-all"
                            >
                                💬 {isUrdu ? "کیا یہ دستیاب ہے؟" : "Is this available?"}
                            </button>
                            <button 
                                onClick={() => handleQuickQuestion(isUrdu ? "اس کا فائنل ریٹ / بہترین رعایت کیا ہو سکتی ہے؟" : "What is your final/best price for this?")}
                                className="px-2.5 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[11px] font-bold rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary whitespace-nowrap shadow-2xs hover:scale-102 active:scale-95 transition-all"
                            >
                                💰 {isUrdu ? "فائنل ریٹ کیا ہے؟" : "Final Price?"}
                            </button>
                            <button 
                                onClick={() => handleQuickQuestion(isUrdu ? "آپ کی دکان / لوکیشن کہاں ہے؟ کیسے وزٹ کر سکتے ہیں؟" : "Where is your exact shop or location for pickup?")}
                                className="px-2.5 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[11px] font-bold rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary whitespace-nowrap shadow-2xs hover:scale-102 active:scale-95 transition-all"
                            >
                                📍 {isUrdu ? "لوکیشن کہاں ہے؟" : "Location?"}
                            </button>
                            <button 
                                onClick={() => handleQuickQuestion(isUrdu ? "کیا اس آئٹم کی ہوم ڈیلیوری دستیاب ہے؟" : "Is home delivery available for this item?")}
                                className="px-2.5 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[11px] font-bold rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary whitespace-nowrap shadow-2xs hover:scale-102 active:scale-95 transition-all"
                            >
                                🚚 {isUrdu ? "ڈیلیوری ملے گی؟" : "Delivery?"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Collapsed Product Pill when banner is dismissed */}
                {activeProduct && !showProductBanner && (
                    <div className="bg-primary/5 dark:bg-primary/10 px-4 py-1.5 border-b border-primary/10 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                            <span className="text-[10px]">📌</span>
                            <span className="font-bold text-gray-700 dark:text-gray-300 truncate">{activeProduct.title}</span>
                            <span className="font-black text-primary dark:text-white flex-shrink-0">Rs. {activeProduct.price.toLocaleString()}</span>
                        </div>
                        <button 
                            onClick={() => setShowProductBanner(true)}
                            className="text-[11px] font-black text-primary dark:text-blue-400 hover:underline flex-shrink-0 ml-2"
                        >
                            {isUrdu ? "بینر دکھائیں" : "Show Banner"}
                        </button>
                    </div>
                )}

                {/* Messages Scroller */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/60 flex flex-col min-h-0 overscroll-contain">
                    {messages.map(msg => {
                        const isMe = msg.senderId === currentUser.id;
                        const timestamp = msg.timestamp 
                            ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                            : '...';

                        return (
                            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`relative max-w-[88%] sm:max-w-[75%] md:max-w-[65%] rounded-2xl shadow-sm overflow-hidden ${
                                    isMe 
                                    ? 'bg-primary text-white rounded-tr-none' 
                                    : 'bg-white dark:bg-dark-surface text-gray-900 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-800'
                                }`}>
                                    
                                    {/* 🏷️ EMBEDDED PRODUCT CARD IN CHAT BUBBLE */}
                                    {msg.listing && (
                                        <div className={`p-3 m-1.5 rounded-xl border transition-all ${
                                            isMe 
                                            ? 'bg-white/10 border-white/20 text-white' 
                                            : 'bg-gray-50 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white'
                                        }`}>
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <span className="text-[10px] font-black uppercase tracking-wider opacity-90">
                                                    📌 {isUrdu ? "متعلقہ اشتہار" : "Referenced Listing"}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                                {msg.listing.imageUrl ? (
                                                    <img 
                                                        src={msg.listing.imageUrl} 
                                                        alt={msg.listing.title} 
                                                        className="w-14 h-14 rounded-xl object-cover border border-black/10 dark:border-white/10 flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-14 h-14 rounded-xl bg-black/10 dark:bg-white/10 flex items-center justify-center font-black flex-shrink-0">
                                                        📦
                                                    </div>
                                                )}

                                                <div className="min-w-0 flex-1">
                                                    <h5 className="font-black text-xs sm:text-sm line-clamp-1 leading-snug">
                                                        {msg.listing.title}
                                                    </h5>
                                                    <p className={`text-xs font-black mt-0.5 ${isMe ? 'text-amber-200' : 'text-primary dark:text-amber-400'}`}>
                                                        Rs. {msg.listing.price.toLocaleString()}
                                                    </p>
                                                    {msg.listing.location && (
                                                        <p className="text-[10px] opacity-75 truncate mt-0.5">
                                                            📍 {msg.listing.location}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => onViewListing && onViewListing(msg.listing!)}
                                                className={`w-full mt-2.5 py-1.5 px-3 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                                                    isMe 
                                                    ? 'bg-white text-primary hover:bg-white/90 shadow-sm' 
                                                    : 'bg-primary text-white hover:bg-primary/90 shadow-sm'
                                                }`}
                                            >
                                                <span>{isUrdu ? "اشتہار کھولیں" : "View Listing"}</span>
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                            </button>
                                        </div>
                                    )}

                                    {/* Message Text Content */}
                                    <div className="px-3.5 pt-2 pb-6">
                                        <p className="text-sm whitespace-pre-wrap leading-relaxed pb-0.5 pr-2 font-medium">{msg.text}</p>
                                    </div>

                                    {/* Timestamp and Read Status */}
                                    <div className={`absolute bottom-1 right-2.5 flex items-center gap-1 select-none`}>
                                        <span className={`text-[10px] font-medium ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                                            {timestamp}
                                        </span>
                                        {isMe && (
                                             <span className={`${msg.read ? 'text-blue-200' : 'text-white/60'}`}>
                                                {msg.read ? (
                                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M0.41 13.41L6 19l1.41-1.41L1.83 12 0.41 13.41zm22.24-9.06l-12 12L9.07 14.83 7.66 16.24 10.66 19.24 24.07 5.76 22.65 4.35zM18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7z" /></svg>
                                                ) : (
                                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>
                                                )}
                                             </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 bg-white dark:bg-dark-surface border-t border-gray-200 dark:border-gray-800 flex flex-col gap-2 flex-shrink-0">
                    
                    {/* Attachment Toggle Chip if product is available */}
                    {activeProduct && (
                        <div className="flex items-center justify-between px-1">
                            <button
                                type="button"
                                onClick={() => setAttachProductToNextMessage(!attachProductToNextMessage)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all border ${
                                    attachProductToNextMessage 
                                    ? 'bg-primary/10 text-primary dark:text-white border-primary/30' 
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-transparent'
                                }`}
                            >
                                <span>{attachProductToNextMessage ? '📌' : '📎'}</span>
                                <span className="truncate max-w-[200px] sm:max-w-xs">{activeProduct.title}</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase ${
                                    attachProductToNextMessage ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                }`}>
                                    {attachProductToNextMessage ? (isUrdu ? 'منسلک ہے' : 'Attached') : (isUrdu ? 'منسلک کریں' : 'Attach')}
                                </span>
                            </button>

                            {attachProductToNextMessage && (
                                <button 
                                    type="button" 
                                    onClick={() => setAttachProductToNextMessage(false)}
                                    className="text-[10px] text-gray-400 hover:text-red-500 font-bold"
                                >
                                    {isUrdu ? "ہٹائیں" : "Remove"}
                                </button>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={isUrdu ? "پیغام لکھیں..." : "Type a message..."}
                            className="flex-grow min-w-0 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50 dark:bg-gray-800/60 text-gray-900 dark:text-white text-sm font-medium shadow-inner"
                        />
                        <button 
                            type="submit" 
                            disabled={!newMessage.trim()} 
                            className="bg-primary text-white w-12 h-12 rounded-2xl hover:bg-primary/90 disabled:opacity-40 transition-all shadow-md flex items-center justify-center flex-shrink-0 active:scale-95"
                            title="Send"
                        >
                            <svg className="w-5 h-5 translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                            </svg>
                        </button>
                    </form>
                </div>
            </>
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center bg-gray-50/30 dark:bg-gray-900/30">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-inner">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </div>
                <h3 className="text-base font-black text-gray-800 dark:text-white">{isUrdu ? "گفتگو منتخب کریں" : "Select a Conversation"}</h3>
                <p className="text-xs text-gray-500 max-w-xs mt-1.5 leading-relaxed">
                    {isUrdu ? "بائیں طرف سے چیٹ منتخب کریں یا کسی اشتہار پر جا کر فروخت کنندہ سے رابطہ کریں۔" : "Choose a conversation from the list or visit any product listing to contact the seller."}
                </p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
