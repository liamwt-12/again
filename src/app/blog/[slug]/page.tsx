import Link from 'next/link';
import { notFound } from 'next/navigation';
import WaitingList from '@/components/WaitingList';
import styles from '../blog.module.css';
import { posts } from '../posts';
import { articleContent } from './content';
import type { Metadata } from 'next';

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = posts.find((p) => p.slug === params.slug);
  if (!post) return {};
  return {
    title: post.metaTitle,
    description: post.metaDescription,
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      url: `https://getagain.co.uk/blog/${post.slug}`,
      type: 'article',
    },
  };
}

export default function BlogPost({ params }: Props) {
  const post = posts.find((p) => p.slug === params.slug);
  if (!post) notFound();

  const content = articleContent[params.slug] || '';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.wordmark}>again</Link>
        <div className={styles.rule} />
        <Link href="/blog" style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--text-3)', textDecoration: 'none' }}>
          ← all posts
        </Link>
      </header>

      <article className={styles.article}>
        <div className={styles.articleCategory}>{post.category}</div>
        <h1 className={styles.articleTitle}>{post.title}</h1>
        <div className={styles.articleMeta}>{post.readTime} read</div>
        <div className={styles.articleBody} dangerouslySetInnerHTML={{ __html: content }} />

        <div className={styles.ctaBox}>
          <div className={styles.ctaTitle}>not taking new signups.</div>
          <WaitingList center />
        </div>
      </article>

      <footer className={styles.footer}>
        <div className={styles.rule} />
        <div className={styles.footerContent}>
          <Link href="/" className={styles.footerLink}>again</Link>
          <Link href="/blog" className={styles.footerCta}>more posts →</Link>
        </div>
      </footer>
    </div>
  );
}
