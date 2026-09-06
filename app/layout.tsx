import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: '2D Multiplayer Space Combat',
  description: 'A real-time 2D multiplayer space combat arena with WebRTC peer-to-peer networking, ready for free hosting on GitHub Pages.',
  openGraph: {
    title: '2D Multiplayer Space Combat',
    description: 'A real-time 2D multiplayer space combat arena with WebRTC peer-to-peer networking, ready for free hosting on GitHub Pages.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '2D Multiplayer Space Combat',
    description: 'A real-time 2D multiplayer space combat arena with WebRTC peer-to-peer networking, ready for free hosting on GitHub Pages.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
