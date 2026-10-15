import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const key = params.key ?? '';
  if (!/^[0-9a-f-]{36}$/i.test(key)) return new Response('Không thấy ảnh.', { status: 404 });
  const bucket = locals.runtime?.env?.IMAGES;
  if (!bucket) return new Response('Kho ảnh chưa được cấu hình.', { status: 404 });
  const object = await bucket.get(key);
  if (!object) return new Response('Không thấy ảnh.', { status: 404 });
  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
