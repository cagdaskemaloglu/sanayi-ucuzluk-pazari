import Iyzipay from "iyzipay";

// IYZICO_API_KEY / IYZICO_SECRET_KEY tanımlı değilse (henüz kurulmadıysa)
// null döner — çağıran taraf bunu kontrol edip kullanıcıya anlaşılır bir
// mesaj göstermeli, uygulamayı çökertmemeli.
export function getIyzipayClient(): Iyzipay | null {
  const apiKey = process.env.IYZICO_API_KEY;
  const secretKey = process.env.IYZICO_SECRET_KEY;
  const uri = process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com";

  if (!apiKey || !secretKey) {
    return null;
  }

  return new Iyzipay({ apiKey, secretKey, uri });
}

// iyzipay SDK'sı Node-style callback kullanıyor (Promise değil).
// async/await ile kullanabilmek için Promise'e sarmalıyoruz.
export function iyzicoRequest<T = unknown>(
  method: (request: unknown, callback: (err: unknown, result: T) => void) => void,
  request: unknown
): Promise<T> {
  return new Promise((resolve, reject) => {
    method(request, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}
