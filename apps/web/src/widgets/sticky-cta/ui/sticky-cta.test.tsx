import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StickyCTA } from './sticky-cta';

describe('StickyCTA', () => {
  it('renders the call button', () => {
    render(<StickyCTA listingId="bx-001" telegram="murod" />);
    expect(screen.getByRole('button', { name: /Qo'ng'iroq/ })).toBeInTheDocument();
  });

  it('the Telegram link points at t.me', () => {
    render(<StickyCTA listingId="bx-001" telegram="murod" />);
    expect(screen.getByRole('link', { name: /Telegram/ })).toHaveAttribute(
      'href',
      'https://t.me/murod',
    );
  });

  it('strips a leading @ from the username', () => {
    render(<StickyCTA listingId="bx-001" telegram="@murod" />);
    expect(screen.getByRole('link', { name: /Telegram/ })).toHaveAttribute(
      'href',
      'https://t.me/murod',
    );
  });

  it('the Telegram link opens in a new tab', () => {
    render(<StickyCTA listingId="bx-001" telegram="murod" />);
    const link = screen.getByRole('link', { name: /Telegram/ });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });
});
