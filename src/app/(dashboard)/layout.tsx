import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'
import SessionTimeout from '@/components/auth/SessionTimeout'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ backgroundColor: '#fafaf9', minHeight: '100vh' }}>
      <Sidebar />
      <SessionTimeout />

      <div className="main-content">
        {children}
      </div>

      <MobileNav />
    </div>
  )
}