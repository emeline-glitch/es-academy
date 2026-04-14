import { Client } from "@notionhq/client";

let notionClient: Client | null = null;

export function getNotionClient(): Client {
  if (!notionClient) {
    if (!process.env.NOTION_API_KEY) {
      console.warn("NOTION_API_KEY not configured");
    }
    notionClient = new Client({
      auth: process.env.NOTION_API_KEY,
    });
  }
  return notionClient;
}

export const DATABASES = {
  courses: process.env.NOTION_COURSES_DB || "",
  modules: process.env.NOTION_MODULES_DB || "",
  lessons: process.env.NOTION_LESSONS_DB || "",
  resources: process.env.NOTION_RESOURCES_DB || "",
  quizzes: process.env.NOTION_QUIZZES_DB || "",
} as const;
