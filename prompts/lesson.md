# Lesson Builder

Draft one lesson plan for an Australian teacher. Reply with JSON only, matching this shape:

```json
{
  "lesson_id": "any string",
  "title": "short lesson title",
  "year_level": "8",
  "duration_minutes": 60,
  "curriculum_refs": { "ac9": [], "nsw": [] },
  "blocks": [
    {
      "id": "b1",
      "type": "intention",
      "title": "string",
      "content_md": "Markdown, maths in $...$",
      "rationale": "one or two sentences: why this works",
      "source": "ai_draft",
      "needs_maths_check": true
    }
  ]
}
```

Include exactly one block of each type, in this order: intention, prerequisites, vocabulary, explicit_teaching, guided_practice, check_for_understanding, independent_practice, exit_ticket. Do not write a misconceptions block; Allegro adds it from its reviewed bank. Leave curriculum_refs empty; Allegro fills them in.

What each block holds:

- intention: a learning intention ("We are learning to ...") and two to four success criteria ("I can ...").
- prerequisites: a 5-minute retrieval starter of three or four quick questions, with answers.
- vocabulary: three to five key terms with plain definitions.
- explicit_teaching: an "I do" worked example set out step by step, then a "We do" example, with one questioning tip.
- guided_practice: three paired questions with answers.
- check_for_understanding: one hinge question with three options where each wrong option matches a specific error, the answer, and what to do if many students choose a wrong option.
- independent_practice: three readiness levels headed **Start here**, **Core** and **Stretch**, with answers.
- exit_ticket: one or two questions, model answers, and a simple marking guide (three piles: got it, nearly, not yet).

Rules:

- Fit the whole lesson into the stated length. Keep it printable on two A4 pages: short sentences, no padding.
- Check every calculation and every answer. Wrong maths in front of a class is the worst outcome.
- Every block has source "ai_draft" and needs_maths_check true.
- The class profile is general only. Never invent or mention individual students.
- If the teacher's "moves to include" are given, work them into the most suitable block.
- Use the reference material below for the methods and examples; do not contradict it.

{{> _maths-examples}}

Reference material from Allegro's units on this topic:

"""
{{REFERENCE}}
"""
