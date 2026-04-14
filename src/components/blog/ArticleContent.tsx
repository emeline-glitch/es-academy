"use client";

import React from "react";
import Link from "next/link";

interface ArticleLink {
  title: string;
  slug: string;
}

interface ArticleContentProps {
  children: React.ReactNode;
  relatedArticles: ArticleLink[];
}

const SKIP_PATTERNS = [
  "ne pas publier",
  "ne pas diffuser",
  "maillage interne",
  "| emeline siron",
  "| es academy",
  "note interne",
  "à compléter",
  "lien à ajouter",
];

function shouldSkipText(text: string): boolean {
  const lower = text.toLowerCase();
  return SKIP_PATTERNS.some((p) => lower.includes(p));
}

function findMatchingArticle(
  text: string,
  articles: ArticleLink[]
): ArticleLink | null {
  const textLower = text.toLowerCase().trim();
  if (textLower.length < 10 || textLower.length > 200) return null;

  for (const article of articles) {
    const titleLower = article.title.toLowerCase();
    // Check if the text IS an article title (or very close)
    if (
      titleLower.includes(textLower) ||
      textLower.includes(titleLower)
    ) {
      return article;
    }

    // Word overlap matching
    const textWords = new Set(
      textLower.split(/\s+/).filter((w) => w.length > 3)
    );
    const titleWords = new Set(
      titleLower.split(/\s+/).filter((w) => w.length > 3)
    );
    if (titleWords.size === 0) continue;

    let common = 0;
    for (const w of textWords) {
      if (titleWords.has(w)) common++;
    }
    const score = common / Math.min(titleWords.size, textWords.size);
    if (score >= 0.6 && common >= 3) {
      return article;
    }
  }
  return null;
}

export function ArticleContent({ children, relatedArticles }: ArticleContentProps) {
  // Process children to add links and filter junk
  function processNode(node: React.ReactNode, key?: number): React.ReactNode {
    if (!React.isValidElement(node)) return node;

    const element = node as React.ReactElement<{
      children?: React.ReactNode;
      className?: string;
    }>;

    // Get text content
    const textContent = getTextContent(element);

    // Skip junk lines
    if (textContent && shouldSkipText(textContent)) {
      return null;
    }

    // Check if this paragraph matches an article title (for internal linking)
    if (
      element.type === "p" ||
      (element.props?.className && element.props.className.includes("mb-4"))
    ) {
      const match = findMatchingArticle(textContent, relatedArticles);
      if (match && textContent.length < 150) {
        return (
          <p key={key} className="mb-4">
            <Link
              href={`/blog/${match.slug}`}
              className="text-es-green font-medium underline decoration-es-gold underline-offset-2 hover:text-es-green-light transition-colors"
            >
              👉 {textContent}
            </Link>
          </p>
        );
      }
    }

    // Recursively process children
    if (element.props?.children) {
      const processedChildren = React.Children.map(
        element.props.children,
        (child, i) => processNode(child, i)
      );
      return React.cloneElement(element, { key }, ...React.Children.toArray(processedChildren || []));
    }

    return React.cloneElement(element, { key });
  }

  function getTextContent(node: React.ReactNode): string {
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (!React.isValidElement(node)) return "";
    const element = node as React.ReactElement<{ children?: React.ReactNode }>;
    if (!element.props?.children) return "";
    return React.Children.toArray(element.props.children)
      .map(getTextContent)
      .join("");
  }

  const processed = React.Children.map(children, (child, i) =>
    processNode(child, i)
  );

  return <>{processed}</>;
}
