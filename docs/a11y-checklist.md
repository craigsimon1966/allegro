# Accessibility checklist (manual pass before the pilot)

Automated: axe runs on every route at phone and laptop sizes in `npm run e2e`. Rows marked "Pre-checked" also have an automated test in `tests/e2e/a11y.spec.ts` (25 Nov 2026), so a quick look is enough. This file is for the checks a person has to do (TECH_SPEC 11). Write the date, who checked, and Pass or a note.

| Check                                                                                       | Device and tool            | Date | Who | Result                                                               |
| ------------------------------------------------------------------------------------------- | -------------------------- | ---- | --- | -------------------------------------------------------------------- |
| Keyboard only: Tammy demo from / to /reflect, every control reachable, focus always visible | Laptop, Chrome             |      |     |                                                                      |
| Keyboard only: sign in, /start, /needs, /pathway                                            | Laptop, Chrome             |      |     |                                                                      |
| Skip link goes to main content on every screen                                              | Laptop, Chrome             |      |     | Pre-checked: first Tab is the skip link, Enter moves focus into main |
| VoiceOver: Tammy demo loop, headings and landmarks make sense                               | iPad, Safari               |      |     |                                                                      |
| VoiceOver: maths reads sensibly in a unit (KaTeX)                                           | iPad, Safari               |      |     |                                                                      |
| VoiceOver: lesson block edit, redo and reorder announce what changed                        | iPad, Safari               |      |     |                                                                      |
| NVDA: Tammy demo loop                                                                       | Windows, Chrome or Firefox |      |     |                                                                      |
| NVDA: growth chart table read as the text alternative                                       | Windows                    |      |     |                                                                      |
| NVDA: errors (student-name warning, AI down, rate limit) announced                          | Windows                    |      |     |                                                                      |
| iPad portrait and landscape layouts                                                         | iPad                       |      |     |                                                                      |
| Chromebook layout (1366 x 768) and touchpad use                                             | Chromebook                 |      |     | Pre-checked: no sideways scroll at 1366 x 768; touchpad still to try |
| 200% zoom: no lost content or sideways scrolling                                            | Laptop                     |      |     | Pre-checked: no sideways scroll at 320px on 9 screens                |
| Reduced motion: loading mark doesn't animate                                                | Laptop, OS setting         |      |     | Pre-checked: animation is none with reduced motion                   |
| Print: lesson prints on 2 A4 pages and is readable in greyscale                             | Any                        |      |     |                                                                      |
