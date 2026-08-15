import type { StructureResolver } from "sanity/structure";

// siteSettings'i tekil (singleton) bir belge olarak menüde göster;
// diğer tipler (category, product) normal liste olarak kalsın.
export const structure: StructureResolver = (S) =>
  S.list()
    .title("İçerik")
    .items([
      S.listItem()
        .title("Site Ayarları")
        .id("siteSettings")
        .child(
          S.document()
            .schemaType("siteSettings")
            .documentId("siteSettings")
            .title("Site Ayarları")
        ),
      S.divider(),
      ...S.documentTypeListItems().filter(
        (listItem) => !["siteSettings"].includes(listItem.getId() ?? "")
      ),
    ]);
