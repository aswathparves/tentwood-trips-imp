import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ backgroundColor: '#fafaf9', minHeight: '100vh' }}>
      <Sidebar />

      <div className="main-content">
        {children}
      </div>

      {/* CHANGE: Mobile-only bottom navigation */}
      <MobileNav />
    </div>
  )
}