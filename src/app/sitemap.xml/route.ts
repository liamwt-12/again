import { posts } from '../blog/posts';

export async function GET() {
  const baseUrl = 'https://getagain.co.uk';

  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'weekly' },
    { url: '/blog', priority: '0.8', changefreq: 'weekly' },
    { url: '/onboarding', priority: '0.9', changefreq: 'monthly' },
    { url: '/dashboard', priority: '0.5', changefreq: 'monthly' },
  ];

  const blogPages = posts.map((post) => ({
    url: `/blog/${post.slug}`,
    priority: '0.7',
    changefreq: 'monthly',
  }));

  const allPages = [...staticPages, ...blogPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map((page) => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
