import { renderBlocks } from "@/lib/notion/renderer";

interface LessonContentProps {
  blocks: Array<Record<string, unknown>>;
}

export function LessonContent({ blocks }: LessonContentProps) {
  if (!blocks || blocks.length === 0) {
    return (
      <div className="text-gray-400 text-center py-8">
        Contenu de la lecon a venir...
      </div>
    );
  }

  return (
    <div className="prose-es max-w-none">
      {renderBlocks(blocks as Parameters<typeof renderBlocks>[0])}
    </div>
  );
}
