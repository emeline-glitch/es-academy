"use client";

import { useState } from "react";

interface AccordionItem {
  question: string;
  answer: string;
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
}

export function Accordion({ items, className = "" }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item, index) => (
        <div
          key={index}
          className="bg-es-white rounded-xl border border-es-cream-dark overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-es-cream-light transition-colors"
          >
            <span className="font-medium text-es-text pr-4">
              {item.question}
            </span>
            <svg
              className={`w-5 h-5 text-es-green shrink-0 transition-transform duration-300 ${
                openIndex === index ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <div
            className="accordion-content"
            data-state={openIndex === index ? "open" : "closed"}
            style={{
              maxHeight: openIndex === index ? "500px" : "0",
            }}
          >
            <div className="px-5 pb-5 text-es-text-muted leading-relaxed">
              {item.answer}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
