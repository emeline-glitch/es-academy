interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({
  children,
  className = "",
  hover = false,
  padding = "md",
}: CardProps) {
  return (
    <div
      className={`bg-es-white rounded-xl border border-es-cream-dark ${paddingStyles[padding]} ${
        hover ? "card-hover" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
