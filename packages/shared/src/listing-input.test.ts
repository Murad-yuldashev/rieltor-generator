import { describe, expect, it } from 'vitest';
import { ListingInputSchema, PublishableListingSchema } from './listing-input';

describe('ListingInputSchema', () => {
  it('accepts an empty object so a blank draft can be saved', () => {
    expect(ListingInputSchema.parse({})).toEqual({});
  });

  it('accepts a partial draft', () => {
    expect(
      ListingInputSchema.parse({ title: 'Boshlanmagan', district: 'Chilonzor tumani' }),
    ).toEqual({ title: 'Boshlanmagan', district: 'Chilonzor tumani' });
  });

  it('rejects a non-numeric price string', () => {
    expect(() => ListingInputSchema.parse({ priceSom: '12 000' })).toThrow();
  });
});

describe('PublishableListingSchema', () => {
  const valid = {
    title: '3 xonali kvartira Chilonzorda',
    priceSom: '780000000',
    priceUsd: 65000,
    areaM2: 78,
    district: 'Chilonzor tumani',
    type: 'SECONDARY' as const,
    deal: 'SALE' as const,
    rooms: 3,
  };

  it('accepts a complete apartment', () => {
    expect(PublishableListingSchema.parse(valid)).toMatchObject({ title: valid.title });
  });

  it('rejects a title shorter than ten characters', () => {
    expect(() => PublishableListingSchema.parse({ ...valid, title: 'Uy' })).toThrow();
  });

  it('rejects a zero or empty price', () => {
    expect(() => PublishableListingSchema.parse({ ...valid, priceSom: '0' })).toThrow();
    expect(() => PublishableListingSchema.parse({ ...valid, priceSom: '' })).toThrow();
  });

  it('requires rooms for an apartment or house', () => {
    expect(() => PublishableListingSchema.parse({ ...valid, rooms: null })).toThrow();
  });

  it('allows a commercial listing without rooms', () => {
    expect(
      PublishableListingSchema.parse({ ...valid, type: 'COMMERCIAL', rooms: null }),
    ).toMatchObject({ type: 'COMMERCIAL' });
  });
});
