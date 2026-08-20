// iyzipay resmi bir TypeScript tipi yayınlamıyor. Sadece bizim
// kullandığımız iki metodu (checkoutFormInitialize.create,
// checkoutForm.retrieve) tanımlayan minimal bir tip veriyoruz —
// gövdeler `any` çünkü iyzico'nun request/response şekli oldukça
// büyük ve burada tam olarak modellemenin katma değeri düşük.
declare module "iyzipay" {
  interface IyzipayOptions {
    apiKey: string;
    secretKey: string;
    uri: string;
  }

  type IyzipayCallback = (err: unknown, result: any) => void;

  class Iyzipay {
    constructor(options: IyzipayOptions);
    checkoutFormInitialize: {
      create: (request: any, callback: IyzipayCallback) => void;
    };
    checkoutForm: {
      retrieve: (request: any, callback: IyzipayCallback) => void;
    };
  }

  export default Iyzipay;
}
