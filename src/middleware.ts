import { defineMiddleware } from 'astro:middleware';
import { clubPassword, readSession, sessionSecret } from './lib/auth';
import { ensureSchema, findUserById } from './lib/db';

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = null;
  const env = context.locals.runtime?.env;
  if (!env?.DB) return next();

  try {
    await ensureSchema(env.DB, clubPassword(env));
    const secret = sessionSecret(env);
    const userId = await readSession(context.cookies.get('deic_session')?.value, secret);
    if (userId) context.locals.user = await findUserById(env.DB, userId);
  } catch (error) {
    console.error(error);
  }

  return next();
});
