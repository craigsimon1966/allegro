# Curriculum codes to verify

Each unit's AC v9 content descriptions and NSW Mathematics K-10 outcomes, to be looked up by Craig or Denise on the ACARA and NSW Curriculum websites. Claude Code never fills these in.

The review document (`npm run content:export-review`) has a box on each unit for Denise to write the codes. Codes she leaves blank are looked up here. Then replace `AC9-TODO` and `NSW-TODO` in the unit's `curriculumRefs` and fill in the last two columns.

| Unit id                        | Title                                          | AC v9 needed | NSW outcome needed | Verified by | Date |
| ------------------------------ | ---------------------------------------------- | ------------ | ------------------ | ----------- | ---- |
| lin-04-graphing-errors         | Four graphing errors to look for               | Year 8, 9    | Year 8, 9          |             |      |
| prop-03-ratio-vs-fraction      | Ratio or fraction? Part to part, part to whole | Year 7, 8    | Year 7, 8          |             |      |
| alg-01-equals-sign             | The equals sign means "the same as"            | Year 7, 8    | Year 7, 8          |             |      |
| alg-02-simplifying             | Simplifying: collecting like terms             | Year 7, 8    | Year 7, 8          |             |      |
| lin-01-what-a-rule-tells-you   | What a linear rule tells you                   | Year 8, 9    | Year 8, 9          |             |      |
| lin-02-table-to-rule           | From table to rule                             | Year 8, 9    | Year 8, 9          |             |      |
| lin-03-tables-graphs-rules     | One relationship, three pictures               | Year 8, 9    | Year 8, 9          |             |      |
| mc-01-goes-up-by               | "It goes up by 2, so y = x + 2"                | Year 8, 9    | Year 8, 9          |             |      |
| mc-02-pronumerals              | When letters stand for objects                 | Year 7, 8    | Year 7, 8          |             |      |
| pck-diff-01-three-entry-points | One maths task, three entry points             | Year 7, 8, 9 | Year 7, 8, 9       |             |      |
| pri-number-01                  | Early number: subitising and part-part-whole   | Year F, 1, 2 | Year F, 1, 2       |             |      |
| prop-01-ratio-tables           | Ratio tables and the unit rate                 | Year 7, 8    | Year 7, 8          |             |      |
| prop-02-percentages            | Percentages as proportion                      | Year 7, 8    | Year 7, 8          |             |      |

## Victorian and WA placeholders

Teachers who choose Victoria see a "Victorian Curriculum 2.0" row with `VC2-TODO`, and teachers who choose Western Australia see a "WA Curriculum" row with `WA-TODO`. These are placeholders set in `shared/states.ts`, not codes. Queensland, South Australia, Tasmania, the ACT and the NT use AC v9 directly, so they see only the AC v9 row.

| Placeholder | Curriculum                                     | Where to look it up | Verified by | Date |
| ----------- | ---------------------------------------------- | ------------------- | ----------- | ---- |
| VC2-TODO    | Victorian Curriculum F-10 Version 2.0 (VCAA)   | VCAA website        |             |      |
| WA-TODO     | Western Australian Curriculum (SCSA)           | SCSA website        |             |      |

Each unit would need its own Victorian and WA codes, in a new field on `curriculumRefs`, once someone has looked them up.
