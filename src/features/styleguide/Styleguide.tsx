import { useState } from 'react';
import { AIBlock } from '@/components/AIBlock';
import { AllegroMark } from '@/components/AllegroMark';
import { Button } from '@/components/Button';
import { DraftBadge } from '@/components/DraftBadge';
import { Highlight } from '@/components/Highlight';
import { Label, SectionRule } from '@/components/Label';
import { MarginLayout } from '@/components/MarginLayout';
import { MarginNote } from '@/components/MarginNote';
import { MathText } from '@/components/MathText';
import { RuledRow } from '@/components/RuledRow';
import { StepSquares } from '@/components/StepSquares';
import { Tag } from '@/components/Tag';
import { AppShell } from '@/components/AppShell';

// Every token and component in one place (SPEC 15, M0). Values live in src/styles/tokens.css.
const COLOURS: { token: string; use: string }[] = [
  { token: 'surface', use: 'Paper, page background' },
  { token: 'ink', use: 'Body text' },
  { token: 'muted', use: 'Secondary text' },
  { token: 'green-700', use: 'Primary action, links, focus' },
  { token: 'green-800', use: 'Hover, pressed' },
  { token: 'green-900', use: 'Footer, strong headings' },
  { token: 'green-600', use: 'Logo, large display only' },
  { token: 'sage-500', use: 'Brand bands (ink text only)' },
  { token: 'sage-300', use: 'Decorative, chart fills' },
  { token: 'sage-100', use: 'Selected states, tags' },
  { token: 'plum-500', use: 'AI, margin, accents' },
  { token: 'plum-700', use: 'Plum text' },
  { token: 'plum-100', use: 'AI draft bands' },
  { token: 'highlighter', use: 'Current item, key answer' },
  { token: 'grid', use: 'Graph paper (learn screens)' },
  { token: 'rule', use: 'Ruled lines' },
  { token: 'warning', use: 'Warnings' },
  { token: 'error', use: 'Errors' },
  { token: 'info', use: 'Info, links in AI blocks' },
  { token: 'field', use: 'Inputs only' },
];

const SPACING = [4, 8, 12, 16, 24, 32, 48, 64];

const MATHS = `The gradient of a line is the **rate of change**: how much $y$ changes when $x$ goes up by 1.

$$y = mx + c$$

For $y = 2x + 3$, every step right goes up by $2$.`;

