import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getProducts } from "@/lib/sanity/fetchers";
import { UNIT_LABELS } from "@/lib/pricing";

// Her istek güncel Sanity verisiyle üretilsin diye statik olarak
// önbelleğe alınmasın.
export const dynamic = "force-dynamic";

export async function GET() {
  const products = await getProducts();

  const rows: Record<string, string | number>[] = [];

  products.forEach((product) => {
    product.pricingOptions?.forEach((option) => {
      const bulkTiersText = option.bulkTiers?.length
        ? option.bulkTiers
            .map((tier) => `${tier.minQuantity}+ : ${tier.price} ₺`)
            .join(" | ")
        : "";

      rows.push({
        "Ürün Adı": product.name,
        Kategori: product.category?.title ?? "",
        Birim: UNIT_LABELS[option.unitType] ?? option.unitType,
        "Birimdeki Adet": option.piecesPerUnit ?? "",
        "Fiyat (₺)": option.price,
        "Toplu Alım Kademeleri": bulkTiersText,
        "Stok Durumu":
          product.stockStatus === "out_of_stock" ? "Stokta Yok" : "Stokta Var",
      });
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Sütun genişliklerini okunabilir yap.
  worksheet["!cols"] = [
    { wch: 35 }, // Ürün Adı
    { wch: 20 }, // Kategori
    { wch: 10 }, // Birim
    { wch: 14 }, // Birimdeki Adet
    { wch: 12 }, // Fiyat
    { wch: 30 }, // Toplu Alım Kademeleri
    { wch: 12 }, // Stok Durumu
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Fiyat Listesi");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  }) as Buffer;

  // NextResponse'un BodyInit tipi Node'un Buffer<ArrayBufferLike> tipini
  // doğrudan kabul etmiyor (build sırasında TS hatası verir); Uint8Array'e
  // çevirmek çalışma zamanında aynı byte'ları taşır, sadece tip uyumu için.
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="sanayi-ucuzluk-pazari-fiyat-listesi.xlsx"',
    },
  });
}
