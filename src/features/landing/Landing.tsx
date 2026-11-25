import { AllegroMark, type Product } from '@/components/AllegroMark';
import { ButtonLink } from '@/components/Button';
import { Label, SectionRule } from '@/components/Label';
import { MarginNote } from '@/components/MarginNote';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';

// SPEC 7.1. Product outcomes come from the v3 proposition (SPEC 1 and P2).
const STEPS = [
  {
    title: 'Understand your needs',
    body: 'Tell us what you teach and what feels hard. We show you, kindly and honestly, where to start.',
  },
  {
    title: 'Learn in 5 minutes',
    body: 'Short units on the maths and the teaching, fitted around your week.',
  },
  {
    title: "Plan tomorrow's lesson",
    body: 'Turn what you learned into a lesson plan you can edit, print and teach.',
  },
];

const PRODUCTS: {
  product: Exclude<Product, 'all'>;
  name: string;
  job: string;
  outcome: string;
  note?: string;
}[] = [
  {
    product: 'equip',
    name: 'Equip',
    job: 'Targeted learning on content and general teaching practice.',
    outcome: 'Walk into the classroom with confidence.',
  },
  {
    product: 'embed',
    name: 'Embed',
    job: 'Turn learning into lessons: sequencing, design and common misconceptions.',
    outcome: 'Better lessons in less planning time.',
  },
  {
    product: 'evaluate',
    name: 'Evaluate',
    job: 'Assessment, feedback and reflection on your practice.',
    outcome: 'See your impact and keep improving.',
  },
  {
    product: 'elevate',
    name: 'Elevate',
    job: 'Leadership and career growth.',
    outcome: 'Grow capability across a school.',
    note: 'preview',
  },
];

// Petal centres in Craig's brand icon (public/brand/icon.svg, viewBox 375), measured from the
// artwork. Clockwise from top-left: Equip, Embed, Evaluate, Elevate (SPEC 10.4).
const PETALS = [
  { name: 'Equip', x: 137, y: 121 },
  { name: 'Embed', x: 250, y: 132 },
  { name: 'Evaluate', x: 239, y: 250 },
  { name: 'Elevate', x: 121, y: 236 },
];

function HeroMark() {
  // The brand icon sits on the same sage as the hero, so only its white lines show.
  return (
    <figure className="relative mx-auto aspect-square w-full max-w-[280px] sm:max-w-[400px]">
      <img
        src="/brand/icon.svg"
        alt=""
        width={400}
        height={400}
        className="absolute inset-0 h-full w-full"
      />
      <ul aria-label="Allegro's four products">
        {PETALS.map((p) => (
          <li
            key={p.name}
            className="absolute -translate-x-1/2 -translate-y-1/2 font-heading text-[17px] font-semibold text-ink sm:text-[22px]"
            style={{ left: `${(p.x / 375) * 100}%`, top: `${(p.y / 375) * 100}%` }}
          >
            {p.name}
          </li>
        ))}
      </ul>
    </figure>
  );
}

export function Landing() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="bg-sage-500 text-ink" aria-labelledby="hero-title">
          <div className="mx-auto grid max-w-[1200px] items-center gap-6 px-4 py-8 sm:px-8 sm:py-14 lg:grid-cols-[minmax(0,1fr)_400px]">
            <div className="flex flex-col gap-4">
              <h1
                id="hero-title"
                className="max-w-[18ch] text-[32px] leading-[1.15] sm:text-[44px]"
              >
                Learn it in five minutes. Teach it with confidence.
              </h1>
              <p className="max-w-prose text-[17px] leading-normal">
                Professional learning built around your class, your topic and your week, then turned
                into tomorrow&apos;s lesson.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <ButtonLink to="/demo" variant="ink">
                  Try the demo <span aria-hidden="true">→</span>
                </ButtonLink>
                <span className="text-[15px]">About 15 minutes. No sign-up needed.</span>
              </div>
            </div>
            <div className="w-full justify-self-center">
              <HeroMark />
            </div>
          </div>
        </section>

        <div className="mx-auto flex max-w-[1200px] flex-col gap-12 px-4 py-10 sm:px-8">
          <section aria-labelledby="how-it-works" className="flex flex-col">
            <SectionRule id="how-it-works">How it works</SectionRule>
            <ol className="grid gap-x-8 sm:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-3 border-b border-rule py-4">
                  <span className="w-6 shrink-0 font-heading text-[22px] font-semibold text-green-700">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-[20px] leading-snug">{s.title}</h3>
                    <p className="mt-1 text-muted">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="products" className="flex flex-col">
            <SectionRule id="products">Four ways Allegro helps</SectionRule>
            <ul>
              {PRODUCTS.map((p) => (
                <li key={p.product} className="flex items-start gap-4 border-b border-rule py-4">
                  <AllegroMark product={p.product} size={40} className="mt-1 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-3">
                      <h3 className="text-[22px]">{p.name}</h3>
                      {p.note && <MarginNote tone="plum">{p.note}</MarginNote>}
                    </div>
                    <p className="mt-1">{p.job}</p>
                    <p className="mt-1 font-bold text-green-700">{p.outcome}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="How Allegro is made" className="border-y-2 border-rule-strong py-5">
            <Label>Honesty note</Label>
            <p className="mt-1 font-heading text-[22px] leading-snug">
              Built with teachers. AI helps, humans write the content.
            </p>
            <p className="mt-2 max-w-prose text-muted">
              Every learning unit is checked by an experienced maths educator before teachers see
              it. AI helps understand your situation, choose what fits and draft lesson ideas, and
              it always says so.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
