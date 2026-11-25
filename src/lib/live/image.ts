const MAX_EDGE = 1600;
const MAX_BYTES = 2 * 1024 * 1024;
const UNREADABLE =
  "That image could not be opened. Choose a JPEG, PNG or WebP.";

/** Shrinks a chosen picture to a JPEG the live route accepts; drops metadata. */
export async function toLiveImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error(UNREADABLE);
  });
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error(UNREADABLE);
    // JPEG has no transparency; without this it turns black.
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.7, 0.5]) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality),
      );
      if (blob && blob.size <= MAX_BYTES) {
        return new File([blob], "image.jpg", { type: "image/jpeg" });
      }
    }
    throw new Error("That image is too detailed. Choose a smaller one.");
  } finally {
    bitmap.close();
  }
}
