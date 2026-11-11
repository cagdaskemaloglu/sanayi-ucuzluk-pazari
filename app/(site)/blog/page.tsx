import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getBlogPosts } from "@/lib/sanity/fetchers";
import { urlForImage } from "@/lib/sanity/image";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Bakım ipuçları, ürün kullanım rehberleri ve sektör haberleri.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-bold text-brand-navy">Blog</h1>
      <p className="mt-2 text-gray-600">
        Bakım ipuçları, ürün kullanım rehberleri ve daha fazlası.
      </p>

      {posts.length === 0 ? (
        <p className="mt-8 text-gray-500">Henüz yayınlanmış bir yazı yok.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const imageUrl = post.coverImage
              ? urlForImage(post.coverImage).width(500).height(300).url()
              : null;

            return (
              <Link
                key={post._id}
                href={`/blog/${post.slug}`}
                className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:shadow-md"
              >
                <div className="relative aspect-video bg-gray-50">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">
                      Görsel yok
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-400">
                    {new Date(post.publishedAt).toLocaleDateString("tr-TR")}
                  </p>
                  <h2 className="mt-1 font-semibold text-gray-800 group-hover:text-brand-navy">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                      {post.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
