const request = require('supertest');
const jwt = require('jwt-simple');
const app = require('../../src/app');

const MAIN_ROUTE = '/v1/accounts';
let user;
let user2;
let user3;

beforeAll(async () => {
  const res = await app.services.user.save({ name: 'User account', email: `${Date.now()}@gmail.com`, passwd: 123456 });
  user = { ...res[0] };
  user.token = jwt.encode(user, 'Segredo!');
  const res2 = await app.services.user.save({ name: 'User account #2', email: `${Date.now()}@gmail.com`, passwd: 123456 });
  user2 = { ...res2[0] };
  const res3 = await app.services.user.save({ name: 'User account #3', email: `${Date.now()}@gmail.com`, passwd: 123456 });
  user3 = { ...res3[0] };
  user3.token = jwt.encode(user3, 'Segredo!');
});

test('Should insert an account with sucess', async () => {
  await request(app).post(MAIN_ROUTE)
    .send({ name: 'Account 2' })
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Account 2');
    });
});

test('Should not insert an accout without name', async () => {
  await request(app).post(MAIN_ROUTE)
    .send({})
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Nome é um atributo obrigatório');
    });
});

test('Should not insert an account with duplicated name for the same user', async () => {
  await app.db('accounts').insert({ name: 'Acc duplicada', user_id: user.id })
    .then(() => request(app).post(MAIN_ROUTE)
      .set('authorization', `bearer ${user.token}`)
      .send({ name: 'Acc duplicada' }))
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Já existe uma conta com esse nome');
    });
});

test('Should list only accounts of current user', () => app.db('accounts').insert([
  { name: 'Acc User #1', user_id: user3.id },
  { name: 'Acc User #2', user_id: user2.id }
]).then(() => request(app).get(MAIN_ROUTE)
  .set('authorization', `bearer ${user3.token}`)
  .then((res) => {
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('Acc User #1');
  })));

test('Should not return an account of another user', async () => {
  await app.db('accounts')
    .insert({ name: 'Acc User #2', user_id: user2.id }, ['id'])
    .then((acc) => request(app).get(`${MAIN_ROUTE}/${acc[0].id}`)
      .set('authorization', `bearer ${user.token}`))
    .then((res) => {
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Não autorizado');
    });
});

test('Should not remove an account of another user', async () => {
  await app.db('accounts')
    .insert({ name: 'Acc User #2', user_id: user2.id }, ['id'])
    .then((acc) => request(app).put(`${MAIN_ROUTE}/${acc[0].id}`)
      .send({ name: 'Acc Updated' })
      .set('authorization', `bearer ${user.token}`))
    .then((res) => {
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Não autorizado');
    });
});

test('Should not modify an account of another user', async () => {
  await app.db('accounts')
    .insert({ name: 'Acc User #2', user_id: user2.id }, ['id'])
    .then((acc) => request(app).delete(`${MAIN_ROUTE}/${acc[0].id}`)
      .set('authorization', `bearer ${user.token}`))
    .then((res) => {
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Não autorizado');
    });
});

test('Should return account by ID', async () => {
  await app.db('accounts')
    .insert({ name: 'acc by id', user_id: user.id }, ['id'])
    .then((acc) => request(app).get(`${MAIN_ROUTE}/${acc[0].id}`).set('authorization', `bearer ${user.token}`))
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('acc by id');
      expect(res.body.user_id).toBe(user.id);
    });
});

test('Should modifier an account', async () => {
  await app.db('accounts')
    .insert({ name: 'acc to update', user_id: user.id }, ['id'])
    .then((acc) => request(app).put(`${MAIN_ROUTE}/${acc[0].id}`)
      .send({ name: 'Acc updated' })
      .set('authorization', `bearer ${user.token}`))
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Acc updated');
    });
});

test('Should remove an account', async () => {
  await app.db('accounts')
    .insert({ name: 'acc to remove', user_id: user.id }, ['id'])
    .then((acc) => request(app).delete(`${MAIN_ROUTE}/${acc[0].id}`).set('authorization', `bearer ${user.token}`))
    .then((res) => {
      expect(res.status).toBe(204); // 204 - No Content
    });
});
