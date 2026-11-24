# Allegro Learning: Demo Site Product and Design Specification

Version 0.1, 27 October 2026
Owner: Craig Simon
Audience: Claude Code (build agent) and the Allegro team

---

## 0. How to use this document

This file is the single source of truth for building the Allegro teacher demo. Put it in the repo root as `SPEC.md` and reference it from `CLAUDE.md` with the line: "Read SPEC.md before any work. Follow the milestones in section 15 in order. Do not invent curriculum codes."

Rules for the build agent:

1. Build milestone by milestone (section 15). Each milestone ends with its acceptance checks passing and a short changelog entry in `CHANGELOG.md`.
2. Use Australian spelling in all UI copy (organise, personalise, maths, colour, programme is NOT used, use program).
3. Never use em dashes in UI copy. Use commas, full stops or parentheses.
4. Never invent curriculum codes. Content shows **both** Australian Curriculum v9 codes and the matching NSW Mathematics K-10 syllabus outcomes. Use placeholders `AC9-TODO` and `NSW-TODO` and list them in `docs/curriculum-todo.md` for a human to verify on the ACARA and NSW Curriculum websites.
5. Items marked **DECISION NEEDED** in section 2 have a default. Build the default unless the owner has changed it.

---

## 1. Product summary and demo goal

**Allegro Learning** ("All learn grow") is an AI-enabled professional learning platform that meets teachers at their point of need, building content knowledge (CK), pedagogical knowledge (PK) and pedagogical content knowledge (PCK), then helping them apply it in real lessons.

The proposition has four products, mirrored by the four overlapping circles in the logo:

| Product | Job | Core outcome |
|---|---|---|
| **Equip** | Targeted PL on content and general pedagogy | Teachers enter the classroom with confidence |
| **Embed** | Turn learning into lessons (sequencing, design, misconceptions) | Better lessons in less planning time |
| **Evaluate** | Assessment, feedback and reflection on practice | Teachers see their impact and keep improving |
| **Elevate** | Leadership and career growth | Leaders grow capability across a school |

### What the demo must prove

The demo is not the whole platform. It must prove **one loop** convincingly to a real teacher in under 15 minutes:

> **Tell Allegro your situation → get an honest picture of what you need → do 5-minute learning that fits your week → turn it into tomorrow's lesson → reflect afterwards.**

That loop touches Equip, Embed and Evaluate. Elevate appears only as a clearly labelled leader preview.

### Demo success measures

- A teacher can complete the loop unaided in 15 minutes or less.
- At least 70% of pilot teachers say the pathway "fits my actual situation" (4 or 5 on a 5-point scale).
- At least 60% say they would use the lesson output with minor edits.
- Zero factual maths errors found in seeded content during pilot review.

---

## 2. Design review: assumptions challenged

This section questions the current design and proposition. Each row ends with the decision the build follows.

### 2.1 Colour and brand

