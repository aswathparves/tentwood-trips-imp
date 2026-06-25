import Sidebar from '@/components/layout/Sidebar'

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
    </div>
  )
}