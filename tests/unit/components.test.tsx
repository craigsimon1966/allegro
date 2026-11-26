import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AIBlock, AI_DISCLOSURE } from '@/components/AIBlock';
import { AllegroMark } from '@/components/AllegroMark';
import { DraftBadge } from '@/components/DraftBadge';
import { MarginNote } from '@/components/MarginNote';
import { MathText } from '@/components/MathText';
import { RuledRow } from '@/components/RuledRow';
import { StepSquares } from '@/components/StepSquares';

describe('AllegroMark', () => {
  it('draws the real icon and fills only the circle for its product', () => {
    const { container } = render(<AllegroMark product="evaluate" />);
    const areas = [...container.querySelectorAll<SVGPathElement>('path[data-product]')];
    expect(areas.map((c) => c.dataset.product).sort()).toEqual([
      'elevate',
      'embed',
      'equip',
      'evaluate',
    ]);
    expect(
      areas
        .filter((c) => c.getAttribute('fill') === 'var(--mark-fill)')
        .map((c) => c.dataset.product),
    ).toEqual(['evaluate']);
    expect(container.querySelectorAll('circle')).toHaveLength(0);
  });

  it('is hidden from screen readers unless labelled', () => {
    const { container } = render(<AllegroMark />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    render(<AllegroMark label="Allegro" />);
    expect(screen.getByRole('img', { name: 'Allegro' })).toBeInTheDocument();
  });
});

describe('StepSquares', () => {
  it('shows the step in text, not colour alone', () => {
    const { container } = render(<StepSquares current={4} />);
    expect(screen.getByText('Step 4 of 6: Learn')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-filled="true"]')).toHaveLength(4);
  });
});

describe('MarginNote', () => {
  it('stays on one line and never goes below 20px', () => {
    render(<MarginNote size={14}>today</MarginNote>);
    const note = screen.getByText('today');
    expect(note).toHaveClass('whitespace-nowrap');
    expect(note).toHaveStyle({ fontSize: '20px' });
  });
});

describe('RuledRow', () => {
  it('strikes through done rows and shows a tick instead of removing them', () => {
    render(<RuledRow done margin="1" title="Gradient as rate of change" />);
    expect(screen.getByText('Gradient as rate of change')).toHaveClass('line-through');
    expect(screen.getByLabelText('Done')).toBeInTheDocument();
  });

  it('links when given a destination', () => {
    render(
      <MemoryRouter>
        <RuledRow margin="2" title="From table to rule" to="/learn/x" current />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', '/learn/x');
  });
});

describe('AIBlock', () => {
  it('always shows the AI label and disclosure line', () => {
    render(<AIBlock>Draft text</AIBlock>);
    expect(screen.getByText('AI DRAFT')).toBeInTheDocument();
    expect(screen.getByText(AI_DISCLOSURE)).toBeInTheDocument();
    expect(AI_DISCLOSURE).toBe('Drafted by Allegro AI. Please check before using.');
  });

  it('asks for a maths check until it is ticked', () => {
    const onChange = vi.fn();
    render(
      <AIBlock mathsChecked={false} onMathsCheckedChange={onChange}>
        Draft
      </AIBlock>,
    );
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('DraftBadge', () => {
  it('shows only for unreviewed content', () => {
    const { rerender } = render(<DraftBadge reviewedBy={null} />);
    expect(screen.getByText(/Draft content/)).toBeInTheDocument();
    rerender(<DraftBadge reviewedBy="Denise Halliday" />);
    expect(screen.queryByText(/Draft content/)).not.toBeInTheDocument();
  });
});

describe('MathText', () => {
  it('renders maths with MathML for screen readers', () => {
    const { container } = render(<MathText>{'Gradient: $y = mx + c$'}</MathText>);
    expect(container.querySelector('math')).not.toBeNull();
  });

  it('does not render raw HTML from the source', () => {
    const { container } = render(<MathText>{'<img src=x onerror="alert(1)">'}</MathText>);
    expect(container.querySelector('img')).toBeNull();
  });
});
