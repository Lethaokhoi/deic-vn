/// <reference types="astro/client" />

type Runtime = import('@astrojs/cloudflare').Runtime<import('./lib/cloudflare').CfEnv>;

declare namespace App {
  interface Locals extends Runtime {
    user: import('./lib/types').SessionUser | null;
  }
}
