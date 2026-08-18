import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tentwood Trips — CRM',
  description: 'Customer Relationship Management Platform for Tentwood Trips',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}