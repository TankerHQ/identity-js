import type { b64string } from '@tanker/crypto';
import { generichash, ready as cryptoReady, tcrypto, utils } from '@tanker/crypto';
import { expect } from '@tanker/test-utils';
import { InvalidArgument } from '../errors';
import type {
  SecretPermanentIdentity, SecretProvisionalIdentity, PublicIdentity, PublicProvisionalIdentity,
} from '../identity';
import { _deserializeIdentity, _deserializePermanentIdentity, _deserializeProvisionalIdentity, _deserializePublicIdentity, _splitProvisionalAndPermanentPublicIdentities, _serializeIdentity, createIdentity, createProvisionalIdentity, getPublicIdentity, upgradeIdentity } from '../identity';
import { obfuscateUserId } from '../userId';
import { assertUserSecret } from '../userSecret';

function checkDelegationSignature(identity: SecretPermanentIdentity, trustchainPublicKey: string) {
  const signedData = utils.concatArrays(utils.fromBase64(identity.ephemeral_public_signature_key), utils.fromBase64(identity.value));
  expect(tcrypto.verifySignature(signedData, utils.fromBase64(identity.delegation_signature), utils.fromBase64(trustchainPublicKey))).to.equal(true);
}

describe('Identity', () => {
  const trustchain = {
    id: 'tpoxyNzh0hU9G2i9agMvHyyd+pO6zGCjO9BfhrCLjd4=',
    sk: 'cTMoGGUKhwN47ypq4xAXAtVkNWeyUtMltQnYwJhxWYSvqjPVGmXd2wwa7y17QtPTZhn8bxb015CZC/e4ZI7+MQ==',
    pk: 'r6oz1Rpl3dsMGu8te0LT02YZ/G8W9NeQmQv3uGSO/jE=',
  };
  const userId = 'b_eich';
  const userEmail = 'brendan.eich@tanker.io';
  const userPhone = '+33611223344';
  let hashedUserEmail: string;
  let obfuscatedUserId: string;
  before(async () => {
    await cryptoReady;
    obfuscatedUserId = utils.toBase64(obfuscateUserId(utils.fromBase64(trustchain.id), userId));
    hashedUserEmail = utils.toBase64(generichash(utils.fromString(userEmail)));
  });
  describe('serialize/deserialize', () => {
    const goodPermanentIdentity = 'eyJ0cnVzdGNoYWluX2lkIjoidHBveHlOemgwaFU5RzJpOWFnTXZIeXlkK3BPNnpHQ2pPOUJmaHJDTGpkND0iLCJ0YXJnZXQiOiJ1c2VyIiwidmFsdWUiOiJSRGEwZXE0WE51ajV0VjdoZGFwak94aG1oZVRoNFFCRE5weTRTdnk5WG9rPSIsImRlbGVnYXRpb25fc2lnbmF0dXJlIjoiVTlXUW9sQ3ZSeWpUOG9SMlBRbWQxV1hOQ2kwcW1MMTJoTnJ0R2FiWVJFV2lyeTUya1d4MUFnWXprTHhINmdwbzNNaUE5cisremhubW9ZZEVKMCtKQ3c9PSIsImVwaGVtZXJhbF9wdWJsaWNfc2lnbmF0dXJlX2tleSI6IlhoM2kweERUcHIzSFh0QjJRNTE3UUt2M2F6TnpYTExYTWRKRFRTSDRiZDQ9IiwiZXBoZW1lcmFsX3ByaXZhdGVfc2lnbmF0dXJlX2tleSI6ImpFRFQ0d1FDYzFERndvZFhOUEhGQ2xuZFRQbkZ1Rm1YaEJ0K2lzS1U0WnBlSGVMVEVOT212Y2RlMEhaRG5YdEFxL2RyTTNOY3N0Y3gwa05OSWZodDNnPT0iLCJ1c2VyX3NlY3JldCI6IjdGU2YvbjBlNzZRVDNzMERrdmV0UlZWSmhYWkdFak94ajVFV0FGZXh2akk9In0=';
    const goodProvisionalIdentity = 'eyJ0cnVzdGNoYWluX2lkIjoidHBveHlOemgwaFU5RzJpOWFnTXZIeXlkK3BPNnpHQ2pPOUJmaHJDTGpkND0iLCJ0YXJnZXQiOiJlbWFpbCIsInZhbHVlIjoiYnJlbmRhbi5laWNoQHRhbmtlci5pbyIsInB1YmxpY19lbmNyeXB0aW9uX2tleSI6Ii8yajRkSTNyOFBsdkNOM3VXNEhoQTV3QnRNS09jQUNkMzhLNk4wcSttRlU9IiwicHJpdmF0ZV9lbmNyeXB0aW9uX2tleSI6IjRRQjVUV212Y0JyZ2V5RERMaFVMSU5VNnRicUFPRVE4djlwakRrUGN5YkE9IiwicHVibGljX3NpZ25hdHVyZV9rZXkiOiJXN1FFUUJ1OUZYY1hJcE9ncTYydFB3Qml5RkFicFQxckFydUQwaC9OclRBPSIsInByaXZhdGVfc2lnbmF0dXJlX2tleSI6IlVtbll1dmRUYUxZRzBhK0phRHBZNm9qdzQvMkxsOHpzbXJhbVZDNGZ1cVJidEFSQUc3MFZkeGNpazZDcnJhMC9BR0xJVUJ1bFBXc0N1NFBTSDgydE1BPT0ifQ==';
    const goodPublicIdentity = 'eyJ0cnVzdGNoYWluX2lkIjoidHBveHlOemgwaFU5RzJpOWFnTXZIeXlkK3BPNnpHQ2pPOUJmaHJDTGpkND0iLCJ0YXJnZXQiOiJ1c2VyIiwidmFsdWUiOiJSRGEwZXE0WE51ajV0VjdoZGFwak94aG1oZVRoNFFCRE5weTRTdnk5WG9rPSJ9';
    const goodPublicProvisionalIdentity = 'eyJ0cnVzdGNoYWluX2lkIjoidHBveHlOemgwaFU5RzJpOWFnTXZIeXlkK3BPNnpHQ2pPOUJmaHJDTGpkND0iLCJ0YXJnZXQiOiJoYXNoZWRfZW1haWwiLCJ2YWx1ZSI6IjB1MmM4dzhFSVpXVDJGelJOL3l5TTVxSWJFR1lUTkRUNVNrV1ZCdTIwUW89IiwicHVibGljX2VuY3J5cHRpb25fa2V5IjoiLzJqNGRJM3I4UGx2Q04zdVc0SGhBNXdCdE1LT2NBQ2QzOEs2TjBxK21GVT0iLCJwdWJsaWNfc2lnbmF0dXJlX2tleSI6Ilc3UUVRQnU5RlhjWElwT2dxNjJ0UHdCaXlGQWJwVDFyQXJ1RDBoL05yVEE9In0=';
    const phoneNumberProvisionalIdentity = 'eyJ0cnVzdGNoYWluX2lkIjoidHBveHlOemgwaFU5RzJpOWFnTXZIeXlkK3BPNnpHQ2pPOUJmaHJDTGpkND0iLCJ0YXJnZXQiOiJwaG9uZV9udW1iZXIiLCJ2YWx1ZSI6IiszMzYxMTIyMzM0NCIsInB1YmxpY19lbmNyeXB0aW9uX2tleSI6Im42bTlYNUxmMFpuYXo4ZjArc2NoTElCTm0rcGlQaG5zWXZBdlh3MktFQXc9IiwicHJpdmF0ZV9lbmNyeXB0aW9uX2tleSI6InRWVFM5bkh4cjJNZFZ1VFI1Y2x3dzBFWGJ3aXM4SGl4Z1BJTmJRSngxVTQ9IiwicHVibGljX3NpZ25hdHVyZV9rZXkiOiJqcklEaWdTQ25BaTNHbDltSUFTbEFpU2hLQzdkQkxGVVpQOUN4TEdzYkg4PSIsInByaXZhdGVfc2lnbmF0dXJlX2tleSI6IlFIcWNMcjhicjZNM2JQblFtUWczcStxSENycDA1RGJjQnBMUGFUWlkwYTZPc2dPS0JJS2NDTGNhWDJZZ0JLVUNKS0VvTHQwRXNWUmsvMExFc2F4c2Z3PT0ifQ==';
    const phoneNumberPublicProvisionalIdentity = 'eyJ0cnVzdGNoYWluX2lkIjoidHBveHlOemgwaFU5RzJpOWFnTXZIeXlkK3BPNnpHQ2pPOUJmaHJDTGpkND0iLCJ0YXJnZXQiOiJoYXNoZWRfcGhvbmVfbnVtYmVyIiwidmFsdWUiOiJKZWFpUUFoOHg3amNpb1UybTRpaHkrQ3NISmx5Vys0VlZTU3M1U0hGVVR3PSIsInB1YmxpY19lbmNyeXB0aW9uX2tleSI6Im42bTlYNUxmMFpuYXo4ZjArc2NoTElCTm0rcGlQaG5zWXZBdlh3MktFQXc9IiwicHVibGljX3NpZ25hdHVyZV9rZXkiOiJqcklEaWdTQ25BaTNHbDltSUFTbEFpU2hLQzdkQkxGVVpQOUN4TEdzYkg4PSJ9';
    it('can parse a valid permanent identity', () => {
      const identity = _deserializePermanentIdentity(goodPermanentIdentity);

      expect(identity.trustchain_id).to.be.equal(trustchain.id);
      expect(identity.target).to.be.equal('user');
      expect(identity.value).to.equal(obfuscatedUserId);
      expect(identity.delegation_signature).to.equal('U9WQolCvRyjT8oR2PQmd1WXNCi0qmL12hNrtGabYREWiry52kWx1AgYzkLxH6gpo3MiA9r++zhnmoYdEJ0+JCw==');
      expect(identity.ephemeral_public_signature_key).to.equal('Xh3i0xDTpr3HXtB2Q517QKv3azNzXLLXMdJDTSH4bd4=');
      expect(identity.ephemeral_private_signature_key).to.equal('jEDT4wQCc1DFwodXNPHFClndTPnFuFmXhBt+isKU4ZpeHeLTENOmvcde0HZDnXtAq/drM3Ncstcx0kNNIfht3g==');
      expect(identity.user_secret).to.equal('7FSf/n0e76QT3s0DkvetRVVJhXZGEjOxj5EWAFexvjI=');
      // @ts-ignore: hidden property
      expect(identity.serializedIdentity).to.equal(goodPermanentIdentity);
      expect(_serializeIdentity(identity)).to.equal(goodPermanentIdentity);
    });
    it('can parse a valid provisional identity', () => {
      const identity = _deserializeProvisionalIdentity(goodProvisionalIdentity);

      expect(identity.trustchain_id).to.be.equal(trustchain.id);
      expect(identity.target).to.be.equal('email');
      expect(identity.value).to.equal(userEmail);
      expect(identity.public_signature_key).to.equal('W7QEQBu9FXcXIpOgq62tPwBiyFAbpT1rAruD0h/NrTA=');
      expect(identity.private_signature_key).to.equal('UmnYuvdTaLYG0a+JaDpY6ojw4/2Ll8zsmramVC4fuqRbtARAG70Vdxcik6Crra0/AGLIUBulPWsCu4PSH82tMA==');
      expect(identity.public_encryption_key).to.equal('/2j4dI3r8PlvCN3uW4HhA5wBtMKOcACd38K6N0q+mFU=');
      expect(identity.private_encryption_key).to.equal('4QB5TWmvcBrgeyDDLhULINU6tbqAOEQ8v9pjDkPcybA=');
      // @ts-ignore: hidden property
      expect(identity.serializedIdentity).to.equal(goodProvisionalIdentity);
      expect(_serializeIdentity(identity)).to.equal(goodProvisionalIdentity);
    });
    it('can parse a valid public identity', () => {
      const identity = _deserializePublicIdentity(goodPublicIdentity);

      expect(identity.trustchain_id).to.equal(trustchain.id);
      expect(identity.target).to.equal('user');
      expect(identity.value).to.equal(obfuscatedUserId);
      // @ts-ignore: hidden property
      expect(identity.serializedIdentity).to.equal(goodPublicIdentity);
      expect(_serializeIdentity(identity)).to.equal(goodPublicIdentity);
    });
    it('can parse a valid public provisional identity', () => {
      const identity = _deserializeProvisionalIdentity(goodPublicProvisionalIdentity);

      expect(identity.trustchain_id).to.be.equal(trustchain.id);
      expect(identity.target).to.be.equal('hashed_email');
      expect(identity.value).to.equal(hashedUserEmail);
      expect(identity.public_signature_key).to.equal('W7QEQBu9FXcXIpOgq62tPwBiyFAbpT1rAruD0h/NrTA=');
      expect(identity.public_encryption_key).to.equal('/2j4dI3r8PlvCN3uW4HhA5wBtMKOcACd38K6N0q+mFU=');
      // @ts-ignore: hidden property
      expect(identity.serializedIdentity).to.equal(goodPublicProvisionalIdentity);
      expect(_serializeIdentity(identity)).to.equal(goodPublicProvisionalIdentity);
    });
    it('can parse a valid phone_number provisional identity', () => {
      const identity = _deserializeProvisionalIdentity(phoneNumberProvisionalIdentity);

      expect(identity.trustchain_id).to.be.equal(trustchain.id);
      expect(identity.target).to.be.equal('phone_number');
      expect(identity.value).to.equal(userPhone);
      expect(identity.public_signature_key).to.equal('jrIDigSCnAi3Gl9mIASlAiShKC7dBLFUZP9CxLGsbH8=');
      expect(identity.private_signature_key).to.equal('QHqcLr8br6M3bPnQmQg3q+qHCrp05DbcBpLPaTZY0a6OsgOKBIKcCLcaX2YgBKUCJKEoLt0EsVRk/0LEsaxsfw==');
      expect(identity.public_encryption_key).to.equal('n6m9X5Lf0Znaz8f0+schLIBNm+piPhnsYvAvXw2KEAw=');
      expect(identity.private_encryption_key).to.equal('tVTS9nHxr2MdVuTR5clww0EXbwis8HixgPINbQJx1U4=');
      // @ts-expect-error hidden property
      expect(identity.serializedIdentity).to.equal(phoneNumberProvisionalIdentity);
      expect(_serializeIdentity(identity)).to.equal(phoneNumberProvisionalIdentity);
    });
    it('can parse a valid phone_number public provisional identity', async () => {
      const privIdentity = _deserializeProvisionalIdentity(phoneNumberProvisionalIdentity);

      const identity = _deserializeProvisionalIdentity(phoneNumberPublicProvisionalIdentity);

      const hashSalt = await generichash(utils.fromBase64(privIdentity.private_signature_key));
      const hashedPhone = utils.toBase64(await generichash(utils.concatArrays(hashSalt, utils.fromString(userPhone))));
      expect(identity.trustchain_id).to.be.equal(trustchain.id);
      expect(identity.target).to.be.equal('hashed_phone_number');
      expect(identity.value).to.equal(hashedPhone);
      expect(identity.public_signature_key).to.equal('jrIDigSCnAi3Gl9mIASlAiShKC7dBLFUZP9CxLGsbH8=');
      expect(identity.public_encryption_key).to.equal('n6m9X5Lf0Znaz8f0+schLIBNm+piPhnsYvAvXw2KEAw=');
      // @ts-expect-error hidden property
      expect(identity.serializedIdentity).to.equal(phoneNumberPublicProvisionalIdentity);
      expect(_serializeIdentity(identity)).to.equal(phoneNumberPublicProvisionalIdentity);
      expect(await getPublicIdentity(phoneNumberProvisionalIdentity)).to.equal(phoneNumberPublicProvisionalIdentity);
    });
    it('can parse both types of secret identities with _deserializeIdentity', () => {
      expect(_deserializeIdentity(goodPermanentIdentity)).to.deep.equal(_deserializePermanentIdentity(goodPermanentIdentity));
      expect(_deserializeIdentity(goodProvisionalIdentity)).to.deep.equal(_deserializeProvisionalIdentity(goodProvisionalIdentity));
    });
    it('can upgrade identities', async () => {
      const oldPermanentIdentity = 'eyJkZWxlZ2F0aW9uX3NpZ25hdHVyZSI6IlU5V1FvbEN2UnlqVDhvUjJQUW1kMVdYTkNpMHFtTDEyaE5ydEdhYllSRVdpcnk1MmtXeDFBZ1l6a0x4SDZncG8zTWlBOXIrK3pobm1vWWRFSjArSkN3PT0iLCJlcGhlbWVyYWxfcHJpdmF0ZV9zaWduYXR1cmVfa2V5IjoiakVEVDR3UUNjMURGd29kWE5QSEZDbG5kVFBuRnVGbVhoQnQraXNLVTRacGVIZUxURU5PbXZjZGUwSFpEblh0QXEvZHJNM05jc3RjeDBrTk5JZmh0M2c9PSIsImVwaGVtZXJhbF9wdWJsaWNfc2lnbmF0dXJlX2tleSI6IlhoM2kweERUcHIzSFh0QjJRNTE3UUt2M2F6TnpYTExYTWRKRFRTSDRiZDQ9IiwidGFyZ2V0IjoidXNlciIsInRydXN0Y2hhaW5faWQiOiJ0cG94eU56aDBoVTlHMmk5YWdNdkh5eWQrcE82ekdDak85QmZockNMamQ0PSIsInVzZXJfc2VjcmV0IjoiN0ZTZi9uMGU3NlFUM3MwRGt2ZXRSVlZKaFhaR0VqT3hqNUVXQUZleHZqST0iLCJ2YWx1ZSI6IlJEYTBlcTRYTnVqNXRWN2hkYXBqT3hobWhlVGg0UUJETnB5NFN2eTlYb2s9In0=';
      const oldProvisionalIdentity = 'eyJwcml2YXRlX2VuY3J5cHRpb25fa2V5IjoiNFFCNVRXbXZjQnJnZXlERExoVUxJTlU2dGJxQU9FUTh2OXBqRGtQY3liQT0iLCJwcml2YXRlX3NpZ25hdHVyZV9rZXkiOiJVbW5ZdXZkVGFMWUcwYStKYURwWTZvanc0LzJMbDh6c21yYW1WQzRmdXFSYnRBUkFHNzBWZHhjaWs2Q3JyYTAvQUdMSVVCdWxQV3NDdTRQU0g4MnRNQT09IiwicHVibGljX2VuY3J5cHRpb25fa2V5IjoiLzJqNGRJM3I4UGx2Q04zdVc0SGhBNXdCdE1LT2NBQ2QzOEs2TjBxK21GVT0iLCJwdWJsaWNfc2lnbmF0dXJlX2tleSI6Ilc3UUVRQnU5RlhjWElwT2dxNjJ0UHdCaXlGQWJwVDFyQXJ1RDBoL05yVEE9IiwidGFyZ2V0IjoiZW1haWwiLCJ0cnVzdGNoYWluX2lkIjoidHBveHlOemgwaFU5RzJpOWFnTXZIeXlkK3BPNnpHQ2pPOUJmaHJDTGpkND0iLCJ2YWx1ZSI6ImJyZW5kYW4uZWljaEB0YW5rZXIuaW8ifQ==';
      const oldPublicIdentity = 'eyJ0YXJnZXQiOiJ1c2VyIiwidHJ1c3RjaGFpbl9pZCI6InRwb3h5TnpoMGhVOUcyaTlhZ012SHl5ZCtwTzZ6R0NqTzlCZmhyQ0xqZDQ9IiwidmFsdWUiOiJSRGEwZXE0WE51ajV0VjdoZGFwak94aG1oZVRoNFFCRE5weTRTdnk5WG9rPSJ9';
      const oldPublicProvisionalIdentity = 'eyJ0cnVzdGNoYWluX2lkIjoidHBveHlOemgwaFU5RzJpOWFnTXZIeXlkK3BPNnpHQ2pPOUJmaHJDTGpkND0iLCJ0YXJnZXQiOiJlbWFpbCIsInZhbHVlIjoiYnJlbmRhbi5laWNoQHRhbmtlci5pbyIsInB1YmxpY19lbmNyeXB0aW9uX2tleSI6Ii8yajRkSTNyOFBsdkNOM3VXNEhoQTV3QnRNS09jQUNkMzhLNk4wcSttRlU9IiwicHVibGljX3NpZ25hdHVyZV9rZXkiOiJXN1FFUUJ1OUZYY1hJcE9ncTYydFB3Qml5RkFicFQxckFydUQwaC9OclRBPSJ9';
      expect(await upgradeIdentity(oldPermanentIdentity)).to.deep.equal(goodPermanentIdentity);
      expect(await upgradeIdentity(oldProvisionalIdentity)).to.deep.equal(goodProvisionalIdentity);
      expect(await upgradeIdentity(oldPublicIdentity)).to.deep.equal(goodPublicIdentity);
      expect(await upgradeIdentity(oldPublicProvisionalIdentity)).to.deep.equal(goodPublicProvisionalIdentity);
    });
  });
  describe('create permanent', () => {
    let b64Identity: b64string;
    before(async () => {
      b64Identity = await createIdentity(trustchain.id, trustchain.sk, userId);
    });
    it('returns a tanker permanent identity', async () => {
      const identity = _deserializePermanentIdentity(b64Identity);

      expect(identity.trustchain_id).to.be.equal(trustchain.id);
      expect(identity.target).to.be.equal('user');
      expect(identity.value).to.be.equal(obfuscatedUserId);
      assertUserSecret(utils.fromBase64(identity.value), utils.fromBase64(identity.user_secret));
      checkDelegationSignature(identity, trustchain.pk);
    });
    it('returns a tanker public identity from a tanker permanent identity', async () => {
      const b64PublicIdentity = await getPublicIdentity(b64Identity);

      const {
        trustchain_id,
        target,
        value,
        ...trail
      } = _deserializePublicIdentity(b64PublicIdentity);

      expect(trustchain_id).to.equal(trustchain.id);
      expect(target).to.equal('user');
      expect(value).to.equal(obfuscatedUserId);
      expect(trail).to.be.empty;
    });
    it('throws with invalid app ID', async () => {
      // @ts-expect-error
      await expect(createIdentity(undefined, trustchain.sk, userId)).to.be.rejectedWith(InvalidArgument);
      // @ts-expect-error
      await expect(createIdentity([], trustchain.sk, userId)).to.be.rejectedWith(InvalidArgument);
    });
    it('throws with invalid app secret', async () => {
      // @ts-expect-error
      await expect(createIdentity(trustchain.id, undefined, userId)).to.be.rejectedWith(InvalidArgument);
      // @ts-expect-error
      await expect(createIdentity(trustchain.id, [], userId)).to.be.rejectedWith(InvalidArgument);
    });
    it('throws with invalid user ID', async () => {
      // @ts-expect-error
      await expect(createIdentity(trustchain.id, trustchain.sk, undefined)).to.be.rejectedWith(InvalidArgument);
      // @ts-expect-error
      await expect(createIdentity(trustchain.id, trustchain.sk, [])).to.be.rejectedWith(InvalidArgument);
    });
    it('throws with invalid identity', async () => {
      // @ts-expect-error
      await expect(getPublicIdentity(undefined)).to.be.rejectedWith(InvalidArgument);
      // @ts-expect-error
      await expect(getPublicIdentity([])).to.be.rejectedWith(InvalidArgument);
    });
  });
  describe('create provisional', () => {
    let b64Identity: string;
    let b64PhoneNumberIdentity: string;
    before(async () => {
      b64Identity = await createProvisionalIdentity(trustchain.id, 'email', userEmail);
      b64PhoneNumberIdentity = await createProvisionalIdentity(trustchain.id, 'phone_number', userPhone);
    });
    it('cannot create a provisional with an invalid target', async () => {
      // @ts-expect-error Checking that invalid arguments result in errors may require passing invalid arguments. Don't try this at home.
      await expect(createProvisionalIdentity(trustchain.id, 'invalid', 'whatever')).to.be.rejectedWith(InvalidArgument);
    });
    it('returns a tanker provisional identity', async () => {
      const {
        trustchain_id,
        value,
        target,
        public_signature_key,
        public_encryption_key,
        private_signature_key,
        private_encryption_key,
      } = _deserializeProvisionalIdentity(b64Identity);

      expect(trustchain_id).to.equal(trustchain.id);
      expect(target).to.be.equal('email');
      expect(value).to.be.equal(userEmail);
      expect(public_encryption_key).to.be.a('string').that.is.not.empty;
      expect(private_encryption_key).to.be.a('string').that.is.not.empty;
      expect(public_signature_key).to.be.a('string').that.is.not.empty;
      expect(private_signature_key).to.be.a('string').that.is.not.empty;
    });
    it('returns a tanker public identity from a tanker provisional identity', async () => {
      const b64PublicIdentity = await getPublicIdentity(b64Identity);

      const provisionalIdentity = _deserializeProvisionalIdentity(b64Identity);

      const {
        trustchain_id,
        target,
        value,
        public_signature_key,
        public_encryption_key,
        ...trail
      } = _deserializePublicIdentity(b64PublicIdentity) as PublicProvisionalIdentity;

      const hashedEmail = utils.toBase64(generichash(utils.fromString(userEmail)));
      expect(trustchain_id).to.equal(trustchain.id);
      expect(target).to.equal('hashed_email');
      expect(value).to.be.equal(hashedEmail);
      expect(public_encryption_key).to.equal(provisionalIdentity.public_encryption_key);
      expect(public_signature_key).to.equal(provisionalIdentity.public_signature_key);
      expect(trail).to.be.empty;
    });
    it('returns a tanker phone_number provisional identity', async () => {
      const {
        trustchain_id,
        value,
        target,
        public_signature_key,
        public_encryption_key,
        private_signature_key,
        private_encryption_key,
      } = _deserializeProvisionalIdentity(b64PhoneNumberIdentity); // eslint-disable-line camelcase

      expect(trustchain_id).to.equal(trustchain.id);
      expect(target).to.be.equal('phone_number');
      expect(value).to.be.equal(userPhone);
      expect(public_encryption_key).to.be.a('string').that.is.not.empty;
      expect(private_encryption_key).to.be.a('string').that.is.not.empty;
      expect(public_signature_key).to.be.a('string').that.is.not.empty;
      expect(private_signature_key).to.be.a('string').that.is.not.empty;
    });
    it('returns a tanker public identity from a tanker phone_number provisional identity', async () => {
      const b64PublicIdentity = await getPublicIdentity(b64PhoneNumberIdentity);

      const provisionalIdentity = _deserializeProvisionalIdentity(b64PhoneNumberIdentity);

      const {
        trustchain_id,
        target,
        value,
        public_signature_key,
        public_encryption_key,
        ...trail
      } = _deserializePublicIdentity(b64PublicIdentity) as PublicProvisionalIdentity;

      const hashSalt = await generichash(utils.fromBase64(provisionalIdentity.private_signature_key));
      const hashedPhone = utils.toBase64(await generichash(utils.concatArrays(hashSalt, utils.fromString(userPhone))));
      expect(trustchain_id).to.equal(trustchain.id);
      expect(target).to.equal('hashed_phone_number');
      expect(value).to.be.equal(hashedPhone);
      expect(public_encryption_key).to.equal(provisionalIdentity.public_encryption_key);
      expect(public_signature_key).to.equal(provisionalIdentity.public_signature_key);
      expect(trail).to.be.empty;
    });
    it('throws with invalid app ID', async () => {
      // @ts-expect-error
      await expect(createProvisionalIdentity(undefined, 'email', userEmail)).to.be.rejectedWith(InvalidArgument);
      // @ts-expect-error
      await expect(createProvisionalIdentity([], 'email', userEmail)).to.be.rejectedWith(InvalidArgument);
    });
    it('throws with invalid email', async () => {
      // @ts-expect-error
      await expect(createProvisionalIdentity(trustchain.id, 'email', undefined)).to.be.rejectedWith(InvalidArgument);
      // @ts-expect-error
      await expect(createProvisionalIdentity(trustchain.id, 'email', [])).to.be.rejectedWith(InvalidArgument);
    });
    it('throws with mismatching app ID and app secret', async () => {
      const mismatchingAppId = 'rB0/yEJWCUVYRtDZLtXaJqtneXQOsCSKrtmWw+V+ysc=';
      await expect(createIdentity(mismatchingAppId, trustchain.sk, userId)).to.be.rejectedWith(InvalidArgument);
    });
  });

  describe('_splitProvisionalAndPermanentPublicIdentities', () => {
    let b64Identity: b64string;
    let identity: SecretPermanentIdentity;
    let b64PublicIdentity: b64string;
    let publicIdentity: PublicIdentity;
    let b64ProvisionalIdentity: b64string;
    let provisionalIdentity: SecretProvisionalIdentity;
    let b64PublicProvisionalIdentity: b64string;
    let publicProvisionalIdentity: PublicProvisionalIdentity;
    before(async () => {
      b64Identity = await createIdentity(trustchain.id, trustchain.sk, userId);
      identity = _deserializePermanentIdentity(b64Identity);
      b64PublicIdentity = await getPublicIdentity(b64Identity);
      publicIdentity = _deserializePublicIdentity(b64PublicIdentity);
      b64ProvisionalIdentity = await createProvisionalIdentity(trustchain.id, 'email', userEmail);
      provisionalIdentity = _deserializeProvisionalIdentity(b64ProvisionalIdentity);
      b64PublicProvisionalIdentity = await getPublicIdentity(b64ProvisionalIdentity);
      publicProvisionalIdentity = _deserializePublicIdentity(b64PublicProvisionalIdentity) as PublicProvisionalIdentity;
    });
    it('splits identities as expected', async () => {
      const {
        permanentIdentities,
        provisionalIdentities,
      } = _splitProvisionalAndPermanentPublicIdentities([publicIdentity, publicProvisionalIdentity]);

      expect(permanentIdentities).to.deep.equal([publicIdentity]);
      expect(provisionalIdentities).to.deep.equal([publicProvisionalIdentity]);
    });
    it('throws when given a secret permanent identity', async () => {
      // @ts-ignore: testing edge case with permanentIdentity
      expect(() => _splitProvisionalAndPermanentPublicIdentities([identity, publicProvisionalIdentity])).to.throw(InvalidArgument);
    });
    it('throws when given a secret provisional identity', async () => {
      // @ts-ignore: testing edge case with permanentIdentity
      expect(() => _splitProvisionalAndPermanentPublicIdentities([publicIdentity, provisionalIdentity])).to.throw(InvalidArgument);
    });
  });
});
