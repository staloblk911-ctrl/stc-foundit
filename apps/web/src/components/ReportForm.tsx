"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { createReportSchema, ReportType, ReportCategory } from "@stc-foundit/shared";

const CATEGORIES: ReportCategory[] = [
  "electronics",
  "documents",
  "keys",
  "bags",
  "clothing",
  "accessories",
  "other",
];

const MAX_IMAGES = 4;
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

export default function ReportForm({ type }: { type: ReportType }) {
  const router = useRouter();
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ReportCategory>("other");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    const tooBig = picked.find((f) => f.size > MAX_FILE_BYTES);
    if (tooBig) {
      setError(`${tooBig.name} is over 5MB -- pick a smaller photo.`);
      return;
    }
    setError(null);
    setImages(picked.slice(0, MAX_IMAGES));
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = createReportSchema.safeParse({
      type,
      category,
      title,
      description,
      location: location || undefined,
      incident_date: incidentDate || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form.");
      return;
    }

    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      setError("Please sign in first.");
      return;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("reports")
      .insert({ ...parsed.data, user_id: userData.user.id })
      .select()
      .single();

    if (insertError || !inserted) {
      setLoading(false);
      setError(insertError?.message ?? "Could not submit report.");
      return;
    }

    // Images are optional and non-fatal: if one fails to upload, the report
    // still exists -- we just skip that image rather than blocking the post.
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      setUploadStatus(`Uploading photo ${i + 1} of ${images.length}...`);
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `${inserted.id}/${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("report-images")
        .upload(path, file);

      if (!uploadError) {
        await supabase.from("report_images").insert({
          report_id: inserted.id,
          storage_path: path,
        });
      }
    }
    setUploadStatus(null);

    // v1 matching -- see supabase/migrations/0002_locations_matching.sql
    await supabase.rpc("generate_matches_for_report", {
      new_report_id: inserted.id,
    });

    setLoading(false);
    router.push("/reports");
  }

  const isLost = type === "lost";

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4 px-4 py-12">
      <h1 className="text-2xl font-semibold">
        {isLost ? "What did you lose?" : "What did you find?"}
      </h1>

      <Field label="Category">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ReportCategory)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-brand"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c[0].toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Title">
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={isLost ? "e.g. Black Nike backpack" : "e.g. Black headphones"}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-brand"
        />
      </Field>

      <Field label="Description">
        <textarea
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Distinguishing details help matching -- brand, color, marks..."
          className="w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-brand"
        />
      </Field>

      <Field label="Location (campus building, area...)">
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Faculty of Science, Building 1"
          className="w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-brand"
        />
      </Field>

      <Field label={isLost ? "Date lost" : "Date found"}>
        <input
          type="date"
          value={incidentDate}
          onChange={(e) => setIncidentDate(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-brand"
        />
      </Field>

      <Field label={`Photos (optional, up to ${MAX_IMAGES})`}>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImagePick}
          className="w-full text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-surface file:px-3 file:py-2 file:text-foreground hover:file:bg-border"
        />
        {images.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {images.map((file, i) => (
              <div key={i} className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="h-16 w-16 rounded-md border border-border object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-xs text-white"
                  aria-label={`Remove ${file.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </Field>

      {error && <p className="text-sm text-danger">{error}</p>}
      {uploadStatus && <p className="text-sm text-muted">{uploadStatus}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-brand py-2.5 font-medium text-black hover:bg-brand-hover disabled:opacity-50"
      >
        {loading ? "Posting..." : isLost ? "Post lost item" : "Post found item"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-muted">{label}</span>
      {children}
    </label>
  );
}
