import { DATABASES } from "./client";
import type {
  Course,
  Module,
  Lesson,
  Resource,
  CourseStructure,
} from "./types";

// Reuse the Notion REST API fetch pattern from Solstice
async function queryDatabase(
  databaseId: string,
  filter?: Record<string, unknown>,
  sorts?: Array<Record<string, unknown>>
) {
  const body: Record<string, unknown> = { page_size: 100 };
  if (filter) body.filter = filter;
  if (sorts) body.sorts = sorts;

  const res = await fetch(
    `https://api.notion.com/v1/databases/${databaseId}/query`,
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

  if (!res.ok) {
    console.error(`Notion query failed: ${res.status} ${res.statusText}`);
    return [];
  }

  const data = await res.json();
  return data.results || [];
}

// Helper to extract property values
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

function getNumber(page: Record<string, unknown>, prop: string): number {
  const properties = page.properties as Record<string, Record<string, unknown>>;
  const p = properties?.[prop];
  if (p?.type === "number") return (p.number as number) || 0;
  return 0;
}

function getCheckbox(page: Record<string, unknown>, prop: string): boolean {
  const properties = page.properties as Record<string, Record<string, unknown>>;
  const p = properties?.[prop];
  if (p?.type === "checkbox") return p.checkbox as boolean;
  return false;
}

function getRelationId(page: Record<string, unknown>, prop: string): string {
  const properties = page.properties as Record<string, Record<string, unknown>>;
  const p = properties?.[prop];
  if (p?.type === "relation") {
    const rel = p.relation as Array<{ id: string }>;
    return rel?.[0]?.id || "";
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

function getSelect(page: Record<string, unknown>, prop: string): string {
  const properties = page.properties as Record<string, Record<string, unknown>>;
  const p = properties?.[prop];
  if (p?.type === "select") {
    const select = p.select as { name: string } | null;
    return select?.name || "";
  }
  return "";
}

// ============ COURSES ============

function mapCourse(page: Record<string, unknown>): Course {
  return {
    id: page.id as string,
    name: getText(page, "Name"),
    slug: getText(page, "Slug"),
    description: getText(page, "Description"),
    published: getCheckbox(page, "Published"),
    thumbnail: getFileUrl(page, "Thumbnail"),
    order: getNumber(page, "Order"),
  };
}

export async function getCourses(): Promise<Course[]> {
  if (!DATABASES.courses) return [];
  const pages = await queryDatabase(
    DATABASES.courses,
    { property: "Published", checkbox: { equals: true } },
    [{ property: "Order", direction: "ascending" }]
  );
  return pages.map(mapCourse);
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  if (!DATABASES.courses) return null;
  const pages = await queryDatabase(DATABASES.courses, {
    and: [
      { property: "Slug", rich_text: { equals: slug } },
      { property: "Published", checkbox: { equals: true } },
    ],
  });
  return pages.length > 0 ? mapCourse(pages[0]) : null;
}

// ============ MODULES ============

function mapModule(page: Record<string, unknown>): Module {
  return {
    id: page.id as string,
    name: getText(page, "Name"),
    slug: getText(page, "Slug"),
    courseId: getRelationId(page, "Course"),
    order: getNumber(page, "Order"),
    description: getText(page, "Description"),
    published: getCheckbox(page, "Published"),
  };
}

export async function getModulesByCourse(courseId: string): Promise<Module[]> {
  if (!DATABASES.modules) return [];
  const pages = await queryDatabase(
    DATABASES.modules,
    {
      and: [
        { property: "Course", relation: { contains: courseId } },
        { property: "Published", checkbox: { equals: true } },
      ],
    },
    [{ property: "Order", direction: "ascending" }]
  );
  return pages.map(mapModule);
}

// ============ LESSONS ============

function mapLesson(page: Record<string, unknown>): Lesson {
  return {
    id: page.id as string,
    name: getText(page, "Name"),
    slug: getText(page, "Slug"),
    moduleId: getRelationId(page, "Module"),
    order: getNumber(page, "Order"),
    published: getCheckbox(page, "Published"),
    videoId: getText(page, "Video_ID") || null,
    videoDuration: getNumber(page, "Video_Duration") || null,
    freePreview: getCheckbox(page, "Free_Preview"),
  };
}

export async function getLessonsByModule(moduleId: string): Promise<Lesson[]> {
  if (!DATABASES.lessons) return [];
  const pages = await queryDatabase(
    DATABASES.lessons,
    {
      and: [
        { property: "Module", relation: { contains: moduleId } },
        { property: "Published", checkbox: { equals: true } },
      ],
    },
    [{ property: "Order", direction: "ascending" }]
  );
  return pages.map(mapLesson);
}

export async function getLessonBySlug(slug: string): Promise<Lesson | null> {
  if (!DATABASES.lessons) return null;
  const pages = await queryDatabase(DATABASES.lessons, {
    and: [
      { property: "Slug", rich_text: { equals: slug } },
      { property: "Published", checkbox: { equals: true } },
    ],
  });
  return pages.length > 0 ? mapLesson(pages[0]) : null;
}

// ============ RESOURCES ============

function mapResource(page: Record<string, unknown>): Resource {
  return {
    id: page.id as string,
    name: getText(page, "Name"),
    moduleId: getRelationId(page, "Module"),
    lessonId: getRelationId(page, "Lesson") || null,
    fileUrl: getFileUrl(page, "File"),
    type: getSelect(page, "Type"),
    order: getNumber(page, "Order"),
    published: getCheckbox(page, "Published"),
  };
}

export async function getResourcesByModule(moduleId: string): Promise<Resource[]> {
  if (!DATABASES.resources) return [];
  const pages = await queryDatabase(
    DATABASES.resources,
    {
      and: [
        { property: "Module", relation: { contains: moduleId } },
        { property: "Published", checkbox: { equals: true } },
      ],
    },
    [{ property: "Order", direction: "ascending" }]
  );
  return pages.map(mapResource);
}

export async function getResourcesByLesson(lessonId: string): Promise<Resource[]> {
  if (!DATABASES.resources) return [];
  const pages = await queryDatabase(
    DATABASES.resources,
    {
      and: [
        { property: "Lesson", relation: { contains: lessonId } },
        { property: "Published", checkbox: { equals: true } },
      ],
    },
    [{ property: "Order", direction: "ascending" }]
  );
  return pages.map(mapResource);
}

// ============ LESSON BLOCKS (content) ============

export async function getLessonBlocks(pageId: string) {
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

// ============ FULL COURSE STRUCTURE ============

export async function getFullCourseStructure(
  courseSlug: string
): Promise<CourseStructure | null> {
  const course = await getCourseBySlug(courseSlug);
  if (!course) return null;

  const modules = await getModulesByCourse(course.id);
  const modulesWithLessons = await Promise.all(
    modules.map(async (mod) => ({
      module: mod,
      lessons: await getLessonsByModule(mod.id),
    }))
  );

  return { course, modules: modulesWithLessons };
}
