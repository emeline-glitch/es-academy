"use client";

import { useRef, useCallback, useState, useEffect } from "react";

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
  // Track the HTML we last emitted via onChange. Used to distinguish
  // "parent re-fed us our own output" (ignore) from "parent fed us new content" (sync into DOM).
  const lastEmittedRef = useRef<string>(value);

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeFontSize, setActiveFontSize] = useState("16px");
  const [activeFontFamily, setActiveFontFamily] = useState(FONT_FAMILIES[0].value);
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);
  const [imgMenuPos, setImgMenuPos] = useState<{ top: number; left: number } | null>(null);

  // Initialize DOM content on mount (and only re-sync when value changes externally,
  // i.e. not as a result of our own onChange cycle). This is the fix for the
  // "cursor jumps, characters disappear" bug caused by dangerouslySetInnerHTML
  // re-applying on every keystroke.
  useEffect(() => {
    if (!editorRef.current) return;
    if (value !== lastEmittedRef.current) {
      editorRef.current.innerHTML = value;
      lastEmittedRef.current = value;
    }
  }, [value]);

  const syncContent = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    lastEmittedRef.current = html;
    onChange(html);
  }, [onChange]);

  const exec = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    syncContent();
  }, [syncContent]);

  function handleInsertLink() {
    if (!linkUrl.trim()) return;
    exec("createLink", linkUrl);
    setShowLinkInput(false);
    setLinkUrl("");
  }

  function handleInsertImageFromUrl() {
    if (!imageUrl.trim()) return;
    exec("insertImage", imageUrl);
    setShowImageInput(false);
    setImageUrl("");
  }

  // Image resize — gestion du click sur une image et du menu flottant
  function handleEditorClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG" && editorRef.current) {
      const img = target as HTMLImageElement;
      const editorRect = editorRef.current.getBoundingClientRect();
      const imgRect = img.getBoundingClientRect();
      setSelectedImg(img);
      setImgMenuPos({
        top: imgRect.bottom - editorRect.top + 4,
        left: imgRect.left - editorRect.left,
      });
    } else {
      setSelectedImg(null);
      setImgMenuPos(null);
    }
  }

  function resizeSelectedImg(size: "small" | "medium" | "large" | "full" | "original") {
    if (!selectedImg || !editorRef.current) return;
    // width en % → inline attribute (plus compatible email) + style backup
    if (size === "original") {
      selectedImg.removeAttribute("width");
      selectedImg.style.width = "";
      selectedImg.style.maxWidth = "";
    } else {
      const pct = { small: 30, medium: 50, large: 75, full: 100 }[size];
      selectedImg.setAttribute("width", `${pct}%`);
      selectedImg.style.width = `${pct}%`;
      selectedImg.style.height = "auto";
    }
    // Repositionne le menu flottant après resize
    const editorRect = editorRef.current.getBoundingClientRect();
    const imgRect = selectedImg.getBoundingClientRect();
    setImgMenuPos({
      top: imgRect.bottom - editorRect.top + 4,
      left: imgRect.left - editorRect.left,
    });
    syncContent();
  }

  function alignSelectedImg(align: "left" | "center" | "right") {
    if (!selectedImg) return;
    if (align === "center") {
      selectedImg.style.display = "block";
      selectedImg.style.marginLeft = "auto";
      selectedImg.style.marginRight = "auto";
      selectedImg.style.float = "";
    } else {
      selectedImg.style.display = "";
      selectedImg.style.marginLeft = "";
      selectedImg.style.marginRight = "";
      selectedImg.style.float = align;
    }
    syncContent();
  }

  function deleteSelectedImg() {
    if (!selectedImg) return;
    selectedImg.remove();
    setSelectedImg(null);
    setImgMenuPos(null);
    syncContent();
  }

  async function handleFileUpload(file: File) {
    setUploadError("");
    if (!file.type.startsWith("image/")) {
      setUploadError("Ce fichier n'est pas une image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image trop lourde (max 5 Mo)");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Erreur upload");
        return;
      }
      exec("insertImage", data.url);
      setShowImageInput(false);
      setImageUrl("");
    } catch {
      setUploadError("Erreur réseau");
    } finally {
      setUploading(false);
    }
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
      onMouseDown={(e) => e.preventDefault()} // garde le focus sur l'éditeur, empêche la perte de sélection
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
          onMouseDown={(e) => e.stopPropagation()}
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
            exec("fontSize", "7");
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
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
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
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
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
        <ToolbarButton onClick={() => exec("justifyFull")} title="Justifier">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="3" width="12" height="1.5"/><rect x="2" y="7" width="12" height="1.5"/><rect x="2" y="11" width="12" height="1.5"/></svg>
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
              <button type="button" onClick={handleInsertLink} className="px-3 py-1.5 bg-es-green text-white text-sm rounded cursor-pointer hover:bg-es-green-light">OK</button>
            </div>
          )}
        </div>

        {/* Unlink */}
        <ToolbarButton onClick={() => exec("unlink")} title="Supprimer le lien">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/><line x1="4" y1="20" x2="20" y2="4"/></svg>
        </ToolbarButton>

        {/* Image (upload + URL) */}
        <div className="relative">
          <ToolbarButton onClick={() => { setShowImageInput(!showImageInput); setShowLinkInput(false); setUploadError(""); }} title="Insérer une image">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </ToolbarButton>
          {showImageInput && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 w-96">
              <p className="text-xs font-semibold text-gray-700 mb-2">Depuis ton ordinateur</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f);
                  e.target.value = "";
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded text-sm text-gray-600 hover:border-es-green hover:bg-es-green/5 disabled:opacity-50 cursor-pointer"
              >
                {uploading ? "Upload…" : "📎 Choisir une image (max 5 Mo)"}
              </button>
              {uploadError && <p className="text-xs text-red-600 mt-2">{uploadError}</p>}

              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[10px] text-gray-400 uppercase">ou</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <p className="text-xs font-semibold text-gray-700 mb-2">Depuis une URL</p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded"
                  onKeyDown={(e) => e.key === "Enter" && handleInsertImageFromUrl()}
                />
                <button type="button" onClick={handleInsertImageFromUrl} className="px-3 py-1.5 bg-es-green text-white text-sm rounded cursor-pointer hover:bg-es-green-light">OK</button>
              </div>
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

      {/* Editable area — NO dangerouslySetInnerHTML (set via effect instead to
          avoid re-applying innerHTML on every onChange, which would reset the cursor). */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncContent}
          onBlur={syncContent}
          onClick={handleEditorClick}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData("text/plain");
            document.execCommand("insertText", false, text);
          }}
          className="min-h-[400px] p-6 text-sm text-gray-800 leading-relaxed focus:outline-none [&_a]:text-es-green [&_a]:underline [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-3 [&_img]:cursor-pointer [&_img.selected]:ring-2 [&_img.selected]:ring-es-green [&_hr]:my-4 [&_hr]:border-gray-200 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1"
          style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
        />

        {/* Menu flottant de resize quand une image est sélectionnée */}
        {selectedImg && imgMenuPos && (
          <div
            className="absolute z-20 bg-white border border-gray-300 rounded-lg shadow-lg p-1.5 flex items-center gap-1 flex-wrap"
            style={{ top: imgMenuPos.top, left: imgMenuPos.left }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <span className="text-[10px] text-gray-400 px-1 uppercase tracking-wider">Taille</span>
            {[
              { k: "small", label: "S", tip: "30 %" },
              { k: "medium", label: "M", tip: "50 %" },
              { k: "large", label: "L", tip: "75 %" },
              { k: "full", label: "XL", tip: "100 %" },
              { k: "original", label: "Auto", tip: "Taille d'origine" },
            ].map((s) => (
              <button
                key={s.k}
                type="button"
                title={s.tip}
                onClick={() => resizeSelectedImg(s.k as "small" | "medium" | "large" | "full" | "original")}
                className="px-2 py-1 text-xs rounded hover:bg-es-green/10 hover:text-es-green text-gray-600 cursor-pointer"
              >
                {s.label}
              </button>
            ))}
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <span className="text-[10px] text-gray-400 px-1 uppercase tracking-wider">Align</span>
            <button type="button" title="Aligner à gauche" onClick={() => alignSelectedImg("left")} className="px-2 py-1 text-xs rounded hover:bg-es-green/10 text-gray-600 cursor-pointer">←</button>
            <button type="button" title="Centrer" onClick={() => alignSelectedImg("center")} className="px-2 py-1 text-xs rounded hover:bg-es-green/10 text-gray-600 cursor-pointer">↔</button>
            <button type="button" title="Aligner à droite" onClick={() => alignSelectedImg("right")} className="px-2 py-1 text-xs rounded hover:bg-es-green/10 text-gray-600 cursor-pointer">→</button>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <button type="button" title="Supprimer l'image" onClick={deleteSelectedImg} className="px-2 py-1 text-xs rounded hover:bg-red-50 text-red-500 cursor-pointer">🗑</button>
          </div>
        )}
      </div>
    </div>
  );
}
