const DEFAULT_NEXT_PATH = "/rooms";

/** Accepts same-origin paths only: browsers read "/\host" and "/<tab>/host" as another site. */
export function safeNextPath(
  value: FormDataEntryValue | null | undefined,
): string {
  return typeof value === "string" && /^\/(?!\/)[^\s\\]*$/u.test(value)
    ? value
    : DEFAULT_NEXT_PATH;
}

export function configuredSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  );
}

/** Auth email templates append "&token_hash=…", so the result always carries a query. */
export function buildConfirmUrl(siteUrl: string, nextPath: string): string {
  const url = new URL(siteUrl);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("The configured site URL must use HTTP or HTTPS.");
  }

  url.pathname = "/auth/confirm";
  url.search = "";
  url.hash = "";
  url.searchParams.set("next", nextPath);
  return url.toString();
}
