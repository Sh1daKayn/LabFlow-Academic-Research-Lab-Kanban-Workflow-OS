import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'LabFlow | Academic Research Lab Kanban & Workflow OS',
  description:
    'Paper-Driven & Blocker-Aware Workflow OS for Academic Research Labs. Reverse DDL planning, 6-stage publication pipeline, math & compute blocker escalation, and PPT-less group meeting standups.',
  keywords: [
    'Academic Lab OS',
    'Research Kanban',
    'Paper Pipeline',
    'Overleaf Workflow',
    'Reverse DDL',
    'Lab Management',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}
