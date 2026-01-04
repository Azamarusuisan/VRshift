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
    LogOut
} from 'lucide-react'

interface SidebarProps {
    profile: Profile
}

export default function Sidebar({ profile }: SidebarProps) {
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

    return (
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
            <div className="p-6 border-b border-gray-200">
                <h1 className="text-lg font-semibold text-gray-900">勤怠・アポ管理</h1>
                <div className="mt-2">
                    <p className="text-sm font-medium text-gray-900">{profile.full_name}</p>
                    <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
                </div>
            </div>

            <nav className="flex-1 p-4">
                <ul className="space-y-1">
                    {links.map((link) => {
                        const Icon = link.icon
                        const isActive = pathname === link.href
                        return (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
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
                    <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md w-full transition-colors">
                        <LogOut className="w-5 h-5" />
                        ログアウト
                    </button>
                </form>
            </div>
        </aside>
    )
}
