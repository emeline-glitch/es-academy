"use client";

import { Button } from "@/components/ui/Button";

export default function PlatformError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="font-serif text-xl font-bold text-gray-900 mb-2">
        Quelque chose s&apos;est mal passe
      </h2>
      <p className="text-gray-500 mb-6 max-w-md">
        {error.message || "Une erreur est survenue. Reessaie ou contacte le support."}
      </p>
      <Button onClick={reset} variant="primary">
        Reessayer
      </Button>
    </div>
  );
}
