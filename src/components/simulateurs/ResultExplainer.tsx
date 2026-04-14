interface ResultExplainerProps {
  items: Array<{
    label: string;
    value: string;
    status: "good" | "warning" | "danger" | "neutral";
    explanation: string;
  }>;
}

const statusStyles = {
  good: "border-l-green-500 bg-green-50",
  warning: "border-l-amber-500 bg-amber-50",
  danger: "border-l-red-500 bg-red-50",
  neutral: "border-l-gray-300 bg-gray-50",
};

const statusDots = {
  good: "bg-green-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  neutral: "bg-gray-400",
};

export function ResultExplainer({ items }: ResultExplainerProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-900 text-sm">Lecture des résultats</h3>
      {items.map((item, i) => (
        <div
          key={i}
          className={`border-l-4 rounded-r-lg p-4 ${statusStyles[item.status]}`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${statusDots[item.status]}`} />
              <span className="text-sm font-medium text-gray-900">{item.label}</span>
            </div>
            <span className="text-sm font-bold text-gray-900">{item.value}</span>
          </div>
          <p className="text-xs text-gray-600 ml-4">{item.explanation}</p>
        </div>
      ))}
    </div>
  );
}
