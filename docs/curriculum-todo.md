# Curriculum codes to check

Every code in Allegro now comes from the official lists in `content/curriculum/` (ACARA's AC v9 Mathematics and NESA's Mathematics K-10 (2022) syllabus), rebuilt with `npm run curriculum:import`. The app checks each code against those lists and the teacher's year (or NSW stage) before it shows, so a made-up or wrong-year code never reaches the screen.

What still needs a person is the **match**: whether each unit or topic really teaches what the code says. Claude Code chose these from the official lists; Denise or Craig should confirm them and fill in the last two columns. To change a code, edit the unit's `curriculumRefs` (or the topic's `curriculum` in `content/tags.json`); the tests fail if the new code isn't official or doesn't belong to the unit's years.

## Units

| Unit id                        | Years            | AC v9                                  | NSW                                | Checked by | Date |
| ------------------------------ | ---------------- | -------------------------------------- | ---------------------------------- | ---------- | ---- |
| alg-01-equals-sign             | Years 7, 8       | AC9M7A03, AC9M8A01                     | MA4-EQU-C-01, MA4-ALG-C-01         |            |      |
| alg-02-simplifying             | Years 7, 8       | AC9M7A02, AC9M8A01                     | MA4-ALG-C-01                       |            |      |
| lin-01-what-a-rule-tells-you   | Years 8, 9       | AC9M8A02, AC9M8A04, AC9M9A03           | MA4-LIN-C-01, MA5-LIN-C-02         |            |      |
| lin-02-table-to-rule           | Years 8, 9       | AC9M8A02, AC9M8A04                     | MA4-LIN-C-01, MA5-LIN-C-01         |            |      |
| lin-03-tables-graphs-rules     | Years 8, 9       | AC9M8A02, AC9M8A04, AC9M9A06           | MA4-LIN-C-01, MA5-LIN-C-02         |            |      |
| lin-04-graphing-errors         | Years 8, 9       | AC9M8A02, AC9M9A03                     | MA4-LIN-C-01, MA5-LIN-C-01         |            |      |
| mc-01-goes-up-by               | Years 8, 9       | AC9M8A04, AC9M9A03                     | MA4-LIN-C-01, MA5-LIN-C-02         |            |      |
| mc-02-pronumerals              | Years 7, 8       | AC9M7A01, AC9M7A02, AC9M8A01           | MA4-ALG-C-01                       |            |      |
| pck-diff-01-three-entry-points | Years 7, 8, 9    | none (teaching approach)               | none                               |            |      |
| pri-data-01                    | Years F, 1, 2    | AC9MFST01, AC9M1ST02, AC9M2ST02        | MAE-DATA-01, MA1-DATA-01           |            |      |
| pri-groups-01                  | Years F, 1, 2    | AC9MFN06, AC9M1N03, AC9M2N05           | MAE-FG-02, MA1-FG-01               |            |      |
| pri-measure-01                 | Years F, 1, 2    | AC9MFM01, AC9M1M02, AC9M2M01           | MAE-GM-02, MA1-GM-02               |            |      |
| pri-shape-01                   | Years F, 1, 2    | AC9MFSP01, AC9M1SP01, AC9M2SP01        | MAE-2DS-01, MA1-2DS-01             |            |      |
| pri-number-01                  | Years F, 1, 2    | AC9MFN02, AC9MFN04, AC9M1N02, AC9M2N02 | MAE-CSQ-02, MAE-RWN-01, MA1-CSQ-01 |            |      |
| pri-attention-01               | Years F, 1, 2    |                                        |                                    |            |      |
| pri-chance-01                  | Years 3, 4, 5, 6 | AC9M3P02, AC9M4P02, AC9M5P01, AC9M6P01 | MA2-CHAN-01, MA3-CHAN-01           |            |      |
| pri-frac-01                    | Years 3, 4, 5, 6 | AC9M3N02, AC9M4N04, AC9M5N03, AC9M6N03 | MA2-PF-01, MA3-RQF-01              |            |      |
| pri-meas-01                    | Years 3, 4, 5, 6 | AC9M4M02, AC9M5M02, AC9M6M02           | MA2-2DS-03, MA3-2DS-02             |            |      |
| pri-mult-01                    | Years 3, 4, 5, 6 | AC9M3N04, AC9M4N06, AC9M5N06           | MA2-MR-01, MA3-MR-01               |            |      |
| pri-pv-01                      | Years 3, 4, 5, 6 | AC9M4N01, AC9M5N01, AC9M6N04           | MA2-RN-02, MA3-RN-02               |            |      |
| pri-routines-01                | Years F, 1, 2    |                                        |                                    |            |      |
| prop-01-ratio-tables           | Years 7, 8       | AC9M7N08, AC9M8M05                     | MA4-RAT-C-01                       |            |      |
| prop-02-percentages            | Years 7, 8       | AC9M7N06, AC9M7N09, AC9M8N05           | MA4-FRC-C-01                       |            |      |
| prop-03-ratio-vs-fraction      | Years 7, 8       | AC9M7N04, AC9M7N08                     | MA4-RAT-C-01, MA4-FRC-C-01         |            |      |
| sec-int-01                     | Years 7, 8       | AC9M7N07, AC9M8N04                     | MA4-INT-C-01                       |            |      |
| sec-meas-01                    | Years 7, 8       | AC9M7M01, AC9M8M01                     | MA4-ARE-C-01                       |            |      |
| sec-stat-01                    | Years 7, 8       | AC9M7ST01                              | MA4-DAT-C-02                       |            |      |

