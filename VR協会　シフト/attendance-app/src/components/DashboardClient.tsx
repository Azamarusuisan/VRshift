'use client'

import { useState } from 'react'
import Sidebar, { MobileHeader } from '@/components/Sidebar'
import { Profile } from '@/types/database'

interface DashboardClientProps {
    children: React.ReactNode
    profile: Profile
}

export default function DashboardClient({ children, profile }: DashboardClientProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar
                profile={profile}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <div className="flex-1 flex flex-col min-h-screen md:min-h-0">
                <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
