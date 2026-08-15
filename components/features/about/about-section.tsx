import Image from "next/image";
import { urlForImage } from "@/lib/sanity/image";
import type { SiteSettings } from "@/lib/sanity/types";

interface AboutSectionProps {
  siteSettings: SiteSettings | null;
}

export function AboutSection({ siteSettings }: AboutSectionProps) {
  // İçerik henüz Studio'da girilmediyse bölümü hiç gösterme.
  if (!siteSettings?.aboutText) {
    return null;
  }

  const images = siteSettings.aboutImages ?? [];
  const hasImages = images.length > 0;
  const title = siteSettings.aboutTitle || "Hakkımızda";

  // Fotoğraf yoksa: eski davranış — ortalanmış, sade metin bloğu.
  if (!hasImages) {
    return (
      <section className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center">
          <h2 className="text-2xl font-bold text-brand-navy">{title}</h2>
          <p className="mt-4 whitespace-pre-line text-gray-600">
            {siteSettings.aboutText}
          </p>
        </div>
      </section>
    );
  }

  // Tek fotoğraf: metnin yanında büyük görsel (masaüstünde 2 sütun).
  if (images.length === 1) {
    const imageUrl = urlForImage(images[0]).width(800).height(600).url();
    return (
      <section className="border-t border-gray-200 bg-white">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 md:grid-cols-2 md:items-center">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-50">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-brand-navy">{title}</h2>
            <p className="mt-4 whitespace-pre-line text-gray-600">
              {siteSettings.aboutText}
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Birden fazla fotoğraf: metin üstte, altında küçük galeri grid'i.
  return (
    <section className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-brand-navy">{title}</h2>
        <p className="mx-auto mt-4 max-w-3xl whitespace-pre-line text-gray-600">
          {siteSettings.aboutText}
        </p>

        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => {
            const imageUrl = urlForImage(image).width(400).height(400).url();
            return (
              <div
                key={index}
                className="relative aspect-square overflow-hidden rounded-lg bg-gray-50"
              >
                <Image
                  src={imageUrl}
                  alt={`${title} — fotoğraf ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
