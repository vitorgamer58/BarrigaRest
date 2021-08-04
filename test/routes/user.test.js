const request = require('supertest');

const app = require('../../src/app');

test.only('Should list all users', async () => {
  await request(app).get('/users')
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      /* expect(res.body[0]).toHaveProperty('name', 'John Doe'); */
    });
});

test.only('Should insert user', async () => {
  const mail = `${Date.now()}@gmail.com`;
  await request(app).post('/users')
    .send({ name: 'Joao Silva', email: mail, passwd: '123456' })
    .then((res) => {
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Joao Silva');
    });
});
