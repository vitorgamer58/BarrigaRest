const request = require('supertest');
const jwt = require('jwt-simple');
const app = require('../../src/app');

const mail = `${Date.now()}@gmail.com`;
let user;

beforeAll(async () => {
  const res = await app.services.user.save({ name: 'User account', email: `${Date.now()}@gmail.com`, passwd: 123456 });
  user = { ...res[0] };
  user.token = jwt.encode(user, 'Segredo!');
});

test('Should list all users', async () => {
  await request(app).get('/users')
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      /* expect(res.body[0]).toHaveProperty('name', 'John Doe'); */
    });
});

test('Should insert user', async () => {
  await request(app).post('/users')
    .send({ name: 'Joao Silva', email: mail, passwd: '123456' })
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Joao Silva');
      expect(res.body).not.toHaveProperty('passwd');
    });
});

test('Should insert encrypted password', async () => {
  const res = await request(app)
    .post('/users')
    .send({ name: 'Joao Silva', email: `${Date.now()}@gmail.com`, passwd: '123456' })
    .set('authorization', `bearer ${user.token}`);
  expect(res.status).toBe(201);
  const { id } = res.body;
  const userDB = await app.services.user.findOne({ id });
  expect(userDB.passwd).not.toBeUndefined();
  expect(userDB.passwd).not.toBe('123456'); // Verifica que a senha está criptografada.
});

test('Should not enter user without name', async () => {
  await request(app).post('/users')
    .send({ email: 'teste@gmail.com', passwd: '123456' })
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Nome é um atributo obrigatório');
    });
});

test('Should not enter user without email', async () => {
  const result = await request(app).post('/users')
    .send({ name: 'Joao Silva', passwd: '123456' })
    .set('authorization', `bearer ${user.token}`);
  expect(result.status).toBe(400);
  expect(result.body.error).toBe('Email é um atributo obrigatório');
});

test('Should not insert user without password', async (done) => {
  await request(app).post('/users')
    .send({ name: 'Joao Silva', email: 'teste@gmail.com' })
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Senha é um atributo obrigatório');
      done(); // Serve para dizer que a requisição está finalizada.
    })
    .catch((err) => done.fail(err));
});

test('Should not enter user with existing email', async (done) => {
  await request(app).post('/users')
    .send({ name: 'Joao Silva', email: mail, passwd: '123456' })
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Já existe um usuário com este email');
      done();
    });
});
