import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import { app, clearTasks, createTask } from '../src/app';

afterEach(clearTasks);

describe('GET /api/tasks', () => {
  it('returns newest tasks first and supplies a cursor for the next page', async () => {
    const first = createTask({
      title: 'First',
      description: 'First task',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    const second = createTask({
      title: 'Second',
      description: 'Second task',
      createdAt: '2026-01-02T00:00:00.000Z',
    });
    const third = createTask({
      title: 'Third',
      description: 'Third task',
      createdAt: '2026-01-03T00:00:00.000Z',
    });
    const fourth = createTask({
      title: 'Fourth',
      description: 'Fourth task',
      createdAt: '2026-01-04T00:00:00.000Z',
    });
    const fifth = createTask({
      title: 'Fifth',
      description: 'Fifth task',
      createdAt: '2026-01-05T00:00:00.000Z',
    });
    const sixth = createTask({
      title: 'Sixth',
      description: 'Sixth task',
      createdAt: '2026-01-06T00:00:00.000Z',
    });

    const firstPage = await request(app).get('/tasks?limit=5').expect(200);

    expect(firstPage.body.data.map((task: { id: string }) => task.id)).toEqual([
      sixth.id,
      fifth.id,
      fourth.id,
      third.id,
      second.id,
    ]);
    expect(firstPage.body).toMatchObject({ hasMore: true });
    expect(firstPage.body.nextCursor).toBe(Buffer.from(second.id).toString('base64'));

    const secondPage = await request(app)
      .get(`/tasks?cursor=${encodeURIComponent(firstPage.body.nextCursor)}`)
      .expect(200);

    expect(secondPage.body).toMatchObject({
      data: [expect.objectContaining({ id: first.id })],
      nextCursor: null,
      hasMore: false,
    });
  });

  it('rejects invalid pagination parameters', async () => {
    await request(app)
      .get('/api/tasks?limit=101')
      .expect(400)
      .expect({ success: false, error: 'limit must be a positive integer between 1 and 100' });

    await request(app)
      .get('/api/tasks?cursor=not-a-cursor')
      .expect(400)
      .expect({ success: false, error: 'cursor must be a valid task cursor' });
  });
});
