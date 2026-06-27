import { useState, useEffect, useRef, useCallback } from 'react';
import { useUserStore } from '../stores/userStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { getWsUrl, API_BASE } from '../config';

interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
}

interface ChatSession {
  userId: string;
  username: string;
}

export default function SocialChat() {
  const user = useUserStore((s) => s.user);
  const accessToken = useUserStore((s) => s.accessToken);
  const [activeChats, setActiveChats] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<Record<string, DirectMessage[]>>({});
  const [minimized, setMinimized] = useState<Record<string, boolean>>({});

  const wsUrl = getWsUrl('/ws/lobby');

  const handleMessage = useCallback((msg: any) => {
    if (msg.type === 'direct_message') {
      const dm: DirectMessage = {
        id: msg.id,
        senderId: msg.senderId,
        receiverId: user?.id || '',
        content: msg.content,
        createdAt: msg.createdAt,
      };

      // Add to messages map
      setMessages((prev) => ({
        ...prev,
        [msg.senderId]: [...(prev[msg.senderId] || []), dm],
      }));

      // Automatically pop up chat box if not already open
      setActiveChats((prev) => {
        if (prev.some((c) => c.userId === msg.senderId)) return prev;
        return [...prev, { userId: msg.senderId, username: msg.senderUsername }].slice(-3);
      });
    } else if (msg.type === 'direct_message_sent') {
      const dm: DirectMessage = {
        id: msg.id,
        senderId: user?.id || '',
        receiverId: msg.receiverId,
        content: msg.content,
        createdAt: msg.createdAt,
      };

      // Add to messages map
      setMessages((prev) => ({
        ...prev,
        [msg.receiverId]: [...(prev[msg.receiverId] || []), dm],
      }));
    }
  }, [user]);

  const { send, isConnected } = useWebSocket({
    url: wsUrl,
    onMessage: handleMessage,
  });

  // Listen to open_chat event from directory page
  useEffect(() => {
    const handleOpenChat = (e: Event) => {
      const { userId, username } = (e as CustomEvent).detail;
      setActiveChats((prev) => {
        if (prev.some((c) => c.userId === userId)) {
          // If already open, make sure it is not minimized
          setMinimized((min) => ({ ...min, [userId]: false }));
          return prev;
        }
        return [...prev, { userId, username }].slice(-3); // Limit to max 3 chats
      });
    };
    window.addEventListener('open_chat', handleOpenChat);
    return () => window.removeEventListener('open_chat', handleOpenChat);
  }, []);

  const closeChat = (userId: string) => {
    setActiveChats((prev) => prev.filter((c) => c.userId !== userId));
  };

  const toggleMinimize = (userId: string) => {
    setMinimized((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  if (!user || !accessToken) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      right: 'var(--sp-4)',
      display: 'flex',
      gap: 'var(--sp-4)',
      zIndex: 9999,
      pointerEvents: 'none', // Allow clicking through empty spacing
    }}>
      {activeChats.map((chat) => (
        <SocialChatBox
          key={chat.userId}
          chat={chat}
          messages={messages[chat.userId] || []}
          isMinimized={minimized[chat.userId] || false}
          onClose={() => closeChat(chat.userId)}
          onMinimize={() => toggleMinimize(chat.userId)}
          onSendMessage={(content) => {
            send({ type: 'direct_message', toUserId: chat.userId, content });
          }}
          setMessages={(newMsgs) => {
            setMessages((prev) => ({ ...prev, [chat.userId]: newMsgs }));
          }}
          accessToken={accessToken}
        />
      ))}
    </div>
  );
}

interface SocialChatBoxProps {
  chat: ChatSession;
  messages: DirectMessage[];
  isMinimized: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onSendMessage: (content: string) => void;
  setMessages: (msgs: DirectMessage[]) => void;
  accessToken: string;
}

function SocialChatBox({
  chat,
  messages,
  isMinimized,
  onClose,
  onMinimize,
  onSendMessage,
  setMessages,
  accessToken,
}: SocialChatBoxProps) {
  const currentUser = useUserStore((s) => s.user);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch message history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/messages/${chat.userId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setMessages(data);
        }
      } catch (err) {
        console.error('Failed to load DM history:', err);
      }
    };
    fetchHistory();
  }, [chat.userId, accessToken, setMessages]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isMinimized]);

  return (
    <div style={{
      width: 260,
      background: 'var(--c-surface)',
      border: '1px solid var(--c-border)',
      display: 'flex',
      flexDirection: 'column',
      pointerEvents: 'auto', // Re-enable pointer events for chat window
      boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
    }}>
      {/* Header */}
      <div
        onClick={onMinimize}
        style={{
          padding: 'var(--sp-2) var(--sp-3)',
          borderBottom: isMinimized ? 'none' : '1px solid var(--c-border)',
          background: 'var(--c-elevated)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: 'var(--tx-xs)', fontWeight: 'var(--wt-bold)', color: 'var(--c-text)' }}>
            {chat.username}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onMinimize}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--c-text-2)',
              fontSize: '14px',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {isMinimized ? '▲' : '−'}
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--c-text-2)',
              fontSize: '12px',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Body & Input (hidden if minimized) */}
      {!isMinimized && (
        <>
          {/* Message List */}
          <div
            ref={scrollRef}
            style={{
              height: 220,
              overflowY: 'auto',
              padding: 'var(--sp-3) var(--sp-2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--sp-2)',
              background: 'var(--c-base)',
            }}
          >
            {messages.length === 0 ? (
              <p style={{ fontSize: 'var(--tx-3xs)', color: 'var(--c-text-3)', fontStyle: 'italic', textAlign: 'center', marginTop: 'var(--sp-4)' }}>
                No messages.
              </p>
            ) : (
              messages.map((msg) => {
                const isSelf = msg.senderId === currentUser?.id;
                return (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: isSelf ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      background: isSelf ? 'var(--c-gold-glow)' : 'var(--c-surface)',
                      border: isSelf ? '1px solid var(--c-gold)' : '1px solid var(--c-border)',
                      padding: '4px var(--sp-2)',
                      fontSize: 'var(--tx-2xs)',
                      lineHeight: 1.35,
                      color: 'var(--c-text)',
                    }}
                  >
                    {msg.content}
                  </div>
                );
              })
            )}
          </div>

          {/* Input field */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const val = inputValue.trim();
              if (val) {
                onSendMessage(val);
                setInputValue('');
              }
            }}
            style={{
              padding: 'var(--sp-1) var(--sp-2)',
              borderTop: '1px solid var(--c-border)',
              background: 'var(--c-elevated)',
              display: 'flex',
              gap: '4px',
            }}
          >
            <input
              type="text"
              placeholder="Type message…"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              autoComplete="off"
              className="input"
              style={{
                flex: 1,
                fontSize: 'var(--tx-2xs)',
                padding: '4px 6px',
              }}
            />
            <button
              type="submit"
              className="btn-play"
              style={{
                padding: '4px var(--sp-2)',
                fontSize: 'var(--tx-3xs)',
              }}
            >
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
}