export default function Styleguide() {
  const [checked, setChecked] = useState(false);
  return (
    <AppShell step={4}>
      <MarginLayout>
        <Label>Allegro Learning</Label>
        <h1 className="mt-1 text-[30px] leading-tight">Style guide</h1>
        <p className="mt-2 max-w-prose text-muted">
          It should look like a teacher&apos;s own planner, not another app. Exercise book
          structure, Allegro colours.
        </p>

        <div className="mt-8 flex flex-col gap-10">
          <section>
            <SectionRule>Colour</SectionRule>
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {COLOURS.map((c) => (
                <li key={c.token} className="flex flex-col gap-1">
                  <div
                    className="h-12 border border-border"
                    style={{ background: `var(--${c.token})` }}
                  />
                  <code className="text-[13px] font-bold">--{c.token}</code>
                  <span className="text-[13px] text-muted">{c.use}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 max-w-prose text-[15px]">
              Never white text on sage. Never plum on green. Never rely on colour alone.
            </p>
          </section>

          <section>
            <SectionRule>Type</SectionRule>
            <div className="mt-3 flex flex-col gap-2">
              <div className="font-heading text-[40px] font-semibold leading-tight">
                Home title 40
              </div>
              <div className="font-heading text-[30px] font-semibold leading-tight">
                Screen title 30
              </div>
              <div className="font-heading text-[22px] font-semibold">Row title 22</div>
              <p className="max-w-prose text-[17px]">
                Body 17, Atkinson Hyperlegible. Designed for low-vision readers, used for everything
                you read and type.
              </p>
              <p className="text-[13px] text-muted">Meta 13</p>
              <Label>Section label 13, uppercase</Label>
              <MarginNote>Caveat for margin notes only</MarginNote>
              <p className="text-[13px] text-muted">
                Caveat rules: one line, 20px or larger, never in inputs, buttons or instructions.
              </p>
            </div>
          </section>

          <section>
            <SectionRule>Spacing (4px grid) and radius (2px)</SectionRule>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              {SPACING.map((s) => (
                <div key={s} className="flex flex-col items-center gap-1">
                  <div className="bg-sage-300" style={{ width: s, height: s }} />
                  <span className="text-[13px] text-muted">{s}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionRule>Mark</SectionRule>
            <div className="mt-3 flex flex-wrap items-center gap-6">
              {(['all', 'equip', 'embed', 'evaluate', 'elevate'] as const).map((p) => (
                <div key={p} className="flex flex-col items-center gap-1">
                  <AllegroMark product={p} size={44} />
                  <span className="text-[13px]">{p}</span>
                </div>
              ))}
              <div className="flex flex-col items-center gap-1">
                <AllegroMark size={44} loading label="Loading example" />
                <span className="text-[13px]">loading</span>
              </div>
            </div>
          </section>

          <section>
            <SectionRule>Buttons and tags</SectionRule>
            <div className="mt-3 flex flex-wrap gap-3">
              <Button>
                Primary <span aria-hidden="true">→</span>
              </Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ask">Ask</Button>
              <Button variant="ink">Ink, on sage bands</Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Tag>CK</Tag>
              <Tag>PCK</Tag>
              <Tag tone="plum">AI</Tag>
              <Tag tone="outline">Year 8</Tag>
              <DraftBadge reviewedBy={null} />
            </div>
          </section>

          <section>
            <SectionRule>Sage band (the one most important prompt)</SectionRule>
            <div className="-ml-4 mt-3 flex flex-col gap-2.5 bg-sage-500 px-4 py-4 text-ink">
              <div className="text-[13px] font-bold uppercase tracking-[0.12em]">
                Before Monday, Year 8
              </div>
              <div className="font-heading text-[22px]">Two short units, then plan the lesson.</div>
            </div>
          </section>

          <section>
            <SectionRule>Ruled rows</SectionRule>
            <div className="-ml-content mt-3 border-t-2 border-rule-strong">
              <RuledRow done title="What a linear rule tells you" meta="Content · 5 min" />
              <RuledRow
                margin="2"
                current
                title="From table to rule"
                meta="Content · 5 min · up next"
                aside={<MarginNote>today</MarginNote>}
                to="/styleguide"
              />
              <RuledRow
                margin="3"
                title={'"It goes up by 2, so y = x + 2"'}
                meta="Teaching this topic · 5 min"
              />
            </div>
            <p className="mt-3">
              <Highlight>Highlighter marks one thing per screen.</Highlight>
            </p>
          </section>

          <section>
            <SectionRule>Step squares</SectionRule>
            <div className="mt-3">
              <StepSquares current={4} />
            </div>
          </section>

          <section>
            <SectionRule>AI block</SectionRule>
            <div className="-ml-4 mt-3">
              <AIBlock
                title="Explicit teaching"
                mathsChecked={checked}
                onMathsCheckedChange={setChecked}
                onEdit={() => undefined}
                onRegenerate={() => undefined}
              >
                <MathText>
                  {'Show three tables of values and ask: what changes each time $x$ goes up by 1?'}
                </MathText>
              </AIBlock>
            </div>
          </section>

          <section>
            <SectionRule>Maths on graph paper</SectionRule>
            <div className="graph-paper -ml-4 mt-3 px-4 py-4">
              <MathText>{MATHS}</MathText>
            </div>
          </section>
        </div>
      </MarginLayout>
    </AppShell>
  );
}
