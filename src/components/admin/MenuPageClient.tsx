"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, Pencil, Trash2, AlertCircle,
  ChefHat, Flame, CheckCircle2, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import {
  Modal, ModalHeader, ModalTitle, ModalDescription,
  ModalBody, ModalFooter,
} from "@/components/ui/Modal";
import { ALLERGENS, FOOD_EMOJIS, SPICE_LABELS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Category {
  id:        string;
  name:      string;
  sortOrder: number;
  _count:    { dishes: number };
}

interface Dish {
  id:          string;
  name:        string;
  description: string;
  price:       number;
  imageEmoji:  string | null;
  spiceLevel:  number;
  isVeg:       boolean;
  isVegan:     boolean;
  isGlutenFree:boolean;
  isJain:      boolean;
  allergens:   string[];
  prepTime:    number;
  isAvailable: boolean;
  isChefPick:  boolean;
  isPopular:   boolean;
  upsellIds:   string[];
  categoryId:  string;
  category:    { id: string; name: string; sortOrder: number };
}

// ---------------------------------------------------------------------------
// Form schema
// ---------------------------------------------------------------------------

const DishFormSchema = z.object({
  name:         z.string().min(1, "Name is required").max(100),
  description:  z.string().min(1, "Description is required").max(500),
  categoryId:   z.string().min(1, "Category is required"),
  price:        z.number({ message: "Must be positive" }).positive("Must be positive"),
  imageEmoji:   z.string().max(8).nullable().optional(),
  spiceLevel:   z.number().int().min(0).max(5),
  isVeg:        z.boolean(),
  isVegan:      z.boolean(),
  isGlutenFree: z.boolean(),
  isJain:       z.boolean(),
  allergens:    z.array(z.string()),
  prepTime:     z.number().int().positive(),
  isChefPick:   z.boolean(),
  isPopular:    z.boolean(),
  isAvailable:  z.boolean(),
  upsellIds:    z.array(z.string()),
});

type DishFormValues = z.infer<typeof DishFormSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function SpiceDots({ level }: { level: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {level === 0 ? (
        <span className="text-xs text-ra-muted">—</span>
      ) : (
        Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${
              i < level ? "bg-orange-500" : "bg-ra-border"
            }`}
          />
        ))
      )}
    </span>
  );
}

function AllergenBadges({ allergens }: { allergens: string[] }) {
  if (allergens.length === 0) {
    return (
      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
        None
      </span>
    );
  }
  return (
    <span className="flex flex-wrap gap-1">
      {allergens.slice(0, 3).map((a) => (
        <span
          key={a}
          className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400"
        >
          {a}
        </span>
      ))}
      {allergens.length > 3 && (
        <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">
          +{allergens.length - 3}
        </span>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Dish Form Modal (Add + Edit)
// ---------------------------------------------------------------------------

function DishModal({
  dish,
  categories,
  allDishes,
  onClose,
}: {
  dish?:       Dish;
  categories:  Category[];
  allDishes:   Dish[];
  onClose:     () => void;
}) {
  const router = useRouter();
  const [apiError,       setApiError]       = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const isEdit = Boolean(dish);
  const otherDishes = allDishes.filter((d) => d.id !== dish?.id);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<DishFormValues>({
    resolver: zodResolver(DishFormSchema),
    defaultValues: dish
      ? {
          name:         dish.name,
          description:  dish.description,
          categoryId:   dish.categoryId,
          price:        dish.price,
          imageEmoji:   dish.imageEmoji ?? "",
          spiceLevel:   dish.spiceLevel,
          isVeg:        dish.isVeg,
          isVegan:      dish.isVegan,
          isGlutenFree: dish.isGlutenFree,
          isJain:       dish.isJain,
          allergens:    dish.allergens,
          prepTime:     dish.prepTime,
          isChefPick:   dish.isChefPick,
          isPopular:    dish.isPopular,
          isAvailable:  dish.isAvailable,
          upsellIds:    dish.upsellIds,
        }
      : {
          name:         "",
          description:  "",
          categoryId:   categories[0]?.id ?? "",
          price:        0,
          imageEmoji:   "",
          spiceLevel:   0,
          isVeg:        false,
          isVegan:      false,
          isGlutenFree: false,
          isJain:       false,
          allergens:    [],
          prepTime:     15,
          isChefPick:   false,
          isPopular:    false,
          isAvailable:  true,
          upsellIds:    [],
        },
  });

  const spiceLevel  = watch("spiceLevel");
  const emoji       = watch("imageEmoji");
  const allergens   = watch("allergens");
  const upsellIds   = watch("upsellIds");
  const isVeg       = watch("isVeg");
  const isVegan     = watch("isVegan");
  const isGlutenFree= watch("isGlutenFree");
  const isJain      = watch("isJain");

  function toggleAllergen(a: string) {
    setValue(
      "allergens",
      allergens.includes(a) ? allergens.filter((x) => x !== a) : [...allergens, a]
    );
  }

  function toggleUpsell(id: string) {
    setValue(
      "upsellIds",
      upsellIds.includes(id) ? upsellIds.filter((x) => x !== id) : [...upsellIds, id]
    );
  }

  async function onSubmit(data: DishFormValues) {
    setApiError(null);
    try {
      const url    = isEdit ? `/api/menu/${dish!.id}` : "/api/menu";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          ...data,
          imageEmoji: data.imageEmoji || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Failed to save dish.");
      }

      onClose();
      router.refresh();
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "An error occurred.");
    }
  }

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title={isEdit ? `Edit: ${dish!.name}` : "Add New Dish"}
      description="Fill in the dish details. Allergen information is required for customer safety."
      contentClassName="bg-ra-surface border-ra-border text-ra-text"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Basic Info ─────────────────────────────────────────────── */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wider text-ra-muted">Basic Info</legend>

          <div>
            <label className="block text-sm font-medium text-ra-text mb-1">Dish Name *</label>
            <input
              {...register("name")}
              placeholder="e.g. Butter Chicken"
              className="w-full rounded-lg border border-ra-border bg-ra-bg px-3 py-2 text-sm text-ra-text placeholder:text-ra-muted/50 focus:border-ra-accent/50 focus:outline-none focus:ring-1 focus:ring-ra-accent/30"
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-ra-text mb-1">Description *</label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="A brief, appetising description…"
              className="w-full rounded-lg border border-ra-border bg-ra-bg px-3 py-2 text-sm text-ra-text placeholder:text-ra-muted/50 focus:border-ra-accent/50 focus:outline-none focus:ring-1 focus:ring-ra-accent/30 resize-none"
            />
            {errors.description && <p className="mt-1 text-xs text-red-400">{errors.description.message}</p>}
          </div>
        </fieldset>

        {/* ── Category + Emoji ───────────────────────────────────────── */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wider text-ra-muted">Classification</legend>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ra-text mb-1">Category *</label>
              <select
                {...register("categoryId")}
                className="w-full rounded-lg border border-ra-border bg-ra-bg px-3 py-2 text-sm text-ra-text focus:border-ra-accent/50 focus:outline-none focus:ring-1 focus:ring-ra-accent/30"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.categoryId && <p className="mt-1 text-xs text-red-400">{errors.categoryId.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-ra-text mb-1">Image Emoji</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="flex w-full items-center gap-3 rounded-lg border border-ra-border bg-ra-bg px-3 py-2 text-sm hover:border-ra-accent/40 transition-colors"
                >
                  <span className="text-xl">{emoji || "🍽️"}</span>
                  <span className="text-ra-muted">{emoji ? "Change emoji" : "Pick emoji"}</span>
                </button>
                {showEmojiPicker && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-36 overflow-y-auto rounded-xl border border-ra-border bg-ra-surface p-2 shadow-xl">
                    <div className="grid grid-cols-8 gap-1">
                      {FOOD_EMOJIS.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => { setValue("imageEmoji", e); setShowEmojiPicker(false); }}
                          className={`rounded p-1 text-lg hover:bg-white/10 transition-colors ${emoji === e ? "bg-ra-accent/20" : ""}`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </fieldset>

        {/* ── Pricing + Prep Time ────────────────────────────────────── */}
        <fieldset>
          <legend className="text-xs font-semibold uppercase tracking-wider text-ra-muted mb-4">Pricing & Timing</legend>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ra-text mb-1">Price (USD) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ra-muted text-sm">$</span>
                <input
                  {...register("price", { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full rounded-lg border border-ra-border bg-ra-bg pl-7 pr-3 py-2 text-sm text-ra-text placeholder:text-ra-muted/50 focus:border-ra-accent/50 focus:outline-none focus:ring-1 focus:ring-ra-accent/30"
                />
              </div>
              {errors.price && <p className="mt-1 text-xs text-red-400">{errors.price.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-ra-text mb-1">Prep Time (min)</label>
              <input
                {...register("prepTime", { valueAsNumber: true })}
                type="number"
                min="1"
                placeholder="15"
                className="w-full rounded-lg border border-ra-border bg-ra-bg px-3 py-2 text-sm text-ra-text placeholder:text-ra-muted/50 focus:border-ra-accent/50 focus:outline-none focus:ring-1 focus:ring-ra-accent/30"
              />
            </div>
          </div>
        </fieldset>

        {/* ── Spice Level ────────────────────────────────────────────── */}
        <fieldset>
          <legend className="text-xs font-semibold uppercase tracking-wider text-ra-muted mb-3">Spice Level</legend>
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setValue("spiceLevel", level)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border text-base transition-all ${
                  spiceLevel === level
                    ? "border-ra-accent bg-ra-accent/20"
                    : "border-ra-border hover:border-ra-accent/40"
                }`}
                title={SPICE_LABELS[level]}
              >
                {level === 0 ? "—" : "🌶"}
              </button>
            ))}
            <span className="ml-2 text-sm text-ra-muted">{SPICE_LABELS[spiceLevel]}</span>
          </div>
        </fieldset>

        {/* ── Dietary Toggles ────────────────────────────────────────── */}
        <fieldset>
          <legend className="text-xs font-semibold uppercase tracking-wider text-ra-muted mb-3">Dietary</legend>
          <div className="grid grid-cols-2 gap-2">
            {([
              ["isVeg",        "🌱 Vegetarian", isVeg],
              ["isVegan",      "🌿 Vegan",      isVegan],
              ["isGlutenFree", "🌾 Gluten Free", isGlutenFree],
              ["isJain",       "🙏 Jain",       isJain],
            ] as [keyof DishFormValues, string, boolean][]).map(([key, label, active]) => (
              <button
                key={key}
                type="button"
                onClick={() => setValue(key, !active)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                    : "border-ra-border text-ra-muted hover:border-ra-accent/40 hover:text-ra-text"
                }`}
              >
                {label}
                {active && <CheckCircle2 className="ml-auto h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </fieldset>

        {/* ── Allergens ──────────────────────────────────────────────── */}
        <fieldset>
          <legend className="text-xs font-semibold uppercase tracking-wider text-ra-muted mb-3">
            Allergens <span className="normal-case font-normal text-red-400">(select all that apply)</span>
          </legend>
          <div className="grid grid-cols-5 gap-2">
            {ALLERGENS.map((a) => {
              const checked = allergens.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAllergen(a)}
                  className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-all ${
                    checked
                      ? "border-red-500/40 bg-red-500/15 text-red-400"
                      : "border-ra-border text-ra-muted hover:border-red-500/30 hover:text-red-400/70"
                  }`}
                >
                  {a}
                </button>
              );
            })}
          </div>
          {allergens.length === 0 && (
            <p className="mt-2 text-xs text-ra-muted/70">
              Leave empty if the dish contains no common allergens.
            </p>
          )}
        </fieldset>

        {/* ── Highlights ─────────────────────────────────────────────── */}
        <fieldset>
          <legend className="text-xs font-semibold uppercase tracking-wider text-ra-muted mb-3">Highlights & Status</legend>
          <div className="grid grid-cols-3 gap-3">
            <Controller
              control={control}
              name="isChefPick"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  label="⭐ Chef's Pick"
                  accent="amber"
                />
              )}
            />
            <Controller
              control={control}
              name="isPopular"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  label="🔥 Popular"
                  accent="amber"
                />
              )}
            />
            <Controller
              control={control}
              name="isAvailable"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  label="Available"
                  accent="amber"
                />
              )}
            />
          </div>
        </fieldset>

        {/* ── Upsell Suggestions ─────────────────────────────────────── */}
        {otherDishes.length > 0 && (
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-wider text-ra-muted mb-3">
              Upsell Suggestions <span className="normal-case font-normal">(optional)</span>
            </legend>
            <div className="max-h-36 overflow-y-auto rounded-xl border border-ra-border divide-y divide-ra-border/50">
              {otherDishes.map((d) => (
                <label
                  key={d.id}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={upsellIds.includes(d.id)}
                    onChange={() => toggleUpsell(d.id)}
                    className="rounded accent-amber-500"
                  />
                  <span className="text-base leading-none">{d.imageEmoji || "🍽️"}</span>
                  <span className="min-w-0 flex-1 text-sm text-ra-text truncate">{d.name}</span>
                  <span className="shrink-0 text-xs text-ra-muted">${d.price.toFixed(2)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {/* ── Error ──────────────────────────────────────────────────── */}
        {apiError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {apiError}
          </div>
        )}

        <ModalFooter className="border-t border-ra-border">
          <Button variant="ghost" type="button" onClick={onClose} className="text-ra-muted">
            Cancel
          </Button>
          <Button variant="amber" type="submit" loading={isSubmitting}>
            {isEdit ? "Save Changes" : "Add Dish"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Delete confirmation modal
// ---------------------------------------------------------------------------

function DeleteModal({
  dish,
  onClose,
}: {
  dish:    Dish;
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/menu/${dish.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Delete failed.");
      }
      onClose();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.");
      setLoading(false);
    }
  }

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title="Delete dish?"
      description={`"${dish.name}" will be permanently removed. This cannot be undone.`}
      contentClassName="bg-ra-surface border-ra-border text-ra-text"
      size="sm"
    >
      {error && (
        <div className="mx-6 mb-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <ModalFooter className="border-t border-ra-border">
        <Button variant="ghost" onClick={onClose} className="text-ra-muted">Cancel</Button>
        <Button variant="danger" loading={loading} onClick={handleDelete}
          leftIcon={<Trash2 className="h-4 w-4" />}>
          Delete dish
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Add category inline modal
// ---------------------------------------------------------------------------

function AddCategoryModal({ onClose }: { onClose: () => void }) {
  const router   = useRouter();
  const [name,    setName]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleAdd() {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/categories", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Failed to create category.");
      }
      onClose();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.");
      setLoading(false);
    }
  }

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title="New category"
      contentClassName="bg-ra-surface border-ra-border text-ra-text"
      size="sm"
    >
      <div className="px-6 pb-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="e.g. Starters, Mains, Desserts…"
          className="w-full rounded-lg border border-ra-border bg-ra-bg px-3 py-2 text-sm text-ra-text placeholder:text-ra-muted/50 focus:border-ra-accent/50 focus:outline-none focus:ring-1 focus:ring-ra-accent/30"
        />
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </div>
      <ModalFooter className="border-t border-ra-border">
        <Button variant="ghost" onClick={onClose} className="text-ra-muted">Cancel</Button>
        <Button variant="amber" loading={loading} onClick={handleAdd}>Create</Button>
      </ModalFooter>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Dish row
// ---------------------------------------------------------------------------

function DishRow({
  dish,
  onEdit,
  onDelete,
}: {
  dish:     Dish;
  onEdit:   (d: Dish) => void;
  onDelete: (d: Dish) => void;
}) {
  const router = useRouter();
  const [available, setAvailable] = useState(dish.isAvailable);
  const [toggling,  setToggling]  = useState(false);

  async function toggleAvailability() {
    setToggling(true);
    const next = !available;
    setAvailable(next); // optimistic
    try {
      await fetch(`/api/menu/${dish.id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ isAvailable: next }),
      });
      router.refresh();
    } catch {
      setAvailable(!next); // rollback
    } finally {
      setToggling(false);
    }
  }

  return (
    <tr className="group border-b border-ra-border/50 hover:bg-white/3 transition-colors">
      {/* Emoji */}
      <td className="w-10 px-4 py-3 text-xl leading-none">
        {dish.imageEmoji || <span className="text-ra-muted/30">🍽️</span>}
      </td>

      {/* Name + badges */}
      <td className="px-4 py-3 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium text-ra-text">{dish.name}</span>
          {dish.isVeg    && <span className="text-xs text-emerald-400">🌱</span>}
          {dish.isVegan  && <span className="text-xs text-emerald-400">🌿</span>}
          {dish.isChefPick && <ChefHat className="h-3.5 w-3.5 text-amber-400" />}
          {dish.isPopular  && <Flame   className="h-3.5 w-3.5 text-orange-500" />}
        </div>
        <p className="mt-0.5 text-xs text-ra-muted truncate max-w-xs">{dish.description}</p>
      </td>

      {/* Category */}
      <td className="hidden px-4 py-3 lg:table-cell">
        <span className="text-sm text-ra-muted">{dish.category.name}</span>
      </td>

      {/* Price */}
      <td className="px-4 py-3 text-sm font-medium text-ra-text">
        ${dish.price.toFixed(2)}
      </td>

      {/* Spice */}
      <td className="hidden px-4 py-3 md:table-cell">
        <SpiceDots level={dish.spiceLevel} />
      </td>

      {/* Allergens */}
      <td className="hidden px-4 py-3 xl:table-cell">
        <AllergenBadges allergens={dish.allergens} />
      </td>

      {/* Prep */}
      <td className="hidden px-4 py-3 text-sm text-ra-muted lg:table-cell">
        {dish.prepTime}m
      </td>

      {/* Available toggle */}
      <td className="px-4 py-3">
        <Switch
          checked={available}
          onCheckedChange={toggleAvailability}
          disabled={toggling}
          accent="amber"
        />
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(dish)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ra-muted hover:bg-white/10 hover:text-ra-text transition-colors"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(dish)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ra-muted hover:bg-red-500/10 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export interface MenuPageClientProps {
  categories: Category[];
  dishes:     Dish[];
}

export function MenuPageClient({ categories, dishes }: MenuPageClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [dishModal,      setDishModal]      = useState<null | "add" | Dish>(null);
  const [deleteTarget,   setDeleteTarget]   = useState<Dish | null>(null);
  const [addCatOpen,     setAddCatOpen]     = useState(false);

  const filteredDishes =
    activeCategory === "all"
      ? dishes
      : dishes.filter((d) => d.categoryId === activeCategory);

  const handleEdit   = useCallback((d: Dish) => setDishModal(d), []);
  const handleDelete = useCallback((d: Dish) => setDeleteTarget(d), []);

  return (
    <div className="px-4 py-8 sm:px-6 space-y-6 max-w-7xl mx-auto">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ra-text">Menu Manager</h1>
          <p className="mt-1 text-sm text-ra-muted">
            {dishes.length} dishes across {categories.length} categories
          </p>
        </div>
        <Button
          variant="amber"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setDishModal("add")}
        >
          Add Dish
        </Button>
      </div>

      {/* ── Category tabs ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {/* All tab */}
        <button
          onClick={() => setActiveCategory("all")}
          className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
            activeCategory === "all"
              ? "border-ra-accent bg-ra-accent/15 text-ra-accent"
              : "border-ra-border text-ra-muted hover:border-ra-accent/40 hover:text-ra-text"
          }`}
        >
          All <span className="ml-1 text-xs opacity-70">({dishes.length})</span>
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
              activeCategory === cat.id
                ? "border-ra-accent bg-ra-accent/15 text-ra-accent"
                : "border-ra-border text-ra-muted hover:border-ra-accent/40 hover:text-ra-text"
            }`}
          >
            {cat.name}
            <span className="ml-1 text-xs opacity-70">({cat._count.dishes})</span>
          </button>
        ))}

        {/* Add category */}
        <button
          onClick={() => setAddCatOpen(true)}
          className="shrink-0 flex items-center gap-1 rounded-full border border-dashed border-ra-border px-4 py-1.5 text-sm text-ra-muted hover:border-ra-accent/40 hover:text-ra-accent transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          Category
        </button>
      </div>

      {/* ── Dish table ───────────────────────────────────────────────── */}
      {filteredDishes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-ra-border py-24 text-center">
          <span className="text-4xl">🍽️</span>
          <div>
            <p className="font-display text-base font-semibold text-ra-text">No dishes yet</p>
            <p className="mt-1 text-sm text-ra-muted">
              {activeCategory === "all"
                ? 'Click "Add Dish" to create your first menu item.'
                : "No dishes in this category. Add one or switch category."}
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ra-border">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-ra-border bg-ra-surface/60">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-ra-muted w-10" />
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-ra-muted">Dish</th>
                <th className="hidden px-4 py-3 text-xs font-medium uppercase tracking-wider text-ra-muted lg:table-cell">Category</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-ra-muted">Price</th>
                <th className="hidden px-4 py-3 text-xs font-medium uppercase tracking-wider text-ra-muted md:table-cell">Spice</th>
                <th className="hidden px-4 py-3 text-xs font-medium uppercase tracking-wider text-ra-muted xl:table-cell">Allergens</th>
                <th className="hidden px-4 py-3 text-xs font-medium uppercase tracking-wider text-ra-muted lg:table-cell">Prep</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-ra-muted">Available</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="bg-ra-surface">
              {filteredDishes.map((dish) => (
                <DishRow
                  key={dish.id}
                  dish={dish}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────────────── */}
      {dishModal !== null && (
        <DishModal
          dish={dishModal === "add" ? undefined : dishModal}
          categories={categories}
          allDishes={dishes}
          onClose={() => setDishModal(null)}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          dish={deleteTarget}
          onClose={() => setDeleteTarget(null)}
        />
      )}
      {addCatOpen && (
        <AddCategoryModal onClose={() => setAddCatOpen(false)} />
      )}
    </div>
  );
}
