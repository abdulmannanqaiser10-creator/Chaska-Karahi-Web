import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function jsonError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Please check the highlighted fields.',
        message: 'Please check the highlighted fields.',
        issues: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      },
      { status: 422 },
    );
  }
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: 'Authentication required.', message: 'Authentication required.' }, { status: 401 });
  }
  if (error instanceof ConflictError) {
    return NextResponse.json({ error: error.message, message: error.message }, { status: 409 });
  }
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message, message: error.message }, { status: error.status });
  }
  console.error('[api] unhandled error', error);
  return NextResponse.json(
    { error: 'Something went wrong. Please try again.', message: 'Something went wrong. Please try again.' },
    { status: 500 },
  );
}

export class UnauthorizedError extends Error {
  constructor(message = 'Authentication required.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

/** Wraps a handler so thrown errors always become a structured JSON response. */
export function route(handler: () => Promise<Response>) {
  return handler().catch(jsonError);
}

/**
 * Unique-violation probe. Drizzle wraps the driver error in DrizzleQueryError, so the
 * Postgres code lives on `cause` — checking only the top-level object misses it and
 * turns an expected conflict into a 500.
 */
export function isUniqueViolation(error: unknown) {
  return pgErrorCode(error, '23505');
}

export function pgErrorCode(error: unknown, code: string): boolean {
  return pgErrorValue(error, 'code') === code;
}

/**
 * A rejected size pair has to say so — the generic slug message would send the admin
 * looking for a name clash that does not exist.
 */
export function isDuplicateSizeRow(error: unknown) {
  return pgErrorValue(error, 'constraint') === 'products_group_size_key';
}

function pgErrorValue(error: unknown, key: 'code' | 'constraint'): string | undefined {
  let current = error;
  for (let depth = 0; current && depth < 4; depth += 1) {
    const value = (current as Record<string, unknown>)[key];
    if (typeof value === 'string') return value;
    current = (current as { cause?: unknown }).cause;
  }
  return undefined;
}
