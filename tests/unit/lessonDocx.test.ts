import { unzipSync, strFromU8 } from 'fflate';
import { Packer } from 'docx';
import { describe, expect, it } from 'vitest';
import { DEMO_LESSON } from '@shared/lesson';
import { docxName, lessonDocument } from '@/lib/lessonDocx';

const NOTICE = 'Drafted by Allegro AI. Please check before using.';

describe('lesson Word download', () => {
  it('builds a valid .docx with the title, every block, the notice and the footer notice', async () => {
    const lesson = DEMO_LESSON.lesson;
    const buf = await Packer.toBuffer(lessonDocument(lesson, NOTICE, 'VIC'));
    const files = unzipSync(new Uint8Array(buf));
    expect(Object.keys(files)).toEqual(
      expect.arrayContaining(['[Content_Types].xml', 'word/document.xml']),
    );
    const doc = strFromU8(files['word/document.xml']!);
    const text = doc.replace(/<[^>]+>/g, '');
    expect(text).toContain(lesson.title);
    expect(text).toContain(NOTICE);
    // Victoria sees AC v9 only (its own codes are not looked up yet), never a placeholder.
    expect(text).toContain('AC v9: AC9M8A02');
    expect(text).not.toContain('TODO');
    expect(text).not.toContain('Victorian Curriculum 2.0');
    for (const b of lesson.blocks) expect(text).toContain(b.title);
    expect(text).not.toContain('$');
    expect(doc).toContain('w:pStyle w:val="Heading2"');
    const footer = Object.keys(files).find((f) => /word\/footer\d*\.xml/.test(f));
    expect(strFromU8(files[footer!]!)).toContain(NOTICE);
  });

  it('names the file from the title', () => {
    expect(
      docxName({ ...DEMO_LESSON.lesson, title: 'Linear rules: tables & graphs', year_level: '8' }),
    ).toBe('linear-rules-tables-graphs-year-8.docx');
  });
});
