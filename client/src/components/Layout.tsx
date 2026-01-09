import { Outlet, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MessageCircle, Compass, Film, Gamepad2, Sparkles } from 'lucide-react'

const navItems = [
    { path: '/', icon: MessageCircle, label: 'Chat' },
    { path: '/discover', icon: Compass, label: 'Discover' },
    { path: '/my-shows', icon: Film, label: 'My Shows' },
    { path: '/quiz', icon: Gamepad2, label: 'Quiz' },
]

export default function Layout() {
    return (
        <div className="flex min-h-screen">
            {/* Fixed Sidebar */}
            <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#0d0d15] border-r border-white/10 z-50 flex flex-col">
                {/* Logo */}
                <div className="p-5 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0d0d15]" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Companion</h1>
                            <p className="text-[10px] text-white/40">AI Entertainment Guide</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive
                                    ? 'bg-purple-500/20 text-white border border-purple-500/30'
                                    : 'text-white/50 hover:text-white hover:bg-white/5'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={`p-1.5 rounded-md ${isActive
                                        ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                                        : 'bg-white/10'
                                        }`}>
                                        <item.icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium">{item.label}</span>
                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* User section */}
                <div className="p-3 border-t border-white/10">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                            P
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">Punith</p>
                            <p className="text-[10px] text-white/40">Premium User</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area - with left margin for sidebar */}
            <div
                className="flex-1 bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#1a1a2e] min-h-screen"
                style={{ marginLeft: '256px' }}
            >
                <Outlet />
            </div>

            {/* Background glow effects - behind everything */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-[150px]" />
            </div>
        </div>
    )
}
