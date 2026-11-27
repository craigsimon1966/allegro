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
| sec-expand-01                  | Years 9, 10      | AC9M9A02, AC9M10A01                    | MA5-ALG-C-01                       |            |      |
| sec-nonlin-01                  | Years 9, 10      | AC9M10A03, AC9M10A04                   | MA5-NLI-C-01, MA5-NLI-C-02         |            |      |
| sec-trig-01                    | Years 9, 10      | AC9M9SP01, AC9M9M03, AC9M10M03         | MA5-TRG-C-01                       |            |      |
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

## NSW Mathematics Standard 11-12 (Stage 6)

Imported from the NESA Mathematics Standard 11-12 (2024) outcomes page by `scripts/curriculum-import.ts` (25 outcomes, MST codes). Year 12 topics list both Standard 1 (S1) and Standard 2 (S2) outcomes. These topics have no AC v9 codes, because AC v9 stops at Year 10.

| Topic                 | Years  | NSW Stage 6 outcomes                                                            |
| --------------------- | ------ | ------------------------------------------------------------------------------- |
| senior.algebra-linear | 11, 12 | MST-11-01, MST-11-02, MST-12-S1-01, MST-12-S2-01                                |
| senior.financial      | 11, 12 | MST-11-03, MST-11-04, MST-12-S1-02, MST-12-S1-03, MST-12-S2-02, MST-12-S2-03    |
| senior.measurement    | 11, 12 | MST-11-05, MST-11-06, MST-12-S1-04, MST-12-S1-05, MST-12-S2-04, MST-12-S2-05    |
| senior.statistics     | 11, 12 | MST-11-08, MST-12-S1-06, MST-12-S1-07, MST-12-S2-08, MST-12-S2-09, MST-12-S2-10 |
| senior.networks       | 11, 12 | MST-11-07, MST-12-S2-06, MST-12-S2-07                                           |

Senior units (Draft, 26 Nov): sen-fin-01 (MST-11-03, MST-12-S1-02, MST-12-S2-02), sen-lin-01 (MST-11-02, MST-12-S1-01, MST-12-S2-01), sen-meas-01 (MST-12-S2-04), sen-stat-01 (MST-11-08, MST-12-S1-06, MST-12-S2-08), sen-net-01 (MST-12-S2-07). Worth a check: sen-meas-01 covers the sine and cosine rules, which sit in Standard 2 only.

## SACE and TASC General Mathematics (SA, NT and Tasmania)

Imported by `scripts/curriculum-import.ts` from the SACE Stage 1 and Stage 2 General Mathematics subject outlines and the TASC General Mathematics Level 2 (MTG215123) and Level 3 (MTG315123) course pages. These documents have no outcome codes, so each entry uses the document's own numbering, such as "Stage 2 Subtopic 4.1" or "MTG315123 Outcome 7". Stage 1 and Level 2 are treated as Year 11; Stage 2 and Level 3 as Year 12. TASC outcomes 1 to 4 (communication, planning, reasoning, technology) apply to every topic, so no topic lists them.

| Topic                 | SACE                                         | TASC                        |
| --------------------- | -------------------------------------------- | --------------------------- |
| senior.algebra-linear | Stage 1 5.1, 5.2; Stage 2 1.1, 1.2           | MTG215123 5, 6; MTG315123 6 |
| senior.financial      | Stage 1 1.1 to 1.4; Stage 2 4.1, 4.2         | MTG215123 6; MTG315123 7    |
| senior.measurement    | Stage 1 2.1 to 2.4, 4.1 to 4.4               | MTG215123 8; MTG315123 8    |
| senior.statistics     | Stage 1 3.1 to 3.5; Stage 2 3.1, 3.2         | MTG215123 7; MTG315123 5    |
| senior.networks       | Stage 1 6.1, 6.2; Stage 2 2.1, 2.2, 5.1, 5.2 | MTG215123 5 (matrices)      |

Worth a check: SACE Stage 2 has no measurement topic, so SA and NT Year 12 teachers see four topics. TASC Level 3 has no networks content, so Tasmanian Year 12 teachers see four topics.

## QCAA, SCSA and BSSS (Queensland, WA and the ACT)

Read from the official syllabus PDFs by `scripts/senior-pdf-import.ts` (see decisions.d/senior-qld-wa-act.md). Topic-level entries only.

