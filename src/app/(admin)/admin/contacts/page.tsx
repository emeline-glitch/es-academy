"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useDebounce } from "@/hooks/useDebounce";

interface Contact {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  tags: string[];
  source: string;
  status: string;
  subscribed_at: string;
}

interface ContactList {
  id: string;
  name: string;
  tag_key: string;
  folder_id: string | null;
  contact_count?: number;
}
interface ListFolder {
  id: string;
  name: string;
}

type ContactType = "all" | "client" | "prospect" | "ebook" | "formation_gratuite";

const CONTACT_TYPES: { key: ContactType; label: string; description: string; color: string }[] = [
  { key: "all", label: "Tous", description: "Tous les contacts", color: "bg-gray-100 text-gray-700" },
  { key: "client", label: "Clients", description: "Ont acheté une formation", color: "bg-green-100 text-green-700" },
  { key: "prospect", label: "Prospects", description: "Inscrits newsletter", color: "bg-blue-100 text-blue-700" },
  { key: "ebook", label: "Lead Ebook", description: "Arrivés via un ebook", color: "bg-purple-100 text-purple-700" },
  { key: "formation_gratuite", label: "Formation gratuite", description: "Arrivés via formation gratuite", color: "bg-amber-100 text-amber-700" },
];

function getTypeFromContact(c: Contact): ContactType {
  const tags = c.tags || [];
  const source = c.source || "";
  if (tags.includes("client") || source === "purchase" || source === "stripe") return "client";
  if (tags.includes("ebook") || tags.includes("lead_magnet") || source === "ebook" || source === "lead_magnet") return "ebook";
  if (tags.includes("formation_gratuite") || source === "formation_gratuite" || source === "free_course") return "formation_gratuite";
  return "prospect";
}

