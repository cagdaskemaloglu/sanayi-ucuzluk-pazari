import { PortableText, type PortableTextComponents } from "@portabletext/react";
import Image from "next/image";
import { urlForImage } from "@/lib/sanity/image";
import type { PortableTextBlockLike } from "@/lib/sanity/types";

const components: PortableTextComponents = {
  types: {
    image: ({ value }) => {
      const url = urlForImage(value).width(800).url();
      return (
        <div className="relative my-6 aspect-video overflow-hidden rounded-lg bg-gray-50">
          <Image
            src={url}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      );
    },
  },
  block: {
    h2: ({ children }) => (
      <h2 className="mt-8 text-xl font-bold text-brand-navy">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-6 text-lg font-semibold text-brand-navy">
        {children}
      </h3>
    ),
    normal: ({ children }) => (
      <p className="mt-4 leading-relaxed text-gray-700">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mt-4 border-l-4 border-brand-navy/30 pl-4 italic text-gray-600">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mt-4 list-disc space-y-1 pl-5 text-gray-700">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="mt-4 list-decimal space-y-1 pl-5 text-gray-700">
        {children}
      </ol>
    ),
  },
};

// @portabletext/react'in kendi TypedObject[] tipi yerine projede
// bilinçli olarak gevşek tuttuğumuz PortableTextBlockLike kullanılıyor
// (bkz. lib/sanity/types.ts) — bu yüzden burada tek bir yerde tip cast'i var.
export function PortableTextRenderer({
  value,
}: {
  value: PortableTextBlockLike[];
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <PortableText value={value as any} components={components} />;
}
