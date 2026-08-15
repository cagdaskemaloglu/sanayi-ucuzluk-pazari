"use client";

import { useState } from "react";
import Image from "next/image";
import type { Image as SanityImage } from "sanity";
import { urlForImage } from "@/lib/sanity/image";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  productName: string;
  mainImage: SanityImage;
  gallery?: SanityImage[];
}

export function ProductGallery({
  productName,
  mainImage,
  gallery,
}: ProductGalleryProps) {
  const images = [mainImage, ...(gallery ?? [])];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex];
  const activeUrl = activeImage
    ? urlForImage(activeImage).width(800).height(800).url()
    : null;

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        {activeUrl ? (
          <Image
            src={activeUrl}
            alt={productName}
            fill
            className="object-contain p-6"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Görsel yok
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="scrollbar-hide mt-3 flex gap-2 overflow-x-auto">
          {images.map((image, index) => {
            const thumbUrl = urlForImage(image).width(120).height(120).url();
            return (
              <button
                key={index}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 bg-gray-50",
                  activeIndex === index
                    ? "border-brand-navy"
                    : "border-transparent hover:border-gray-300"
                )}
                aria-label={`${productName} — fotoğraf ${index + 1}`}
              >
                <Image
                  src={thumbUrl}
                  alt=""
                  fill
                  className="object-contain p-1"
                  sizes="64px"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
