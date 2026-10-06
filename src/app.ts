import { randomUUID } from 'node:crypto';
import express, { type NextFunction, type Request, type Response } from 'express';

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

const tasks: Task[] = [];
const maximumLimit = 100;
const defaultLimit = 20;

function encodeCursor(id: string): string {
  return Buffer.from(id, 'utf8').toString('base64');
}

function parseLimit(value: unknown): number {
  if (value === undefined) {
    return defaultLimit;
  }

  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    throw new Error('limit must be a positive integer between 1 and 100');
  }

  const limit = Number(value);
  if (!Number.isSafeInteger(limit) || limit > maximumLimit) {
    throw new Error('limit must be a positive integer between 1 and 100');
  }

  return limit;
}

function parseCursor(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    throw new Error('cursor must be a valid task cursor');
  }

  const id = Buffer.from(value, 'base64').toString('utf8');
  if (!id || encodeCursor(id) !== value) {
    throw new Error('cursor must be a valid task cursor');
  }

  return id;
}

function sortedTasks(): Task[] {
  return [...tasks].sort(
    (first, second) =>
      second.createdAt.localeCompare(first.createdAt) || second.id.localeCompare(first.id),
  );
}

export function createTask(
  input: Pick<Task, 'title' | 'description'> & Partial<Pick<Task, 'status' | 'createdAt'>>,
): Task {
  const now = input.createdAt ?? new Date().toISOString();
  const task: Task = {
    id: randomUUID(),
    title: input.title,
    description: input.description,
    status: input.status ?? 'todo',
    createdAt: now,
    updatedAt: now,
  };
  tasks.push(task);
  return task;
}

export function clearTasks(): void {
  tasks.length = 0;
}

export const app = express();

app.get('/health', (_request, response) => {
  response.json({ success: true });
});

app.get(['/tasks', '/api/tasks'], (request, response, next) => {
  try {
    const limit = parseLimit(request.query.limit);
    const cursor = parseCursor(request.query.cursor);
    const orderedTasks = sortedTasks();
    const startIndex =
      cursor === undefined
        ? 0
        : (() => {
            const index = orderedTasks.findIndex((task) => task.id === cursor);
            if (index === -1) {
              throw new Error('cursor does not reference an existing task');
            }
            return index + 1;
          })();
    const data = orderedTasks.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + data.length < orderedTasks.length;

    response.json({
      success: true,
      data,
      nextCursor: hasMore ? encodeCursor(data[data.length - 1].id) : null,
      hasMore,
    });
  } catch (error) {
    next(error);
  }
});

app.use(
  (error: unknown, _request: Request, response: Response, _next: NextFunction): void => {
    response.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid request parameters',
    });
  },
);
