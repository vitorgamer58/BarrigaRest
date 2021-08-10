const request = require('supertest');

const app = require('../../src/app');

const mail = `${Date.now()}@gmail.com`;

test('Should list all users', async () => {
  await request(app).get('/users')
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      /* expect(res.body[0]).toHaveProperty('name', 'John Doe'); */
    });
});

test('Should insert user', async () => {
  await request(app).post('/users')
    .send({ name: 'Joao Silva', email: mail, passwd: '123456' })
    .then((res) => {
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Joao Silva');
    });
});

test('Should not enter user without name', async () => {
  await request(app).post('/users')
    .send({ email: 'teste@gmail.com', passwd: '123456' })
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Nome é um atributo obrigatório');
    });
});

test('Should not enter user without email', async () => {
  const result = await request(app).post('/users')
    .send({ name: 'Joao Silva', passwd: '123456' });
  expect(result.status).toBe(400);
  expect(result.body.error).toBe('Email é um atributo obrigatório');
});

test('Should not insert user without password', async (done) => {
  await request(app).post('/users')
    .send({ name: 'Joao Silva', email: 'teste@gmail.com' })
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Senha é um atributo obrigatório');
      done(); // Serve para dizer que a requisição está finalizada.
    })
    .catch((err) => done.fail(err));
});

test('Should not enter user with existing email', async () => {
  await request(app).post('/users')
    .send({ name: 'Joao Silva', email: mail, passwd: '123456' })
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Já existe um usuário com este email');
    });
});
