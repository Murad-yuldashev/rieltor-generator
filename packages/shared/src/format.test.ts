import { describe, expect, it } from 'vitest';
import { formatNarxSom, formatNarxUsd } from './format';

describe('formatNarxSom', () => {
  it('uch xonadan probel bilan ajratadi', () => {
    expect(formatNarxSom('480000000')).toBe("480 000 000 so'm");
  });

  it("to'liq bo'lmagan guruhni to'g'ri ajratadi", () => {
    expect(formatNarxSom('1250000')).toBe("1 250 000 so'm");
  });

  it("uch xonadan kichik sonni o'zgartirmaydi", () => {
    expect(formatNarxSom('500')).toBe("500 so'm");
  });

  it("Int chegarasidan katta sonni yo'qotmaydi", () => {
    expect(formatNarxSom('5000000000')).toBe("5 000 000 000 so'm");
  });
});

describe('formatNarxUsd', () => {
  it('dollar belgisi bilan ajratadi', () => {
    expect(formatNarxUsd(40000)).toBe('$40 000');
  });

  it("ming'dan kichik sonni o'zgartirmaydi", () => {
    expect(formatNarxUsd(900)).toBe('$900');
  });
});
