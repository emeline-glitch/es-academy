export interface Course {
  id: string;
  name: string;
  slug: string;
  description: string;
  published: boolean;
  thumbnail: string | null;
  order: number;
}

export interface Module {
  id: string;
  name: string;
  slug: string;
  courseId: string;
  order: number;
  description: string;
  published: boolean;
}

export interface Lesson {
  id: string;
  name: string;
  slug: string;
  moduleId: string;
  order: number;
  published: boolean;
  videoId: string | null;
  videoDuration: number | null;
  freePreview: boolean;
}

export interface Resource {
  id: string;
  name: string;
  moduleId: string;
  lessonId: string | null;
  fileUrl: string | null;
  type: string;
  order: number;
  published: boolean;
}

export interface Quiz {
  id: string;
  name: string;
  lessonId: string;
  passScore: number;
  published: boolean;
}

export interface QuizQuestion {
  question: string;
  choices: string[];
  correctIndex: number;
}

export interface CourseStructure {
  course: Course;
  modules: Array<{
    module: Module;
    lessons: Lesson[];
  }>;
}
