import type { b64string } from '@tanker/crypto';
import { ready as cryptoReady, tcrypto, utils, generichash } from '@tanker/crypto';
import { InvalidArgument } from './errors';
import { obfuscateUserId } from './userId';
import { createUserSecretB64 } from './userSecret';

type PermanentIdentityTarget = 'user';
type SecretProvisionalIdentityTarget = 'email' | 'phone_number';
type PublicProvisionalIdentityTarget = 'email' | 'hashed_email' | 'hashed_phone_number';
export type PublicPermanentIdentity = {
  trustchain_id: b64string;
  target: PermanentIdentityTarget;
  value: b64string;
};
export type SecretPermanentIdentity = PublicPermanentIdentity & {
  ephemeral_public_signature_key: b64string;
  ephemeral_private_signature_key: b64string;
  delegation_signature: b64string;
  user_secret: b64string;
};

type ProvisionalIdentityBase = {
  trustchain_id: b64string;
  value: string;
  public_signature_key: b64string;
  public_encryption_key: b64string;
};

export type PublicProvisionalIdentity = ProvisionalIdentityBase & {
  target: PublicProvisionalIdentityTarget;
};
export type SecretProvisionalIdentity = ProvisionalIdentityBase & {
  target: SecretProvisionalIdentityTarget;
  private_encryption_key: b64string;
  private_signature_key: b64string;
};
export type PublicProvisionalUser = {
  trustchainId: Uint8Array;
  target: string;
  value: string;
  appSignaturePublicKey: Uint8Array;
  appEncryptionPublicKey: Uint8Array;
  tankerSignaturePublicKey: Uint8Array;
  tankerEncryptionPublicKey: Uint8Array;
};
export type ProvisionalUserKeys = {
  appSignatureKeyPair: tcrypto.SodiumKeyPair;
  appEncryptionKeyPair: tcrypto.SodiumKeyPair;
  tankerSignatureKeyPair: tcrypto.SodiumKeyPair;
  tankerEncryptionKeyPair: tcrypto.SodiumKeyPair;
};
export type SecretIdentity = SecretPermanentIdentity | SecretProvisionalIdentity;
export type PublicIdentity = PublicPermanentIdentity | PublicProvisionalIdentity;

function isPermanentIdentity(identity: SecretIdentity | PublicIdentity): boolean {
  return identity.target === 'user';
}

function isPublicPermanentIdentity(identity: SecretPermanentIdentity | PublicPermanentIdentity): boolean {
  return !('user_secret' in identity);
}

function isProvisionalIdentity(identity: SecretIdentity | PublicIdentity): boolean {
  return !isPermanentIdentity(identity);
}

const rubyJsonOrder: Record<string, number> = {
  trustchain_id: 1,
  target: 2,
  value: 3,
  delegation_signature: 4,
  ephemeral_public_signature_key: 5,
  ephemeral_private_signature_key: 6,
  user_secret: 7,
  public_encryption_key: 8,
  private_encryption_key: 9,
  public_signature_key: 10,
  private_signature_key: 11,
};

function rubyJsonSort(a: string, b: string) {
  const aIdx = rubyJsonOrder[a];
  const bIdx = rubyJsonOrder[b];
  if (!aIdx) throw new InvalidArgument(`Assertion error: unknown identity JSON key: ${a}`);
  if (!bIdx) throw new InvalidArgument(`Assertion error: unknown identity JSON key: ${b}`);
  return aIdx - bIdx;
}

function dumpOrderedJson(o: Record<string, any>): string {
  const keys = Object.keys(o).sort(rubyJsonSort);
  const json = [];

  for (const k of keys) {
    let val;
    if (o[k] !== null && typeof o[k] === 'object') val = dumpOrderedJson(o[k]); else val = JSON.stringify(o[k]);
    json.push(`"${k}":${val}`);
  }

  return `{${json.join(',')}}`;
}

export function toIdentityOrderedJson(identity: SecretIdentity | PublicIdentity): b64string {
  return utils.toBase64(utils.fromString(dumpOrderedJson(identity)));
}

export function _serializeIdentity(identity: SecretIdentity | PublicIdentity): b64string { // eslint-disable-line no-underscore-dangle
  return toIdentityOrderedJson(identity);
}

function _deserializeAndFreeze(identity: b64string): Object { // eslint-disable-line no-underscore-dangle
  const result = utils.fromB64Json(identity);
  // Hidden property that carries the original serialized version of the
  // identity for debugging purposes (e.g. error messages)
  Object.defineProperty(result, 'serializedIdentity', {
    value: identity,
    configurable: false,
    enumerable: false,
    writable: false,
  });
  return Object.freeze(result);
}

