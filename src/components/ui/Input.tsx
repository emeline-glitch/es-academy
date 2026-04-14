interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-es-text">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-4 py-3 rounded-lg border border-es-cream-dark bg-es-white text-es-text placeholder:text-es-text-muted/50 focus:outline-none focus:ring-2 focus:ring-es-green/30 focus:border-es-green transition-all ${
          error ? "border-es-error focus:ring-es-error/30" : ""
        } ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-es-error">{error}</p>}
    </div>
  );
}
