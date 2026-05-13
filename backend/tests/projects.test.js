import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

let token;
let projectId;

beforeAll(async () => {
  // Create a fresh user for project tests
  const res = await request(app)
    .post('/api/auth/signup')
    .send({
      name: 'Project Tester',
      email: `projtest_${Date.now()}@test.com`,
      password: 'ProjTest123',
    });
  token = res.body.data.token;
});

describe('Projects Endpoints', () => {
  describe('POST /api/projects', () => {
    it('should create a project and make user admin', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Project', description: 'For testing' });

      expect(res.status).toBe(201);
      expect(res.body.data.project.name).toBe('Test Project');
      projectId = res.body.data.project.id;
    });

    it('should reject without auth', async () => {
      const res = await request(app)
        .post('/api/projects')
        .send({ name: 'No Auth' });

      expect(res.status).toBe(401);
    });

    it('should reject empty name', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '' });

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/projects', () => {
    it('should list user projects', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.projects.length).toBeGreaterThan(0);
      expect(res.body.data.projects[0].myRole).toBe('ADMIN');
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return project detail with members', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.project.members.length).toBe(1);
      expect(res.body.data.project.myRole).toBe('ADMIN');
    });

    it('should 403 for non-member', async () => {
      // Create another user
      const other = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Outsider',
          email: `outsider_${Date.now()}@test.com`,
          password: 'Outside123',
        });

      const res = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${other.body.data.token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/projects/:id', () => {
    it('should update project name', async () => {
      const res = await request(app)
        .patch(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.data.project.name).toBe('Updated Name');
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete project', async () => {
      // Create a throwaway project to delete
      const create = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'To Delete' });

      const res = await request(app)
        .delete(`/api/projects/${create.body.data.project.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(204);
    });
  });
});
