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
    expect(text).toContain('Victorian Curriculum 2.0');
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

describe('diagrams in the Word download', () => {
  const lesson = DEMO_LESSON.lesson;
  const raw = '{"type":"ten_frame","filled":7}';
  const withVisual = {
    ...lesson,
    blocks: [{ ...lesson.blocks[0]!, content_md: `Count them.\n\n\`\`\`visual\n${raw}\n\`\`\`` }],
  };

  it('embeds the drawn diagram as a picture with alt text', async () => {
    // A 1 x 1 PNG stands in for the browser's drawing.
    const png = Uint8Array.from(
      atob(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      ),
      (c) => c.charCodeAt(0),
    );
    const images = new Map([[raw, { data: png, width: 220, height: 100 }]]);
    const buf = await Packer.toBuffer(lessonDocument(withVisual, NOTICE, 'NSW', images));
    const files = unzipSync(new Uint8Array(buf));
    const doc = strFromU8(files['word/document.xml']!);
    expect(doc).toContain('<w:drawing>');
    expect(doc).toContain('Ten frame with 7 counters.');
    expect(Object.keys(files).some((f) => f.startsWith('word/media/'))).toBe(true);
    expect(doc).not.toContain('```');
  });

  it('falls back to a description when the picture is missing', async () => {
    const buf = await Packer.toBuffer(lessonDocument(withVisual, NOTICE, 'NSW'));
    const doc = strFromU8(unzipSync(new Uint8Array(buf))['word/document.xml']!);
    expect(doc.replace(/<[^>]+>/g, '')).toContain('[Diagram] Ten frame with 7 counters.');
  });
});
