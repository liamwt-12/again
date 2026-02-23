import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'again — recurring tasks that refuse to disappear.',
  description: 'no boards. no projects. just recurring tasks. add it once. see it again until it\'s done.',
  openGraph: {
    title: 'again — recurring tasks that refuse to disappear.',
    description: 'no boards. no projects. just recurring tasks. add it once. see it again until it\'s done.',
    url: 'https://getagain.co.uk',
    siteName: 'again',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
