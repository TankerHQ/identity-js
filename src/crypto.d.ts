declare module '@tanker/crypto' {
  export type b64string = string;
  export const ready: Promise<void>;

  export declare module tcrypto {
    export type SodiumKeyPair = {
      privateKey: Uint8Array,
      publicKey: Uint8Array,
    };
    export const SIGNATURE_PRIVATE_KEY_SIZE: number;
    export const SIGNATURE_PUBLIC_KEY_SIZE: number;
    export const makeSignKeyPair: () => SodiumKeyPair;
    export const sign: (data: Uint8Array, privateKey: Uint8Array) => Uint8Array;
    export const makeEncryptionKeyPair: () => SodiumKeyPair;
    export const verifySignature: (data: Uint8Array, signature: Uint8Array, publicKey: Uint8Array) => bool;
  }
  export const generichash: (data: Uint8Array, bytesize: number = 32) => Uint8Array;
  export const random: (size: number) => Uint8Array;
  export declare module utils {
    export const toBase64: (bytes: Uint8Array) => b64string;
    export const fromBase64: (str: b64string) => Uint8Array;
    export const fromB64Json: (str: b64string) => Object;
    export const toB64Json: (o: Object) => b64string;
    export const concatArrays: (...arrays: Array<Uint8Array>) => Uint8Array;
    export const fromString: (str: string) => Uint8Array;
    export const generateAppID: (publicKey: Uint8Array) => Uint8Array;
  }
}
