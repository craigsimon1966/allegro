# Lesson pack: worksheets, teacher steps and smart board slides

The teacher has a lesson plan (below, as JSON). Turn it into a classroom pack. Reply with JSON only, matching this shape:

```json
{
  "steps": [
    {
      "block_id": "b2",
      "do": [
        "Show the warm up slide. Students answer on mini whiteboards, one question at a time."
      ],
      "say": ["Show me your boards in 3, 2, 1."],
      "ask": ["How did you work out question 2?"],
      "watch_for": ["Students who add before multiplying in question 1."]
    }
  ],
  "worksheet": {
    "title": "short student-friendly title",
    "instructions": "one or two sentences for students",
    "sections": [
      {
        "heading": "Practise with a partner",
        "level": "all",
        "block_id": "b6",
        "items": [
          { "prompt_md": "question, maths in $...$", "answer_md": "answer", "space": "medium" }
        ]
      }
    ]
  },
  "exit_ticket": [{ "prompt_md": "question", "answer_md": "model answer", "space": "medium" }],
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

What each part holds:

- steps: one entry for every block in the lesson, in lesson order, using the block's id. "do" is two to four short actions in order, naming the slide (by its heading) or worksheet section to use. Do not number slides; Allegro adds slide numbers to the guide. "say" is one or two short lines the teacher can read out. "ask" is two or three questions to ask the class. "watch_for" is one or two errors or signs to look for (for the misconceptions block, use the misconceptions it lists). Write for a teacher who is not a maths specialist: plain words, no jargon.
- worksheet: the questions students do on paper, taken from the lesson's guided practice and independent practice. Use level "all" for guided practice. If independent practice has readiness levels (Start here, Core, Stretch), make one section for each with level "start", "core" or "stretch"; otherwise one section with level "all". Copy the lesson's questions and numbers exactly. Every item has its answer in "answer_md". "space" is how much working the question needs: short, medium or long.
- exit_ticket: the lesson's exit ticket questions, with model answers.
- slides: 10 to 16 slides for a smart board. First a title slide (kind "title", heading the lesson title, body the year level). Then follow the lesson: intention (learning intention and success criteria), vocabulary (up to four terms), the retrieval starter questions, the worked example and the "we do" example (kind "example"), guided practice questions (kind "problem"), the hinge question (kind "hinge", with "options"), and finish with a reflection slide that points students to their exit ticket.

Rules for slides (they are shown on a smart board, and the teacher writes on them with the board pen):

- One idea per slide. A body is at most about 25 words, plus a small table if the question needs one (Markdown table, at most 5 columns).
- Never show answers, working or the steps of a solution on a slide. Show the problem only. The teacher writes the working and the answer live. Put the answer in "answer_md" for the teacher's answer key.
- Set "writing_space" true on every example, problem and hinge slide, and on any slide where students' ideas will be written up. Set it false on title, intention and vocabulary slides.
- Retrieval starter: one slide per question, or two short questions on one slide.
- Hinge options: two to four short options, without saying which is right.
- Diagrams: when the lesson block shows the problem with a ```visual diagram (a graph, bar model, number line and so on), put it on the slide too, copied exactly into "body_md" as its own fenced block. At most one diagram per slide; it sits beside the text. A diagram on a slide must not give the answer away: for a "find the rule" graph, keep the points and leave out the line and any label that states the rule.

Other rules:

- Use only the lesson's own content, numbers and order. Do not add new maths. Check every answer.
- When a question gives a table of values (for example x and y), write it as a small Markdown table in "prompt_md" and "body_md", not as a list of numbers.
- Student-facing text (worksheet, exit ticket, slides) speaks to students in short sentences.
- Never invent or mention individual students.
- Keep it compact: no padding, no repetition between "do", "say" and "ask".

The lesson plan (JSON):

"""
{{LESSON}}
"""
