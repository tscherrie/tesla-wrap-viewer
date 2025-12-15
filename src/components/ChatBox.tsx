import { useState, useEffect, useRef } from 'react'
import { Socket } from 'socket.io-client'

interface ChatBoxProps {
    socket: Socket | null
}

interface Message {
    id: string
    text: string
    timestamp: number
    senderId: string
}

export function ChatBox({ socket }: ChatBoxProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!socket) return;

        const handleMessage = (msg: { id: string, text: string, timestamp: number }) => {
            setMessages(prev => [...prev, { ...msg, senderId: msg.id }])
        }

        socket.on('chat-message', handleMessage);

        return () => {
            socket.off('chat-message', handleMessage);
        }
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && socket) {
            socket.emit('chat-message', input);
            setInput('');
        }
    }

    return (
        <div className="absolute bottom-4 left-4 w-80 bg-black/50 backdrop-blur-md rounded-lg p-4 text-white z-40 flex flex-col gap-2 max-h-60">
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
