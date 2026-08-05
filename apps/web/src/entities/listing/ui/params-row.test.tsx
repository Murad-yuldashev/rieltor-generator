import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ParamsRow } from './params-row';

describe('ParamsRow', () => {
  it('renders all four parameters', () => {
    render(<ParamsRow rooms={2} areaM2={58} floor="4/5" district="Buxoro shahri" />);
    // Plitkada qiymat va yorliq alohida: "2" ustida, "Xonalar" ostida.
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Xonalar')).toBeInTheDocument();
    expect(screen.getByText('58 m²')).toBeInTheDocument();
    expect(screen.getByText('4/5')).toBeInTheDocument();
    expect(screen.getByText('Buxoro shahri')).toBeInTheDocument();
  });

  it('omits the tile when the floor is null', () => {
    const { container } = render(
      <ParamsRow rooms={5} areaM2={180} floor={null} district="Kogon tumani" />,
    );
    expect(container.querySelectorAll('li')).toHaveLength(3);
  });
});