## Lesson topics

A lesson plan shows the codes for its topic that belong to the lesson's year.

| Topic                          | Years       | AC v9                                                                                                                           | NSW                                                                                | Checked by | Date |
| ------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------- | ---- |
| algebra.linear                 | 7, 8, 9, 10 | AC9M7A04, AC9M7A05, AC9M8A02, AC9M8A03, AC9M8A04, AC9M9A03, AC9M9A05, AC9M9A06, AC9M10A02                                       | MA4-LIN-C-01, MA5-LIN-C-01, MA5-LIN-C-02                                           |            |      |
| algebra.foundations            | 7, 8        | AC9M7A01, AC9M7A02, AC9M7A03, AC9M8A01                                                                                          | MA4-ALG-C-01, MA4-EQU-C-01                                                         |            |      |
| number.proportional            | 7, 8        | AC9M7N04, AC9M7N06, AC9M7N08, AC9M7N09, AC9M7M06, AC9M8M05, AC9M8M07, AC9M8N05                                                  | MA4-RAT-C-01, MA4-FRC-C-01                                                         |            |      |
| pck.algebra-misconceptions     | 7, 8, 9     | AC9M7A01, AC9M7A02, AC9M7A03, AC9M7A05, AC9M8A01, AC9M8A02, AC9M8A04, AC9M9A02, AC9M9A03                                        | MA4-ALG-C-01, MA4-EQU-C-01, MA4-LIN-C-01, MA5-ALG-C-01, MA5-LIN-C-01               |            |      |
| primary.early-number           | F, 1, 2     | AC9MFN02, AC9MFN04, AC9M1N02, AC9M1N04, AC9M2N02                                                                                | MAE-CSQ-02, MAE-RWN-01, MA1-CSQ-01, MA1-RWN-02                                     |            |      |
| primary.patterns-groups        | F, 1, 2     | AC9MFA01, AC9MFN06, AC9M1A01, AC9M1A02, AC9M1N03, AC9M1N06, AC9M2A01, AC9M2A03, AC9M2N05                                        | MAE-FG-01, MAE-FG-02, MA1-FG-01                                                    |            |      |
| primary.measurement            | F, 1, 2     | AC9MFM01, AC9MFM02, AC9M1M01, AC9M1M02, AC9M1M03, AC9M2M01, AC9M2M03, AC9M2M04                                                  | MAE-GM-02, MAE-NSM-01, MAE-NSM-02, MA1-GM-02, MA1-NSM-01, MA1-NSM-02               |            |      |
| primary.shape-position         | F, 1, 2     | AC9MFSP01, AC9MFSP02, AC9M1SP01, AC9M1SP02, AC9M2SP01, AC9M2SP02                                                                | MAE-2DS-01, MAE-3DS-01, MAE-GM-01, MA1-2DS-01, MA1-3DS-01, MA1-GM-01               |            |      |
| primary.data                   | F, 1, 2     | AC9MFST01, AC9M1ST01, AC9M1ST02, AC9M2ST01, AC9M2ST02                                                                           | MAE-DATA-01, MA1-DATA-01, MA1-DATA-02                                              |            |      |
| number.place-value             | 3, 4, 5, 6  | AC9M3N01, AC9M3N03, AC9M3N05, AC9M4N01, AC9M4N07, AC9M5N01, AC9M5N08, AC9M6N04, AC9M6N06                                        | MA2-RN-01, MA2-RN-02, MA2-AR-01, MA3-RN-01, MA3-RN-02                              |            |      |
| number.multiplicative          | 3, 4, 5, 6  | AC9M3A03, AC9M3N04, AC9M4A02, AC9M4N05, AC9M4N06, AC9M5A01, AC9M5N02, AC9M5N06, AC9M5N07, AC9M6N02, AC9M6A02                    | MA2-MR-01, MA2-MR-02, MA3-MR-01, MA3-MR-02                                         |            |      |
| number.fractions               | 3, 4, 5, 6  | AC9M3N02, AC9M4N03, AC9M4N04, AC9M5N03, AC9M5N04, AC9M5N05, AC9M6N03, AC9M6N05, AC9M6N07                                        | MA2-PF-01, MA3-RQF-01, MA3-RQF-02, MA3-RN-03                                       |            |      |
| measurement.length-area-angles | 3, 4, 5, 6  | AC9M3M02, AC9M3M05, AC9M4M02, AC9M4M04, AC9M5M02, AC9M5M04, AC9M6M02, AC9M6M04                                                  | MA2-GM-02, MA2-GM-03, MA2-2DS-03, MA3-2DS-02, MA3-2DS-03, MA3-GM-03                |            |      |
| statistics.data-chance         | 3, 4, 5, 6  | AC9M3ST02, AC9M3P01, AC9M4ST01, AC9M4P01, AC9M5ST02, AC9M5P01, AC9M6ST01, AC9M6P01                                              | MA2-DATA-01, MA2-DATA-02, MA2-CHAN-01, MA3-DATA-01, MA3-DATA-02, MA3-CHAN-01       |            |      |
| number.integers                | 7, 8        | AC9M7N07, AC9M8N04                                                                                                              | MA4-INT-C-01                                                                       |            |      |
| measurement.area-volume-angles | 7, 8        | AC9M7M01, AC9M7M02, AC9M7M03, AC9M7M04, AC9M7M05, AC9M8M01, AC9M8M02, AC9M8M03, AC9M8M06                                        | MA4-ARE-C-01, MA4-VOL-C-01, MA4-LEN-C-01, MA4-ANG-C-01, MA4-PYT-C-01               |            |      |
| statistics.probability         | 7, 8, 9, 10 | AC9M7ST01, AC9M7ST02, AC9M7P01, AC9M8ST02, AC9M8P01, AC9M8P02, AC9M9ST03, AC9M9P01, AC9M9P02, AC9M10ST02, AC9M10ST03, AC9M10P01 | MA4-DAT-C-01, MA4-DAT-C-02, MA4-PRO-C-01, MA5-DAT-C-01, MA5-DAT-C-02, MA5-PRO-C-01 |            |      |
| algebra.techniques             | 9, 10       | AC9M9A01, AC9M9A02, AC9M10A01                                                                                                   | MA5-ALG-C-01, MA5-IND-C-01, MA5-EQU-C-01                                           |            |      |
| algebra.non-linear             | 9, 10       | AC9M9A04, AC9M9A06, AC9M10A03, AC9M10A04                                                                                        | MA5-NLI-C-01, MA5-NLI-C-02                                                         |            |      |
| measurement.trigonometry       | 9, 10       | AC9M9M03, AC9M9SP01, AC9M10M03                                                                                                  | MA5-TRG-C-01, MA5-TRG-C-02                                                         |            |      |

