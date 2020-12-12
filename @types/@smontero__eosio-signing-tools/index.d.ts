declare module "@smontero/eosio-signing-tools" {
  export class SigningTools {
    static verifySignature(
      params: VerifySignatureParams
    ): boolean;
  }

  export interface VerifySignatureParams {
    chainId: string;
    account: string;
    signature: string;
    data: string;
  }
}
