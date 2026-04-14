import React from "react";

interface RichText {
  plain_text: string;
  href: string | null;
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
  };
}

interface Block {
  id: string;
  type: string;
  [key: string]: unknown;
}

function renderRichText(richTexts: RichText[]) {
  return richTexts.map((text, i) => {
    let content: React.ReactNode = text.plain_text;

    if (text.annotations.bold) content = <strong key={i}>{content}</strong>;
    if (text.annotations.italic) content = <em key={i}>{content}</em>;
    if (text.annotations.strikethrough) content = <s key={i}>{content}</s>;
    if (text.annotations.code)
      content = (
        <code key={i} className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">
          {content}
        </code>
      );
    if (text.href)
      content = (
        <a
          key={i}
          href={text.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-es-green underline decoration-es-gold underline-offset-2 hover:text-es-green-light"
        >
          {content}
        </a>
      );

    return <React.Fragment key={i}>{content}</React.Fragment>;
  });
}

function getBlockContent(block: Block): RichText[] {
  const data = block[block.type] as { rich_text?: RichText[] };
  return data?.rich_text || [];
}

export function renderBlocks(blocks: Block[]) {
  const elements: React.ReactNode[] = [];
  let currentList: { type: "bulleted" | "numbered"; items: React.ReactNode[] } | null = null;

  function flushList() {
    if (!currentList) return;
    if (currentList.type === "bulleted") {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc pl-6 mb-4 space-y-1">
          {currentList.items}
        </ul>
      );
    } else {
      elements.push(
        <ol key={`list-${elements.length}`} className="list-decimal pl-6 mb-4 space-y-1">
          {currentList.items}
        </ol>
      );
    }
    currentList = null;
  }

  for (const block of blocks) {
    // Handle list continuity
    if (
      block.type !== "bulleted_list_item" &&
      block.type !== "numbered_list_item"
    ) {
      flushList();
    }

    switch (block.type) {
      case "paragraph":
        elements.push(
          <p key={block.id} className="mb-4">
            {renderRichText(getBlockContent(block))}
          </p>
        );
        break;

      case "heading_2":
        elements.push(
          <h2 key={block.id} className="font-serif text-2xl font-bold text-gray-900 mt-8 mb-4">
            {renderRichText(getBlockContent(block))}
          </h2>
        );
        break;

      case "heading_3":
        elements.push(
          <h3 key={block.id} className="font-serif text-xl font-bold text-gray-900 mt-6 mb-3">
            {renderRichText(getBlockContent(block))}
          </h3>
        );
        break;

      case "bulleted_list_item": {
        const listType = "bulleted";
        if (!currentList || currentList.type !== listType) {
          flushList();
          currentList = { type: listType, items: [] };
        }
        currentList.items.push(
          <li key={block.id}>{renderRichText(getBlockContent(block))}</li>
        );
        break;
      }

      case "numbered_list_item": {
        const listType = "numbered";
        if (!currentList || currentList.type !== listType) {
          flushList();
          currentList = { type: listType, items: [] };
        }
        currentList.items.push(
          <li key={block.id}>{renderRichText(getBlockContent(block))}</li>
        );
        break;
      }

      case "quote":
        elements.push(
          <blockquote
            key={block.id}
            className="border-l-4 border-es-gold pl-4 py-2 my-4 italic text-gray-600 bg-gray-50 rounded-r-lg"
          >
            {renderRichText(getBlockContent(block))}
          </blockquote>
        );
        break;

      case "callout": {
        const callout = block.callout as {
          icon?: { emoji?: string };
          rich_text?: RichText[];
        };
        elements.push(
          <div
            key={block.id}
            className="flex gap-3 p-4 my-4 bg-es-green/5 border border-es-green/10 rounded-xl"
          >
            {callout?.icon?.emoji && (
              <span className="text-xl">{callout.icon.emoji}</span>
            )}
            <div>{renderRichText(callout?.rich_text || [])}</div>
          </div>
        );
        break;
      }

      case "divider":
        elements.push(
          <hr key={block.id} className="my-8 border-gray-200" />
        );
        break;

      case "image": {
        const image = block.image as {
          type: string;
          file?: { url: string };
          external?: { url: string };
          caption?: RichText[];
        };
        const imgUrl =
          image?.type === "file"
            ? image.file?.url
            : image?.external?.url;
        if (imgUrl) {
          elements.push(
            <figure key={block.id} className="my-6">
              <img
                src={imgUrl}
                alt={image.caption?.[0]?.plain_text || ""}
                className="rounded-xl w-full"
              />
              {image.caption?.[0] && (
                <figcaption className="text-center text-sm text-gray-400 mt-2">
                  {renderRichText(image.caption)}
                </figcaption>
              )}
            </figure>
          );
        }
        break;
      }

      case "toggle": {
        const toggle = block[block.type] as { rich_text?: RichText[] };
        elements.push(
          <details key={block.id} className="my-4 border border-gray-200 rounded-xl">
            <summary className="px-4 py-3 cursor-pointer font-medium text-gray-900 hover:bg-gray-50 rounded-xl">
              {renderRichText(toggle?.rich_text || [])}
            </summary>
            <div className="px-4 pb-4 text-gray-600">
              {/* Toggle children would be fetched separately */}
            </div>
          </details>
        );
        break;
      }

      case "code": {
        const code = block.code as {
          rich_text?: RichText[];
          language?: string;
        };
        elements.push(
          <pre
            key={block.id}
            className="my-4 bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm"
          >
            <code>{code?.rich_text?.[0]?.plain_text || ""}</code>
          </pre>
        );
        break;
      }

      default:
        break;
    }
  }

  flushList();
  return elements;
}
