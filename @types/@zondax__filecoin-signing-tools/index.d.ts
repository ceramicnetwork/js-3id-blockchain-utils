declare module "@zondax/filecoin-signing-tools/nodejs" {
  export * from "@zondax/filecoin-signing-tools"
}

declare module "@zondax/filecoin-signing-tools" {
  export interface ExtendedKey {
    address: string;
    public_raw: Uint8Array;
    private_raw: Uint8Array;
    public_hexstring: Uint8Array;
    private_hexstring: Uint8Array;
    public_base64: Uint8Array;
    private_base64: Uint8Array;
  }

  export interface MessageParams {
    from: string;
    to: string;
    value: string;
    gasPrice: string;
    gasLimit: number;
    nonce: number;
    method: number;
    params: string;
  }

  export interface TransactionSignResponse {
    message: MessageParams;
    signature: {
      type: number;
      data: string;
    };
  }

  export function keyRecover(
      privateKey: string,
      testnet?: boolean
  ): ExtendedKey;
  export function transactionSign(
      message: MessageParams,
      privateKeyHex: Uint8Array
  ): TransactionSignResponse;
  export function verifySignature(signature: any, message: any): any;
  export function transactionSerialize(message: any): any;
}
