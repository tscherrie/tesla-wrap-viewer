import { useState, useEffect, useRef } from 'react'
import { Socket } from 'socket.io-client'

interface ChatBoxProps {
    socket: Socket | null
    targetId: string
    targetLabel?: string
    onClose?: () => void
}

interface Message {
    senderId: string
    recipientId: string
    text: string
    timestamp: number
}

export function ChatBox({ socket, targetId, targetLabel, onClose }: ChatBoxProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!socket) return;

        const handleMessage = (msg: { id: string, to: string, text: string, timestamp: number }) => {
            // Only render messages for the active conversation
            if (msg.id !== targetId && msg.to !== targetId) return;
            setMessages(prev => [...prev, {
                senderId: msg.id,
                recipientId: msg.to,
                text: msg.text,
                timestamp: msg.timestamp
            }])
        }

        socket.on('chat-message', handleMessage);

        return () => {
            socket.off('chat-message', handleMessage);
        }
    }, [socket, targetId]);

    // Reset history when switching to a new chat target
    useEffect(() => {
        setMessages([]);
        setInput('');
    }, [targetId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && socket) {
            socket.emit('chat-message', { to: targetId, text: input });
            setInput('');
        }
    }

    return (
        <div className="absolute bottom-4 left-4 w-80 bg-black/50 backdrop-blur-md rounded-lg p-4 text-white z-40 flex flex-col gap-2 max-h-60">
            <div className="flex items-center justify-between text-sm text-white/80">
                <div className="font-semibold">Chat with {targetLabel ?? `Player ${targetId.slice(0, 4)}`}</div>
                {onClose && (
                    <button
                        className="text-white/60 hover:text-white text-xs"
                        onClick={onClose}
                    >
                        Close
                    </button>
                )}
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 min-h-[100px] scrollbar-thin scrollbar-thumb-white/20">
                {messages.map((msg, i) => (
                    <div key={i} className="text-sm">
                        <span className="font-bold text-blue-400">
                            {msg.senderId === socket?.id ? 'Me' : `Player ${msg.senderId.slice(0, 4)}`}:
                        </span>
                        <span className="ml-1 break-words">{msg.text}</span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-white/10 border border-white/20 rounded px-2 py-1 text-sm focus:outline-none focus:border-white/50"
                    placeholder="Type a message..."
                    onKeyDown={(e) => e.stopPropagation()} // Prevent interfering with game controls
                />
            </form>
        </div>
    )
}
