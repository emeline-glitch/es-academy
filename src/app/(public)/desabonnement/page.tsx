"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function Desabonnement() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/contacts/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {status === "success" ? (
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              </div>
              <h2 className="font-serif text-xl font-bold text-gray-900 mb-2">
                Desabonnement confirme
              </h2>
              <p className="text-gray-500 text-sm">
                Tu ne recevras plus d&apos;emails marketing de notre part.
              </p>
            </div>
          ) : (
            <>
              <h1 className="font-serif text-xl font-bold text-gray-900 mb-2">
                Se desabonner
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                Entre ton email pour te desabonner de nos communications.
              </p>

              {status === "error" && (
                <div className="bg-red-50 text-red-800 text-sm rounded-lg p-4 mb-4">
                  Une erreur est survenue. Reessaie ou contacte-nous.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ton@email.com"
                  required
                />
                <Button
                  type="submit"
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "..." : "Me desabonner"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