## Uncertain matches worth a look

- New topics (26 Nov): `measurement.area-volume-angles` includes Pythagoras for Year 8 only (AC9M8M06); Year 9 Pythagoras sits in `measurement.trigonometry` (AC9M9M03). `number.multiplicative` uses AC9M6N02 (primes, composites, squares) and AC9M6A02 (equations with brackets) for Year 6, because AC v9 has no plain Year 6 multiplication code.

- `algebra.linear` now includes Year 7, because AC v9 starts linear patterns and tables there (AC9M7A04, AC9M7A05). The linear units themselves stay Years 8 and 9.
- `lin-02-table-to-rule` has no Year 9 AC v9 code: AC v9 puts tables to rules in Years 7 and 8, so Year 9 teachers see only the NSW Stage 5 outcome.
- Year 8 proportional reasoning sits in Measurement in AC v9 (AC9M8M05 rates, AC9M8M07 ratios and rates), not Number.
- `alg-01-equals-sign` maps to solving equations (AC9M7A03, MA4-EQU-C-01): AC v9 has no code for the meaning of the equals sign on its own.
- `pck-diff-01-three-entry-points` has no codes, because it is a teaching approach rather than maths content.

## Victoria and WA

Victoria (Victorian Curriculum 2.0) and Western Australia (WA Curriculum) publish their own versions. Until someone adds their codes, teachers in those states see AC v9 codes only, and no placeholder shows.
