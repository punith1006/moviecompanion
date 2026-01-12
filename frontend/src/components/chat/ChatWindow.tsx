import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useChat, Message } from '@/hooks/useChat';
import { ChatContentCard } from './ChatContentCard';
import { QuickReplyChips } from './QuickReplyChips';


export function ChatWindow() {
    const { messages, sendMessage, isLoading, error } = useChat();
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSend = () => {
        if (!inputValue.trim()) return;
        sendMessage(inputValue);
        setInputValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#1a1f35]/50 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl overflow-hidden relative">

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-violet-500/20 scrollbar-track-transparent">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-60">
                        <div className="w-20 h-20 bg-violet-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <Sparkles className="w-10 h-10 text-violet-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Hey there! I'm ReelMind.</h2>
                        <p className="text-gray-400 max-w-md">
                            Your personal entertainment companion. Tell me what you've watched recently, and I'll help you track it, or ask me for a recommendation! 🎬
                        </p>
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                            {["I watched The Bear S3", "Recommend a sci-fi movie", "Quiz me on Breaking Bad", "What happened in Succession?"].map((suggestion, i) => (
                                <button
                                    key={i}
                                    onClick={() => sendMessage(suggestion)}
                                    className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-sm text-gray-300 transition-all text-left"
                                >
                                    "{suggestion}"
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {messages.map((msg) => (
                            <MessageBubble
                                key={msg.id}
                                message={msg}
                                onSendMessage={sendMessage}
                                isLoading={isLoading}
                            />
                        ))}
                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex justify-start"
                            >
                                <div className="bg-[#2a2f45] border border-white/10 rounded-2xl rounded-tl-sm px-6 py-4 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </motion.div>
                        )}
                        {error && (
                            <div className="flex justify-center my-4">
                                <span className="bg-red-500/20 text-red-200 px-4 py-2 rounded-lg text-sm border border-red-500/30">
                                    {error}
                                </span>
                            </div>
                        )}
                    </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#131620]/80 border-t border-white/5 backdrop-blur-md">
                <div className="relative max-w-4xl mx-auto flex items-end gap-3">
                    <div className="relative flex-1 bg-[#1c2128] border border-white/10 rounded-2xl focus-within:border-violet-500/50 focus-within:bg-[#252a3d] transition-all shadow-lg overflow-hidden">
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Tell me what you watched, or ask for a recommendation..."
                            className="w-full bg-transparent text-white px-5 py-4 min-h-[60px] max-h-[120px] focus:outline-none resize-none scrollbar-hide text-[15px] placeholder-gray-500"
                            rows={1}
                        />
                        <div className="absolute right-3 bottom-3 flex gap-2">
                            {/* Future: Voice button */}
                        </div>
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isLoading}
                        className="p-4 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-violet-900/20 transition-all active:scale-95"
                    >
                        <Send className={`w-5 h-5 ${isLoading ? 'opacity-0' : 'opacity-100'}`} />
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            </div>
                        )}
                    </button>
                </div>
                <div className="text-center mt-2">
                    <span className="text-[10px] text-gray-600">ReelMind AI can make mistakes. Have fun! ✨</span>
                </div>
            </div>
        </div>
    );
}

function MessageBubble({ message, onSendMessage, isLoading }: { message: Message; onSendMessage: (msg: string) => void; isLoading?: boolean }) {
    const isUser = message.role === 'user';
    const contentCards = message.metadata?.contentCards || [];
    const suggestedReplies = message.metadata?.suggestedReplies || [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}
        >
            <div className={`max-w-[85%] md:max-w-[75%] flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-lg ${isUser ? 'bg-gradient-to-br from-violet-600 to-indigo-600' : 'bg-[#2a2f45] border border-white/10'
                    }`}>
                    {isUser ? <User className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-violet-400" />}
                </div>

                {/* Content */}
                <div className="flex flex-col gap-3">
                    <div className={`relative px-5 py-3.5 rounded-2xl shadow-sm text-[15px] leading-relaxed ${isUser
                        ? 'bg-violet-600 text-white rounded-tr-sm'
                        : 'bg-[#2a2f45] border border-white/5 text-gray-100 rounded-tl-sm shadow-xl'
                        }`}>
                        {/* Markdown Content */}
                        <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-strong:text-violet-300 prose-headings:text-white">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>

                        {/* Metadata/Tools display */}
                        {!isUser && message.metadata && (
                            <div className="mt-2 flex gap-2">
                                {message.metadata.type === 'recap' && <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/20">📝 Recap</span>}
                                {message.metadata.type === 'recommendation' && <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/20">✨ Recommendation</span>}
                                {message.metadata.type === 'discovery' && <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/20">🔮 Discovery</span>}
                                {message.metadata.type === 'quiz' && <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full border border-green-500/20">🎯 Quiz</span>}
                            </div>
                        )}
                    </div>

                    {/* Quick Reply Chips - Right after the response */}
                    {!isUser && suggestedReplies.length > 0 && (
                        <QuickReplyChips
                            replies={suggestedReplies}
                            onChipClick={onSendMessage}
                            disabled={isLoading}
                        />
                    )}

                    {/* Content Cards - 3-column grid, max 2 rows (6 cards) */}
                    {!isUser && contentCards.length > 0 && (
                        <div className="w-full max-w-[600px] mt-1">
                            <div className="grid grid-cols-3 gap-3">
                                {contentCards.slice(0, 6).map((item) => (
                                    <ChatContentCard key={item.id} item={item} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
