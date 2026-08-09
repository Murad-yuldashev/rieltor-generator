import { describe, expect, it } from 'vitest';
import { formatPriceSom, formatPriceUsd } from './format';

describe('formatPriceSom', () => {
  it('groups digits in threes with a space', () => {
    expect(formatPriceSom('480000000', 'SALE')).toBe("480 000 000 so'm");
  });

  it('groups a partial leading group correctly', () => {
    expect(formatPriceSom('1250000', 'SALE')).toBe("1 250 000 so'm");
  });

  it('leaves a number under three digits unchanged', () => {
    expect(formatPriceSom('500', 'SALE')).toBe("500 so'm");
  });

  it('keeps a number above the Int limit intact', () => {
    expect(formatPriceSom('5000000000', 'SALE')).toBe("5 000 000 000 so'm");
  });

  it('marks a rent price as monthly', () => {
    expect(formatPriceSom('11924000', 'RENT')).toBe("11 924 000 so'm/oy");
  });
});

describe('formatPriceUsd', () => {
  it('formats with a dollar sign', () => {
    expect(formatPriceUsd(40000, 'SALE')).toBe('$40 000');
  });

  it('leaves a number below one thousand unchanged', () => {
    expect(formatPriceUsd(900, 'SALE')).toBe('$900');
  });

  it('marks a rent price as monthly', () => {
    expect(formatPriceUsd(1000, 'RENT')).toBe('$1 000/oy');
  });
});