| Topic                 | QCAA                            | SCSA          | BSSS                |
| --------------------- | ------------------------------- | ------------- | ------------------- |
| senior.algebra-linear | U1 T4, T5; U2 T1; U3 T4         | 1.2, 2.3, 3.2 | U1 T2; U2 T3; U3 T2 |
| senior.financial      | U1 T1; U4 T1, T2                | 1.1, 4.2      | U1 T1; U4 T2        |
| senior.measurement    | U1 T2, T3; U2 T2; U3 T5         | 1.3, 2.2      | U1 T3; U2 T2        |
| senior.statistics     | U2 T4, T5; U3 T1, T2, T3        | 2.1, 3.1, 4.1 | U2 T1; U3 T1; U4 T1 |
| senior.networks       | U2 T3 (matrices); U4 T3, T4, T5 | 1.2, 3.3, 4.3 | U1 T2; U3 T3; U4 T3 |

Worth a check: the BSSS course document is titled "from 2014"; confirm it is still the current accredited version. SCSA and BSSS Year 12 have no measurement topic, so those teachers see four Year 12 topics.

## Victoria and WA

Victorian Curriculum 2.0 codes (VCAA) and WA Curriculum entries (SCSA) were added on 27 Nov 2026 from the official Word documents (see docs/vic-wa-curriculum-source.md and decisions.d/vic-wa-curriculum.md). The WA document has no codes, so WA entries are named by year and sub-strand; below, "Y8" means Year 8 and "PP" means Pre-primary. Victorian codes were matched from each unit's AC v9 codes; WA entries were chosen by sub-strand. Both are Draft until a person confirms the match.

### Units

