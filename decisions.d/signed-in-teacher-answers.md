## 27 Nov 2026: signed-in teachers keep their own answers

- A signed-in teacher's own answers (state or territory, year levels, role, situation ticks, days a week, hours) are saved inside the intake row's `diagnosis` JSON, under `teacher_answers`. Before this, signing in again (or on another device) restored the needs but not these answers, so a Victorian or WA teacher went back to NSW codes and lost their days a week.
- Kept in the existing JSON column rather than a new column, so no database migration is needed before the pilot. A later migration can move it to its own column. Old intakes without it load as before.
