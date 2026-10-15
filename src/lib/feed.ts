import { listClubPosts } from './db';
import { postImage } from './images';
import { getPosts } from './posts';
import type { AppDb } from './cloudflare';

export type ClubCard = {
  href: string;
  title: string;
  description: string;
  date: Date;
  image?: string;
  imageAlt?: string;
  tags?: string[];
};

export async function clubFeed(db?: AppDb): Promise<ClubCard[]> {
  const written = await getPosts();
  const fromAccount = db ? await listClubPosts(db) : [];
  return [
    ...written.map((post) => ({
      href: `/bai-viet/${post.id}/`,
      title: post.data.title,
      description: post.data.description,
      date: post.data.pubDate,
      image: post.data.image,
      imageAlt: post.data.imageAlt,
      tags: post.data.tags,
    })),
    ...fromAccount.map((post) => ({
      href: `/bai-viet/clb/${post.id}/`,
      title: post.title,
      description: post.description,
      date: new Date(post.updatedAt),
      image: postImage(post.imageKey, post.updatedAt) ?? undefined,
      imageAlt: post.title,
    })),
  ].sort((a, b) => b.date.valueOf() - a.date.valueOf());
}
