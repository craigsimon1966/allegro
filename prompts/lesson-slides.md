# Lesson pack: smart board slides

The teacher has a lesson plan (below, as JSON). Draft the slides they will show on a smart board and write on with the board pen. Reply with JSON only, matching this shape:

```json
{
  "slides": [
    {
      "kind": "problem",
      "block_id": "b4",
      "heading": "short heading",
      "body_md": "the problem only",
      "options": [],
      "writing_space": true,
      "answer_md": "the answer, for the teacher's answer key"
    }
  ]
}
```

Slides: 10 to 14. First a title slide (kind "title", heading the lesson title, body the year level). Then follow the lesson: intention (learning intention and success criteria), vocabulary (up to four terms), the retrieval starter questions, the worked example and the "we do" example (kind "example"), guided practice questions (kind "problem"), the hinge question (kind "hinge", with "options"), and finish with a reflection slide (kind "reflection") that points students to their exit ticket. Use each slide's lesson block id in "block_id".

Rules:

- One idea per slide. A body is at most about 25 words, plus a small table if the question needs one (Markdown table, at most 5 columns).
- Never show answers, working or the steps of a solution on a slide. Show the problem only. The teacher writes the working and the answer live. Put the short answer (no working) in "answer_md" for the teacher's answer key; leave it empty on title, intention, vocabulary and reflection slides.
- Set "writing_space" true on every example, problem and hinge slide. Set it false on title, intention, vocabulary and reflection slides.
- Retrieval starter: one slide per question, or two short questions on one slide.
- Hinge options: two to four short options, without saying which is right.
- When a question gives a table of values (for example x and y), write it as a small Markdown table in "body_md", not as a list of numbers.
- Use only the lesson's own content, numbers and order. Do not add new maths. Check every answer.
- Speak to students in short sentences. Never invent or mention individual students.

The lesson plan (JSON):

"""
{{LESSON}}
"""
