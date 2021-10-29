/* eslint-disable jest/no-done-callback */
const request = require('supertest');
const app = require('../../src/app');

const usersToDelete = [];

afterAll(async () => {
  usersToDelete.forEach(async (usr) => {
    // Removes all users created during testing.
    await app.db('users').where({ id: usr.id }).del();
  });
  await new Promise((r) => setTimeout(r, 1000)); // Wait 1 second
});

test('Should create user with signup route', async () => {
  await request(app).post('/auth/signup')
    .send({ name: 'Walter', email: `${Date.now()}@gmail.com`, passwd: '123456' }) // Create a user
    .then((res) => {
      expect(res.status).toBe(201);
      // expect(res.body).toHaveProperty('email');
      // expect(res.body).not.toHaveProperty('passwd');
      // toContainAllKeys assert from jest-extended
      expect(res.body).toContainAnyKeys(['name', 'email']);
      expect(res.body.name).toBe('Walter');
      usersToDelete.push(res.body);
    });
});

test('Should receive token when login', async (done) => {
  const email = `${Date.now()}@gmail.com`;
  await app.services.user.save({ name: 'Joao', email, passwd: '123456' }, ['id']) // Create a user
    .then((userId) => {
      usersToDelete.push(...userId);
      request(app).post('/auth/signin')
        .send({ email, passwd: '123456' })
        .then((res) => {
          expect(res.status).toBe(200);
          expect(res.body).toHaveProperty('token');
        });
    });
  done();
});

test('Should not authenticate the user with the wrong password', async (done) => {
  const email = `${Date.now()}@gmail.com`;
  await app.services.user.save({ name: 'Joao', email, passwd: '123456' }, ['id']) // Create a user
    .then((userId) => {
      usersToDelete.push(...userId);
      request(app).post('/auth/signin')
        .send({ email, passwd: '654321' }) // Senha incorreta
        .then((res) => {
          expect(res.status).toBe(400);
          expect(res.body.error).toBe('Usuário ou senha incorreto.');
        });
    });
  done();
});

test('Should not authenticate the user with invalid email', async (done) => {
  await request(app).post('/auth/signin')
    .send({ email: 'NaoExiste@a.com.br', passwd: '654321' }) // Senha incorreta
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Usuário ou senha incorreto.');
    });
  done();
});

test('Should not access a protected route without token', async () => {
  await request(app).get('/v1/users')
    .then((res) => {
      expect(res.status).toBe(401);
    });
});
