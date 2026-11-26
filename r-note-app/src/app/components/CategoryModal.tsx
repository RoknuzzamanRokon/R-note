"use client";

import { useEffect, useState } from "react";
import {
  createCategory,
  getCategories,
  updateCategory,
  type Category,
  type CategorySummary,
} from "@/lib/api";

type Props = {
  /** Set → edit this category. Empty → create a new one. */
  category?: CategorySummary | null;
  onClose: () => void;
  onSaved: (category: Category) => void;
};

const inputClass =
  "w-full bg-surface-variant border border-outline-variant rounded px-sm py-1.5 text-body-md placeholder:text-on-surface-variant/40 focus:outline-none focus:border-tanstack-blue";

export default function CategoryModal({ category, onClose, onSaved }: Props) {
  const editing = !!category;
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(category?.is_public ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // The sidebar list has no description — load it when editing
  useEffect(() => {
    if (!category) return;
    getCategories()
      .then((list) => {
        const full = list.find((c) => c.id === category.id);
        if (full?.description) setDescription((d) => d || full.description || "");
      })
      .catch(() => {});
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        is_public: isPublic,
      };
      const saved = category
        ? await updateCategory(category.id, payload)
        : await createCategory(payload);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-md"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-nav-bg border border-outline-variant rounded-xl w-full max-w-md"
      >
        <div className="flex items-center justify-between px-lg py-md border-b border-outline-variant">
          <h2 className="text-title-md font-bold" style={{ color: "var(--fg)" }}>
            {editing ? "Edit Category" : "New Category"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-white p-1 rounded hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="px-lg py-md space-y-md">
          <div>
            <label className="block text-label-md text-on-surface-variant mb-xs">Name *</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className={inputClass}
              style={{ color: "var(--fg)" }}
              placeholder="e.g. Development"
            />
          </div>

          <div>
            <label className="block text-label-md text-on-surface-variant mb-xs">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              className={`${inputClass} resize-none`}
              style={{ color: "var(--fg)" }}
              placeholder="Optional"
            />
          </div>

          <label className="flex items-start gap-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="mt-[3px] accent-tanstack-blue"
            />
            <span>
              <span className="block text-body-md" style={{ color: "var(--fg)" }}>
                Public
              </span>
              <span className="block text-label-md text-on-surface-variant">
                Anyone can read the published posts in this category without logging in.
                Unchecked: only you can read them.
              </span>
            </span>
          </label>

          {error && (
            <div className="flex items-center gap-xs text-tanstack-pink text-body-md">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-sm px-lg py-md border-t border-outline-variant">
          <button
            type="button"
            onClick={onClose}
            className="px-md py-sm rounded-lg text-body-md text-on-surface-variant hover:text-white hover:bg-surface-variant transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-lg py-sm rounded-lg text-body-md font-bold text-white transition-colors disabled:opacity-50"
            style={{ background: "#3b82f6" }}
          >
            {saving ? "Saving…" : editing ? "Save" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
