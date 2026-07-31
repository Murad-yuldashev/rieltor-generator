import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PriceBlock } from './price-block';

describe('PriceBlock', () => {
  it("so'm narxini probel bilan ko'rsatadi", () => {
    render(<PriceBlock priceSom="480000000" priceUsd={40000} />);
    expect(screen.getByText("480 000 000 so'm")).toBeInTheDocument();
  });

  it('dollar narxini ham chiqaradi', () => {
    render(<PriceBlock priceSom="480000000" priceUsd={40000} />);
    expect(screen.getByText('$40 000')).toBeInTheDocument();
  });

  it("Int chegarasidan katta narxni yo'qotmaydi", () => {
    render(<PriceBlock priceSom="5000000000" priceUsd={420000} />);
    expect(screen.getByText("5 000 000 000 so'm")).toBeInTheDocument();
  });
});
