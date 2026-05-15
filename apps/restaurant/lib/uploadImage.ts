import type { ImageUploadResponse } from "@bawarchie/types";
import * as ImagePicker from "expo-image-picker";

import { api } from "@/lib/api";

type PickAndUploadResult =
  | { ok: true; imageUrl: string }
  | { ok: false; error: string };

/**
 * Open the system image picker, then push the chosen image through
 * POST /api/upload-image (which forwards it to Cloudinary). Returns the
 * permanent Cloudinary URL on success.
 *
 * Image is sent as a base64 data URL — fine for typical menu-photo sizes
 * (~100-400 KB) and matches what the existing web admin form sends.
 */
export async function pickAndUploadImage(
  token: string | null
): Promise<PickAndUploadResult> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    return {
      ok: false,
      error: "Permission to access photos was denied.",
    };
  }

  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    base64: true,
  });

  if (picked.canceled) {
    return { ok: false, error: "" }; // empty error -> caller treats as no-op
  }

  const asset = picked.assets[0];
  if (!asset?.base64) {
    return { ok: false, error: "Could not read the picked image." };
  }

  const mime = asset.mimeType ?? "image/jpeg";
  const dataUrl = `data:${mime};base64,${asset.base64}`;

  const res = await api.post<ImageUploadResponse>(
    "/api/upload-image",
    { image: dataUrl },
    { token, timeoutMs: 60_000 }
  );

  if (!res.success) {
    return { ok: false, error: res.error };
  }
  return { ok: true, imageUrl: res.imageUrl };
}
