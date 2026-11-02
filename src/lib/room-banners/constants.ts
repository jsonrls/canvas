// The bucket name is already deployed; the product surface treats its assets
// as square room icons rather than wide banners.
export const ROOM_ICON_BUCKET = "room-banners";
export const ROOM_ICON_CONTENT_TYPE = "image/jpeg";
export const ROOM_ICON_MAX_UPLOAD_BYTES = 700 * 1024;
export const ROOM_ICON_MAX_SOURCE_BYTES = 15 * 1024 * 1024;
export const ROOM_ICON_OUTPUT_SIZE = 640;
export const ROOM_ICON_ASPECT_RATIO = 1;
export const ROOM_ICON_SIGNED_URL_TTL_SECONDS = 60 * 60;

export const ROOM_ICON_ACCEPTED_SOURCE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