export function _deserializeIdentity(identity: b64string): SecretIdentity { // eslint-disable-line no-underscore-dangle
  try {
    return _deserializeAndFreeze(identity) as SecretIdentity;
  } catch (e) {
    throw new InvalidArgument(`Invalid identity provided: ${identity}`);
  }
}
export function _deserializePermanentIdentity(identity: b64string): SecretPermanentIdentity { // eslint-disable-line no-underscore-dangle
  let result: SecretPermanentIdentity;

  try {
    result = _deserializeAndFreeze(identity) as SecretPermanentIdentity;
  } catch (e) {
    throw new InvalidArgument(`Invalid secret permanent identity provided: ${identity}`);
  }

  if (!isPermanentIdentity(result)) {
    throw new InvalidArgument(`Expected a secret permanent identity, but got provisional identity with target: "${result.target}"`);
  }

  if (isPublicPermanentIdentity(result)) {
    throw new InvalidArgument(`Expected a secret permanent identity, but got a public permanent identity: ${identity}"`);
  }

  return result;
}
export function _deserializeProvisionalIdentity(identity: b64string): SecretProvisionalIdentity { // eslint-disable-line no-underscore-dangle
  let result: SecretProvisionalIdentity;

  try {
    result = _deserializeAndFreeze(identity) as SecretProvisionalIdentity;
  } catch (e) {
    throw new InvalidArgument(`Invalid provisional identity provided: ${identity}`);
  }

  if (!isProvisionalIdentity(result)) {
    throw new InvalidArgument(`Expected a provisional identity, but contained target "${result.target}"`);
  }

  return result;
}
export function _deserializePublicIdentity(identity: b64string): PublicIdentity { // eslint-disable-line no-underscore-dangle
  try {
    return _deserializeAndFreeze(identity) as PublicIdentity;
  } catch (e) {
    throw new InvalidArgument(`Invalid public identity provided: ${identity}`);
  }
}

export function _splitProvisionalAndPermanentPublicIdentities(identities: Array<PublicIdentity>) { // eslint-disable-line no-underscore-dangle
  const permanentIdentities: Array<PublicPermanentIdentity> = [];
  const provisionalIdentities: Array<PublicProvisionalIdentity> = [];

  for (const identity of identities) {
    if (isPermanentIdentity(identity)) {
      // Check that the permanent identities are not secret permanent identities
      if ('user_secret' in identity) {
        throw new InvalidArgument('unexpected secret identity, only public identities are allowed');
      }

      permanentIdentities.push(identity as PublicPermanentIdentity);
    } else {
      // Check that the provisional identities are not secret provisional identities
      if ('private_encryption_key' in identity) {
        throw new InvalidArgument('unexpected secret identity, only public identities are allowed');
      }

      provisionalIdentities.push(identity as PublicProvisionalIdentity);
    }
  }

  return {
    permanentIdentities,
    provisionalIdentities,
  };
}

function _generateAppId(appSecret: Uint8Array): b64string { // eslint-disable-line no-underscore-dangle
  const publicKey = appSecret.subarray(tcrypto.SIGNATURE_PRIVATE_KEY_SIZE - tcrypto.SIGNATURE_PUBLIC_KEY_SIZE, tcrypto.SIGNATURE_PRIVATE_KEY_SIZE);
  return utils.toBase64(utils.generateAppID(publicKey));
}

