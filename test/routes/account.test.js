const request = require('supertest');
const app = require('../../src/app');

const MAIN_ROUTE = '/accounts';
let user;

beforeAll(async () => {
  const res = await app.services.user.save({ name: 'User account', email: `${Date.now()}@gmail.com`, passwd: 123456 });
  user = { ...res[0] };
});

test('Should insert an account with sucess', async () => {
  await request(app).post(MAIN_ROUTE)
    .send({ name: 'Account 1', user_id: user.id })
    .then((res) => {
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Account 1');
    });
});

test('Shoud list all accounts', async () => {
  await app.db('accounts')
    .insert({ name: 'acc list', user_id: user.id })
    .then(() => request(app).get(MAIN_ROUTE))
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });
});

test('Should return account by ID', async () => {
  await app.db('accounts')
    .insert({ name: 'acc by id', user_id: user.id }, ['id'])
    .then((acc) => request(app).get(`${MAIN_ROUTE}/${acc[0].id}`))
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('acc by id');
      expect(res.body.user_id).toBe(user.id);
    });
});
