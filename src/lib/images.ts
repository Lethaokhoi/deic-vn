const MAX_BYTES = 2_500_000;

export function sniffImage(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

export async function readUpload(file: FormDataEntryValue | null): Promise<{ bytes: Uint8Array; type: string } | { error: string } | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > MAX_BYTES) return { error: 'Ảnh cần nhỏ hơn 2,5 MB.' };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffImage(bytes);
  if (!type) return { error: 'Chỉ nhận ảnh JPEG, PNG hoặc WebP.' };
  return { bytes, type };
}

export function postImage(imageKey: string | null, updatedAt?: string): string | null {
  if (!imageKey) return null;
  const version = updatedAt ? `?v=${encodeURIComponent(updatedAt)}` : '';
  return `/anh/${imageKey}/${version}`;
}
