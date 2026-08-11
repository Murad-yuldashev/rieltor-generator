import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { RealtorCta } from './realtor-cta';

describe('RealtorCta', () => {
  it('invites a realtor to the cabinet', () => {
    render(
      <MemoryRouter>
        <RealtorCta />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: /Rieltor bo'lmoqchimisiz/ });
    expect(link).toHaveAttribute('href', '/cabinet');
  });

  it('explains what the cabinet is for', () => {
    render(
      <MemoryRouter>
        <RealtorCta />
      </MemoryRouter>,
    );

    expect(screen.getByText(/o'z e'lonlaringizni joylang/i)).toBeInTheDocument();
  });
});
