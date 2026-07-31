import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StickyCTA } from './sticky-cta';

describe('StickyCTA', () => {
  it("qo'ng'iroq havolasi tel: sxemasi bilan", () => {
    render(<StickyCTA phone="+998901234567" telegram="murod" />);
    expect(screen.getByRole('link', { name: /Qo'ng'iroq/ })).toHaveAttribute(
      'href',
      'tel:+998901234567',
    );
  });

  it('Telegram havolasi t.me manzili bilan', () => {
    render(<StickyCTA phone="+998901234567" telegram="murod" />);
    expect(screen.getByRole('link', { name: /Telegram/ })).toHaveAttribute(
      'href',
      'https://t.me/murod',
    );
  });

  it('username oldidagi @ belgisini tashlab yuboradi', () => {
    render(<StickyCTA phone="+998901234567" telegram="@murod" />);
    expect(screen.getByRole('link', { name: /Telegram/ })).toHaveAttribute(
      'href',
      'https://t.me/murod',
    );
  });

  it('Telegram havolasi yangi oynada ochiladi', () => {
    render(<StickyCTA phone="+998901234567" telegram="murod" />);
    const link = screen.getByRole('link', { name: /Telegram/ });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });
});
