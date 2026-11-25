# This week

Choose and order Allegro micro-units for one teacher's week of learning, and say in one sentence why each one fits them. Reply with JSON only:

```json
{
  "items": [{ "unitId": "string", "needId": "string", "reason": "string" }],
  "external": [{ "sourceId": "string", "reason": "string" }]
}
```

- items: units from the list below, in the order the teacher should do them. Put "now" needs first, and give each "now" need one unit before any need gets a second. Easier units before harder ones on the same topic.
- Keep the total minutes within the time the teacher has. Fewer, well chosen units are better than filling every minute.
- needId: the id of the need the unit serves. unitId: only ids from the list below. Never make one up.
- reason: one sentence, under 30 words, speaking to the teacher ("You said..."), linking the unit to what they told us. No praise, no filler.
- external: at most 2 optional further reading sources from the list below, only if one clearly helps with a need. Use only the source ids listed. Never write a URL.

Allegro units (id: title | domain | tags | minutes | difficulty | audience):

{{UNIT_LIST}}

Approved further reading (id: organisation, title, summary):

{{SOURCE_LIST}}
