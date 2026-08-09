import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PriceBlock } from './price-block';

describe('PriceBlock', () => {
  it("renders the so'm price with grouped digits", () => {
    render(<PriceBlock priceSom="480000000" priceUsd={40000} areaM2={58} deal="SALE" />);
    expect(screen.getByText("480 000 000 so'm")).toBeInTheDocument();
  });

  it('renders the dollar price as well', () => {
    render(<PriceBlock priceSom="480000000" priceUsd={40000} areaM2={58} deal="SALE" />);
    expect(screen.getByText('$40 000')).toBeInTheDocument();
  });

  it('keeps a price above the Int limit intact', () => {
    render(<PriceBlock priceSom="5000000000" priceUsd={420000} areaM2={160} deal="SALE" />);
    expect(screen.getByText("5 000 000 000 so'm")).toBeInTheDocument();
  });

  it('marks a rent price as monthly and drops the per-m² pill', () => {
    render(<PriceBlock priceSom="11924000" priceUsd={1000} areaM2={110} deal="RENT" />);
    expect(screen.getByText("11 924 000 so'm/oy")).toBeInTheDocument();
    expect(screen.queryByText(/mln\/m²/)).not.toBeInTheDocument();
  });
});