export async function createIdentity(appId: b64string, appSecret: b64string, userId: string): Promise<b64string> {
  if (!appId || typeof appId !== 'string') throw new InvalidArgument('appId', 'b64string', appId);
  if (!appSecret || typeof appSecret !== 'string') throw new InvalidArgument('appSecret', 'b64string', appSecret);
  if (!userId || typeof userId !== 'string') throw new InvalidArgument('userId', 'string', userId);
  await cryptoReady;
  const obfuscatedUserId = obfuscateUserId(utils.fromBase64(appId), userId);
  const appSecretBytes = utils.fromBase64(appSecret);

  const gerenatedAppId = _generateAppId(appSecretBytes);

  if (gerenatedAppId !== appId) throw new InvalidArgument('app secret and app ID mismatch');
  const ephemeralKeyPair = tcrypto.makeSignKeyPair();
  const toSign = utils.concatArrays(ephemeralKeyPair.publicKey, obfuscatedUserId);
  const delegationSignature = tcrypto.sign(toSign, appSecretBytes);
  const userSecret = createUserSecretB64(appId, userId);
  const permanentIdentity: SecretPermanentIdentity = {
    trustchain_id: appId,
    target: 'user',
    value: utils.toBase64(obfuscatedUserId),
    delegation_signature: utils.toBase64(delegationSignature),
    ephemeral_public_signature_key: utils.toBase64(ephemeralKeyPair.publicKey),
    ephemeral_private_signature_key: utils.toBase64(ephemeralKeyPair.privateKey),
    user_secret: userSecret,
  };
  return _serializeIdentity(permanentIdentity);
}
export async function createProvisionalIdentity(appId: b64string, target: SecretProvisionalIdentityTarget, value: string): Promise<b64string> {
  if (!appId || typeof appId !== 'string') throw new InvalidArgument('appId', 'b64string', appId);
  if (!target || typeof target !== 'string') throw new InvalidArgument('target', 'string', target);
  if (!value || typeof value !== 'string') throw new InvalidArgument('value', 'string', value);
  if (!['email', 'phone_number'].includes(target)) throw new InvalidArgument('Unsupported target for provisional identity');
  await cryptoReady;
  const encryptionKeys = tcrypto.makeEncryptionKeyPair();
  const signatureKeys = tcrypto.makeSignKeyPair();
  const provisionalIdentity: SecretProvisionalIdentity = {
    trustchain_id: appId,
    target,
    value,
    public_encryption_key: utils.toBase64(encryptionKeys.publicKey),
    private_encryption_key: utils.toBase64(encryptionKeys.privateKey),
    public_signature_key: utils.toBase64(signatureKeys.publicKey),
    private_signature_key: utils.toBase64(signatureKeys.privateKey),
  };
  return _serializeIdentity(provisionalIdentity);
}

async function _getPublicHashedValueFromSecretProvisional(identity: SecretProvisionalIdentity): Promise<b64string> { // eslint-disable-line no-underscore-dangle
  /* eslint-disable no-else-return */
  // eslint is too clever by half. Write your code for humans to read, not machines, and let us free ourselves from the tyranny of bad linters, my friends!
  if (identity.target === 'email') {
    return utils.toBase64(await generichash(utils.fromString(identity.value)));
  } else if (identity.target === 'phone_number') {
    const hashSalt = await generichash(utils.fromBase64(identity.private_signature_key));
    return utils.toBase64(await generichash(utils.concatArrays(hashSalt, utils.fromString(identity.value))));
  } else {
    throw new InvalidArgument(`Unsupported identity target to hash: ${identity.target}`);
  }
  /* eslint-enable no-else-return */
}

// Note: tankerIdentity is a Tanker identity created by either createIdentity() or createProvisionalIdentity()
export async function getPublicIdentity(tankerIdentity: b64string): Promise<b64string> {
  if (!tankerIdentity || typeof tankerIdentity !== 'string') throw new InvalidArgument('tankerIdentity', 'b64string', tankerIdentity);
  await cryptoReady;

  const identity = _deserializeIdentity(tankerIdentity);

  if (isPermanentIdentity(identity)) {
    const {
      trustchain_id,
      target,
      value,
    } = identity;
    return _serializeIdentity({
      trustchain_id,
      target,
      value,
    } as PublicPermanentIdentity);
  }

  const provIdentity = identity as SecretProvisionalIdentity;
  if (provIdentity.public_signature_key && provIdentity.public_encryption_key) {
    const {
      trustchain_id,
      public_signature_key,
      public_encryption_key,
    } = provIdentity;

    const target: PublicProvisionalIdentityTarget = `hashed_${provIdentity.target}`;
    const value = await _getPublicHashedValueFromSecretProvisional(provIdentity);
    const publicIdentity: PublicIdentity = {
      trustchain_id,
      target,
      value,
      public_signature_key,
      public_encryption_key,
    };
    return _serializeIdentity(publicIdentity);
  }

  throw new InvalidArgument(`Invalid secret identity provided: ${tankerIdentity}`);
}

export async function upgradeIdentity(tankerIdentity: b64string): Promise<b64string> {
  if (!tankerIdentity || typeof tankerIdentity !== 'string') throw new InvalidArgument('tankerIdentity', 'b64string', tankerIdentity);

  const frozenIdentity = _deserializeIdentity(tankerIdentity);

  const identity = {
    ...frozenIdentity,
  };

  const pubIdentity = identity as PublicIdentity;
  if (identity.target === 'email' && !identity.private_encryption_key) {
    pubIdentity.value = await _getPublicHashedValueFromSecretProvisional(identity);
    pubIdentity.target = 'hashed_email';
  }

  return _serializeIdentity(pubIdentity);
}
