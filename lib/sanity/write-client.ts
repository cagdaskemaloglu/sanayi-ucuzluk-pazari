import { createClient } from "next-sanity";
import { dataset, projectId, apiVersion } from "./client";

// SADECE sunucu tarafında kullanılır (API route'lar, server action'lar).
// SANITY_API_TOKEN, tarayıcıya asla gönderilmeyen bir server-only env
// değişkenidir (NEXT_PUBLIC_ öneki yok). Token tanımlı değilse (henüz
// Studio'dan bir "Editor" token oluşturulmadıysa) yazma işlemleri
// atlanır — sipariş kaydı olmadan da ödeme akışı çalışmaya devam eder.
export function getWriteClient() {
  const token = process.env.SANITY_API_TOKEN;

  if (!token) {
    return null;
  }

  return createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
  });
}
