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
    for (const link of screen.getAllByRole('link', { name: /Try the demo/ })) {
      expect(link).toHaveAttribute('href', '/demo');
    }
  });
});
