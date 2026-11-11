import { serializeJsonLd } from "@/lib/seo";

// Google'ın okuduğu yapısal veriyi (schema.org JSON-LD) sayfaya gömer.
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
