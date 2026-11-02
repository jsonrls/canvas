import {
  ROOM_ICON_ACCEPTED_SOURCE_TYPES,
  ROOM_ICON_ASPECT_RATIO,
  ROOM_ICON_CONTENT_TYPE,
  ROOM_ICON_MAX_SOURCE_BYTES,
  ROOM_ICON_MAX_UPLOAD_BYTES,
  ROOM_ICON_OUTPUT_SIZE,
} from "@/lib/room-banners/constants";

interface SourceCrop {
  height: number;
  width: number;
  x: number;
  y: number;
}

function getSourceCrop(width: number, height: number): SourceCrop {
  const sourceRatio = width / height;

  if (sourceRatio > ROOM_ICON_ASPECT_RATIO) {
    const croppedWidth = height * ROOM_ICON_ASPECT_RATIO;

    return {
      height,
      width: croppedWidth,
      x: (width - croppedWidth) / 2,
      y: 0,
    };
  }

  const croppedHeight = width / ROOM_ICON_ASPECT_RATIO;

  return {
    height: croppedHeight,
    width,
    x: 0,
    y: (height - croppedHeight) / 2,
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("This browser could not prepare the room icon."));
      },
      ROOM_ICON_CONTENT_TYPE,
      quality,
    );
  });
}

function loadImage(file: File): Promise<{
  dispose: () => void;
  image: HTMLImageElement;
}> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.decoding = "async";
    image.onload = () => {
      resolve({
        dispose: () => URL.revokeObjectURL(objectUrl),
        image,
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new Error(
          "That room icon could not be opened. Choose a JPEG, PNG, or WebP file.",
        ),
      );
    };
    image.src = objectUrl;
  });
}

function assertSupportedSource(file: File): void {
  if (
    !ROOM_ICON_ACCEPTED_SOURCE_TYPES.includes(
      file.type as (typeof ROOM_ICON_ACCEPTED_SOURCE_TYPES)[number],
    )
  ) {
    throw new Error("Choose a JPEG, PNG, or WebP image.");
  }

  if (file.size < 1 || file.size > ROOM_ICON_MAX_SOURCE_BYTES) {
    throw new Error("Choose an image smaller than 15 MB.");
  }
}

export async function compressRoomIcon(file: File): Promise<File> {
  assertSupportedSource(file);

  const { dispose, image } = await loadImage(file);

  try {
    const sourceWidth = image.naturalWidth;
    const sourceHeight = image.naturalHeight;

    if (sourceWidth < 1 || sourceHeight < 1) {
      throw new Error("That image has invalid dimensions.");
    }

    const crop = getSourceCrop(sourceWidth, sourceHeight);
    let outputWidth = Math.max(
      1,
      Math.min(ROOM_ICON_OUTPUT_SIZE, Math.floor(crop.width)),
    );
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: false });

    if (!context) {
      throw new Error("This browser could not prepare the room icon.");
    }

    const qualitySteps = [0.84, 0.76, 0.68, 0.6];
    let smallestBlob: Blob | null = null;

    for (let sizeAttempt = 0; sizeAttempt < 4; sizeAttempt += 1) {
      canvas.width = outputWidth;
      canvas.height = Math.max(
        1,
        Math.round(outputWidth / ROOM_ICON_ASPECT_RATIO),
      );
      context.fillStyle = "#f7f2e8";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      for (const quality of qualitySteps) {
        const blob = await canvasToBlob(canvas, quality);
        smallestBlob =
          !smallestBlob || blob.size < smallestBlob.size ? blob : smallestBlob;

        if (blob.size <= ROOM_ICON_MAX_UPLOAD_BYTES) {
          return new File([blob], `qollab-room-icon-${Date.now()}.jpg`, {
            lastModified: Date.now(),
            type: ROOM_ICON_CONTENT_TYPE,
          });
        }
      }

      outputWidth = Math.max(480, Math.floor(outputWidth * 0.8));
    }

    if (smallestBlob && smallestBlob.size <= ROOM_ICON_MAX_UPLOAD_BYTES) {
      return new File([smallestBlob], `qollab-room-icon-${Date.now()}.jpg`, {
        lastModified: Date.now(),
        type: ROOM_ICON_CONTENT_TYPE,
      });
    }

    throw new Error(
      "That image could not be compressed enough. Choose a simpler or smaller image.",
    );
  } finally {
    dispose();
  }
}
