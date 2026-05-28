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
};

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
      if (k === "label" && editIndex === null) {
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
    setFields((prev) => prev.filter((_, i) => i !== index).map((f, i) => ({ ...f, order: i })));
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/dashboard")} className="text-gray-500 hover:text-gray-700 text-sm">
            ← Dashboard
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Construtor de Formulário</h1>
        </div>
        <div className="flex items-center gap-3">
          {schema && (
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${schema.published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
              {schema.published ? `Publicado v${schema.version}` : `Rascunho v${schema.version}`}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
          >
            {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar rascunho"}
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing || !schema?.id}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
          >
            {publishing ? "Publicando..." : "Publicar"}
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-gray-900">Campos extras do formulário</h2>
              <p className="text-sm text-gray-500 mt-1">
                Campos fixos (nome, documento, e-mail, telefone, tipo de serviço, endereço, LGPD) são sempre exibidos.
                Adicione campos personalizados abaixo.
              </p>
            </div>
            <button
              onClick={openAdd}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              + Adicionar campo
            </button>
          </div>

          {fields.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">Nenhum campo extra adicionado ainda.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {fields.map((field, i) => (
                <li key={field.key + i} className="flex items-center gap-3 p-4 rounded-lg border border-gray-100 bg-gray-50">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveField(i, -1)}
                      disabled={i === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-20 text-xs leading-none"
                    >▲</button>
                    <button
                      onClick={() => moveField(i, 1)}
                      disabled={i === fields.length - 1}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-20 text-xs leading-none"
                    >▼</button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900">{field.label}</span>
                      {field.required && (
                        <span className="text-xs text-red-500">*obrigatório</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        {FIELD_TYPE_LABELS[field.type]}
                      </span>
                      <span className="text-xs text-gray-400">key: {field.key}</span>
                    </div>
                  </div>
                  <button onClick={() => openEdit(i)} className="text-xs text-blue-600 hover:underline">Editar</button>
                  <button onClick={() => removeField(i)} className="text-xs text-red-500 hover:underline">Remover</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              {editIndex !== null ? "Editar campo" : "Novo campo"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={draft.label}
                  onChange={(e) => handleDraftChange("label", e.target.value)}
                  placeholder="Ex: Nome da empresa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chave (key)</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                  value={draft.key}
                  onChange={(e) => handleDraftChange("key", slugify(e.target.value))}
                  placeholder="gerado automaticamente"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={draft.type}
                  onChange={(e) => handleDraftChange("type", e.target.value)}
                >
                  {Object.entries(FIELD_TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={draft.placeholder}
                  onChange={(e) => handleDraftChange("placeholder", e.target.value)}
                />
              </div>
              {draft.type === "SELECT" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opções</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOption())}
                      placeholder="Digita e pressiona Enter"
                    />
                    <button onClick={addOption} className="px-3 py-2 bg-gray-100 rounded-lg text-sm">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {draft.options.map((opt, i) => (
                      <span key={i} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        {opt}
                        <button onClick={() => removeOption(i)} className="ml-1 text-blue-400 hover:text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="required"
                  checked={draft.required}
                  onChange={(e) => handleDraftChange("required", e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="required" className="text-sm text-gray-700">Campo obrigatório</label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mín. caracteres</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={draft.minLength ?? ""}
                    onChange={(e) => handleDraftChange("minLength", e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Máx. caracteres</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={draft.maxLength ?? ""}
                    onChange={(e) => handleDraftChange("maxLength", e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={saveField}
                disabled={!draft.label || !draft.key}
                className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