| # | Current assumption | Challenge | Spec decision |
|---|---|---|---|
| C1 | White text on sage (#80A880) works, as on the current website | It measures **2.68:1**. WCAG AA needs 4.5:1 for body text and 3:1 for large text. It fails both. This directly contradicts the Inclusivity value, which names WCAG. | Sage is a **surface and decoration colour only**. Never put white body text on sage. Dark ink (#1F2A1F) on sage passes at 5.56:1. |
| C2 | Plum headings on sage (the "Professional learning that understands your system" panel) | Measures **2.19:1**. This is the weakest pairing on the current site. | Plum is used on white or off-white only (5.88:1 and 5.45:1). Never plum on green. |
| C3 | The dark green logo variant (#658865) is a safe text colour | 3.99:1 on white. Passes only for large text (24px+ or 19px bold). | Introduce **Green 700 #4E7050** (5.59:1 on white) as the functional brand green for buttons, links and body-level text. Keep #658865 for logo and large display. |
| C4 | Two brand hues can colour-code four products | They cannot without adding hues, and colour-only coding fails colour-blind users anyway. | **Do not colour-code products by hue.** Each product is identified by the four-circle icon with its own circle filled, plus its name. Hue stays reserved for brand and status. |
| C5 | The full-bleed green panels read as calm and premium | Large saturated green blocks with long paragraphs are tiring to read and look like a template. | Default page surface is off-white (#F5F7F2). Sage appears as solid bands, illustrations and the hero, not behind long text. |

### 2.2 Proposition and language

| # | Current assumption | Challenge | Spec decision |
|---|---|---|---|
| P1 | The first product is called Equip | The v2 "Who we are" doc calls it **Empower**. The v3 proposition calls it **Equip**. Teachers will see both if old material circulates. | **DECIDED: Equip.** Update older docs that say Empower. |
| P2 | The product image diagram is a fair summary | Its outcomes contradict the proposition: it puts "faster planning" under Equip (that is Embed) and "improved classroom management" under Embed (that is Equip PK). | Use the outcomes from v3 proposition only. Retire the diagram or redraw it. |
| P3 | Tagline is "learning that grows" | The logo lock-up says "All Learn Grow". Two taglines dilute both. | Logo keeps "All Learn Grow". Site hero uses a teacher-benefit line (see 10.8). Drop "learning that grows". |
| P4 | "Supports teachers in real time during lessons" | A teacher mid-lesson with 28 students is unlikely to open an app. Overpromising here invites scepticism from experienced teachers. | Position Quick Help as **"between lessons and 2-minute prep"**. Keep it mobile-first so it still works in a corridor or at the back of the room. |
| P5 | Self-assessment tools personalise the journey | Self-rating is poorly calibrated. Out-of-field teachers often do not know what they do not know, and confident teachers over-rate. Craig's own comment on v3 asks "Will there be assessment of the content here?" | Pair every CK self-rating with a **short diagnostic check** (3 to 5 items from a human-verified bank). The pathway uses both signals and shows the teacher the gap honestly and kindly. |
| P6 | "Adaptive" learning | In a demo, "adaptive" will mean rules plus an LLM picking from a catalogue. Calling that adaptive is fine, but the claim should not imply learning analytics we do not have yet. | UI says "personalised to you". Avoid "adaptive" in demo copy. |
| P7 | AI can generate the learning content | AI-generated maths content will contain errors, and one wrong worked example destroys trust with a maths teacher. | **AI selects, sequences and contextualises. Humans author the core content.** Micro-units, diagnostic items and misconception banks are seeded and human-checked. AI-generated lesson drafts are labelled and carry a "check the maths" prompt. |
| P8 | All four products should be in the demo | Four products in one demo produces four shallow experiences. | One deep loop (Equip → Embed → Evaluate). Elevate is a labelled preview. |
| P9 | Covers "rural to urban, primary to senior secondary, faith-based to government" | Breadth is a sales claim, not a demo. The Cool.org use cases mix Year 1 primary and Year 12 Standard maths, which have completely different curriculum frameworks (Year 12 is state syllabus, not AC v9). | Demo slice: **out-of-field and early career teachers of Years 7 to 9 maths**, plus general pedagogy that applies to everyone. One primary persona is included to show breadth, with lighter content. |

### 2.3 Imagery and tone

| # | Current assumption | Challenge | Spec decision |
|---|---|---|---|
| I1 | Stock and AI-generated photos of a teacher at a desk | The "We are for teachers" image appears AI-generated. Teachers notice, and it undermines an authenticity message. | No AI-generated people. Use illustration built from the four-circle motif, real classroom photography (licensed), or screenshots of the product. |
| I2 | Copy speaks to systems and schools first | Teacher-facing screens should talk to the teacher. System-level copy belongs on the leader preview and marketing pages. | Teacher screens use second person, plain language, short sentences. |

### 2.4 Product and data

| # | Current assumption | Challenge | Spec decision |
|---|---|---|---|
| D1 | The knowledge base includes school profile, staff profile, family data, demographics | Family and student data raise serious privacy obligations (Australian Privacy Principles, state education department rules) and are not needed to prove the loop. | Demo uses **fictional school profiles only**. No student or family data. The input box warns against entering student names. |
| D2 | Teachers will create accounts | Account creation is friction for a 15-minute demo, but "teacher ready" implies people return. | **DECIDED: magic-link sign-in from the first pilot.** Persona demos still work without signing in ("Try as Tammy"); signing in saves the teacher's own pathway, lessons and reflections across devices. |
| D3 | The product is AI-first | Teachers judge the product on content quality and time saved, not on AI. | AI is visible only where it helps (understanding the situation, tailoring examples, drafting). Every AI output can be edited and has a "Why this?" explanation. |

---

## 3. Scope

### In scope (demo v1)

- Landing page with clear value proposition and "Try the demo" entry
- Persona picker (three fictional teachers) and "Start as me" option
- Situation intake (free text plus guided chips)
- AI needs diagnosis mapped to CK, PK, PCK, assessment, wellbeing and context
- Diagnostic check for CK topics
- Personalised pathway of 5-minute micro-units, fitted to available time
- Micro-unit player (text, worked example, short video placeholder, check question, reflect prompt)
- Lesson Builder (Embed) for one topic, producing an editable, printable lesson plan
- Quick Help (ask a teaching question, get a short, sourced answer)
- Post-lesson reflection and a simple growth view (Evaluate)
- Leader preview dashboard with fictional aggregate data (Elevate preview)
- In-app feedback capture for the pilot
- Deployed to a public URL with an access code

### Out of scope (v1)

- Real school or student data, LMS or SIS integration
- Payments, licensing, multi-tenant admin
- Peer communities of practice (show as a "coming soon" row only)
- Full assessment authoring (only rubric critique and model answer in Lesson Builder)
- Native mobile apps (responsive web only)

---

## 4. Personas (fictional, used as demo seed profiles)

### 4.1 Tammy, part-time out-of-field maths teacher

- Trained in PE and health. Timetable gap means she now teaches two Year 8 maths classes.
- Teaches three days a week. Has time on her days off and is willing to use it to build confidence.
- Worries about explaining concepts she learned "the rules for" but never understood.
- Needs: CK in algebra and proportional reasoning, PCK on common misconceptions, PK on checking for understanding.
- Success looks like: walks into Monday's lesson knowing how she will explain linear relationships and what errors to watch for.

### 4.2 Sam, early career teacher in a regional school

- Second-year teacher, maths trained, Year 7 and 9 classes in a regional NSW high school.
- Strong content, struggles with classroom routines and differentiation for a wide range of readiness.
- Needs: PK on classroom management and explicit instruction, PCK on differentiating one task three ways.

### 4.3 Priya, casual teacher covering a Year 1 class (breadth persona)

- Secondary-trained casual given a Year 1 class in a rural Victorian school for three weeks.
- Needs: PK on early years routines and attention spans, CK on early number. Lighter content set.

### 4.4 Ms Henderson, deputy principal (Elevate preview only)

- Wants to see where staff confidence is low across the school and what PL is working, without seeing individual teachers' private reflections.

---

## 5. The core loop (user journey)

```
Landing → Pick persona or Start as me
       → 1. Tell us your situation (intake)
       → 2. Your learning needs (diagnosis + diagnostic check)
       → 3. Your pathway (fitted to your week)
       → 4. Learn (micro-units)
       → 5. Plan (Lesson Builder)
       → 6. Reflect (after teaching)
       → Growth view
```

A six-square step counter shows progress during setup and reflection; day to day, teachers move between Week, Lessons, Growth and Me (bottom tabs on phone, sidebar on laptop). Teachers can jump to any unlocked step. Quick Help is available from every screen.

---

## 6. Information architecture and routes

| Route | Screen | Product |
|---|---|---|
| `/` | Landing | Marketing |
| `/demo` | Persona picker and access code | Shell |
| `/start` | Situation intake | Equip |
| `/needs` | Needs diagnosis and diagnostic check | Equip |
| `/pathway` | Personalised pathway | Equip |
| `/learn/:unitId` | Micro-unit player | Equip |
| `/plan` | Lesson Builder topic picker | Embed |
| `/plan/:lessonId` | Lesson editor and print view | Embed |
| `/reflect` | Post-lesson reflection | Evaluate |
| `/growth` | Growth view | Evaluate |
| `/help` | Quick Help (also as a slide-over panel) | Embed |
| `/leader` | Leader preview | Elevate |
| `/about-demo` | What this demo is, privacy, how AI is used | Shell |

---

## 7. Screen specifications

Each screen lists purpose, key components, states and acceptance criteria (AC).

### 7.1 Landing `/`

- **Purpose:** in 10 seconds, a teacher understands what Allegro does for them and starts the demo.
- **Components:** header (logo, "How it works", "For leaders", "Try the demo" button), hero (headline, one-line subhead, primary CTA, illustration of the four circles), "How it works" three-step strip (Understand your needs, Learn in 5 minutes, Plan tomorrow's lesson), four product rows, each with its AllegroMark state, honesty strip ("Built with teachers. AI helps, humans write the content."), footer.
- **AC:** hero headline and CTA visible above the fold at 375px wide; Lighthouse accessibility score 95+; no white text on sage anywhere.

### 7.2 Persona picker `/demo`

- **Components:** access code field (if `DEMO_ACCESS_CODE` is set), three persona rows (initial in the margin, name, one-line situation), a "Start as me" sign-in form, note that persona demo data stays in this browser, and a signed-in teacher's data is saved securely in Australia.
- **AC:** choosing a persona pre-fills intake and jumps to `/needs` with a cached diagnosis (no AI call needed, so the demo works even if the API is down).

### 7.3 Situation intake `/start`

- **Components:**
  - Large text area: "Tell us about your teaching situation. What are you teaching, and what feels hard right now?"
  - Example prompts as tappable chips (the two Cool.org examples, adapted).
  - Guided fields (optional, collapsible): role (out-of-field, early career, casual/relief, experienced, leader), year levels, subject, school type, location type (metro, regional, rural, remote), how long (weeks), time available per week (slider 0.5 to 5 hours).
  - Privacy note under the box: "Please don't include student names or personal details."
- **Behaviour:** submit calls `POST /api/diagnose`. If the AI needs more information it returns up to 2 clarifying questions shown inline as chips plus free text.
- **States:** empty, typing, submitting (skeleton with "Reading your situation" message), clarifying, error (retry plus "use guided form instead").
- **AC:** a submission containing an obvious student full name pattern triggers a gentle warning before sending; works with keyboard only.

### 7.4 Needs diagnosis `/needs`

- **Components:**
  - AI summary band: "Here's what we heard" (2 to 3 sentences, editable, plum AI band).
  - Needs grid grouped by domain chips: CK, PK, PCK, Assessment, Wellbeing, Context. Each need shows topic, why it was identified ("You mentioned..."), priority (Now, Soon, Later), and a self-confidence slider (1 to 5).
  - Diagnostic check entry for each CK need: "Check yourself (2 minutes, 4 questions)". Items come from the seeded bank only.
  - After the check: an honest, kind calibration message, for example "You rated yourself 4. The check suggests the idea of gradient is worth a refresh. That's very common."
  - Teacher can remove, add or reprioritise needs.
- **AC:** diagnostic items render maths with KaTeX; results never shown as a score out of 100, only as "solid", "worth a refresh", "start here"; teacher edits persist.

### 7.5 Pathway `/pathway`

- **Components:**
  - Week view fitting micro-units into the time the teacher said they have (respect Tammy's three teaching days; schedule learning on non-teaching days by default, editable).
  - Each unit row: margin number or tick, title, domain label, duration, "Why this?" info button, status.
  - "Before Monday" highlight: the 2 to 3 units most urgent for the next lesson.
  - Optional external resources section (approved sources list only, see 8.5), each with a one-line summary and link.
- **AC:** total scheduled time never exceeds the stated weekly availability; drag to reorder on desktop, up/down buttons on mobile.

### 7.6 Micro-unit player `/learn/:unitId`

- **Structure of every micro-unit (about 5 minutes):**
  1. Hook (one sentence on why this matters in your classroom)
  2. Core idea (short text, diagram or video placeholder)
  3. Worked example (for CK and PCK units)
  4. Common misconception and how to respond
  5. Check (1 to 2 questions with feedback)
  6. Try it tomorrow (one concrete classroom move)
  7. Reflect (one-line note saved to growth view)
- **Components:** progress bar, "Explain this differently" button (AI re-explains the core idea at a simpler level or with a different context, using only the unit's own content as source), "Add to my lesson" button (sends the "Try it tomorrow" move into Lesson Builder).
- **AC:** unit can be completed in 4 to 7 minutes; "Explain this differently" output is labelled AI and stays within the unit's facts.

### 7.7 Lesson Builder `/plan` and `/plan/:lessonId`

- **Inputs:** topic (from pathway or picker), year level, lesson length, class profile in general terms only (for example "mixed readiness, some EAL/D learners"), what was covered last lesson.
- **Output structure (editable blocks):**
  - Learning intention and success criteria
  - Curriculum references: AC v9 code(s) and NSW syllabus outcome(s) side by side (placeholders until verified)
  - Prerequisites and a 5-minute retrieval starter
  - Key vocabulary and glossary
  - Explicit teaching segment with worked example(s)
  - Common misconceptions to watch for (from the seeded misconception bank)
  - Guided practice, then independent practice (three readiness levels)
  - Checks for understanding (hinge question)
  - Exit ticket with model answers and a simple marking guide
  - "Pedagogical rationale" side note for each block (why this works), which is where PCK grows
- **Components:** block editor (reorder, edit, regenerate one block), "Check the maths" banner on AI blocks until the teacher ticks "I've checked this", print and PDF export, copy to clipboard.
- **AC:** misconceptions block always draws from the seeded bank for that topic; print view fits on 2 A4 pages; regenerating one block does not change others.

### 7.8 Quick Help `/help` and slide-over

- Teacher asks a short question ("A student says 2x means 2 + x. How do I explain?").
- Answer format: 3 to 5 sentences, one concrete move, one link to the relevant micro-unit if it exists.
- **AC:** answers under 120 words by default; "More detail" expands; panel usable one-handed on a phone.

### 7.9 Reflect `/reflect`

- Three prompts, about 2 minutes: What did you try? What happened for students? What will you keep or change?
- Optional confidence re-rating per need.
- AI offers one short, specific, encouraging observation and one suggested next unit. It never grades the teacher.
- **AC:** reflections are private to the teacher and never shown in the leader preview.

### 7.10 Growth view `/growth`

- Confidence over time per need (simple line or dot plot), units completed, lessons planned, reflections timeline, "next best step".
- **AC:** chart has text alternative; no gamified badges or streaks in v1 (teachers find them patronising; revisit after pilot).

### 7.11 Leader preview `/leader`

- Banner: "Preview with fictional data".
- Aggregate confidence by domain across staff, most-used units, topics where out-of-field staff need support, suggested whole-school PL focus.
- **AC:** no individual teacher names or reflections appear; every number is clearly fictional.

### 7.12 About this demo `/about-demo`

- What Allegro is, what the demo does and does not do, how AI is used, what data is stored and where, how to delete it, who to contact.

---

## 8. AI behaviour

### 8.1 Principles

1. AI understands, selects, sequences, tailors and drafts. Humans author core content.
2. Every AI output is editable and explains itself ("Why this?").
3. No student personal information is requested or stored.
4. Australian context: Australian spelling, Australian Curriculum language, AITSL Standards where relevant.
5. Warm, collegial, never condescending. Speak like an experienced head teacher, not a chatbot.

### 8.2 Endpoints (all server-side via proxy, API key never in the browser)

| Endpoint | Purpose | Output |
|---|---|---|
| `POST /api/diagnose` | Turn intake into structured needs | JSON (schema 8.3) |
| `POST /api/pathway` | Select and sequence micro-units from the catalogue | JSON list of unit IDs with reasons and schedule |
| `POST /api/explain` | Re-explain a unit's core idea | Short text, grounded in unit content |
| `POST /api/lesson` | Draft a lesson plan | JSON blocks (schema 8.4) |
| `POST /api/lesson-block` | Regenerate one block | One JSON block |
| `POST /api/help` | Quick Help answer | Short text plus optional unit ID |
| `POST /api/reflect` | Observation and next-step suggestion | Short text plus unit ID |
| `POST /api/feedback` | Store pilot feedback | 204 |

### 8.3 Needs diagnosis schema

```json
{
  "summary": "string, 2-3 sentences, second person",
  "context": {
    "role": "out_of_field | early_career | casual | experienced | leader",
    "subject": "string",
    "year_levels": ["string"],
    "school_type": "government | catholic | independent | unknown",
    "location_type": "metro | regional | rural | remote | unknown",
    "timeframe_weeks": "number | null",
    "hours_per_week": "number | null"
  },
  "needs": [
    {
      "id": "string",
      "domain": "CK | PK | PCK | ASSESSMENT | WELLBEING | CONTEXT",
      "topic": "string",
      "catalogue_tags": ["string"],
      "evidence": "string quoting or paraphrasing what the teacher said",
      "priority": "now | soon | later"
    }
  ],
  "clarifying_questions": ["string, max 2"],
  "safety_flags": ["student_pii | wellbeing_concern | out_of_scope"]
}
```

Validate with Zod on the server. On invalid JSON, retry once with the validation error appended, then fall back to the guided form.

### 8.4 Lesson block schema

```json
{
  "lesson_id": "string",
  "title": "string",
  "year_level": "string",
  "duration_minutes": 60,
  "curriculum_refs": { "ac9": ["AC9-TODO"], "nsw": ["NSW-TODO"] },
  "blocks": [
    {
      "id": "string",
      "type": "intention | prerequisites | vocabulary | explicit_teaching | misconceptions | guided_practice | independent_practice | check_for_understanding | exit_ticket",
      "title": "string",
      "content_md": "markdown with KaTeX allowed",
      "rationale": "string, why this works",
      "source": "seeded | ai_draft",
      "needs_maths_check": true
    }
  ]
}
```

### 8.5 Grounding and sources

- Phase 1 retrieval is simple: the catalogue is a typed JSON file. The server filters by tags and passes the matching unit summaries (not full text) to the model. No vector database needed at demo scale.
- Approved external sources list (config file, editable): AITSL, ACARA Australian Curriculum, state education department PL sites, AERO (Australian Education Research Organisation), reSolve: Maths by Inquiry, AAMT. The model may only recommend external resources from this list and must not fabricate URLs. Store known URLs in config; the model selects by ID.

### 8.6 System prompt skeleton (for `/api/diagnose`)

```
You are Allegro, a professional learning guide for Australian teachers.
Your job: read a teacher's description of their situation and identify
their learning needs across content knowledge (CK), pedagogical knowledge
(PK), pedagogical content knowledge (PCK), assessment, wellbeing and
context.

Rules:
- Use Australian spelling and Australian Curriculum language.
- Base every need on something the teacher said. Quote or paraphrase it
  in "evidence".
- Prefer 3 to 6 needs. Mark at most 3 as "now".
- Ask at most 2 clarifying questions, only if the answer would change
  the needs.
- Never ask for student names or personal information. If the teacher
  included any, add "student_pii" to safety_flags and do not repeat it.
- If the teacher describes distress or burnout, add "wellbeing_concern"
  and include a WELLBEING need. Do not counsel.
- Only use catalogue_tags from this list: {{TAG_LIST}}
- Respond with JSON only, matching the schema.
```

Write equivalent prompts for each endpoint and keep them in `prompts/*.md` so non-developers can edit them.

### 8.7 Model and limits

- Model set by env var `ANTHROPIC_MODEL` (default `claude-sonnet-5-5`; use `claude-haiku-5-5` for Quick Help and Explain to keep latency low).
- Max output tokens per endpoint configured in one file.
- Rate limit per signed-in teacher and per demo session (default 40 and 15 AI calls per hour). No IP addresses are stored.
- Every persona path has cached responses so the demo still runs if the API fails.

---

## 9. Content model and seed data

### 9.1 Types

```ts
type Domain = 'CK' | 'PK' | 'PCK' | 'ASSESSMENT' | 'WELLBEING' | 'CONTEXT';
type Format = 'text' | 'worked_example' | 'video' | 'reflective_task' | 'interactive';
type Audience = 'out_of_field' | 'early_career' | 'casual' | 'experienced' | 'leader' | 'primary' | 'secondary';

interface MicroUnit {
  id: string;
  moduleId: string;
  title: string;
  domain: Domain;
  tags: string[];            // e.g. 'algebra.linear', 'pk.checking-understanding'
  audience: Audience[];
  yearLevels: string[];      // e.g. ['7','8','9']
  durationMinutes: number;   // target 5
  format: Format[];
  difficulty: 1 | 2 | 3;
  curriculumRefs: { ac9: string[]; nsw: string[] }; // 'AC9-TODO' / 'NSW-TODO' until verified
  aitslStandards: string[];  // e.g. '2.1', '3.2'
  hook: string;
  coreIdeaMd: string;
  workedExampleMd?: string;
  misconceptionIds: string[];
  checkItems: CheckItem[];
  tryTomorrow: string;
  reflectPrompt: string;
  reviewedBy: string | null; // human reviewer, required before pilot
}

interface Misconception {
  id: string;
  topicTag: string;
  studentSays: string;       // "2x means 2 + x"
  whyItHappens: string;
  howToRespond: string;
  diagnosticQuestion: string;
}

interface CheckItem {
  id: string;
  stemMd: string;
  type: 'mcq' | 'numeric' | 'short';
  options?: string[];
  answer: string;
  feedbackCorrect: string;
  feedbackIncorrect: string;
}

interface Module { id: string; title: string; summary: string; unitIds: string[]; }
interface SchoolProfile { id: string; name: string; sector: string; location: string; size: string; priorities: string[]; fictional: true; }
```

### 9.2 Minimum seed content for v1

| Area | Units | Notes |
|---|---|---|
| CK: Linear relationships (Years 8 to 9) | 4 | gradient as rate of change, tables to graphs to rules, y = mx + c meaning, common graphing errors |
| CK: Proportional reasoning (Years 7 to 8) | 3 | ratio vs fraction, unit rates, percentage as proportion |
| CK: Algebraic thinking foundations | 3 | pronumerals as variables, equivalence and the equals sign, simplifying |
| PCK: Teaching algebra misconceptions | 2 | using the misconception bank |
| PK: Checking for understanding | 3 | hinge questions, mini whiteboards, exit tickets |
| PK: Explicit instruction and worked examples | 2 | I do, we do, you do; fading |
| PK: Classroom routines | 2 | entry routines, transitions |
| PK: Differentiation | 2 | one task, three entry points |
| Primary breadth (Priya) | 3 | early years routines, attention spans, early number |
| Assessment | 2 | writing success criteria, feedback that moves learning |
| Misconception bank | 12 entries | algebra and proportional reasoning |
| Diagnostic items | 4 per CK topic | human-verified |

Seed content lives in `content/` as JSON or MDX. Claude Code may draft seed content, but every unit is created with `reviewedBy: null` and the app shows a "Draft content" badge on unreviewed units until a human sets `reviewedBy`. A script `npm run content:report` lists unreviewed items.

---

## 10. Design system

### 10.1 Colour tokens

Brand values come from the logo files. Derived values were added to meet WCAG 2.2 AA. Contrast ratios were measured.

| Token | Hex | Use | Contrast notes |
|---|---|---|---|
| `--sage-500` | #80A880 | Brand surface, hero bands, illustration | White on it 2.68:1, **never for text on it except ink** |
| `--sage-300` | #A9C7A9 | Decorative fills, chart fills | |
| `--sage-100` | #E8F0E8 | Table header cells, selected states, tags | Ink 12.8:1, Green 700 4.81:1 |
| `--green-600` | #658865 | Logo, large display text only | 3.99:1 on white (large text only) |
| `--green-700` | #4E7050 | **Primary action**, links, focus ring | 5.59:1 on white, white text on it 5.59:1 |
| `--green-800` | #3F5E3F | Hover/pressed primary | 7.28:1 |
| `--green-900` | #2F3E2F | Footer background, strong headings | |
| `--plum-500` | #7F577F | Secondary accent, headings on light, highlights | 5.88:1 on white, 5.45:1 on off-white |
| `--plum-700` | #5E3E5E | Plum text and hover | 9.03:1 on white |
| `--plum-100` | #F1EAF1 | Plum tint surfaces (AI-drafted blocks) | Plum 700 on it 7.64:1 |
| `--ink` | #1F2A1F | Body text | 13.8:1 on off-white, 5.56:1 on sage |
| `--muted` | #5A6B5A | Secondary text | 5.7:1 on white |
| `--surface` | #F5F7F2 | Page background | |
| `--field` | #FFFFFF | Input and textarea backgrounds only | |
| `--border` | #D5DDD3 | Hairlines | |
| `--success` | #4E7050 | Success states (shares Green 700) | |
| `--warning` | #9A6B12 | Warnings | 4.68:1 on white |
| `--error` | #B4573A | Errors | 4.81:1 on white |
| `--info` | #2E6B8A | Info, links inside AI blocks | 5.86:1 on white |
| `--highlighter` | #C9DEC3 | Highlighter mark behind the current item or key answer (lower 42% of the line only) | Ink on it passes AA |
| `--grid` | #E1E9DF | Graph-paper lines, learning screens only | Decorative |
| `--margin` | #7F577F at 50% opacity | The margin line | Decorative |
| `--rule` | #D5DDD3 | Ruled lines between rows | Decorative |
| `--rule-strong` | #1F2A1F | 2px rules under headers and above bottom bars | |

Rules:
- Primary buttons: Green 700 background, white text, 2px corners.
- Secondary buttons: paper background, 2px Green 700 border and text.
- Ask and other AI actions: 2px plum border, plum 700 text.
- Plum is the "thinking" colour: AI-drafted content sits in a full-width Plum 100 band with "AI" or "AI DRAFT" in the margin or header, plus the disclosure line. This makes AI content instantly recognisable.
- Sage is used as a solid band for the single most important prompt on a screen (for example "Before Monday"), with ink text only.
- Never rely on colour alone. Every state also has an icon or label.
- Provide a dark mode in v1.1 (not required for pilot).

### 10.2 Typography

Decided 24 November 2026 (exercise book direction):

- **Headings:** Literata (Google Fonts, optical size axis), weight 600. Bookish and calm; sets the planner feel.
- **Body, UI and every input:** Atkinson Hyperlegible, weights 400 and 700. Designed for low-vision readers, which supports the Inclusivity value.
- **Margin notes:** Caveat, weight 500 to 600, used only for short annotations (ticks, "today", "+2 every time", lesson timings like 20'). Rules: one line, 20px or larger, never in inputs, buttons, instructions or anything a teacher must act on. A teacher's sent Quick Help question may be shown in Caveat; the typing field never is.
- **Maths:** KaTeX default fonts. Tables in Literata.
- Scale (px, mobile): 12 labels, 13 meta, 15 to 17 body, 20 to 22 row titles, 26 to 30 screen titles, 40 home title. Body line height 1.45 to 1.5. Max line length 68 characters.
- Headings in sentence case. Small uppercase labels (13px, 0.12em letter spacing) for section names and the step counter.

### 10.3 Spacing, radius, elevation

- 4px base grid. Spacing tokens 4, 8, 12, 16, 24, 32, 48, 64.
- Radius: 2px on buttons, inputs and tags. No rounded cards and no pills.
- No cards. Structure comes from ruled lines (1px `--rule` between rows, 2px ink under headers and above bottom bars) and the margin.
- Elevation: none in content. Bottom sheets sit on a dimmed backdrop with a 4px plum top edge instead of a shadow.

### 10.4 Iconography and the four-circle motif

- Build an `<AllegroMark product="equip|embed|evaluate|elevate|all" />` component from the logo SVG paths. Each product fills its own circle (clockwise: top-left Equip, top-right Embed, bottom-right Evaluate, bottom-left Elevate; decided 27 October 2026, so the mark reads as a growth cycle) and outlines the other three.
- Use it for product badges, the home header and loading states (circles fill in sequence).
- UI icons: Lucide, 1.5px stroke, 20px default.

### 10.5 Brand assets

- Source files: `Allegro Logo.svg` (white on sage), `Allegro Logo DG.svg` (white on dark green), `Allegro Purple.svg` (white on plum), `Allegro icon.svg`, `AL logo trans.png`.
- The SVGs include a full background rectangle. Create cleaned versions in `public/brand/` with the background removed: `logo-white.svg`, `logo-green.svg` (mark and text in Green 700 for light backgrounds), `mark.svg`, `favicon.svg`.
- Logo on light backgrounds uses Green 700 or Green 600 (large). Logo on sage uses white only at large header size, or ink.

### 10.6 Layout and responsiveness

- Mobile first. Breakpoints 640, 1024, 1280.
- **Phone (under 640):** 52px margin column with the plum margin line; content starts at 68px. Bottom tab bar (Week, Lessons, Growth, Me), text labels, active tab marked with a 4px green underline. "Ask a question" button sits above the tab bar. During setup and reflection a six-square step counter replaces the tab bar's role ("Step 2 of 6").
- **Tablet (640 to 1023):** same tab bar; content in a centred 600px page with its own margin line. Quick Help opens as a side sheet.
- **Laptop (1024 and up):** left "Contents" sidebar (ruled list, active item with green left edge) replaces the tab bar and shows the loop's step squares; the margin line belongs to the main column only; Quick Help (on This week) or "Why this block works" (on lessons) docks on the right.
- Lesson plans use the margin for running times (0', 5', 20' ...) and confirm the plan fits the lesson length.
- Minimum tap target 44px.
- Must work well on iPad (common school device) and Chromebook.

### 10.6a Exercise book visual language

- Background is paper (`--surface`). Graph paper (`--grid`, 20px squares) appears only on learning screens and maths blocks, where working-out happens.
- The margin carries step numbers, ticks, "now / soon / later" priorities, lesson timings and AI markers.
- The highlighter marks at most one thing per screen: the current item or the key answer.
- Completed items are struck through in green with a tick in the margin, never removed.
- Voice input (microphone button) is offered on the situation box and Quick Help, because teachers on phones between classes will talk more readily than type.

### 10.7 Motion

- 150 to 250ms ease-out for state changes. Honour `prefers-reduced-motion`.
- Loading uses the four-circle fill sequence, never spinners alone.

### 10.8 Voice and microcopy

- Warm, practical, collegial. Short sentences. Second person.
- Hero headline options (test in pilot): "Professional learning that starts with your classroom" / "Know what to teach tomorrow, and why" / "Learn it in five minutes. Teach it with confidence."
- Never say "simply", "just", "easy". Never shame a gap: "worth a refresh" not "weak".
- AI disclosure line used consistently: "Drafted by Allegro AI. Please check before using."

---

### 10.9 Design reference screens

- Canvas: "Allegro Learning: Mobile-first UI/UX" (claude.ai artifact, owner Craig). The rows "Mobile first: the teacher loop" and "Scaling up" are the source of truth; the style rows below them are explorations only.
- The same screens are exported to `design/` in the repo as HTML files (one per screen, inline styles). Claude Code should match their layout, spacing, type and colour, but rebuild them as real components using the tokens in `src/styles/tokens.css`. Do not copy the markup or the `support.js` runtime.
- Where a screen and this spec disagree, this spec wins.

---

## 11. Accessibility

- Target WCAG 2.2 AA throughout. Automated checks with axe in CI; manual keyboard and screen reader pass (VoiceOver and NVDA) before pilot.
- All maths has accessible text (KaTeX with MathML output).
- Charts have data tables or text summaries.
- Focus ring: 2px Green 700 plus 2px white offset.
- Forms: visible labels, inline errors with text, not colour alone.
- Reading level for UI copy: aim for Year 8 to 9 plain English.

---

## 12. Technical architecture

### 12.1 Stack

- **Frontend:** Vite, React 18, TypeScript, React Router, Tailwind CSS (tokens from 10.1 in `tailwind.config.ts` and CSS variables), Radix UI primitives, Lucide icons, KaTeX, Zustand for state.
- **Server:** Cloudflare Pages Functions in `functions/api/*` acting as the Anthropic API proxy. Zod validation.
- **Storage:**
  - **Supabase** for magic-link auth and Postgres with row-level security (each teacher can read and write only their own rows). Tables: `profiles`, `needs`, `pathway_items`, `unit_progress`, `lessons`, `reflections`, `feedback`.
  - Persona demo mode (not signed in) uses in-memory state plus localStorage (wrapped in try/catch).
  - Supabase project in the Sydney region (ap-southeast-2) to keep teacher data in Australia.
  - Pilot size is under 20 teachers, so the Supabase free or Pro tier is ample; no scaling work needed.
- **Hosting:** Cloudflare Pages, custom subdomain (for example `demo.allegrolearning.com.au`, confirm domain).
- **Testing:** Vitest for units, Playwright for the core loop end to end, axe for accessibility.

### 12.2 Folder structure

```
/
  SPEC.md
  CLAUDE.md
  CHANGELOG.md
  content/
    units/*.json
    modules.json
    misconceptions.json
    schools.json
    personas.json
    approved-sources.json
  docs/
    curriculum-todo.md
  functions/
    api/
      diagnose.ts  pathway.ts  explain.ts  lesson.ts  lesson-block.ts  help.ts  reflect.ts  feedback.ts
    _lib/
      anthropic.ts  auth.ts  ratelimit.ts  prompts.ts  respond.ts
  shared/
    schemas.ts  types.ts  catalogue.ts   (used by both the app and the Functions)
  prompts/*.md
  public/brand/*
  src/
    app/        (routes and layout)
    components/ (AllegroMark, Button, Tag, StepSquares, MarginLayout, RuledRow, AIBlock, ...)
    features/   (intake, needs, pathway, learn, plan, help, reflect, growth, leader)
    lib/        (store, api client, katex, analytics)
    styles/tokens.css
  tests/
```

### 12.3 Environment variables

| Name | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Server only |
| `ANTHROPIC_MODEL` | Default `claude-sonnet-5-5` |
| `ANTHROPIC_MODEL_FAST` | Default `claude-haiku-5-5` |
| `DEMO_ACCESS_CODE` | Optional gate for pilot |
| `RATE_LIMIT_USER_PER_HOUR` | Default 40 (signed-in teachers) |
| `RATE_LIMIT_DEMO_PER_HOUR` | Default 15 (persona demo sessions) |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Supabase project URL and public anon key (browser) |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Same values, used by the Functions to verify sign-in |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only, for admin feedback export |

### 12.4 Performance

- First load under 200KB JS gzipped for the landing page (code-split the app).
- Stream AI responses where the UI benefits (Quick Help, Explain).
- Time to first meaningful AI output under 4 seconds for Quick Help.

---

## 13. Privacy, safety and trust

- No student personal information collected. Client-side check warns on likely student names; server prompt also flags it.
- Signed-in teacher data is stored in Supabase (Sydney region) with row-level security. "Delete my account and data" on `/about-demo` removes all of the teacher's rows and their auth record. Persona demo data stays in the browser only.
- Pilot feedback is anonymous (no IP stored; session ID is random).
- AI calls do not include persona or teacher identity beyond the situation text.
- Prompts and responses are not logged in production by default. A debug flag enables redacted logging for development only.
- Align with the Australian Privacy Principles and the Australian Framework for Generative AI in Schools. Publish a short plain-English statement on `/about-demo`.
- Wellbeing: if a teacher describes distress, show a gentle note pointing to their school's EAP and to Beyond Blue (1300 22 4636). Do not attempt counselling.

---

## 14. Pilot feedback capture

- Thumbs up/down with optional comment on: diagnosis, pathway, each micro-unit, lesson plan, Quick Help answers.
- End-of-loop survey (5 questions, 1 to 5 scale plus one open question):
  1. The needs identified matched my real situation.
  2. The pathway fitted the time I have.
  3. I learned something I will use this week.
  4. I would use the lesson plan with minor edits.
  5. I would recommend Allegro to a colleague.
  6. What would make this more useful for you?
- Simple admin page `/admin/feedback` (protected by a separate code) listing results and CSV export.

---

## 15. Build milestones for Claude Code

Build in order. Do not start a milestone until the previous one's checks pass.

### M0. Foundations
- Scaffold stack (12.1), tokens (10.1 to 10.3), fonts, `AllegroMark` component, cleaned brand assets, app shell, routing, landing page.
- **Checks:** Lighthouse accessibility 95+ on landing; axe shows zero violations; tokens documented in a `/styleguide` route.

### M1. Intake and diagnosis
- Supabase project, magic-link sign-in, `profiles` table with RLS, persona picker, intake screen, `/api/diagnose` with schema validation and retry, needs screen, diagnostic check from seeded items, cached persona responses.
- **Checks:** Playwright test completes Tammy's path with the API mocked; invalid model JSON triggers fallback; student-name warning works.

### M2. Pathway and learning
- Seed content (9.2) as drafts, `/api/pathway`, pathway week view, micro-unit player, Explain, "Add to my lesson".
- **Checks:** scheduled time never exceeds availability (unit test); a unit is completable in under 7 minutes; draft badge shows on unreviewed units.

### M3. Lesson Builder
- Lesson inputs, `/api/lesson`, block editor, single-block regenerate, misconception block from bank, maths-check banner, print and PDF.
- **Checks:** print view is 2 A4 pages or fewer for a 60-minute lesson; regenerate affects one block only.

### M4. Reflect, growth, Quick Help
- Reflection flow, growth view with accessible chart, Quick Help panel and page.
- **Checks:** reflections are private to their owner (another teacher can never read them); Quick Help answers under 120 words by default.

### M5. Leader preview, feedback, hardening, deploy
- Supabase auth and persistence are built in M1 (sign-in screen, profile) and used by every later milestone.
- Leader preview with fictional data, feedback capture and admin page, rate limiting, error states, `/about-demo`, deploy to Cloudflare Pages.
- **Checks:** full Playwright loop passes against the deployed URL with a real API key; manual screen reader pass recorded in `docs/a11y-checklist.md`; `npm run content:report` shows zero unreviewed units (every unit signed off by Denise Halliday).

---

## 16. Decisions log and open questions

### Decided (27 October 2026)

| Topic | Decision |
|---|---|
| Product name | Equip (not Empower) |
| Sign-in | Magic-link sign-in in the first pilot; persona demos work without signing in |
| Content review | Denise Halliday (maths educator) reviews and signs off every unit before pilot; her name goes in `reviewedBy` |
| Elevate | Included as a labelled leader preview with fictional data |
| Curriculum frame | Both AC v9 and NSW syllabus references shown side by side |
| Pilot size | Under 20 teachers |
| Trade mark | Allegro Learning name checked and clear |
| Circle mapping | Clockwise from top-left: Equip, Embed, Evaluate, Elevate |
| Visual style (24 Nov 2026) | Exercise book direction in Allegro colours: paper, margin line, ruled rows, no cards, Literata / Atkinson Hyperlegible / Caveat (see 10.2 to 10.6a) |
| Navigation (24 Nov 2026) | Bottom tabs on phone (Week, Lessons, Growth, Me), Contents sidebar on laptop; step squares only during setup and reflection |
| Voice input (24 Nov 2026) | Microphone option on the situation box and Quick Help |
| Ownership (24 Nov 2026) | ZOMO Consulting owns Allegro; Cloudflare, Supabase and Anthropic accounts sit under ZOMO |
| Content source (24 Nov 2026) | New units written for Allegro (about 30), AI drafted and human reviewed; no external catalogue ingestion in v1 |
| Builder (24 Nov 2026) | Craig builds with Claude Code; technical spec is written as milestone build prompts |
| Product description audience (24 Nov 2026) | School and system buyers (principals, dioceses, departments) |

### Still open

1. **Reviewer timing:** how many days Denise Halliday needs for roughly 30 units, and when she can start.
2. **Pilot schools:** which schools and when (NSW schools fit the dual curriculum choice).
3. **Domain:** confirm the demo URL.
4. **Pilot sign-in emails:** personal or school/department emails. Department emails may trigger a privacy review or ST4S assessment; check with pilot schools before recruiting.
