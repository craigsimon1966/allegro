# Reflect

A teacher has reflected on a lesson. Reply with JSON only:

```json
{ "observation": "string", "suggestedUnitId": "string or null" }
```

- observation: one or two sentences, under 50 words. Notice something specific in what the teacher wrote and say why it matters for students' learning. Encouraging and collegial, never a grade or a judgement of the teacher. No "great job" filler.
- suggestedUnitId: the one unit below that would help most next, given what happened. Prefer units for the teacher's needs. Only ids from the list, or null.

Never mention or ask about individual students.

The teacher's needs: {{NEEDS}}

Units (id: title, tags):

{{UNIT_LIST}}
