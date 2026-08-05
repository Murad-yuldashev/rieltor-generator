import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StickyCTA } from './sticky-cta';

describe('StickyCTA', () => {
  it('the call link uses the tel: scheme', () => {
    render(<StickyCTA phone="+998901234567" telegram="murod" />);
    expect(screen.getByRole('link', { name: /Qo'ng'iroq/ })).toHaveAttribute(
      'href',
      'tel:+998901234567',
    );
  });

  it('the Telegram link points at t.me', () => {
    render(<StickyCTA phone="+998901234567" telegram="murod" />);
    expect(screen.getByRole('link', { name: /Telegram/ })).toHaveAttribute(
      'href',
      'https://t.me/murod',
    );
  });

  it('strips a leading @ from the username', () => {
    render(<StickyCTA phone="+998901234567" telegram="@murod" />);
    expect(screen.getByRole('link', { name: /Telegram/ })).toHaveAttribute(
      'href',
      'https://t.me/murod',
    );
  });

  it('the Telegram link opens in a new tab', () => {
    render(<StickyCTA phone="+998901234567" telegram="murod" />);
    const link = screen.getByRole('link', { name: /Telegram/ });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });
});
