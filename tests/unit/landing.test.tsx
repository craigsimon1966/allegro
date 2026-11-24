import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Landing } from '@/features/landing/Landing';

describe('Landing', () => {
  it('shows the headline and the demo call to action', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Try the demo' })).toHaveAttribute('href', '/demo');
  });
});
