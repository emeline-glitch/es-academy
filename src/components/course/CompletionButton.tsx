"use client";

import { useState } from "react";

interface CompletionButtonProps {
  lessonId: string;
  courseId: string;
  initialCompleted: boolean;
}

export function CompletionButton({
  lessonId,
  courseId,
  initialCompleted,
}: CompletionButtonProps) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);

  async function toggleCompletion() {
    setLoading(true);
    const newState = !completed;
    setCompleted(newState); // Optimistic

    try {
      const res = await fetch("/api/progress", {
        method: newState ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lesson_id: lessonId, course_id: courseId }),
      });

      if (!res.ok) {
        setCompleted(!newState); // Revert
      }
    } catch {
      setCompleted(!newState); // Revert
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggleCompletion}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
        completed
          ? "bg-es-green text-white"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      <svg
        className={`w-5 h-5 ${completed ? "text-white" : "text-gray-400"}`}
        fill={completed ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      {completed ? "Terminee" : "Marquer comme terminee"}
    </button>
  );
}
