'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Profile } from '@/types/database'
import {
    Clock,
    Calendar,
    BarChart3,
    CheckSquare,
    Users,
    Settings,
    FileText,
    LogOut,
    Menu,
    X
} from 'lucide-react'

interface SidebarProps {
    profile: Profile
    isOpen?: boolean
    onClose?: () => void
}

export default function Sidebar({ profile, isOpen, onClose }: SidebarProps) {
    const pathname = usePathname()

    const staffLinks = [
        { href: '/dashboard', label: '打刻', icon: Clock },
        { href: '/history', label: '勤怠履歴', icon: Calendar },
        { href: '/monthly', label: '月次サマリー', icon: BarChart3 },
        { href: '/corrections', label: '修正申請', icon: FileText },
    ]

    const managerLinks = [
        { href: '/dashboard', label: '打刻', icon: Clock },
        { href: '/history', label: '勤怠履歴', icon: Calendar },
        { href: '/monthly', label: '月次サマリー', icon: BarChart3 },
        { href: '/approvals', label: '承認管理', icon: CheckSquare },
        { href: '/staff', label: '部下一覧', icon: Users },
    ]

    const ownerLinks = [
        { href: '/dashboard', label: '概要', icon: BarChart3 },
        { href: '/history', label: '勤怠履歴', icon: Calendar },
        { href: '/monthly', label: '月次集計', icon: BarChart3 },
        { href: '/approvals', label: '承認管理', icon: CheckSquare },
        { href: '/staff', label: 'スタッフ管理', icon: Users },
        { href: '/settings', label: '設定', icon: Settings },
    ]

    const links = profile.role === 'owner' ? ownerLinks :
        profile.role === 'manager' ? managerLinks : staffLinks

    const handleLinkClick = () => {
        if (onClose) onClose()
    }

    const sidebarContent = (
        <>
            <div className="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-gray-900">勤怠・アポ管理</h1>
                    <div className="mt-2">
                        <p className="text-sm font-medium text-gray-900">{profile.full_name}</p>
                        <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
                    </div>
                </div>
                {/* Mobile close button */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="md:hidden p-2 -mr-2 text-gray-500 hover:text-gray-700 transition-colors"
                        aria-label="メニューを閉じる"
                    >
                        <X className="w-6 h-6" />
                    </button>
                )}
            </div>

            <nav className="flex-1 p-4 overflow-y-auto">
                <ul className="space-y-1">
                    {links.map((link) => {
                        const Icon = link.icon
                        const isActive = pathname === link.href
                        return (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    onClick={handleLinkClick}
                                    className={`flex items-center gap-3 px-3 py-3 md:py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {link.label}
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            <div className="p-4 border-t border-gray-200">
                <form action="/auth/signout" method="post">
                    <button className="flex items-center gap-3 px-3 py-3 md:py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md w-full transition-colors">
                        <LogOut className="w-5 h-5" />
                        ログアウト
                    </button>
                </form>
            </div>
        </>
    )

    // Desktop: Static sidebar
    // Mobile: Overlay sidebar (controlled by parent)
    return (
        <>
            {/* Desktop sidebar - always visible */}
            <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 min-h-screen flex-col">
                {sidebarContent}
            </aside>

            {/* Mobile overlay */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={onClose}
                        aria-hidden="true"
                    />
                    {/* Slide-in sidebar */}
                    <aside className="fixed inset-y-0 left-0 w-72 bg-white z-50 flex flex-col shadow-xl md:hidden animate-slide-in">
                        {sidebarContent}
                    </aside>
                </>
            )}
        </>
    )
}

// Mobile header component for DashboardLayout
export function MobileHeader({ onMenuClick, title }: { onMenuClick: () => void; title?: string }) {
    return (
        <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
            <button
                onClick={onMenuClick}
                className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="メニューを開く"
            >
                <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">{title || '勤怠・アポ管理'}</h1>
        </header>
    )
}
