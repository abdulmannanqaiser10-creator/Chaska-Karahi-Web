import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { uploadedImages } from '@/db/schema';
import { HttpError, jsonError } from '@/lib/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

/** Public and cache-immutable: the URL embeds a uuid, so the bytes never change at that path. */
export async function GET(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      throw new HttpError(404, 'Image not found.');
    }
    const [row] = await db
      .select({ data: uploadedImages.data, contentType: uploadedImages.contentType })
      .from(uploadedImages)
      .where(eq(uploadedImages.id, id));
    if (!row) throw new HttpError(404, 'Image not found.');

    // Stored as base64 text (drizzle's pg columns have no bytea type), decoded on the way out.
    return new NextResponse(new Uint8Array(Buffer.from(row.data, 'base64')), {
      headers: {
        'content-type': row.contentType,
        'cache-control': 'public, max-age=31536000, immutable',
        etag: `"${id}"`,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
