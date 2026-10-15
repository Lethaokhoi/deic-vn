export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T>(): Promise<T | null>;
  run(): Promise<unknown>;
  all<T>(): Promise<{ results: T[] }>;
}

export interface AppDb {
  prepare(query: string): D1Statement;
  batch(statements: D1Statement[]): Promise<unknown>;
}

export interface StoredImage {
  body: ReadableStream;
  httpMetadata?: { contentType?: string };
}

export interface AppImages {
  put(
    key: string,
    value: ArrayBuffer | Uint8Array,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
  get(key: string): Promise<StoredImage | null>;
  delete(key: string): Promise<void>;
}

export interface CfEnv {
  DB: AppDb;
  IMAGES: AppImages;
  SESSION_SECRET?: string;
  CLUB_PASSWORD?: string;
}
