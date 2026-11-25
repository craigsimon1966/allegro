# Curriculum codes to check

Every code in Allegro now comes from the official lists in `content/curriculum/` (ACARA's AC v9 Mathematics and NESA's Mathematics K-10 (2022) syllabus), rebuilt with `npm run curriculum:import`. The app checks each code against those lists and the teacher's year (or NSW stage) before it shows, so a made-up or wrong-year code never reaches the screen.

What still needs a person is the **match**: whether each unit or topic really teaches what the code says. Claude Code chose these from the official lists; Denise or Craig should confirm them and fill in the last two columns. To change a code, edit the unit's `curriculumRefs` (or the topic's `curriculum` in `content/tags.json`); the tests fail if the new code isn't official or doesn't belong to the unit's years.

## Units

| Unit id                        | Years         | AC v9                                  | NSW                                | Checked by | Date |
| ------------------------------ | ------------- | -------------------------------------- | ---------------------------------- | ---------- | ---- |
| alg-01-equals-sign             | Years 7, 8    | AC9M7A03, AC9M8A01                     | MA4-EQU-C-01, MA4-ALG-C-01         |            |      |
| alg-02-simplifying             | Years 7, 8    | AC9M7A02, AC9M8A01                     | MA4-ALG-C-01                       |            |      |
| lin-01-what-a-rule-tells-you   | Years 8, 9    | AC9M8A02, AC9M8A04, AC9M9A03           | MA4-LIN-C-01, MA5-LIN-C-02         |            |      |
| lin-02-table-to-rule           | Years 8, 9    | AC9M8A02, AC9M8A04                     | MA4-LIN-C-01, MA5-LIN-C-01         |            |      |
| lin-03-tables-graphs-rules     | Years 8, 9    | AC9M8A02, AC9M8A04, AC9M9A06           | MA4-LIN-C-01, MA5-LIN-C-02         |            |      |
| lin-04-graphing-errors         | Years 8, 9    | AC9M8A02, AC9M9A03                     | MA4-LIN-C-01, MA5-LIN-C-01         |            |      |
| mc-01-goes-up-by               | Years 8, 9    | AC9M8A04, AC9M9A03                     | MA4-LIN-C-01, MA5-LIN-C-02         |            |      |
| mc-02-pronumerals              | Years 7, 8    | AC9M7A01, AC9M7A02, AC9M8A01           | MA4-ALG-C-01                       |            |      |
| pck-diff-01-three-entry-points | Years 7, 8, 9 | none (teaching approach)               | none                               |            |      |
| pri-number-01                  | Years F, 1, 2 | AC9MFN02, AC9MFN04, AC9M1N02, AC9M2N02 | MAE-CSQ-02, MAE-RWN-01, MA1-CSQ-01 |            |      |
| prop-01-ratio-tables           | Years 7, 8    | AC9M7N08, AC9M8M05                     | MA4-RAT-C-01                       |            |      |
| prop-02-percentages            | Years 7, 8    | AC9M7N06, AC9M7N09, AC9M8N05           | MA4-FRC-C-01                       |            |      |
| prop-03-ratio-vs-fraction      | Years 7, 8    | AC9M7N04, AC9M7N08                     | MA4-RAT-C-01, MA4-FRC-C-01         |            |      |

## Lesson topics

A lesson plan shows the codes for its topic that belong to the lesson's year.

| Topic                      | Years   | AC v9                                                                                    | NSW                                                                  | Checked by | Date |
| -------------------------- | ------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------- | ---- |
| algebra.linear             | 7, 8, 9 | AC9M7A04, AC9M7A05, AC9M8A02, AC9M8A03, AC9M8A04, AC9M9A03, AC9M9A05, AC9M9A06           | MA4-LIN-C-01, MA5-LIN-C-01, MA5-LIN-C-02                             |            |      |
| algebra.foundations        | 7, 8    | AC9M7A01, AC9M7A02, AC9M7A03, AC9M8A01                                                   | MA4-ALG-C-01, MA4-EQU-C-01                                           |            |      |
| number.proportional        | 7, 8    | AC9M7N04, AC9M7N06, AC9M7N08, AC9M7N09, AC9M7M06, AC9M8M05, AC9M8M07, AC9M8N05           | MA4-RAT-C-01, MA4-FRC-C-01                                           |            |      |
| pck.algebra-misconceptions | 7, 8, 9 | AC9M7A01, AC9M7A02, AC9M7A03, AC9M7A05, AC9M8A01, AC9M8A02, AC9M8A04, AC9M9A02, AC9M9A03 | MA4-ALG-C-01, MA4-EQU-C-01, MA4-LIN-C-01, MA5-ALG-C-01, MA5-LIN-C-01 |            |      |
| primary.early-number       | F, 1, 2 | AC9MFN02, AC9MFN04, AC9M1N02, AC9M1N04, AC9M2N02                                         | MAE-CSQ-02, MAE-RWN-01, MA1-CSQ-01, MA1-RWN-02                       |            |      |

## Uncertain matches worth a look

- `algebra.linear` now includes Year 7, because AC v9 starts linear patterns and tables there (AC9M7A04, AC9M7A05). The linear units themselves stay Years 8 and 9.
- `lin-02-table-to-rule` has no Year 9 AC v9 code: AC v9 puts tables to rules in Years 7 and 8, so Year 9 teachers see only the NSW Stage 5 outcome.
- Year 8 proportional reasoning sits in Measurement in AC v9 (AC9M8M05 rates, AC9M8M07 ratios and rates), not Number.
- `alg-01-equals-sign` maps to solving equations (AC9M7A03, MA4-EQU-C-01): AC v9 has no code for the meaning of the equals sign on its own.
- `pck-diff-01-three-entry-points` has no codes, because it is a teaching approach rather than maths content.

## Victoria and WA

Victoria (Victorian Curriculum 2.0) and Western Australia (WA Curriculum) publish their own versions. Until someone adds their codes, teachers in those states see AC v9 codes only, and no placeholder shows.
