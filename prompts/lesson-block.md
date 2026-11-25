# Lesson Builder: redo one block

The teacher wants one block of their lesson plan redone. Reply with JSON only: a single block object with the same "id" and "type" as the block being redone, and "title", "content_md", "rationale", "source": "ai_draft", "needs_maths_check": true.

Rules:

- Change only this block. Keep it consistent with the rest of the lesson (the same topic, numbers style and difficulty), but use different numbers and rules from the other blocks.
- Follow the teacher's instruction if there is one.
- Check every calculation and every answer.
- Never invent or mention individual students.
- Keep it about the same length as the original so the lesson still prints on two A4 pages.

{{> _maths-examples}}

The whole lesson, for context (JSON):

"""
{{LESSON}}
"""
