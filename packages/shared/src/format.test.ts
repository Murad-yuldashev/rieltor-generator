import { describe, expect, it } from 'vitest';
import { formatPriceSom, formatPriceUsd } from './format';

describe('formatPriceSom', () => {
  it('groups digits in threes with a space', () => {
    expect(formatPriceSom('480000000')).toBe("480 000 000 so'm");
  });

  it('groups a partial leading group correctly', () => {
    expect(formatPriceSom('1250000')).toBe("1 250 000 so'm");
  });

  it('leaves a number under three digits unchanged', () => {
    expect(formatPriceSom('500')).toBe("500 so'm");
  });

  it('keeps a number above the Int limit intact', () => {
    expect(formatPriceSom('5000000000')).toBe("5 000 000 000 so'm");
  });
});

describe('formatPriceUsd', () => {
  it('formats with a dollar sign', () => {
    expect(formatPriceUsd(40000)).toBe('$40 000');
  });

  it('leaves a number below one thousand unchanged', () => {
    expect(formatPriceUsd(900)).toBe('$900');
  });
});