| Unit id                      | Years      | Victorian Curriculum 2.0                         | WA Curriculum                                                                                                             | Checked by | Date |
| ---------------------------- | ---------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ---------- | ---- |
| alg-01-equals-sign           | 7, 8       | VC2M7A03, VC2M8A01                               | Y7 Linear and non-linear equations and inequalities; Y8 Linear and non-linear equations and inequalities                  |            |      |
| alg-02-simplifying           | 7, 8       | VC2M7A02, VC2M8A01                               | Y7 Algebraic techniques; Y8 Algebraic techniques                                                                          |            |      |
| lin-01-what-a-rule-tells-you | 8, 9       | VC2M8A02, VC2M8A05, VC2M9A03, VC2M9A04           | Y8 Linear and non-linear patterns and relationships; Y9 Linear and non-linear patterns and relationships                  |            |      |
| lin-02-table-to-rule         | 8, 9       | VC2M8A02, VC2M8A05                               | Y8 Linear and non-linear patterns and relationships; Y9 Linear and non-linear patterns and relationships                  |            |      |
| lin-03-tables-graphs-rules   | 8, 9       | VC2M8A02, VC2M8A05, VC2M9A07                     | Y8 Linear and non-linear patterns and relationships; Y9 Linear and non-linear patterns and relationships                  |            |      |
| lin-04-graphing-errors       | 8, 9       | VC2M8A02, VC2M9A03, VC2M9A04                     | Y8 Linear and non-linear patterns and relationships; Y9 Linear and non-linear patterns and relationships                  |            |      |
| mc-01-goes-up-by             | 8, 9       | VC2M8A05, VC2M9A03, VC2M9A04                     | Y8 Linear and non-linear patterns and relationships; Y9 Linear and non-linear patterns and relationships                  |            |      |
| mc-02-pronumerals            | 7, 8       | VC2M7A01, VC2M7A02, VC2M8A01                     | Y7 Algebraic techniques; Y8 Algebraic techniques                                                                          |            |      |
| pri-chance-01                | 3, 4, 5, 6 | VC2M3P02, VC2M4P02, VC2M5P01, VC2M6P01           | Y3 Probability; Y4 Probability; Y5 Probability; Y6 Probability                                                            |            |      |
| pri-data-01                  | F, 1, 2    | VC2MFST01, VC2M1ST02, VC2M2ST02                  | PP Statistics; Y1 Statistics; Y2 Statistics                                                                               |            |      |
| pri-frac-01                  | 3, 4, 5, 6 | VC2M3N03, VC2M4N04, VC2M5N03, VC2M6N03           | Y3 Understanding number; Y4 Understanding number; Y5 Understanding number; Y6 Understanding number                        |            |      |
| pri-groups-01                | F, 1, 2    | VC2MFN06, VC2M1N03, VC2M2N05                     | PP Understanding number; Y1 Understanding number; Y2 Understanding number                                                 |            |      |
| pri-meas-01                  | 3, 4, 5, 6 | VC2M4M02, VC2M5M02, VC2M6M02                     | Y4 Two-dimensional space and structures; Y5 Two-dimensional space and structures; Y6 Two-dimensional space and structures |            |      |
| pri-measure-01               | F, 1, 2    | VC2MFM01, VC2M1M02, VC2M2M01                     | PP Two-dimensional space and structures; Y1 Two-dimensional space and structures; Y2 Two-dimensional space and structures |            |      |
| pri-mult-01                  | 3, 4, 5, 6 | VC2M3N05, VC2M4N06, VC2M5N06                     | Y3 Understanding number; Y4 Calculating with number; Y5 Calculating with number                                           |            |      |
| pri-number-01                | F, 1, 2    | VC2MFN02, VC2MFN04, VC2M1N02, VC2M2N02           | PP Understanding number; Y1 Understanding number; Y2 Understanding number                                                 |            |      |
| pri-pv-01                    | 3, 4, 5, 6 | VC2M4N01, VC2M5N01, VC2M6N04                     | Y4 Understanding number; Y5 Understanding number; Y6 Understanding number                                                 |            |      |
| pri-shape-01                 | F, 1, 2    | VC2MFSP01, VC2M1SP01, VC2M2SP01                  | PP Two-dimensional space and structures; Y1 Two-dimensional space and structures; Y2 Two-dimensional space and structures |            |      |
| prop-01-ratio-tables         | 7, 8       | VC2M7N09, VC2M8M05                               | Y7 Understanding number; Y8 Understanding number                                                                          |            |      |
| prop-02-percentages          | 7, 8       | VC2M7N06, VC2M7N07, VC2M7N10, VC2M8N05, VC2M8N06 | Y7 Calculating with number; Y8 Calculating with number                                                                    |            |      |
| prop-03-ratio-vs-fraction    | 7, 8       | VC2M7N03, VC2M7N09                               | Y7 Understanding number                                                                                                   |            |      |
| sec-expand-01                | 9, 10      | VC2M9A02, VC2M10A01, VC2M10A02, VC2M10A04        | Y9 Algebraic techniques; Y10 Algebraic techniques                                                                         |            |      |
| sec-int-01                   | 7, 8       | VC2M7N08, VC2M8N04                               | Y7 Understanding number; Y7 Calculating with number; Y8 Understanding number; Y8 Calculating with number                  |            |      |
| sec-meas-01                  | 7, 8       | VC2M7M01, VC2M8M01                               | Y7 Two-dimensional space and structures; Y8 Two-dimensional space and structures                                          |            |      |
| sec-nonlin-01                | 9, 10      | VC2M10A11, VC2M10A14, VC2M10A15                  | Y10 Linear and non-linear patterns and relationships                                                                      |            |      |
| sec-stat-01                  | 7, 8       | VC2M7ST01                                        | Y7 Probability and statistics                                                                                             |            |      |
| sec-trig-01                  | 9, 10      | VC2M9SP01, VC2M9M03, VC2M10M03                   | Y9 Two-dimensional space and structures; Y10 Two-dimensional space and structures                                         |            |      |

### Lesson topics

