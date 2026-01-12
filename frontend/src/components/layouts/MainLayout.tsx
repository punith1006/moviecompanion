'use client';

import { useState, createContext, useContext, ReactNode } from 'react';
import { Sidebar, BottomNav, Header } from '@/components/layouts';
import { ChatOverlay } from '@/components/chat/ChatOverlay';

interface SidebarContextType {
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
    toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
    isCollapsed: false,
    setIsCollapsed: () => { },
    toggleSidebar: () => { },
});

export const useSidebar = () => useContext(SidebarContext);

interface MainLayoutProps {
    children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    return (
        <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, toggleSidebar }}>
            <div className="flex h-screen overflow-hidden bg-background">
                {/* Desktop Sidebar */}
                <Sidebar />

                {/* Main Content - adjusts based on sidebar state */}
                <main className="flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300">
                    {/* Mobile Header */}
                    <Header />

                    {/* Page Content */}
                    <div className="flex-1 overflow-hidden pt-14 pb-16 lg:pt-0 lg:pb-0">
                        {children}
                    </div>

                    {/* Mobile Bottom Nav */}
                    <BottomNav />
                </main>

                {/* Global Chat Overlay */}
                <ChatOverlay />
            </div>
        </SidebarContext.Provider>
    );
}
