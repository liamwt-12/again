import Link from 'next/link';
import styles from './blog.module.css';
import { posts } from './posts';

export const metadata = {
  title: 'Blog — again',
  description: 'Guides and tips for staying on top of recurring tasks with SMS reminders.',
  openGraph: {
    title: 'Blog — again',
    description: 'Guides and tips for staying on top of recurring tasks with SMS reminders.',
    url: 'https://getagain.co.uk/blog',
  },
};

export default function BlogIndex() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.wordmark}>again</Link>
        <div className={styles.rule} />
        <h1 className={styles.title}>blog</h1>
        <p className={styles.sub}>tips, guides, and the odd rant about forgetting things.</p>
      </header>

      <div className={styles.grid}>
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className={styles.card}>
            <div className={styles.cardCategory}>{post.category}</div>
            <h2 className={styles.cardTitle}>{post.title}</h2>
            <p className={styles.cardDesc}>{post.description}</p>
            <div className={styles.cardMeta}>{post.readTime} read</div>
          </Link>
        ))}
      </div>

      <footer className={styles.footer}>
        <div className={styles.rule} />
        <div className={styles.footerContent}>
          <Link href="/" className={styles.footerLink}>again</Link>
          <Link href="/onboarding" className={styles.footerCta}>start free →</Link>
        </div>
      </footer>
    </div>
  );
}
