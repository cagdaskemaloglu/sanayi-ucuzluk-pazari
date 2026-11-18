import { useState } from "react";
import { Box, Button, Card, Flex, Stack, Text, TextInput, useToast } from "@sanity/ui";
import {
  set,
  unset,
  useClient,
  useDocumentOperation,
  useFormValue,
  type StringInputProps,
} from "sanity";
import { slugifyTr, type ImportedProduct } from "../../lib/import/hepsiburada";

// Ürün formundaki "Hepsiburada'dan Doldur" alanı: link yapıştırılıp
// "Bilgileri Çek"e basılınca ad, slug, açıklama, marka, barkod, MPN ve
// fotoğraflar doldurulur. YALNIZCA BOŞ ALANLAR doldurulur; dolu alanların
// üzerine yazılmaz. Fiyat, kategori, birimler ve stok elle girilir.

type ImageValue = { _type: "image"; _key?: string; asset: { _type: "reference"; _ref: string } };

function randomKey() {
  return Math.random().toString(36).slice(2, 12);
}

export function HepsiburadaImportInput(props: StringInputProps) {
  const { value, onChange, elementProps } = props;
  const toast = useToast();
  const client = useClient({ apiVersion: "2024-01-01" });

  const documentId = String(useFormValue(["_id"]) ?? "").replace(/^drafts\./, "");
  const { patch } = useDocumentOperation(documentId, "product");

  const current = {
    name: useFormValue(["name"]) as string | undefined,
    slug: useFormValue(["slug"]) as { current?: string } | undefined,
    description: useFormValue(["description"]) as string | undefined,
    brand: useFormValue(["brand"]) as string | undefined,
    gtin: useFormValue(["gtin"]) as string | undefined,
    mpn: useFormValue(["mpn"]) as string | undefined,
    mainImage: useFormValue(["mainImage"]) as { asset?: unknown } | undefined,
    gallery: useFormValue(["gallery"]) as unknown[] | undefined,
  };

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function uploadImage(url: string, index: number): Promise<string | null> {
    try {
      const response = await fetch(`/api/studio/hepsiburada?image=${encodeURIComponent(url)}`);
      if (!response.ok) return null;
      const blob = await response.blob();
      const extension = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
      const asset = await client.assets.upload("image", blob, {
        filename: `${slugifyTr(current.name || "urun") || "urun"}-${index + 1}.${extension}`,
        source: { name: "hepsiburada", id: url, url },
      });
      return asset._id;
    } catch {
      return null;
    }
  }

  async function handleImport() {
    if (!value?.trim()) {
      toast.push({ status: "warning", title: "Önce bir Hepsiburada ürün linki yapıştırın." });
      return;
    }
    setLoading(true);
    setStatus("Ürün sayfası okunuyor…");
    try {
      const response = await fetch("/api/studio/hepsiburada", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value.trim() }),
      });
      const data = (await response.json().catch(() => ({}))) as { product?: ImportedProduct; error?: string };
      if (!response.ok || !data.product) {
        toast.push({ status: "error", title: "Bilgiler alınamadı", description: data.error ?? "Bilinmeyen hata", duration: 10000 });
        return;
      }
      const product = data.product;
      const fields: Record<string, unknown> = {};
      const filled: string[] = [];

      if (!current.name && product.name) {
        fields.name = product.name;
        filled.push("ad");
      }
      if (!current.slug?.current && product.name) {
        fields.slug = { _type: "slug", current: slugifyTr(product.name) };
        filled.push("slug");
      }
      if (!current.description && product.description) {
        fields.description = product.description;
        filled.push("açıklama");
      }
      if (!current.brand && product.brand) {
        fields.brand = product.brand;
        filled.push("marka");
      }
      if (!current.gtin && product.gtin) {
        fields.gtin = product.gtin;
        filled.push("barkod");
      }
      if (!current.mpn && product.mpn) {
        fields.mpn = product.mpn;
        filled.push("MPN");
      }

      // Fotoğraflar: ana fotoğraf boşsa ilki, galeri boşsa kalanlar.
      const needMain = !current.mainImage?.asset;
      const needGallery = !current.gallery?.length;
      const toUpload = product.images.slice(needMain ? 0 : 1, needGallery ? undefined : 1);
      if ((needMain || needGallery) && toUpload.length > 0) {
        setStatus(`Fotoğraflar yükleniyor (${toUpload.length})…`);
        const assetIds: string[] = [];
        for (let i = 0; i < toUpload.length; i++) {
          const id = await uploadImage(toUpload[i], i);
          if (id) assetIds.push(id);
        }
        const images: ImageValue[] = assetIds.map((id) => ({
          _type: "image",
          asset: { _type: "reference", _ref: id },
        }));
        if (needMain && images[0]) {
          fields.mainImage = images.shift();
          filled.push("ana fotoğraf");
        }
        if (needGallery && images.length > 0) {
          fields.gallery = images.map((image) => ({ ...image, _key: randomKey() }));
          filled.push(`${images.length} galeri fotoğrafı`);
        }
        if (assetIds.length < toUpload.length) {
          toast.push({ status: "warning", title: `${toUpload.length - assetIds.length} fotoğraf yüklenemedi.` });
        }
      }

      if (Object.keys(fields).length === 0) {
        toast.push({
          status: "info",
          title: "Doldurulacak boş alan yok",
          description: "Bu alanlar zaten dolu; mevcut bilgilerin üzerine yazılmadı.",
        });
        return;
      }

      patch.execute([{ set: fields }]);
      toast.push({
        status: "success",
        title: "Ürün bilgileri dolduruldu",
        description: `${filled.join(", ")}. Kategori, birimler, fiyat (KDV hariç, adet başı) ve stok durumunu kontrol edip Publish edin.`,
        duration: 10000,
      });
    } catch {
      toast.push({ status: "error", title: "Bağlantı hatası", description: "Tekrar deneyin." });
    } finally {
      setLoading(false);
      setStatus(null);
    }
  }

  return (
    <Stack space={3}>
      <Flex gap={2}>
        <Box flex={1}>
          <TextInput
            {...elementProps}
            value={value ?? ""}
            placeholder="https://www.hepsiburada.com/...-p-HBC..."
            onChange={(event) => {
              const next = event.currentTarget.value;
              onChange(next ? set(next) : unset());
            }}
          />
        </Box>
        <Button
          text={loading ? "Çekiliyor…" : "Bilgileri Çek"}
          tone="primary"
          disabled={loading || !value}
          loading={loading}
          onClick={handleImport}
        />
      </Flex>
      {status && (
        <Card padding={2} radius={2} tone="primary">
          <Text size={1}>{status}</Text>
        </Card>
      )}
    </Stack>
  );
}
