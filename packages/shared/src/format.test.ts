import { describe, expect, it } from 'vitest';
import { formatPriceSom, formatPriceUsd } from './format';

describe('formatPriceSom', () => {
  it('uch xonadan probel bilan ajratadi', () => {
    expect(formatPriceSom('480000000')).toBe("480 000 000 so'm");
  });

  it("to'liq bo'lmagan guruhni to'g'ri ajratadi", () => {
    expect(formatPriceSom('1250000')).toBe("1 250 000 so'm");
  });

  it("uch xonadan kichik sonni o'zgartirmaydi", () => {
    expect(formatPriceSom('500')).toBe("500 so'm");
  });

  it("Int chegarasidan katta sonni yo'qotmaydi", () => {
    expect(formatPriceSom('5000000000')).toBe("5 000 000 000 so'm");
  });
});

describe('formatPriceUsd', () => {
  it('dollar belgisi bilan ajratadi', () => {
    expect(formatPriceUsd(40000)).toBe('$40 000');
  });

  it("ming'dan kichik sonni o'zgartirmaydi", () => {
    expect(formatPriceUsd(900)).toBe('$900');
  });
});
