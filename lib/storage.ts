import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "template-references";
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/avif",
  "image/gif",
]);

function extensionFor(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/jpeg":
    case "image/jpg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
    case "image/gif":
      return "gif";
    default:
      return "bin";
  }
}

export interface UploadedReference {
  storagePath: string;
  publicUrl: string;
  size: number;
  contentType: string;
}

export type UploadResult =
  | { ok: true; reference: UploadedReference }
  | { ok: false; error: string };

/**
 * Upload a single image into the template-references bucket.
 *
 * Validates size + mime type, generates a unique path, returns the public URL.
 * Browser-uploaded files arrive as `File` objects through FormData; we accept
 * the spec-compliant Web `File` interface.
 */
export async function uploadTemplateReference(
  nicheSlug: string,
  file: File
): Promise<UploadResult> {
  if (!ALLOWED_MIME.has(file.type)) {
    return {
      ok: false,
      error: `Filtype ${file.type || "ukjent"} ikke støttet`,
    };
  }
  if (file.size === 0) {
    return { ok: false, error: "Tom fil" };
  }
  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      error: `Filen er for stor (maks ${(MAX_BYTES / 1024 / 1024).toFixed(0)} MB)`,
    };
  }

  const ext = extensionFor(file.type);
  const id = crypto.randomUUID();
  const path = `${nicheSlug}/${id}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = getSupabaseAdmin();
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return {
    ok: true,
    reference: {
      storagePath: path,
      publicUrl: data.publicUrl,
      size: file.size,
      contentType: file.type,
    },
  };
}

export async function deleteTemplateReferenceFile(
  storagePath: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
