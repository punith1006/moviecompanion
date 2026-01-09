import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, Wand2, History, Zap, ChevronRight } from 'lucide-react'
import axios from 'axios'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

const quickActions = [
    { icon: Wand2, label: 'Get Recommendations', prompt: 'Recommend me something to watch based on my taste' },
    { icon: History, label: 'What did I watch?', prompt: "What have I been watching lately?" },
    { icon: Zap, label: 'Start Quiz', prompt: "Let's play a quiz about my shows!" },
    { icon: Sparkles, label: 'Something Fun', prompt: 'I want something light and funny to watch' },
]

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: `Hey there! 👋 I'm your **Movie & Series Companion** – your personal AI entertainment guide.\n\nI can help you:\n• 📚 **Track** what you've watched\n• 🎯 **Discover** personalized recommendations\n• 📖 **Recap** where you left off in any series\n• 🎮 **Quiz** you on your favorite shows\n\nTell me about something you recently watched, or try one of the quick actions below!`,
            timestamp: new Date(),
        },
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const sendMessage = async (content: string) => {
        if (!content.trim() || isLoading) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: content.trim(),
            timestamp: new Date(),
        }

        setMessages((prev) => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        try {
            const response = await axios.post('/api/chat', {
                message: content,
                user_id: 'default_user',
            })

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.data.response,
                timestamp: new Date(),
            }

            setMessages((prev) => [...prev, assistantMessage])
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm having trouble connecting right now. Please make sure the backend server is running on port 8000.",
                timestamp: new Date(),
            }
            setMessages((prev) => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    const formatContent = (content: string) => {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-purple-300">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/•/g, '<span class="text-purple-400">•</span>')
            .replace(/\n/g, '<br />')
    }

    return (
        <div className="h-screen flex flex-col relative">
            {/* Header */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="p-6 border-b border-white/10 glass sticky top-0 z-40"
            >
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold gradient-text">Chat with Companion</h1>
                    <p className="text-white/50 mt-1">Ask anything about movies & shows</p>
                </div>
            </motion.header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    <AnimatePresence>
                        {messages.map((message, index) => (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                {/* Avatar */}
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${message.role === 'user'
                                            ? 'bg-gradient-to-br from-cyan-400 to-blue-500'
                                            : 'bg-gradient-to-br from-purple-500 to-pink-500'
                                        }`}
                                >
                                    {message.role === 'user' ? (
                                        <span className="text-white font-bold">P</span>
                                    ) : (
                                        <Sparkles className="w-5 h-5 text-white" />
                                    )}
                                </div>

                                {/* Message bubble */}
                                <div
                                    className={`max-w-[80%] ${message.role === 'user' ? 'ml-auto' : 'mr-auto'
                                        }`}
                                >
                                    <div
                                        className={`rounded-2xl px-5 py-4 ${message.role === 'user'
                                                ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-500/30'
                                                : 'glass'
                                            }`}
                                    >
                                        <div
                                            className="text-white/90 leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
                                        />
                                    </div>
                                    <p className="text-xs text-white/30 mt-2 px-2">
                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Loading indicator */}
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-4"
                        >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white animate-pulse" />
                            </div>
                            <div className="glass rounded-2xl px-5 py-4">
                                <div className="flex gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-purple-400 typing-dot" />
                                    <div className="w-2 h-2 rounded-full bg-purple-400 typing-dot" />
                                    <div className="w-2 h-2 rounded-full bg-purple-400 typing-dot" />
                                </div>
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Quick Actions */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="px-6 pb-4"
            >
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-wrap gap-2">
                        {quickActions.map((action) => (
                            <button
                                key={action.label}
                                onClick={() => sendMessage(action.prompt)}
                                disabled={isLoading}
                                className="group flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-sm text-white/70 hover:text-white hover:border-purple-500/50 transition-all duration-300 disabled:opacity-50"
                            >
                                <action.icon className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
                                {action.label}
                                <ChevronRight className="w-3 h-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Input */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="p-6 border-t border-white/10 glass"
            >
                <div className="max-w-4xl mx-auto">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        sendMessage(input)
                                    }
                                }}
                                placeholder="Tell me about a show you watched, ask for recommendations..."
                                rows={1}
                                className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 resize-none text-white placeholder:text-white/40 transition-all"
                            />
                        </div>
                        <button
                            onClick={() => sendMessage(input)}
                            disabled={!input.trim() || isLoading}
                            className="w-14 h-14 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-xs text-white/30 mt-2 text-center">
                        Press Enter to send · Shift+Enter for new line
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
