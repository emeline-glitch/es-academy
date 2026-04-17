export function PressGrid() {
  const medias = [
    { name: "Capital" },
    { name: "MySweetImmo" },
    { name: "La Martingale" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-3 gap-8 items-center">
        {medias.map((m) => (
          <div
            key={m.name}
            className="h-16 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center px-4 text-gray-500 font-serif text-lg font-bold"
          >
            {m.name}
          </div>
        ))}
      </div>
      <p className="text-center text-[10px] text-gray-400 italic mt-4">
        Placeholders — les logos officiels seront intégrés quand fournis
      </p>
    </div>
  );
}
