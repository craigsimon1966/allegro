import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AIProgress } from '@/components/AIProgress';

describe('AIProgress', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  const show = () =>
    render(
      <AIProgress
        title="Building your week"
        steps={['One', 'Two']}
        expectedSeconds={10}
        slowNote="We'll use rules."
      />,
    );
  const percent = () => Number(screen.getByRole('progressbar').getAttribute('aria-valuenow'));

  it('moves through the steps and counts down', () => {
    show();
    expect(screen.getByRole('status')).toHaveTextContent('One');
    expect(screen.getByText('About 10 seconds left.')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(6000));
    expect(screen.getByRole('status')).toHaveTextContent('Two');
    expect(screen.getByText('A few seconds left.')).toBeInTheDocument();
    expect(percent()).toBeGreaterThan(40);
    expect(screen.queryByText("We'll use rules.")).toBeNull();
  });

  it('says when it is slow, and never reaches 100%', () => {
    show();
    act(() => vi.advanceTimersByTime(60000));
    expect(screen.getByText(/longer than usual/)).toBeInTheDocument();
    expect(screen.getByText("We'll use rules.")).toBeInTheDocument();
    expect(percent()).toBeLessThan(100);
  });
});
