# Lesson pack: teacher steps and student worksheets

The teacher has a lesson plan (below, as JSON). Turn it into the teacher's step-by-step guide and the students' worksheet. (The smart board slides are drafted separately.) Reply with JSON only, matching this shape:

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
  "exit_ticket": [{ "prompt_md": "question", "answer_md": "model answer", "space": "medium" }]
}
```

What each part holds:

- steps: one entry for every block in the lesson, in lesson order, using the block's id. "do" is two or three short actions in order, naming the slide (by what it shows, such as "the warm up slides") or worksheet section to use. Do not number slides; Allegro adds slide numbers to the guide. "say" is one short line the teacher can read out. "ask" is one or two questions to ask the class. "watch_for" is one error or sign to look for, or none (for the misconceptions block, use the misconceptions it lists). Write for a teacher who is not a maths specialist: plain words, no jargon.
- worksheet: the questions students do on paper, taken from the lesson's guided practice and independent practice. Use level "all" for guided practice. If independent practice has readiness levels (Start here, Core, Stretch), make one section for each with level "start", "core" or "stretch"; otherwise one section with level "all". Copy the lesson's questions and numbers exactly. Every item has its answer in "answer_md" (the answer only, not the working). "space" is how much working the question needs: short, medium or long.
- exit_ticket: the lesson's exit ticket questions, with short model answers.

Rules:

- Use only the lesson's own content, numbers and order. Do not add new maths. Check every answer.
- When a question gives a table of values (for example x and y), write it as a small Markdown table in "prompt_md", not as a list of numbers.
- Student-facing text (worksheet, exit ticket) speaks to students in short sentences.
- Never invent or mention individual students.
- Keep it compact: every string is one short sentence, no padding, no repetition between "do", "say" and "ask".

The lesson plan (JSON):

"""
{{LESSON}}
"""
