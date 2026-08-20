import { NextRequest, NextResponse } from "next/server";
import { getIyzipayClient, iyzicoRequest } from "@/lib/iyzico/client";
import { getWriteClient } from "@/lib/sanity/write-client";
import { SITE_CONFIG } from "@/lib/constants";

export const dynamic = "force-dynamic";

// iyzico, ödeme tamamlandığında kullanıcının tarayıcısını bu adrese
// bir POST (form submit) ile yönlendirir. Burada token'ı iyzico'ya
// tekrar sorup (retrieve) ödemenin gerçekten başarılı olduğunu
// doğruladıktan sonra kullanıcıyı sonuç sayfasına yönlendiriyoruz —
// callback'teki bilgiye asla körü körüne güvenmiyoruz.
//
// ÖNEMLİ: NextResponse.redirect bir POST isteğine varsayılan olarak 307
// (Temporary Redirect) döner, bu da tarayıcının HEDEF adrese de POST
// atmaya çalışmasına yol açar — hedef sayfa GET beklediği için bu bir
// hataya neden olur. Bu yüzden her redirect'te açıkça 303 (See Other)
// kullanıyoruz: bu, tarayıcıya "hedefe GET ile git" der.
function redirect(url: string) {
  return NextResponse.redirect(url, 303);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const token = formData.get("token")?.toString();

  if (!token) {
    return redirect(`${SITE_CONFIG.url}/odeme/basarisiz`);
  }

  const iyzipay = getIyzipayClient();
  if (!iyzipay) {
    return redirect(`${SITE_CONFIG.url}/odeme/basarisiz`);
  }

  try {
    const result = await iyzicoRequest<{
      status: string;
      paymentStatus?: string;
      conversationId?: string;
    }>(iyzipay.checkoutForm.retrieve.bind(iyzipay.checkoutForm), {
      locale: "tr",
      token,
    });

    const isSuccess =
      result.status === "success" && result.paymentStatus === "SUCCESS";

    // Sipariş kaydının durumunu güncelle (varsa). Bu adım başarısız olsa
    // bile kullanıcının yönlendirilmesini engellemiyoruz — sipariş kaydı
    // ikincil bir kolaylık, ödeme akışının kendisi değil.
    const writeClient = getWriteClient();
    if (writeClient && result.conversationId) {
      try {
        const orderId = await writeClient.fetch<string | null>(
          `*[_type == "order" && iyzicoConversationId == $conversationId][0]._id`,
          { conversationId: result.conversationId }
        );

        if (orderId) {
          await writeClient
            .patch(orderId)
            .set({
              status: isSuccess ? "paid" : "failed",
              ...(isSuccess ? { paidAt: new Date().toISOString() } : {}),
            })
            .commit();
        }
      } catch (writeError) {
        console.error("Sipariş durumu güncellenemedi:", writeError);
      }
    }

    if (isSuccess) {
      return redirect(
        `${SITE_CONFIG.url}/odeme/basarili?conversationId=${result.conversationId ?? ""}`
      );
    }

    return redirect(`${SITE_CONFIG.url}/odeme/basarisiz`);
  } catch (error) {
    console.error("iyzico checkout retrieve hatası:", error);
    return redirect(`${SITE_CONFIG.url}/odeme/basarisiz`);
  }
}
