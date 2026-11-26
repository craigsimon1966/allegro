## Queensland, WA and ACT senior maths from uploaded PDFs (27 Nov 2026)

- QCAA, SCSA and BSSS block automated downloads, so Craig downloaded the official syllabus PDFs and `scripts/senior-pdf-import.ts` reads them (with pdftotext) into content/curriculum/senior-maths-pdf.json. The main import script does not touch that file, so rerunning it never drops these states.
- Entries are topic headings named by each document's numbering, with the authority in front so they never clash: "QCAA Unit 4 Topic 1", "SCSA Topic 3.3", "BSSS Unit 2 Topic 1". Units 1 and 2 are Year 11; Units 3 and 4 are Year 12.
- Versions used: QCAA General Mathematics 2025 v1.3 (January 2026); SCSA Mathematics Applications ATAR Year 11 syllabus for teaching from 2026 and Year 12 for teaching from 2027 (Year 12 classes in 2026 still use the earlier version); BSSS Mathematical Applications T, the course document titled "from 2014".
