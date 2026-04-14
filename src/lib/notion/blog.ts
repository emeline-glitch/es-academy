export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  author: string;
  publishDate: string;
  featuredImage: string | null;
  seoTitle: string;
  seoDescription: string;
}

const BLOG_DB = process.env.NOTION_BLOG_DB || "";

async function queryBlogDatabase(
  filter?: Record<string, unknown>,
  sorts?: Array<Record<string, unknown>>,
  pageSize = 50
) {
  if (!BLOG_DB || !process.env.NOTION_API_KEY) return [];

  const body: Record<string, unknown> = { page_size: pageSize };
  if (filter) body.filter = filter;
  if (sorts) body.sorts = sorts;

  const res = await fetch(
    `https://api.notion.com/v1/databases/${BLOG_DB}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

function getText(page: Record<string, unknown>, prop: string): string {
  const properties = page.properties as Record<string, Record<string, unknown>>;
  const p = properties?.[prop];
  if (!p) return "";
  if (p.type === "title") {
    const title = p.title as Array<{ plain_text: string }>;
    return title?.[0]?.plain_text || "";
  }
  if (p.type === "rich_text") {
    const rt = p.rich_text as Array<{ plain_text: string }>;
    return rt?.[0]?.plain_text || "";
  }
  return "";
}

function getSelect(page: Record<string, unknown>, prop: string): string {
  const properties = page.properties as Record<string, Record<string, unknown>>;
  const p = properties?.[prop];
  if (p?.type === "select") {
    const select = p.select as { name: string } | null;
    return select?.name || "";
  }
  return "";
}

function getMultiSelect(page: Record<string, unknown>, prop: string): string[] {
  const properties = page.properties as Record<string, Record<string, unknown>>;
  const p = properties?.[prop];
  if (p?.type === "multi_select") {
    const ms = p.multi_select as Array<{ name: string }>;
    return ms?.map((m) => m.name) || [];
  }
  return [];
}

function getDate(page: Record<string, unknown>, prop: string): string {
  const properties = page.properties as Record<string, Record<string, unknown>>;
  const p = properties?.[prop];
  if (p?.type === "date") {
    const date = p.date as { start: string } | null;
    return date?.start || "";
  }
  return "";
}

function getFileUrl(page: Record<string, unknown>, prop: string): string | null {
  const properties = page.properties as Record<string, Record<string, unknown>>;
  const p = properties?.[prop];
  if (p?.type === "files") {
    const files = p.files as Array<{
      type: string;
      file?: { url: string };
      external?: { url: string };
    }>;
    if (files?.[0]) {
      return files[0].type === "file"
        ? files[0].file?.url || null
        : files[0].external?.url || null;
    }
  }
  return null;
}

function getCheckbox(page: Record<string, unknown>, prop: string): boolean {
  const properties = page.properties as Record<string, Record<string, unknown>>;
  const p = properties?.[prop];
  if (p?.type === "checkbox") return p.checkbox as boolean;
  return false;
}

function mapArticle(page: Record<string, unknown>): Article {
  return {
    id: page.id as string,
    title: getText(page, "Title"),
    slug: getText(page, "Slug"),
    excerpt: getText(page, "Excerpt"),
    category: getSelect(page, "Category"),
    tags: getMultiSelect(page, "Tags"),
    author: getText(page, "Author") || "Emeline Siron",
    publishDate: getDate(page, "PublishDate"),
    featuredImage: getFileUrl(page, "FeaturedImage"),
    seoTitle: getText(page, "SEO_Title") || getText(page, "Title"),
    seoDescription: getText(page, "SEO_Description") || getText(page, "Excerpt"),
  };
}

export async function getPublishedArticles(limit = 50): Promise<Article[]> {
  const pages = await queryBlogDatabase(
    {
      and: [
        { property: "Published", checkbox: { equals: true } },
      ],
    },
    [{ property: "PublishDate", direction: "descending" }],
    limit
  );
  return pages.map(mapArticle);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const pages = await queryBlogDatabase({
    and: [
      { property: "Slug", rich_text: { equals: slug } },
      { property: "Published", checkbox: { equals: true } },
    ],
  });
  return pages.length > 0 ? mapArticle(pages[0]) : null;
}

export async function getArticlesByCategory(category: string, limit = 20): Promise<Article[]> {
  const pages = await queryBlogDatabase(
    {
      and: [
        { property: "Category", select: { equals: category } },
        { property: "Published", checkbox: { equals: true } },
      ],
    },
    [{ property: "PublishDate", direction: "descending" }],
    limit
  );
  return pages.map(mapArticle);
}

export async function getArticleBlocks(pageId: string) {
  const res = await fetch(
    `https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`,
    {
      headers: {
        Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
        "Notion-Version": "2022-06-28",
      },
      next: { revalidate: 3600 },
    }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}
