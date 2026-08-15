import type { Metadata } from "next";
import { MessageCircle, Phone, Mail, MapPin } from "lucide-react";
import { getSiteSettings } from "@/lib/sanity/fetchers";
import { buildMapEmbedSrc } from "@/lib/maps";
import { SITE_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
  title: "İletişim",
};

export default async function IletisimPage() {
  const siteSettings = await getSiteSettings();

  const address = siteSettings?.address || SITE_CONFIG.address;
  const phone = siteSettings?.phone || SITE_CONFIG.phone;
  const email = siteSettings?.email || SITE_CONFIG.email;
  const whatsappNumber = siteSettings?.whatsappNumber || SITE_CONFIG.whatsappNumber;
  const mapSrc = buildMapEmbedSrc(siteSettings);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold text-brand-navy">İletişim</h1>
      <p className="mt-2 text-gray-600">
        Sorularınız veya sipariş talepleriniz için bize aşağıdaki
        kanallardan ulaşabilirsiniz.
      </p>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-navy" />
            <div>
              <p className="text-sm font-medium text-gray-800">Adres</p>
              <p className="mt-0.5 text-sm text-gray-600">{address}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 h-5 w-5 shrink-0 text-brand-navy" />
            <div>
              <p className="text-sm font-medium text-gray-800">Telefon</p>
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="mt-0.5 block text-sm text-gray-600 hover:text-brand-navy"
              >
                {phone}
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-brand-navy" />
            <div>
              <p className="text-sm font-medium text-gray-800">E-posta</p>
              <a
                href={`mailto:${email}`}
                className="mt-0.5 block text-sm text-gray-600 hover:text-brand-navy"
              >
                {email}
              </a>
            </div>
          </div>

          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 rounded-md bg-green-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-600"
          >
            <MessageCircle className="h-4 w-4" fill="white" />
            WhatsApp&apos;tan Yaz
          </a>
        </div>

        {mapSrc && (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <iframe
              src={mapSrc}
              title="İşyeri Konumu"
              width="100%"
              height="320"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}
      </div>
    </div>
  );
}