| Topic                          | Years       | Victorian Curriculum 2.0                                                                                                        | WA Curriculum                                                                                                                                                                                                                                                                                                                                  | Checked by | Date |
| ------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---- |
| algebra.linear                 | 7, 8, 9, 10 | VC2M7A04, VC2M7A05, VC2M8A02, VC2M8A03, VC2M8A05, VC2M9A03, VC2M9A04, VC2M9A06, VC2M9A07, VC2M10A08, VC2M10A09                  | Y7 Linear and non-linear patterns and relationships; Y8 Linear and non-linear patterns and relationships; Y8 Linear and non-linear equations and inequalities; Y9 Linear and non-linear patterns and relationships; Y10 Linear and non-linear equations and inequalities                                                                       |            |      |
| algebra.foundations            | 7, 8        | VC2M7A01, VC2M7A02, VC2M7A03, VC2M8A01                                                                                          | Y7 Algebraic techniques; Y7 Linear and non-linear equations and inequalities; Y8 Algebraic techniques; Y8 Linear and non-linear equations and inequalities                                                                                                                                                                                     |            |      |
| number.proportional            | 7, 8        | VC2M7N03, VC2M7N06, VC2M7N07, VC2M7N09, VC2M7N10, VC2M7M06, VC2M8M05, VC2M8M07, VC2M8N05, VC2M8N06                              | Y7 Understanding number; Y7 Calculating with number; Y8 Understanding number; Y8 Calculating with number                                                                                                                                                                                                                                       |            |      |
| pck.algebra-misconceptions     | 7, 8, 9     | VC2M7A01, VC2M7A02, VC2M7A03, VC2M7A05, VC2M8A01, VC2M8A02, VC2M8A05, VC2M9A02, VC2M9A03, VC2M9A04                              | Y7 Algebraic techniques; Y7 Linear and non-linear equations and inequalities; Y7 Linear and non-linear patterns and relationships; Y8 Algebraic techniques; Y8 Linear and non-linear patterns and relationships; Y9 Algebraic techniques; Y9 Linear and non-linear patterns and relationships                                                  |            |      |
| primary.early-number           | F, 1, 2     | VC2MFN02, VC2MFN04, VC2M1N02, VC2M1N04, VC2M2N02                                                                                | PP Understanding number; Y1 Understanding number; Y1 Calculating with number; Y2 Understanding number; Y2 Calculating with number                                                                                                                                                                                                              |            |      |
| primary.patterns-groups        | F, 1, 2     | VC2MFA01, VC2MFN06, VC2M1A01, VC2M1A02, VC2M1N03, VC2M1N06, VC2M2A01, VC2M2A03, VC2M2N05                                        | PP Patterns and relationships; PP Understanding number; Y1 Patterns and relationships; Y1 Understanding number; Y2 Patterns and relationships; Y2 Understanding number                                                                                                                                                                         |            |      |
| primary.measurement            | F, 1, 2     | VC2MFM01, VC2MFM02, VC2M1M01, VC2M1M02, VC2M1M03, VC2M2M01, VC2M2M03, VC2M2M04                                                  | PP Two-dimensional space and structures; PP Three-dimensional space and structures; PP Non-spatial measurement; Y1 Two-dimensional space and structures; Y1 Three-dimensional space and structures; Y1 Non-spatial measurement; Y2 Two-dimensional space and structures; Y2 Three-dimensional space and structures; Y2 Non-spatial measurement |            |      |
| primary.shape-position         | F, 1, 2     | VC2MFSP01, VC2MFSP02, VC2M1SP01, VC2M1SP02, VC2M2SP01, VC2M2SP02                                                                | PP Two-dimensional space and structures; PP Three-dimensional space and structures; Y1 Two-dimensional space and structures; Y1 Three-dimensional space and structures; Y2 Two-dimensional space and structures; Y2 Three-dimensional space and structures                                                                                     |            |      |
| primary.data                   | F, 1, 2     | VC2MFST01, VC2M1ST01, VC2M1ST02, VC2M2ST01, VC2M2ST02                                                                           | PP Statistics; Y1 Statistics; Y2 Statistics                                                                                                                                                                                                                                                                                                    |            |      |
| number.place-value             | 3, 4, 5, 6  | VC2M3N02, VC2M3N04, VC2M3N06, VC2M4N01, VC2M4N07, VC2M5N01, VC2M5N08, VC2M6N04, VC2M6N06                                        | Y3 Understanding number; Y3 Calculating with number; Y4 Understanding number; Y4 Calculating with number; Y5 Understanding number; Y5 Calculating with number; Y6 Understanding number; Y6 Calculating with number                                                                                                                             |            |      |
| number.multiplicative          | 3, 4, 5, 6  | VC2M3A03, VC2M3N05, VC2M4A02, VC2M4N05, VC2M4N06, VC2M5A01, VC2M5N02, VC2M5N06, VC2M5N07, VC2M6N02, VC2M6A02                    | Y3 Understanding number; Y4 Understanding number; Y4 Calculating with number; Y5 Understanding number; Y5 Calculating with number; Y6 Understanding number; Y6 Calculating with number; Y6 Understanding equalities and inequalities                                                                                                           |            |      |
| number.fractions               | 3, 4, 5, 6  | VC2M3N03, VC2M4N03, VC2M4N04, VC2M5N03, VC2M5N04, VC2M5N05, VC2M6N03, VC2M6N05, VC2M6N07                                        | Y3 Understanding number; Y4 Understanding number; Y5 Understanding number; Y5 Calculating with number; Y6 Understanding number; Y6 Calculating with number                                                                                                                                                                                     |            |      |
| measurement.length-area-angles | 3, 4, 5, 6  | VC2M3M02, VC2M3M05, VC2M4M02, VC2M4M04, VC2M5M02, VC2M5M04, VC2M6M02, VC2M6M04                                                  | Y3 Two-dimensional space and structures; Y4 Two-dimensional space and structures; Y5 Two-dimensional space and structures; Y6 Two-dimensional space and structures                                                                                                                                                                             |            |      |
| statistics.data-chance         | 3, 4, 5, 6  | VC2M3ST02, VC2M3P01, VC2M4ST01, VC2M4P01, VC2M5ST02, VC2M5P01, VC2M6ST01, VC2M6P01                                              | Y3 Statistics; Y3 Probability; Y4 Statistics; Y4 Probability; Y5 Statistics; Y5 Probability; Y6 Statistics; Y6 Probability                                                                                                                                                                                                                     |            |      |
| number.integers                | 7, 8        | VC2M7N08, VC2M8N04                                                                                                              | Y7 Understanding number; Y7 Calculating with number; Y8 Understanding number; Y8 Calculating with number                                                                                                                                                                                                                                       |            |      |
| measurement.area-volume-angles | 7, 8        | VC2M7M01, VC2M7M02, VC2M7M03, VC2M7M04, VC2M7M05, VC2M8M01, VC2M8M02, VC2M8M03, VC2M8M06                                        | Y7 Two-dimensional space and structures; Y7 Three-dimensional space and structures; Y8 Two-dimensional space and structures; Y8 Three-dimensional space and structures                                                                                                                                                                         |            |      |
| statistics.probability         | 7, 8, 9, 10 | VC2M7ST01, VC2M7ST02, VC2M7P01, VC2M8ST02, VC2M8P01, VC2M8P02, VC2M9ST03, VC2M9P01, VC2M9P02, VC2M10ST01, VC2M10ST02, VC2M10P01 | Y7 Probability and statistics; Y8 Probability and statistics; Y9 Probability and statistics; Y10 Probability and statistics                                                                                                                                                                                                                    |            |      |
| algebra.techniques             | 9, 10       | VC2M9A01, VC2M9A02, VC2M10A01, VC2M10A02, VC2M10A04                                                                             | Y9 Algebraic techniques; Y9 Linear and non-linear equations and inequalities; Y10 Algebraic techniques; Y10 Linear and non-linear equations and inequalities                                                                                                                                                                                   |            |      |
| algebra.non-linear             | 9, 10       | VC2M9A05, VC2M9A07, VC2M10A11, VC2M10A14, VC2M10A15                                                                             | Y9 Linear and non-linear patterns and relationships; Y9 Linear and non-linear equations and inequalities; Y10 Linear and non-linear patterns and relationships; Y10 Linear and non-linear equations and inequalities                                                                                                                           |            |      |
| measurement.trigonometry       | 9, 10       | VC2M9M03, VC2M9SP01, VC2M10M03                                                                                                  | Y9 Two-dimensional space and structures; Y10 Two-dimensional space and structures                                                                                                                                                                                                                                                              |            |      |

### Worth a look

- Victorian Curriculum 2.0 splits some AC v9 descriptions in two, so a few units carry two Victorian codes for one AC v9 code: Year 7 percentages (VC2M7N06, VC2M7N07), Year 8 percentages (VC2M8N05, VC2M8N06), Year 9 linear graphs (VC2M9A03, VC2M9A04), and Year 10 algebra (VC2M10A01, A02 and A04; A08 and A09; A11 and A14).
- WA entries cover a whole sub-strand for a year, so they are broader than a single code. For example `pri-measure-01` (length) uses the two-dimensional space sub-strand, which is where WA puts length.
- WA optional Year 9 and 10 content is not included, so a WA Year 10 non-linear lesson sees only the mandated quadratic and exponential content.
