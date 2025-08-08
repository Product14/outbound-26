import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Outbound AI - Intelligent Calling Platform',
  description: 'Advanced AI-powered outbound calling platform for automotive dealerships. Automate customer outreach, boost engagement, and drive results.',
  keywords: 'AI calling, outbound automation, automotive CRM, customer engagement, dealership software',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
        <style>{`
html {
  font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
}
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
