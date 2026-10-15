import type { APIRoute } from 'astro';
import { sameOrigin } from '../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, redirect, request }) => {
  if (!sameOrigin(request)) return new Response('Yêu cầu không hợp lệ.', { status: 403 });
  cookies.delete('deic_session', { path: '/' });
  return redirect('/');
};

export const GET: APIRoute = () => new Response('Hãy dùng nút đăng xuất.', { status: 405 });
