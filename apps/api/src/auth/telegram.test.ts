import { describe, expect, it } from 'vitest';
import type { TelegramAuth } from '@rieltor/shared';
import { telegramDataCheckString, verifyTelegramAuth } from './telegram';

const BOT_TOKEN = '123456:TEST-BOT-TOKEN';

/**
 * A vector computed once with node:crypto against the token above. Hard-coding it
 * means the test cannot pass by repeating the implementation's own mistake.
 */
const payload: TelegramAuth = {
  id: 777000,
  first_name: 'Ali',
  username: 'ali_rieltor',
  auth_date: 1754700000,
  hash: 'b0ce1804dbb324c237f5127cd1a886cf1e8368bbd83b9e83d5369a10c9cd0a71',
};

const JUST_AFTER = payload.auth_date + 60;

describe('telegramDataCheckString', () => {
  it('joins the fields alphabetically and leaves out the hash', () => {
    expect(telegramDataCheckString(payload)).toBe(
      'auth_date=1754700000\nfirst_name=Ali\nid=777000\nusername=ali_rieltor',
    );
  });

  it('skips fields the widget did not send', () => {
    expect(telegramDataCheckString({ ...payload, last_name: undefined })).not.toContain(
      'last_name',
    );
  });

  it('includes a field this repo does not declare yet, sorted alphabetically like any other', () => {
    expect(telegramDataCheckString({ ...payload, is_premium: true })).toBe(
      'auth_date=1754700000\nfirst_name=Ali\nid=777000\nis_premium=true\nusername=ali_rieltor',
    );
  });
});

describe('verifyTelegramAuth', () => {
  it('accepts the golden vector', () => {
    expect(verifyTelegramAuth(payload, BOT_TOKEN, JUST_AFTER)).toBe(true);
  });

  it('rejects a tampered field', () => {
    expect(verifyTelegramAuth({ ...payload, first_name: 'Vali' }, BOT_TOKEN, JUST_AFTER)).toBe(
      false,
    );
  });

  it('rejects a wrong bot token', () => {
    expect(verifyTelegramAuth(payload, 'boshqa-token', JUST_AFTER)).toBe(false);
  });

  it('rejects a hash of the wrong length', () => {
    expect(verifyTelegramAuth({ ...payload, hash: 'ab'.repeat(16) }, BOT_TOKEN, JUST_AFTER)).toBe(
      false,
    );
  });

  it('rejects an auth_date older than 24 hours', () => {
    expect(verifyTelegramAuth(payload, BOT_TOKEN, payload.auth_date + 86_401)).toBe(false);
  });

  it('rejects an auth_date from the future', () => {
    expect(verifyTelegramAuth(payload, BOT_TOKEN, payload.auth_date - 120)).toBe(false);
  });
});
