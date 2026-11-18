/** Giriş sonrası yalnızca site içi göreli adreslere yönlendir (açık yönlendirme olmasın). */
export function safeCallbackUrl(value: string | null | undefined, fallback = "/hesabim"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}
