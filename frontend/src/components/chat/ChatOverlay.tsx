import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function ChatOverlay() {
    const [open, setOpen] = useState(false);

    // Floating chat widget commented out
    return null;
    /*
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    className="fixed bottom-6 right-6 p-4 rounded-full bg-violet-600 hover:bg-violet-500 text-white shadow-2xl shadow-violet-900/50 transition-all hover:scale-105 z-50 flex items-center gap-2 group"
                    aria-label="Open AI Chat"
                >
                    <MessageSquare className="w-6 h-6" />
                    <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-medium">
                        Chat with ReelMind
                    </span>
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl h-[80vh] p-0 border-white/10 bg-[#131620] overflow-hidden">
                <ChatWindow />
            </DialogContent>
        </Dialog>
    );
    */
}
