import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ParamsRow } from './params-row';

describe('ParamsRow', () => {
  it("to'rtala parametrni ko'rsatadi", () => {
    render(<ParamsRow xona={2} maydonM2={58} qavat="4/5" tuman="Buxoro shahri" />);
    expect(screen.getByText('2 xona')).toBeInTheDocument();
    expect(screen.getByText('58 m²')).toBeInTheDocument();
    expect(screen.getByText('4/5')).toBeInTheDocument();
    expect(screen.getByText('Buxoro shahri')).toBeInTheDocument();
  });

  it("qavat null bo'lsa o'sha elementni chiqarmaydi", () => {
    const { container } = render(
      <ParamsRow xona={5} maydonM2={180} qavat={null} tuman="Kogon tumani" />,
    );
    expect(container.querySelectorAll('li')).toHaveLength(3);
  });
});
