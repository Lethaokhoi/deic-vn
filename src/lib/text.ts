export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

type BlockKind = 'p' | 'h' | 'ul' | 'ol' | 'quote';

export function paragraphs(value: string): string {
  const blocks: { kind: BlockKind; lines: string[] }[] = [];
  let current: { kind: BlockKind; lines: string[] } | null = null;
  const close = () => {
    if (current && current.lines.length) blocks.push(current);
    current = null;
  };

  for (const raw of value.replaceAll('\r\n', '\n').split('\n')) {
    const line = raw.trim();
    if (!line) {
      close();
      continue;
    }
    const kind: BlockKind = /^#{2,3} /.test(line)
      ? 'h'
      : /^[-*] /.test(line)
        ? 'ul'
        : /^\d+\. /.test(line)
          ? 'ol'
          : line === '>' || line.startsWith('> ')
            ? 'quote'
            : 'p';
    if (kind === 'h') {
      close();
      blocks.push({ kind, lines: [line] });
      continue;
    }
    if (!current || current.kind !== kind) {
      close();
      current = { kind, lines: [line] };
    } else current.lines.push(line);
  }
  close();
  return blocks.map(renderBlock).join('');
}

function renderBlock(block: { kind: BlockKind; lines: string[] }): string {
  if (block.kind === 'h') {
    const heading = block.lines[0].match(/^(#{2,3}) (.+)$/);
    const tag = heading?.[1].length === 2 ? 'h2' : 'h3';
    return `<${tag}>${inline(escapeHtml(heading?.[2] ?? block.lines[0]))}</${tag}>`;
  }
  if (block.kind === 'ul') {
    return `<ul>${block.lines.map((line) => `<li>${inline(escapeHtml(line.slice(2)))}</li>`).join('')}</ul>`;
  }
  if (block.kind === 'ol') {
    return `<ol>${block.lines.map((line) => `<li>${inline(escapeHtml(line.replace(/^\d+\. /, '')))}</li>`).join('')}</ol>`;
  }
  if (block.kind === 'quote') {
    const quote = block.lines.map((line) => inline(escapeHtml(line.replace(/^>\s?/, '')))).join('<br />');
    return `<blockquote><p>${quote}</p></blockquote>`;
  }
  return `<p>${block.lines.map((line) => inline(escapeHtml(line))).join('<br />')}</p>`;
}

function inline(escaped: string): string {
  return escaped
    .replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
}
