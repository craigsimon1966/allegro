import { zipSync } from 'fflate';
import type { Lesson, LessonPack } from '@shared/schemas';
import { LEVEL_NAMES, packLevels } from '@shared/lessonPack';
import {
  docxBlob,
  docxName,
  exitTicketDocument,
  lessonDocument,
  saveBlob,
  worksheetDocument,
} from '@/lib/lessonDocx';

// The lesson pack as files: teacher guide, worksheets, exit tickets and slides, one at a time
// or zipped together. Loaded only when a teacher downloads (Word and PowerPoint builders are big).

export type PackPart = 'guide' | 'worksheets' | 'slides' | 'all';

export interface PackFile {
  name: string;
  blob: Blob;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export async function worksheetFiles(
  lesson: Lesson,
  pack: LessonPack,
  disclosure: string,
): Promise<PackFile[]> {
  const levels = packLevels(pack);
  const files: PackFile[] = [];
  for (const level of levels.length ? levels : (['all'] as const))
    files.push({
      name: docxName(
        lesson,
        level === 'all' ? 'worksheet' : `worksheet-${slug(LEVEL_NAMES[level])}`,
      ),
      blob: await docxBlob(worksheetDocument(lesson, pack, level, disclosure)),
    });
  if (pack.exit_ticket.length)
    files.push({
      name: docxName(lesson, 'exit-tickets'),
      blob: await docxBlob(exitTicketDocument(lesson, pack, disclosure)),
    });
  return files;
}

export async function packFiles(
  part: PackPart,
  lesson: Lesson,
  pack: LessonPack,
  disclosure: string,
  state?: string,
): Promise<PackFile[]> {
  const files: PackFile[] = [];
  if (part === 'guide' || part === 'all')
    files.push({
      name: docxName(lesson, 'teacher-guide'),
      blob: await docxBlob(lessonDocument(lesson, disclosure, state, pack)),
    });
  if (part === 'worksheets' || part === 'all')
    files.push(...(await worksheetFiles(lesson, pack, disclosure)));
  if (part === 'slides' || part === 'all') {
    // PowerPoint is the biggest builder, so it loads only when slides are asked for.
    const { slidesBlob } = await import('@/lib/lessonSlides');
    files.push({
      name: docxName(lesson, 'slides', 'pptx'),
      blob: await slidesBlob(lesson, pack, disclosure),
    });
  }
  return files;
}

/** One file downloads as itself; several download as one zip (browsers block many at once). */
export async function downloadPack(
  part: PackPart,
  lesson: Lesson,
  pack: LessonPack,
  disclosure: string,
  state?: string,
) {
  const files = await packFiles(part, lesson, pack, disclosure, state);
  if (files.length === 1) return saveBlob(files[0]!.blob, files[0]!.name);
  const entries: Record<string, Uint8Array> = {};
  for (const f of files) entries[f.name] = new Uint8Array(await f.blob.arrayBuffer());
  // Word and PowerPoint files are already compressed, so store them as they are.
  const zip = zipSync(entries, { level: 0 });
  saveBlob(
    new Blob([zip], { type: 'application/zip' }),
    docxName(lesson, part === 'all' ? 'lesson-pack' : part, 'zip'),
  );
}
