import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

type FieldType = "TEXT" | "EMAIL" | "PHONE" | "NUMBER" | "TEXTAREA" | "SELECT" | "CHECKBOX";

interface FormField {
  id?: string;
  key: string;
  label: string;
  type: FieldType;
  placeholder: string;
  required: boolean;
  order: number;
  options: string[];
  minLength?: number;
  maxLength?: number;
  isCore: boolean;
  isVisible: boolean;
}

interface FormSchema {
  id: string;
  version: number;
  published: boolean;
  publishedAt?: string;
  fields: FormField[];
}

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  TEXT: "Texto",
  EMAIL: "E-mail",
  PHONE: "Telefone",
  NUMBER: "Número",
  TEXTAREA: "Área de texto",
  SELECT: "Seleção",
  CHECKBOX: "Checkbox",
};

const EMPTY_FIELD: Omit<FormField, "order"> = {
  key: "",
  label: "",
  type: "TEXT",
  placeholder: "",
  required: false,
  options: [],
  isCore: false,
  isVisible: true,
};

const LOCKED_KEYS = ["terms_accepted"];

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export default function FormBuilderPage() {
  const navigate = useNavigate();
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<Omit<FormField, "order">>({ ...EMPTY_FIELD });
  const [optionInput, setOptionInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<FormSchema>("/form-config/draft").then((r) => {
      setSchema(r.data);
      setFields(r.data.fields ?? []);
    });
  }, []);

  function openAdd() {
    setDraft({ ...EMPTY_FIELD });
    setOptionInput("");
    setEditIndex(null);
    setShowModal(true);
  }

  function openEdit(index: number) {
    setDraft({ ...fields[index] });
    setOptionInput("");
    setEditIndex(index);
    setShowModal(true);
  }

  function handleDraftChange(k: keyof typeof draft, v: unknown) {
    setDraft((prev) => {
      const next = { ...prev, [k]: v };
      if (k === "label" && editIndex === null && !prev.isCore) {
        next.key = slugify(v as string);
      }
      return next;
    });
  }

  function addOption() {
    const opt = optionInput.trim();
    if (!opt) return;
    setDraft((prev) => ({ ...prev, options: [...prev.options, opt] }));
    setOptionInput("");
  }

  function removeOption(i: number) {
    setDraft((prev) => ({ ...prev, options: prev.options.filter((_, idx) => idx !== i) }));
  }

  function saveField() {
    if (!draft.label || !draft.key) return;
    if (editIndex !== null) {
      setFields((prev) =>
        prev.map((f, i) => (i === editIndex ? { ...draft, order: f.order } : f))
      );
    } else {
      setFields((prev) => [...prev, { ...draft, order: prev.length }]);
    }
    setShowModal(false);
  }

  function removeField(index: number) {
    const field = fields[index];
    if (field.isCore) return;
    setFields((prev) => prev.filter((_, i) => i !== index).map((f, i) => ({ ...f, order: i })));
  }

  function toggleVisibility(index: number) {
    setFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, isVisible: !f.isVisible } : f))
    );
  }

  function moveField(index: number, dir: -1 | 1) {
    const next = [...fields];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setFields(next.map((f, i) => ({ ...f, order: i })));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const r = await api.post<FormSchema>("/form-config/draft", { fields });
      setSchema(r.data);
      setFields(r.data.fields);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!schema?.id) return;
    setPublishing(true);
    try {
      const r = await api.post<FormSchema>(`/form-config/${schema.id}/publish`);
      setSchema(r.data);
    } finally {
      setPublishing(false);
    }
  }

  const isLocked = (field: FormField) => LOCKED_KEYS.includes(field.key);

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#c4c6cd] h-16 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1 text-[#44474c] hover:text-[#0054cd] text-sm transition-colors"
          >
            ← Dashboard
          </button>
          <div className="h-6 w-px bg-[#c4c6cd]" />
          <span className="font-bold text-lg text-[#0b1c30]">Construtor de Formulário</span>
          {schema && (
            schema.published ? (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                Publicado v{schema.version}
              </span>
            ) : (
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
                Rascunho v{schema.version}
              </span>
            )
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 border border-[#c4c6cd] text-[#44474c] text-sm rounded-lg hover:bg-[#eff4ff] disabled:opacity-50 transition-colors"
          >
            {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar rascunho"}
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing || !schema?.id}
            className="px-5 py-2 bg-[#0054cd] text-white text-sm font-semibold rounded-lg hover:bg-[#0040a1] disabled:opacity-50 transition-colors"
          >
            {publishing ? "Publicando..." : "Publicar"}
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="bg-white rounded-xl border border-[#c4c6cd] shadow-[0_4px_12px_rgba(4,22,39,0.05)] overflow-hidden">
          {/* Card header */}
          <div className="p-6 border-b border-[#c4c6cd] flex justify-between items-center bg-[#eff4ff]/30">
            <div>
              <h2 className="font-semibold text-lg text-[#0b1c30]">Campos do formulário</h2>
              <p className="text-sm text-[#44474c] mt-1">
                Campos do sistema podem ter label e visibilidade editados. Campos personalizados podem ser removidos.
                O campo LGPD é obrigatório e não pode ser ocultado.
              </p>
            </div>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 bg-[#0054cd] text-white text-sm font-semibold rounded-lg hover:bg-[#0040a1] transition-colors whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Adicionar campo
            </button>
          </div>

          {/* Field list */}
          {fields.length === 0 ? (
            <div className="py-16 text-center text-sm text-[#74777d]">
              Nenhum campo adicionado ainda.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#eff4ff]">
                  <th className="px-6 py-4 text-xs font-semibold text-[#44474c] uppercase tracking-wider w-16">Ordem</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#44474c] uppercase tracking-wider">Rótulo / Chave</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#44474c] uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#44474c] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#44474c] uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c4c6cd]">
                {fields.map((field, i) => (
                  <tr
                    key={field.key + i}
                    className={`hover:bg-[#eff4ff] transition-colors group ${!field.isVisible ? "opacity-50" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveField(i, -1)}
                          disabled={i === 0}
                          className="material-symbols-outlined text-[#74777d] hover:text-[#0054cd] text-xl disabled:opacity-20"
                        >keyboard_arrow_up</button>
                        <button
                          onClick={() => moveField(i, 1)}
                          disabled={i === fields.length - 1}
                          className="material-symbols-outlined text-[#74777d] hover:text-[#0054cd] text-xl disabled:opacity-20"
                        >keyboard_arrow_down</button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-semibold text-sm text-[#0b1c30]">{field.label}</div>
                          <div className="font-mono text-xs text-[#74777d] mt-0.5">{field.key}</div>
                        </div>
                        {field.isCore && (
                          <span className="text-[10px] font-semibold bg-[#dce9ff] text-[#0054cd] px-1.5 py-0.5 rounded uppercase tracking-wide">
                            Sistema
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-[#dce9ff] text-[#44474c] px-2 py-1 rounded text-xs font-semibold">
                        {FIELD_TYPE_LABELS[field.type] ?? field.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {field.required ? (
                          <span className="text-xs font-semibold text-green-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-600 inline-block" />
                            Obrigatório
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-[#74777d] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#74777d] inline-block" />
                            Opcional
                          </span>
                        )}
                        {!field.isVisible && (
                          <span className="text-xs text-[#74777d] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">visibility_off</span>
                            Oculto
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isLocked(field) && (
                          <>
                            <button
                              onClick={() => openEdit(i)}
                              className="text-[#0054cd] text-sm font-semibold hover:underline"
                            >
                              Editar
                            </button>
                            {field.isCore ? (
                              <button
                                onClick={() => toggleVisibility(i)}
                                className="text-[#44474c] text-sm font-semibold hover:underline"
                                title={field.isVisible ? "Ocultar campo" : "Exibir campo"}
                              >
                                {field.isVisible ? "Ocultar" : "Exibir"}
                              </button>
                            ) : (
                              <button
                                onClick={() => removeField(i)}
                                className="text-[#ba1a1a] text-sm font-semibold hover:underline"
                              >
                                Remover
                              </button>
                            )}
                          </>
                        )}
                        {isLocked(field) && (
                          <span className="text-xs text-[#74777d] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">lock</span>
                            LGPD
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#1a2b3c]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[600px] rounded-xl shadow-2xl border border-[#c4c6cd] overflow-hidden">
            {/* Modal header */}
            <div className="px-6 py-4 border-b border-[#c4c6cd] flex justify-between items-center bg-[#eff4ff]/30">
              <h3 className="font-semibold text-[#0b1c30] text-lg flex items-center gap-2">
                {editIndex !== null ? "Editar campo" : "Novo campo"}
                {draft.isCore && (
                  <span className="text-[10px] font-semibold bg-[#dce9ff] text-[#0054cd] px-1.5 py-0.5 rounded uppercase tracking-wide">
                    Sistema
                  </span>
                )}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-[#74777d] hover:text-[#0b1c30] transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-5">
              {/* Label + Key row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#44474c] mb-1">Rótulo (label)</label>
                  <input
                    className="w-full border border-[#c4c6cd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0054cd]"
                    value={draft.label}
                    onChange={(e) => handleDraftChange("label", e.target.value)}
                    placeholder="Ex: Nome da empresa"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#44474c] mb-1">Chave (key)</label>
                  <input
                    className="w-full border border-[#c4c6cd] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0054cd] disabled:bg-[#f5f5f5] disabled:text-[#74777d]"
                    value={draft.key}
                    onChange={(e) => handleDraftChange("key", slugify(e.target.value))}
                    placeholder="gerado automaticamente"
                    disabled={draft.isCore}
                  />
                </div>
              </div>

              {/* Type + Placeholder row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#44474c] mb-1">Tipo</label>
                  <select
                    className="w-full border border-[#c4c6cd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0054cd] disabled:bg-[#f5f5f5] disabled:text-[#74777d]"
                    value={draft.type}
                    onChange={(e) => handleDraftChange("type", e.target.value)}
                    disabled={draft.isCore}
                  >
                    {Object.entries(FIELD_TYPE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#44474c] mb-1">Placeholder</label>
                  <input
                    className="w-full border border-[#c4c6cd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0054cd]"
                    value={draft.placeholder}
                    onChange={(e) => handleDraftChange("placeholder", e.target.value)}
                  />
                </div>
              </div>

              {/* Options (SELECT only) */}
              {draft.type === "SELECT" && !draft.isCore && (
                <div>
                  <label className="block text-sm font-medium text-[#44474c] mb-1">Opções</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      className="flex-1 border border-[#c4c6cd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0054cd]"
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOption())}
                      placeholder="Digita e pressiona Enter"
                    />
                    <button onClick={addOption} className="px-3 py-2 bg-[#eff4ff] border border-[#c4c6cd] rounded-lg text-sm text-[#44474c] hover:bg-[#e5eeff]">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {draft.options.map((opt, i) => (
                      <span key={i} className="flex items-center gap-1 text-xs bg-[#e5eeff] text-[#0054cd] px-2 py-1 rounded">
                        {opt}
                        <button onClick={() => removeOption(i)} className="ml-1 text-[#0054cd] hover:text-[#ba1a1a]">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Required checkbox */}
              <div className="bg-[#eff4ff] rounded-lg p-4 flex items-center justify-between gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.required}
                    onChange={(e) => handleDraftChange("required", e.target.checked)}
                    className="w-4 h-4 rounded accent-[#0054cd]"
                  />
                  <span className="text-sm font-medium text-[#44474c]">Campo obrigatório</span>
                </label>
              </div>

              {/* Min/Max (non-core only) */}
              {!draft.isCore && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#44474c] mb-1">Mín. caracteres</label>
                    <input
                      type="number"
                      className="w-full border border-[#c4c6cd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0054cd]"
                      value={draft.minLength ?? ""}
                      onChange={(e) => handleDraftChange("minLength", e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#44474c] mb-1">Máx. caracteres</label>
                    <input
                      type="number"
                      className="w-full border border-[#c4c6cd] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0054cd]"
                      value={draft.maxLength ?? ""}
                      onChange={(e) => handleDraftChange("maxLength", e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-[#c4c6cd] flex justify-end gap-3 bg-[#eff4ff]/20">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-[#c4c6cd] text-[#44474c] text-sm rounded-lg hover:bg-[#eff4ff] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveField}
                disabled={!draft.label || !draft.key}
                className="px-5 py-2 bg-[#0054cd] text-white text-sm font-semibold rounded-lg hover:bg-[#0040a1] disabled:opacity-50 transition-colors"
              >
                {editIndex !== null ? "Atualizar" : "Adicionar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
