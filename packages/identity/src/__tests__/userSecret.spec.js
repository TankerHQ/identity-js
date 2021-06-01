// @flow
import { ready as cryptoReady, utils } from '@tanker/crypto';
import { expect } from '@tanker/test-utils';

import { obfuscateUserId } from '../userId';
import { createUserSecretBinary, assertUserSecret, USER_SECRET_SIZE } from '../userSecret';

const { fromBase64, fromString } = utils;

describe('userSecret', () => {
  let trustchainId;
  let trustchainIdB64;

  before(async () => {
    await cryptoReady;
    trustchainIdB64 = 'uxTyZYP8OOYP13A4GQC4zfVr7hJz5tsF7YdMpd3PT8w=';
    trustchainId = fromBase64(trustchainIdB64);
  });

  it('should throw if bad arguments given to createUserSecretBinary', () => {
    [
      // $FlowExpectedError
      [], [undefined, 'fernand'], [trustchainIdB64], [trustchainIdB64, null]
    ].forEach((badArgs, i) => {
      // $FlowExpectedError
      expect(() => createUserSecretBinary(...badArgs), `bad args #${i}`).to.throw('Assertion error');
    });
  });

  // Warning! This test only works 99.9999999999999999999999999999999999999999999999999999999999999999999999999991% of the time!
  it('should give two different secrets for two requests', async () => {
    const secret1 = createUserSecretBinary(trustchainIdB64, 'mondego');
    const secret2 = createUserSecretBinary(trustchainIdB64, 'mondego');
    expect(secret1).to.not.equal(secret2);
  });

  it('should throw if bad arguments given to assertUserSecret', () => {
    const userId = 'edmond';
    const hashedUserId = obfuscateUserId(trustchainId, userId);
    const secret = createUserSecretBinary(trustchainIdB64, userId);
    const tooShortSecret = new Uint8Array(USER_SECRET_SIZE - 1);

    [
      // $FlowExpectedError
      [], [undefined, secret], [hashedUserId], [hashedUserId, null], [userId, secret], [hashedUserId, tooShortSecret]
    ].forEach((badArgs, i) => {
      // $FlowExpectedError
      expect(() => assertUserSecret(...badArgs), `bad args #${i}`).to.throw('Assertion error');
    });
  });

  it('should accept secrets of the right user', async () => {
    const userId = 'fernand';
    const secret = createUserSecretBinary(trustchainIdB64, userId);
    const obfuscatedUserId = obfuscateUserId(trustchainId, userId);
    expect(() => assertUserSecret(obfuscatedUserId, secret)).not.to.throw();
  });

  it('should reject invalid secrets, even with correct size', async () => {
    const secret = fromString('And our interests are the same !');
    expect(() => assertUserSecret(obfuscateUserId(trustchainId, 'danglars'), secret)).to.throw();
  });

  it('should reject secrets of the wrong user most of the time', async () => {
    const count = 10;
    let rejections = 0;
    for (let i = 0; i < count; ++i) {
      const secret = createUserSecretBinary(trustchainIdB64, 'villefort');
      try {
        assertUserSecret(obfuscateUserId(trustchainId, 'edmond'), secret);
      } catch (e) {
        rejections += 1;
      }
    }
    expect(rejections).that.which.does.have.to.be.above(count / 2);
  });
});
