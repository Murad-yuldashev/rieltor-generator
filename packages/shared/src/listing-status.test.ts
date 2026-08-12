import { describe, expect, it } from 'vitest';
import { allowedTransitions } from './listing-status';

describe('allowedTransitions (realtor)', () => {
  it('lets a realtor publish a draft (the service downgrades to PENDING when untrusted)', () => {
    expect(allowedTransitions('DRAFT', 'realtor')).toEqual(['ACTIVE']);
  });

  it('lets a realtor withdraw a pending listing', () => {
    expect(allowedTransitions('PENDING', 'realtor')).toEqual(['DRAFT']);
  });

  it('offers reserve, sold, rented and archive from active', () => {
    expect(allowedTransitions('ACTIVE', 'realtor')).toEqual([
      'RESERVED',
      'SOLD',
      'RENTED',
      'ARCHIVED',
    ]);
  });

  it('lets a sold listing be reactivated (the service enforces the 48h window)', () => {
    expect(allowedTransitions('SOLD', 'realtor')).toEqual(['ACTIVE']);
    expect(allowedTransitions('RENTED', 'realtor')).toEqual(['ACTIVE']);
  });

  it('lets an archived listing be reactivated', () => {
    expect(allowedTransitions('ARCHIVED', 'realtor')).toEqual(['ACTIVE']);
  });
});

describe('allowedTransitions (admin)', () => {
  it('lets an admin approve or reject a pending listing', () => {
    expect(allowedTransitions('PENDING', 'admin')).toEqual(['ACTIVE', 'DRAFT']);
  });

  it('gives an admin no moves from any non-pending status', () => {
    expect(allowedTransitions('ACTIVE', 'admin')).toEqual([]);
    expect(allowedTransitions('DRAFT', 'admin')).toEqual([]);
  });
});