function getTypeBadge(type: ContactType) {
  const t = CONTACT_TYPES.find((ct) => ct.key === type);
  if (!t || type === "all") return null;
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.color}`}>{t.label}</span>;
}

export default function AdminContacts() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [rawSearch, setRawSearch] = useState("");
  const search = useDebounce(rawSearch, 300);
  const [tagFilter, setTagFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<ContactType>("all");
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState("");
  const [importListTagKey, setImportListTagKey] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showTagModal, setShowTagModal] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    source: "manuel",
    list_tag_key: "",
    extra_tags: "",
  });
  const [addingContact, setAddingContact] = useState(false);
  const [addError, setAddError] = useState("");
  const [availableLists, setAvailableLists] = useState<ContactList[]>([]);
  const [listFolders, setListFolders] = useState<ListFolder[]>([]);
  const [listFilter, setListFilter] = useState<string>("");

  useEffect(() => {
    fetchContacts();
  }, [page, search, tagFilter, listFilter]);

  useEffect(() => {
    // Charger les listes disponibles au mount
    fetch("/api/admin/lists")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setAvailableLists(data.lists || []);
          setListFolders(data.folders || []);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-ouvrir la modale d'ajout si ?add=1 dans l'URL (raccourci depuis /admin/pipeline)
  useEffect(() => {
    if (searchParams?.get("add") === "1") {
      setShowAddContact(true);
      setAddError("");
    }
  }, [searchParams]);

  async function fetchContacts() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "30" });
    if (search) params.set("search", search);
    // listFilter prime sur tagFilter
    const effectiveTag = listFilter || tagFilter;
    if (effectiveTag) params.set("tag", effectiveTag);

    const res = await fetch(`/api/contacts?${params}`);
    if (res.ok) {
      const data = await res.json();
      setContacts(data.contacts || []);
      setTotal(data.total || 0);
    }
    setLoading(false);
  }

  // Filter contacts by type client-side
  const filteredContacts = typeFilter === "all"
    ? contacts
    : contacts.filter((c) => getTypeFromContact(c) === typeFilter);

  // Count by type
  const typeCounts = contacts.reduce(
    (acc, c) => {
      const t = getTypeFromContact(c);
      acc[t] = (acc[t] || 0) + 1;
      acc.all++;
      return acc;
    },
    { all: 0, client: 0, prospect: 0, ebook: 0, formation_gratuite: 0 } as Record<ContactType, number>
  );

  async function handleAddContact() {
    setAddError("");
    if (!newContact.email.trim() || !newContact.email.includes("@")) {
      setAddError("Email invalide");
      return;
    }
    setAddingContact(true);
    // Combiner la liste sélectionnée + tags libres
    const extraTags = newContact.extra_tags
      ? newContact.extra_tags.split(/[,;]/).map((t) => t.trim()).filter(Boolean)
      : [];
    const tags = Array.from(
      new Set([
        ...(newContact.list_tag_key ? [newContact.list_tag_key] : []),
        ...extraTags,
        "manuel",
      ])
    );
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: newContact.email.trim(),
        first_name: newContact.first_name.trim(),
        last_name: newContact.last_name.trim(),
        phone: newContact.phone.trim() || null,
        source: newContact.source || "manuel",
        tags,
      }),
    });
    setAddingContact(false);
    if (res.ok) {
      setShowAddContact(false);
      setNewContact({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        source: "manuel",
        list_tag_key: "",
        extra_tags: "",
      });
      fetchContacts();
      toast.success("Contact ajouté");
    } else {
      const body = await res.json().catch(() => ({}));
      setAddError(body.error || "Erreur serveur");
      toast.error(body.error || "Erreur serveur");
    }
  }

  async function handleImportCSV() {
    if (!csvText.trim()) return;
    setImporting(true);
    setImportResult("");

    const lines = csvText.trim().split("\n");
    let imported = 0;
    let errors = 0;

    for (const line of lines) {
      const parts = line.split(",").map((s) => s.trim());
      const email = parts[0];
      if (!email || !email.includes("@")) {
        errors++;
        continue;
      }

      const lineTags = parts[4] ? parts[4].split(";").map((t) => t.trim()).filter(Boolean) : [];
      const allTags = Array.from(new Set([
        ...lineTags,
        ...(importListTagKey ? [importListTagKey] : []),
        "import",
      ]));

      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          first_name: parts[1] || "",
          last_name: parts[2] || "",
          source: parts[3] || "import_csv",
          tags: allTags,
        }),
      });

      if (res.ok) imported++;
      else errors++;
    }

    const listLabel = availableLists.find((l) => l.tag_key === importListTagKey)?.name;
    const msg = `${imported} importés${listLabel ? ` dans "${listLabel}"` : ""}${errors > 0 ? `, ${errors} erreurs` : ""}`;
    setImportResult(msg);
    setImporting(false);
    setCsvText("");
    fetchContacts();
    if (errors === 0 && imported > 0) toast.success(msg);
    else if (errors > 0) toast.error(msg);
  }

  async function handleExportCSV() {
    const rows = ["email,prenom,nom,type,tags,source,statut,date"];
    const res = await fetch("/api/contacts?limit=10000");
    if (res.ok) {
      const data = await res.json();
      for (const c of data.contacts || []) {
        const type = getTypeFromContact(c);
        rows.push(
          `${c.email},${c.first_name},${c.last_name},${type},"${(c.tags || []).join(";")}",${c.source},${c.status},${c.subscribed_at || ""}`
        );
      }
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  }

  async function handleExportFiltered() {
    const rows = ["email,prenom,nom,type,tags,source,statut,date"];
    for (const c of filteredContacts) {
      const type = getTypeFromContact(c);
      rows.push(
        `${c.email},${c.first_name},${c.last_name},${type},"${(c.tags || []).join(";")}",${c.source},${c.status},${c.subscribed_at || ""}`
      );
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts_${typeFilter}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredContacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContacts.map((c) => c.id)));
    }
  }

  async function handleBulkStatus(newStatus: "active" | "archived") {
    const count = selectedIds.size;
    if (count === 0) return;
    const verb = newStatus === "archived" ? "archiver" : "restaurer";
    if (!confirm(`${verb[0].toUpperCase() + verb.slice(1)} ${count} contact${count > 1 ? "s" : ""} ?`)) return;
    await Promise.all(
      Array.from(selectedIds).map((id) =>
        fetch(`/api/contacts/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        })
      )
    );
    setSelectedIds(new Set());
    fetchContacts();
    toast.success(`${count} contact${count > 1 ? "s" : ""} ${newStatus === "archived" ? "archivé(s)" : "restauré(s)"}`);
  }

  async function handleBulkTag() {
    if (!newTag.trim() || selectedIds.size === 0) return;
    for (const id of selectedIds) {
      const contact = contacts.find((c) => c.id === id);
      if (!contact) continue;
      const updatedTags = [...new Set([...(contact.tags || []), newTag.trim()])];
      await fetch(`/api/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: updatedTags }),
      });
    }
    const count = selectedIds.size;
    setShowTagModal(false);
    setNewTag("");
    setSelectedIds(new Set());
    fetchContacts();
    toast.success(`Tag "${newTag.trim()}" ajouté à ${count} contact${count > 1 ? "s" : ""}`);
  }

  const allTags = Array.from(new Set(contacts.flatMap((c) => c.tags || [])));

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Contacts CRM</h1>
          <p className="text-sm text-gray-500 mt-1">{total} contacts au total</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="primary" size="sm" onClick={() => { setShowAddContact(true); setAddError(""); }}>
            + Ajouter un contact
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowImport(!showImport)}>
            {showImport ? "Fermer" : "Importer CSV"}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExportCSV}>
            Exporter tout
          </Button>
        </div>
      </div>

      {/* Modal ajout manuel */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-lg my-8">
            <h3 className="font-serif text-lg font-bold text-gray-900 mb-1">Ajouter un contact</h3>
            <p className="text-xs text-gray-500 mb-4">Saisie manuelle — le contact ira directement dans ton CRM.</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Prénom</label>
                  <Input
                    placeholder="Ex : Marie"
                    value={newContact.first_name}
                    onChange={(e) => setNewContact({ ...newContact, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Nom</label>
                  <Input
                    placeholder="Ex : Dupont"
                    value={newContact.last_name}
                    onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Email *</label>
                <Input
                  type="email"
                  placeholder="marie.dupont@exemple.com"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Téléphone</label>
                <Input
                  type="tel"
                  placeholder="06 12 34 56 78"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Liste {availableLists.length === 0 && <span className="italic text-gray-400">— aucune liste, à créer dans /admin/lists</span>}
                </label>
                <select
                  value={newContact.list_tag_key}
                  onChange={(e) => setNewContact({ ...newContact, list_tag_key: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700"
                >
                  <option value="">— Aucune liste —</option>
                  {listFolders.map((f) => {
                    const folderLists = availableLists.filter((l) => l.folder_id === f.id);
                    if (folderLists.length === 0) return null;
                    return (
                      <optgroup key={f.id} label={f.name}>
                        {folderLists.map((l) => (
                          <option key={l.id} value={l.tag_key}>{l.name}</option>
                        ))}
                      </optgroup>
                    );
                  })}
                  {/* Listes sans dossier */}
                  {availableLists.filter((l) => !l.folder_id).length > 0 && (
                    <optgroup label="Autres">
                      {availableLists.filter((l) => !l.folder_id).map((l) => (
                        <option key={l.id} value={l.tag_key}>{l.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tags supplémentaires</label>
                <Input
                  placeholder="Séparés par ; ou , (ex : vip ; a_rappeler)"
                  value={newContact.extra_tags}
                  onChange={(e) => setNewContact({ ...newContact, extra_tags: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Source</label>
                <Input
                  placeholder="Ex : appel direct, salon, recommandation"
                  value={newContact.source}
                  onChange={(e) => setNewContact({ ...newContact, source: e.target.value })}
                />
              </div>
              {addError && <p className="text-sm text-red-600">{addError}</p>}
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <Button variant="ghost" size="sm" onClick={() => setShowAddContact(false)}>Annuler</Button>
              <Button variant="primary" size="sm" onClick={handleAddContact} disabled={addingContact}>
                {addingContact ? "Création…" : "Ajouter"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Type filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CONTACT_TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTypeFilter(t.key); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              typeFilter === t.key
                ? "bg-es-green text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {t.label}
            <span className={`ml-2 text-xs ${typeFilter === t.key ? "text-white/70" : "text-gray-400"}`}>
              {typeCounts[t.key] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Import CSV */}
      {showImport && (
        <Card className="mb-6">
          <h3 className="font-medium text-gray-900 mb-2">Importer des contacts</h3>
          <p className="text-xs text-gray-500 mb-3">
            Format : email, prénom, nom, source, tags (séparés par ;) — un contact par ligne
          </p>

          <div className="mb-3">
            <label className="text-xs text-gray-500 mb-1 block">Liste de destination (optionnel)</label>
            <select
              value={importListTagKey}
              onChange={(e) => setImportListTagKey(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
            >
              <option value="">— Pas de liste —</option>
              {listFolders.map((f) => {
                const folderLists = availableLists.filter((l) => l.folder_id === f.id);
                if (folderLists.length === 0) return null;
                return (
                  <optgroup key={f.id} label={f.name}>
                    {folderLists.map((l) => <option key={l.id} value={l.tag_key}>{l.name}</option>)}
                  </optgroup>
                );
              })}
              {availableLists.filter((l) => !l.folder_id).length > 0 && (
                <optgroup label="Autres">
                  {availableLists.filter((l) => !l.folder_id).map((l) => <option key={l.id} value={l.tag_key}>{l.name}</option>)}
                </optgroup>
              )}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">Tous les contacts importés seront ajoutés à cette liste</p>
          </div>

          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={"jean@exemple.com, Jean, Dupont, ebook, lead_magnet;ebook\nmarie@exemple.com, Marie, Martin, formation_gratuite, formation_gratuite"}
            rows={5}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm font-mono mb-3 focus:outline-none focus:ring-2 focus:ring-es-green/30"
          />
          {importResult && (
            <p className="text-sm text-es-green mb-3">{importResult}</p>
          )}
          <Button variant="primary" size="sm" onClick={handleImportCSV} disabled={importing}>
            {importing ? "Import..." : `Importer ${csvText.trim().split("\n").length} contacts`}
          </Button>
        </Card>
      )}

      {/* Search + list + tag filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <Input
            placeholder="Rechercher par email, nom..."
            value={rawSearch}
            onChange={(e) => { setRawSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          value={listFilter}
          onChange={(e) => { setListFilter(e.target.value); setPage(1); }}
          className="px-4 py-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 min-w-[180px]"
        >
          <option value="">Toutes les listes</option>
          {listFolders.map((f) => {
            const folderLists = availableLists.filter((l) => l.folder_id === f.id);
            if (folderLists.length === 0) return null;
            return (
              <optgroup key={f.id} label={f.name}>
                {folderLists.map((l) => (
                  <option key={l.id} value={l.tag_key}>
                    {l.name} ({l.contact_count || 0})
                  </option>
                ))}
              </optgroup>
            );
          })}
          {availableLists.filter((l) => !l.folder_id).length > 0 && (
            <optgroup label="Autres listes">
              {availableLists.filter((l) => !l.folder_id).map((l) => (
                <option key={l.id} value={l.tag_key}>
                  {l.name} ({l.contact_count || 0})
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <select
          value={tagFilter}
          onChange={(e) => { setTagFilter(e.target.value); setPage(1); }}
          className="px-4 py-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-600"
        >
          <option value="">Tous les tags</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
          <option value="client">client</option>
          <option value="lead_magnet">lead_magnet</option>
          <option value="ebook">ebook</option>
          <option value="formation_gratuite">formation_gratuite</option>
          <option value="newsletter">newsletter</option>
          <option value="import">import</option>
        </select>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-es-green/5 rounded-lg border border-es-green/20 flex-wrap">
          <span className="text-sm font-medium text-es-green">{selectedIds.size} sélectionné(s)</span>
          <Button variant="secondary" size="sm" onClick={() => setShowTagModal(true)}>
            Ajouter un tag
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExportFiltered}>
            Exporter la sélection
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleBulkStatus("archived")}>
            📦 Archiver
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleBulkStatus("active")}>
            ↩︎ Restaurer
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
            Désélectionner
          </Button>
        </div>
      )}

      {/* Tag modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <Card className="w-96">
            <h3 className="font-medium text-gray-900 mb-3">Ajouter un tag à {selectedIds.size} contact(s)</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {["client", "prospect", "ebook", "formation_gratuite", "vip", "inactif"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setNewTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${
                    newTag === tag ? "bg-es-green text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <Input
              placeholder="Ou saisir un tag personnalisé..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
            />
            <div className="flex gap-2 mt-4">
              <Button variant="primary" size="sm" onClick={handleBulkTag} disabled={!newTag.trim()}>
                Appliquer
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setShowTagModal(false); setNewTag(""); }}>
                Annuler
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Export filtered button */}
      {typeFilter !== "all" && (
        <div className="flex justify-end mb-4">
          <Button variant="ghost" size="sm" onClick={handleExportFiltered}>
            Exporter {CONTACT_TYPES.find((t) => t.key === typeFilter)?.label} ({filteredContacts.length})
          </Button>
        </div>
      )}

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="px-5 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredContacts.length && filteredContacts.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 accent-es-green"
                  />
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Tags</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Source</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={9} className="px-5 py-8 text-center text-sm text-gray-400">Chargement...</td></tr>
              ) : filteredContacts.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-12 text-center text-sm text-gray-400">Aucun contact trouvé</td></tr>
              ) : (
                filteredContacts.map((c) => {
                  const type = getTypeFromContact(c);
                  return (
                    <tr key={c.id} className={`hover:bg-gray-50 ${selectedIds.has(c.id) ? "bg-es-green/5" : ""}`}>
                      <td className="px-5 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(c.id)}
                          onChange={() => toggleSelect(c.id)}
                          className="rounded border-gray-300 accent-es-green"
                        />
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-900 font-medium">
                        <Link href={`/admin/contacts/${c.id}`} className="hover:text-es-green hover:underline">
                          {c.email}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">
                        <Link href={`/admin/contacts/${c.id}`} className="hover:text-es-green">
                          {c.first_name} {c.last_name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">
                        {c.phone ? (
                          <a href={`tel:${c.phone}`} className="text-es-green hover:underline">{c.phone}</a>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">{getTypeBadge(type)}</td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {(c.tags || []).map((tag) => (
                            <Badge key={tag} variant={tag === "client" ? "success" : tag === "ebook" ? "info" : "default"}>
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400">{c.source}</td>
                      <td className="px-5 py-3">
                        <Badge variant={c.status === "active" ? "success" : "error"}>{c.status}</Badge>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400">
                        {c.subscribed_at ? new Date(c.subscribed_at).toLocaleDateString("fr-FR") : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {total > 30 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="text-sm text-gray-500 hover:text-es-green disabled:opacity-30 cursor-pointer">
              ← Précédent
            </button>
            <span className="text-xs text-gray-400">Page {page} · {filteredContacts.length} affichés</span>
            <button onClick={() => setPage(page + 1)} disabled={contacts.length < 30} className="text-sm text-gray-500 hover:text-es-green disabled:opacity-30 cursor-pointer">
              Suivant →
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
