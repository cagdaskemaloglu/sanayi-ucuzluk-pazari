import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPostBySlug } from "@/lib/sanity/fetchers";
import { urlForImage } from "@/lib/sanity/image";
import { PortableTextRenderer } from "@/components/features/blog/portable-text-renderer";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_CONFIG } from "@/lib/constants";
import { absoluteUrl } from "@/lib/seo";

interface BlogPostPageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);

  if (!post) {
    return { title: "Yazı Bulunamadı" };
  }

  const ogImageUrl = post.coverImage
    ? urlForImage(post.coverImage).width(1200).height(630).url()
    : undefined;

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      type: "article",
      publishedTime: post.publishedAt,
      images: ogImageUrl ? [{ url: ogImageUrl }] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const coverUrl = post.coverImage
    ? urlForImage(post.coverImage).width(1200).height(600).url()
    : null;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: coverUrl ? [coverUrl] : undefined,
    datePublished: post.publishedAt,
    url: absoluteUrl(`/blog/${post.slug}`),
    publisher: { "@type": "Organization", name: SITE_CONFIG.name },
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <JsonLd data={articleJsonLd} />
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/blog" className="hover:text-brand-navy">
          Blog
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{post.title}</span>
      </nav>

      {coverUrl && (
        <div className="relative mb-6 aspect-video overflow-hidden rounded-lg bg-gray-50">
          <Image
            src={coverUrl}
            alt={post.title}
            fill
            className="object-cover"
            sizes="768px"
            priority
          />
        </div>
      )}

      <p className="text-xs text-gray-400">
        {new Date(post.publishedAt).toLocaleDateString("tr-TR")}
      </p>
      <h1 className="mt-1 text-2xl font-bold text-brand-navy">
        {post.title}
      </h1>

      <PortableTextRenderer value={post.body} />
    </div>
  );
}
