import { describe, expect, it } from 'vitest';
import {
  PhoneSchema,
  RealtorProfileUpdateSchema,
  TelegramAuthSchema,
  slugifyUsername,
} from './realtor';

describe('TelegramAuthSchema', () => {
  const valid = {
    id: '777000',
    first_name: 'Ali',
    username: 'ali_rieltor',
    auth_date: '1754700000',
    hash: 'b0ce1804dbb324c237f5127cd1a886cf1e8368bbd83b9e83d5369a10c9cd0a71',
  };

  it('coerces the numeric fields the widget sends as strings', () => {
    const parsed = TelegramAuthSchema.parse(valid);
    expect(parsed.id).toBe(777000);
    expect(parsed.auth_date).toBe(1754700000);
  });

  it('rejects a hash that is not 64 hex characters', () => {
    expect(() => TelegramAuthSchema.parse({ ...valid, hash: 'qisqa' })).toThrow();
  });
});

describe('PhoneSchema', () => {
  it('accepts a full Uzbek number', () => {
    expect(PhoneSchema.parse('+998901234567')).toBe('+998901234567');
  });

  it.each(['998901234567', '+99890123456', '+9989012345678', '+998 90 123 45 67'])(
    'rejects %s',
    (bad) => {
      expect(() => PhoneSchema.parse(bad)).toThrow();
    },
  );
});

describe('RealtorProfileUpdateSchema', () => {
  it('accepts a partial update', () => {
    expect(RealtorProfileUpdateSchema.parse({ phone: '+998901234567' })).toEqual({
      phone: '+998901234567',
    });
  });

  it('allows clearing an optional text field with null', () => {
    expect(RealtorProfileUpdateSchema.parse({ agency: null })).toEqual({ agency: null });
  });

  it('rejects a name shorter than two characters', () => {
    expect(() => RealtorProfileUpdateSchema.parse({ name: 'A' })).toThrow();
  });
});

describe('slugifyUsername', () => {
  it.each([
    ['Ali_Valiyev', 'ali-valiyev'],
    ['ALI', 'ali'],
    ['  ali  ', 'ali'],
    ['ali--valiyev', 'ali-valiyev'],
    ['__ali__', 'ali'],
  ])('turns %s into %s', (input, expected) => {
    expect(slugifyUsername(input)).toBe(expected);
  });

  it('falls back when nothing usable is left', () => {
    expect(slugifyUsername('Али')).toBe('rieltor');
  });

  it('falls back when the result is shorter than three characters', () => {
    expect(slugifyUsername('ab')).toBe('rieltor');
  });

  it('truncates to thirty characters without a trailing dash', () => {
    const long = slugifyUsername('a'.repeat(40));
    expect(long).toHaveLength(30);
    expect(long.endsWith('-')).toBe(false);
  });
});
