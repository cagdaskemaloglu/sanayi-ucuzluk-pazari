import type { StructureResolver } from "sanity/structure";

// Site Ayarları tekil (singleton) belge; Siparişler durumlarına göre
// gruplanmış listeler; diğer tipler (ürün, kategori, blog) normal liste.
const orderList = (
  S: Parameters<StructureResolver>[0],
  id: string,
  title: string,
  filter: string
) =>
  S.listItem()
    .id(id)
    .title(title)
    .child(
      S.documentList()
        .id(id)
        .title(title)
        .schemaType("order")
        .filter(`_type == "order" && (${filter})`)
        .defaultOrdering([{ field: "_createdAt", direction: "desc" }])
    );

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
      S.listItem()
        .id("orders")
        .title("Siparişler")
        .child(
          S.list()
            .id("orders-by-status")
            .title("Siparişler")
            .items([
              orderList(S, "orders-new", "🆕 Yeni Siparişler", 'status == "paid"'),
              orderList(S, "orders-preparing", "📦 Hazırlanıyor", 'status == "preparing"'),
              orderList(S, "orders-shipped", "🚚 Kargoda", 'status == "shipped"'),
              orderList(S, "orders-delivered", "✅ Teslim Edildi", 'status == "delivered"'),
              orderList(S, "orders-cancelled", "↩️ İptal / İade", 'status == "cancelled"'),
              S.divider(),
              orderList(
                S,
                "orders-unpaid",
                "⏳ Ödeme Bekleyen / Başarısız",
                'status in ["pending", "failed"]'
              ),
              orderList(S, "orders-all", "Tüm Siparişler", "true"),
            ])
        ),
      S.divider(),
      ...S.documentTypeListItems().filter(
        (listItem) => !["siteSettings", "order"].includes(listItem.getId() ?? "")
      ),
    ]);
