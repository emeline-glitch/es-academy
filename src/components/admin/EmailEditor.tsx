"use client";

import { useRef, useCallback, useState } from "react";

interface EmailEditorProps {
  value: string;
  onChange: (html: string) => void;
}

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"];
const FONT_FAMILIES = [
  { label: "Sans-serif", value: "Arial, Helvetica, sans-serif" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Monospace", value: "'Courier New', monospace" },
];
const COLORS = [
  "#000000", "#333333", "#666666", "#999999",
  "#2c6e55", "#1a5c3a", "#3d8b6e",
  "#c4a35a", "#b8860b",
  "#dc3545", "#e74c3c",
  "#2563eb", "#3b82f6",
  "#7c3aed", "#8b5cf6",
  "#ffffff",
];

export function EmailEditor({ value, onChange }: EmailEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [activeFontSize, setActiveFontSize] = useState("16px");
  const [activeFontFamily, setActiveFontFamily] = useState(FONT_FAMILIES[0].value);

  const exec = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    syncContent();
  }, []);

  const syncContent = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  function handleInsertLink() {
    if (!linkUrl.trim()) return;
    exec("createLink", linkUrl);
    setShowLinkInput(false);
    setLinkUrl("");
  }

  function handleInsertImage() {
    if (!imageUrl.trim()) return;
    exec("insertImage", imageUrl);
    setShowImageInput(false);
    setImageUrl("");
  }

  const ToolbarButton = ({
    onClick,
    active,
    title,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded text-sm transition-colors cursor-pointer ${
        active ? "bg-es-green/20 text-es-green" : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50 p-2 flex flex-wrap items-center gap-1">
        {/* Font family */}
        <select
          value={activeFontFamily}
          onChange={(e) => {
            setActiveFontFamily(e.target.value);
            exec("fontName", e.target.value);
          }}
          className="px-2 py-1.5 rounded border border-gray-200 text-xs bg-white"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        {/* Font size */}
        <select
          value={activeFontSize}
          onChange={(e) => {
            setActiveFontSize(e.target.value);
            // execCommand fontSize uses 1-7, we use a span workaround
            exec("fontSize", "7");
            // Replace font size 7 with actual px
            if (editorRef.current) {
              const bigElements = editorRef.current.querySelectorAll('font[size="7"]');
              bigElements.forEach((el) => {
                const span = document.createElement("span");
                span.style.fontSize = e.target.value;
                span.innerHTML = el.innerHTML;
                el.replaceWith(span);
              });
              syncContent();
            }
          }}
          className="px-2 py-1.5 rounded border border-gray-200 text-xs bg-white"
        >
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Bold, Italic, Underline, Strike */}
        <ToolbarButton onClick={() => exec("bold")} title="Gras">
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("italic")} title="Italique">
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("underline")} title="Souligné">
          <span className="underline">U</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("strikeThrough")} title="Barré">
          <span className="line-through">S</span>
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Text color */}
        <div className="relative">
          <ToolbarButton onClick={() => { setShowColorPicker(!showColorPicker); setShowBgColorPicker(false); }} title="Couleur du texte">
            <span className="flex flex-col items-center">
              A
              <span className="w-4 h-1 bg-es-green rounded-full mt-0.5" />
            </span>
          </ToolbarButton>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 grid grid-cols-4 gap-1">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => { exec("foreColor", color); setShowColorPicker(false); }}
                  className="w-6 h-6 rounded border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Background color */}
        <div className="relative">
          <ToolbarButton onClick={() => { setShowBgColorPicker(!showBgColorPicker); setShowColorPicker(false); }} title="Couleur de fond">
            <span className="bg-yellow-200 px-1 rounded text-xs">A</span>
          </ToolbarButton>
          {showBgColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 grid grid-cols-4 gap-1">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => { exec("hiliteColor", color); setShowBgColorPicker(false); }}
                  className="w-6 h-6 rounded border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Alignment */}
        <ToolbarButton onClick={() => exec("justifyLeft")} title="Aligner à gauche">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="3" width="12" height="1.5"/><rect x="2" y="7" width="8" height="1.5"/><rect x="2" y="11" width="10" height="1.5"/></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("justifyCenter")} title="Centrer">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="3" width="12" height="1.5"/><rect x="4" y="7" width="8" height="1.5"/><rect x="3" y="11" width="10" height="1.5"/></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("justifyRight")} title="Aligner à droite">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="3" width="12" height="1.5"/><rect x="6" y="7" width="8" height="1.5"/><rect x="4" y="11" width="10" height="1.5"/></svg>
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Lists */}
        <ToolbarButton onClick={() => exec("insertUnorderedList")} title="Liste à puces">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="3" cy="4" r="1.5"/><rect x="6" y="3" width="8" height="1.5"/><circle cx="3" cy="8" r="1.5"/><rect x="6" y="7" width="8" height="1.5"/><circle cx="3" cy="12" r="1.5"/><rect x="6" y="11" width="8" height="1.5"/></svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("insertOrderedList")} title="Liste numérotée">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><text x="1" y="5" fontSize="5" fontWeight="bold">1</text><rect x="6" y="3" width="8" height="1.5"/><text x="1" y="9" fontSize="5" fontWeight="bold">2</text><rect x="6" y="7" width="8" height="1.5"/><text x="1" y="13" fontSize="5" fontWeight="bold">3</text><rect x="6" y="11" width="8" height="1.5"/></svg>
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Link */}
        <div className="relative">
          <ToolbarButton onClick={() => { setShowLinkInput(!showLinkInput); setShowImageInput(false); }} title="Insérer un lien">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </ToolbarButton>
          {showLinkInput && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 flex gap-2 w-80">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded"
                onKeyDown={(e) => e.key === "Enter" && handleInsertLink()}
              />
              <button onClick={handleInsertLink} className="px-3 py-1.5 bg-es-green text-white text-sm rounded cursor-pointer hover:bg-es-green-light">OK</button>
            </div>
          )}
        </div>

        {/* Unlink */}
        <ToolbarButton onClick={() => exec("unlink")} title="Supprimer le lien">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/><line x1="4" y1="20" x2="20" y2="4"/></svg>
        </ToolbarButton>

        {/* Image */}
        <div className="relative">
          <ToolbarButton onClick={() => { setShowImageInput(!showImageInput); setShowLinkInput(false); }} title="Insérer une image">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </ToolbarButton>
          {showImageInput && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 flex gap-2 w-80">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="URL de l'image..."
                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded"
                onKeyDown={(e) => e.key === "Enter" && handleInsertImage()}
              />
              <button onClick={handleInsertImage} className="px-3 py-1.5 bg-es-green text-white text-sm rounded cursor-pointer hover:bg-es-green-light">OK</button>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Headings */}
        <ToolbarButton onClick={() => exec("formatBlock", "h2")} title="Titre">
          H2
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("formatBlock", "h3")} title="Sous-titre">
          H3
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("formatBlock", "p")} title="Paragraphe">
          P
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Horizontal rule */}
        <ToolbarButton onClick={() => exec("insertHorizontalRule")} title="Séparateur">
          <span className="text-xs">―</span>
        </ToolbarButton>

        {/* Remove formatting */}
        <ToolbarButton onClick={() => exec("removeFormat")} title="Supprimer le formatage">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="4" x2="20" y2="20"/><path d="M8 4h8l-4 16"/></svg>
        </ToolbarButton>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={syncContent}
        onBlur={syncContent}
        dangerouslySetInnerHTML={{ __html: value }}
        className="min-h-[400px] p-6 text-sm text-gray-800 leading-relaxed focus:outline-none [&_a]:text-es-green [&_a]:underline [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-3 [&_hr]:my-4 [&_hr]:border-gray-200 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1"
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      />
    </div>
  );
}
