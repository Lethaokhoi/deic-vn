import { CLUB_ACCOUNT_NAME, CLUB_EMAIL, hashPassword } from './auth';
import type { AppDb } from './cloudflare';
import type { BusinessPost, SessionUser, UserRole } from './types';

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  business_name: string;
  role: string | null;
};

type PostRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  body: string;
  image_key: string | null;
  updated_at: string;
  business_name: string;
  role: string | null;
};

const POST_SELECT = `SELECT posts.id, posts.user_id, posts.title, posts.description, posts.body, posts.image_key, posts.updated_at,
  users.business_name, users.role
  FROM posts JOIN users ON users.id = posts.user_id`;

let schemaReady: Promise<void> | null = null;

export function ensureSchema(db: AppDb, clubPass: string | null): Promise<void> {
  schemaReady ??= (async () => {
    await db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        business_name TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        body TEXT NOT NULL,
        image_key TEXT,
        updated_at TEXT NOT NULL
      )`),
    ]);
    await addRoleColumn(db);
    await allowManyPosts(db);
    if (clubPass) await seedClubUser(db, clubPass);
  })().catch((error) => {
    schemaReady = null;
    throw error;
  });
  return schemaReady;
}

async function addRoleColumn(db: AppDb) {
  try {
    await db.prepare("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'business'").run();
  } catch {
    // Cột role đã có.
  }
}

async function allowManyPosts(db: AppDb) {
  const row = await db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'posts'")
    .first<{ sql: string }>();
  if (!row?.sql || !/user_id[^,]*unique/i.test(row.sql)) return;
  await db.batch([
    db.prepare(`CREATE TABLE posts_new (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      body TEXT NOT NULL,
      image_key TEXT,
      updated_at TEXT NOT NULL
    )`),
    db.prepare(`INSERT INTO posts_new (id, user_id, title, description, body, image_key, updated_at)
      SELECT id, user_id, title, description, body, image_key, updated_at FROM posts`),
    db.prepare('DROP TABLE posts'),
    db.prepare('ALTER TABLE posts_new RENAME TO posts'),
  ]);
}

async function seedClubUser(db: AppDb, password: string) {
  const existing = await findUserByEmail(db, CLUB_EMAIL);
  if (existing) return;
  await createUser(db, {
    email: CLUB_EMAIL,
    businessName: CLUB_ACCOUNT_NAME,
    passwordHash: await hashPassword(password),
    role: 'club',
  });
}

export async function createUser(
  db: AppDb,
  input: { email: string; passwordHash: string; businessName: string; role?: UserRole },
): Promise<SessionUser> {
  const id = crypto.randomUUID();
  const role = input.role ?? 'business';
  await db
    .prepare('INSERT INTO users (id, email, password_hash, business_name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, input.email, input.passwordHash, input.businessName, role, new Date().toISOString())
    .run();
  return { id, email: input.email, businessName: input.businessName, role };
}

export async function findUserByEmail(db: AppDb, email: string): Promise<(SessionUser & { passwordHash: string }) | null> {
  const row = await db
    .prepare('SELECT id, email, password_hash, business_name, role FROM users WHERE email = ?')
    .bind(email)
    .first<UserRow>();
  return row ? mapUser(row) : null;
}

export async function findUserById(db: AppDb, id: string): Promise<SessionUser | null> {
  const row = await db
    .prepare('SELECT id, email, password_hash, business_name, role FROM users WHERE id = ?')
    .bind(id)
    .first<UserRow>();
  if (!row) return null;
  const user = mapUser(row);
  return { id: user.id, email: user.email, businessName: user.businessName, role: user.role };
}

export async function listPosts(db: AppDb): Promise<BusinessPost[]> {
  const result = await db
    .prepare(`${POST_SELECT} WHERE users.role = 'business' ORDER BY posts.updated_at DESC`)
    .all<PostRow>();
  return result.results.map(mapPost);
}

export async function listClubPosts(db: AppDb): Promise<BusinessPost[]> {
  const result = await db
    .prepare(`${POST_SELECT} WHERE users.role = 'club' ORDER BY posts.updated_at DESC`)
    .all<PostRow>();
  return result.results.map(mapPost);
}

export async function listPostsByUser(db: AppDb, userId: string): Promise<BusinessPost[]> {
  const result = await db.prepare(`${POST_SELECT} WHERE posts.user_id = ? ORDER BY posts.updated_at DESC`).bind(userId).all<PostRow>();
  return result.results.map(mapPost);
}

export async function getPost(db: AppDb, id: string): Promise<BusinessPost | null> {
  const row = await db.prepare(`${POST_SELECT} WHERE posts.id = ?`).bind(id).first<PostRow>();
  return row ? mapPost(row) : null;
}

export async function getPostByUser(db: AppDb, userId: string): Promise<BusinessPost | null> {
  const row = await db.prepare(`${POST_SELECT} WHERE posts.user_id = ?`).bind(userId).first<PostRow>();
  return row ? mapPost(row) : null;
}

export async function saveBusinessPost(
  db: AppDb,
  userId: string,
  input: { title: string; description: string; body: string; imageKey: string | null },
): Promise<BusinessPost> {
  const now = new Date().toISOString();
  const existing = await getPostByUser(db, userId);
  if (existing) {
    await db
      .prepare(
        'UPDATE posts SET title = ?, description = ?, body = ?, image_key = COALESCE(?, image_key), updated_at = ? WHERE id = ? AND user_id = ?',
      )
      .bind(input.title, input.description, input.body, input.imageKey, now, existing.id, userId)
      .run();
    const post = await getPost(db, existing.id);
    if (!post) throw new Error('Không lưu được bài');
    return post;
  }
  const id = crypto.randomUUID();
  await db
    .prepare('INSERT INTO posts (id, user_id, title, description, body, image_key, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id, userId, input.title, input.description, input.body, input.imageKey, now)
    .run();
  const post = await getPost(db, id);
  if (!post) throw new Error('Không lưu được bài');
  return post;
}

export async function saveClubPost(
  db: AppDb,
  userId: string,
  input: { id: string; title: string; description: string; body: string; imageKey: string | null },
): Promise<BusinessPost> {
  const now = new Date().toISOString();
  const existing = await getPost(db, input.id);
  if (existing) {
    if (existing.userId !== userId || existing.role !== 'club') throw new Error('Không sửa được bài này');
    await db
      .prepare(
        'UPDATE posts SET title = ?, description = ?, body = ?, image_key = COALESCE(?, image_key), updated_at = ? WHERE id = ? AND user_id = ?',
      )
      .bind(input.title, input.description, input.body, input.imageKey, now, input.id, userId)
      .run();
  } else {
    await db
      .prepare('INSERT INTO posts (id, user_id, title, description, body, image_key, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(input.id, userId, input.title, input.description, input.body, input.imageKey, now)
      .run();
  }
  const post = await getPost(db, input.id);
  if (!post) throw new Error('Không lưu được bài');
  return post;
}

export async function deletePostByUser(db: AppDb, userId: string): Promise<string | null> {
  const existing = await getPostByUser(db, userId);
  if (!existing || existing.role === 'club') return null;
  await db.prepare('DELETE FROM posts WHERE id = ? AND user_id = ?').bind(existing.id, userId).run();
  return existing.imageKey;
}

export async function deleteClubPost(db: AppDb, userId: string, postId: string): Promise<string | null> {
  const existing = await getPost(db, postId);
  if (!existing || existing.userId !== userId) return null;
  await db.prepare('DELETE FROM posts WHERE id = ? AND user_id = ?').bind(postId, userId).run();
  return existing.imageKey;
}

function mapUser(row: UserRow): SessionUser & { passwordHash: string } {
  return {
    id: row.id,
    email: row.email,
    businessName: row.business_name,
    role: row.role === 'club' ? 'club' : 'business',
    passwordHash: row.password_hash,
  };
}

function mapPost(row: PostRow): BusinessPost {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    body: row.body,
    imageKey: row.image_key,
    updatedAt: row.updated_at,
    businessName: row.business_name,
    role: row.role === 'club' ? 'club' : 'business',
  };
}
