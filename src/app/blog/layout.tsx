import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog — again',
  description: 'Tips, guides, and stories about staying on top of recurring tasks. No apps. Just SMS.',
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
