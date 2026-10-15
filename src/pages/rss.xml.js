import rss from '@astrojs/rss';
import { listPosts } from '../lib/db';
import { clubFeed } from '../lib/feed';
import { site } from '../data/site';

export async function GET(context) {
  const db = context.locals.runtime?.env?.DB;
  const posts = await clubFeed(db);
  const businesses = db ? await listPosts(db) : [];
  return rss({
    title: `${site.name} · ${site.clubName}`,
    description: site.description,
    site: context.site,
    items: [
      ...businesses.map((post) => ({
        title: post.title,
        pubDate: new Date(post.updatedAt),
        description: post.description,
        link: `/doanh-nghiep/${post.id}/`,
      })),
      ...posts.map((post) => ({
        title: post.title,
        pubDate: post.date,
        description: post.description,
        link: post.href,
      })),
    ],
    customData: '<language>vi-vn</language>',
  });
}
