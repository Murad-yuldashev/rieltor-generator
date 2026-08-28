import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AgentCard } from './agent-card';

const agent = {
  id: 'agent-1',
  name: 'Murod',
  agency: 'Buxoro Uy',
  photoUrl: '/images/agents/agent-1.jpg',
  phoneMasked: '+998 90 ••• •• 67',
  telegram: 'murod',
  verified: false,
  profileSlug: null,
  ratingAvg: null,
  ratingCount: 0,
};

describe('AgentCard', () => {
  it('renders the name, agency and the masked phone as text', () => {
    render(<AgentCard agent={agent} />);
    expect(screen.getByText('Murod')).toBeInTheDocument();
    expect(screen.getByText('Buxoro Uy')).toBeInTheDocument();
    expect(screen.getByText('+998 90 ••• •• 67')).toBeInTheDocument();
  });

  it('gives the photo alt text', () => {
    render(<AgentCard agent={agent} />);
    expect(screen.getByAltText('Murod')).toHaveAttribute('src', '/images/agents/agent-1.jpg');
  });
});
