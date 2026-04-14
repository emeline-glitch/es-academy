interface ReadingTimeProps {
  blocks: Array<Record<string, unknown>>;
}

export function getReadingTime(blocks: Array<Record<string, unknown>>): number {
  let wordCount = 0;

  for (const block of blocks) {
    const data = block[block.type as string] as { rich_text?: Array<{ plain_text: string }> };
    if (data?.rich_text) {
      for (const rt of data.rich_text) {
        wordCount += rt.plain_text.split(/\s+/).length;
      }
    }
  }

  return Math.max(1, Math.ceil(wordCount / 200));
}

export function ReadingTime({ blocks }: ReadingTimeProps) {
  const minutes = getReadingTime(blocks);

  return (
    <span className="inline-flex items-center gap-1 text-sm text-white/50">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {minutes} min de lecture
    </span>
  );
}
