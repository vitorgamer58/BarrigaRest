/* eslint-disable jest/expect-expect */
const request = require('supertest');
const jwt = require('jwt-simple');
const app = require('../../src/app');

const MAIN_ROUTE = '/v1/transactions';
let user;
let user2;
let accUser;
let accUser2;
const transactions = [];
const accountsToRemove = [];
const usersToRemove = [];

beforeAll(async () => {
  // await app.db('transactions').del();
  // await app.db('accounts').del();
  // await app.db('users').del();
  const users = await app.db('users').insert([
    { name: 'User TR #1', email: `user${Date.now()}@email.com`, passwd: '$2a$10$8fZO8t7337U00aACrIRPguEl.GaH66BDMmou6pryh9fZGRJ2sZGVa' },
    { name: 'User TR #2', email: `user2${Date.now()}@email.com`, passwd: '$2a$10$8fZO8t7337U00aACrIRPguEl.GaH66BDMmou6pryh9fZGRJ2sZGVa' }
  ], '*');
  usersToRemove.push(users[0], users[1]);
  [user, user2] = users;
  delete user.passwd;
  user.token = jwt.encode(user, 'Segredo!');
  delete user2.passwd;
  user2.token = jwt.encode(user2, 'Segredo!');
  const accs = await app.db('accounts').insert([
    { name: 'Acc #1', user_id: user.id },
    { name: 'Acc #2', user_id: user2.id }
  ], '*');
  [accUser, accUser2] = accs;
  accountsToRemove.push(...accs);
});

afterAll(async () => {
  transactions.forEach(async (transaction) => {
    // Removes all transactions created during testing.
    await app.db('transactions').where({ id: transaction.id }).del();
  });
  await new Promise((r) => setTimeout(r, 1000)); // Wait one second
  accountsToRemove.forEach(async (acc) => {
    // Removes all accounts created during testing.
    await app.db('accounts').where({ id: acc.id }).del();
  });
  await new Promise((r) => setTimeout(r, 1000)); // Wait one second
  usersToRemove.forEach(async (usr) => {
    // Removes all users created during testing.
    await app.db('users').where({ id: usr.id }).del();
  });
  await new Promise((r) => setTimeout(r, 1000)); // Wait one second
});

test('Should list only the transactions of current user', async () => {
  // dois usuários, duas contas, duas transações.
  const transaction1 = await app.db('transactions').insert(
    { description: 'T1', date: new Date(), ammount: 100, type: 'I', acc_id: accUser.id }, ['id']
  );
  const transaction2 = await app.db('transactions').insert(
    { description: 'T2', date: new Date(), ammount: 300, type: 'O', acc_id: accUser2.id }, ['id']
  );
  request(app).get(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].description).toBe('T1');
    });
  transactions.push(transaction1[0], transaction2[0]);
});

test('Should insert a transaction with success', async () => {
  await request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({ description: 'New T', date: new Date(), ammount: 100, type: 'I', acc_id: accUser.id })
    .then((res) => {
      expect(res.status).toBe(201);
      expect(res.body.acc_id).toBe(accUser.id);
      expect(res.body.ammount).toBe('100.00');
      transactions.push(res.body);
    });
});

test('Transactions of income should to be positive', async () => {
  await request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({ description: 'New T', date: new Date(), ammount: -100, type: 'I', acc_id: accUser.id })
    .then((res) => {
      expect(res.status).toBe(201);
      expect(res.body.acc_id).toBe(accUser.id);
      expect(res.body.ammount).toBe('100.00');
      transactions.push(res.body);
    });
});

describe('Should validate transactions', () => {
  let validTransaction;
  beforeAll(() => {
    validTransaction = { description: 'New T', date: new Date(), ammount: 100, type: 'I', acc_id: accUser.id };
  });
  const testTemplate = async (newData, errorMessage) => {
    await request(app).post(MAIN_ROUTE)
      .set('authorization', `bearer ${user.token}`)
      .send({ ...validTransaction, ...newData })
      .then((res) => {
        expect(res.status).toBe(400);
        expect(res.body.error).toBe(errorMessage);
      });
  };
  test('Should not insert a transaction without description', () => testTemplate({ description: null }, 'description é um atributo obrigatório'));
  test('Should not insert a transaction without value', () => testTemplate({ ammount: null }, 'ammount é um atributo obrigatório'));
  test('Should not insert a transaction without data', async () => testTemplate({ date: null }, 'date é um atributo obrigatório'));
  test('Should not insert a transaction without account', async () => testTemplate({ acc_id: null }, 'acc_id é um atributo obrigatório'));
  test('Should not insert a transaction without type', async () => testTemplate({ type: null }, 'type é um atributo obrigatório'));
  test('Should not insert a transaction with a invalid type', async () => testTemplate({ type: 'X' }, 'type é inválido'));
});

test('Transactions of outcome should to be negative', async () => {
  await request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({ description: 'New T', date: new Date(), ammount: 100, type: 'O', acc_id: accUser.id })
    .then((res) => {
      expect(res.status).toBe(201);
      expect(res.body.acc_id).toBe(accUser.id);
      expect(res.body.ammount).toBe('-100.00');
      transactions.push(res.body);
    });
});

test('Should return a transaction by ID', async () => {
  const transactionID = await app.db('transactions').insert(
    { description: 'T ID', date: new Date(), ammount: 100, type: 'I', acc_id: accUser.id }, ['id']
  );
  transactions.push(transactionID[0]);

  await request(app).get(`${MAIN_ROUTE}/${transactionID[0].id}`)
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(transactionID[0].id);
      expect(res.body.description).toBe('T ID');
    });
});

test('Should modifier a transaction', async () => {
  const transactionID = await app.db('transactions').insert(
    { description: 'Transaction to Edit', date: new Date(), ammount: 100, type: 'I', acc_id: accUser.id }, ['id']
  );
  transactions.push(transactionID[0]);

  await request(app).put(`${MAIN_ROUTE}/${transactionID[0].id}`)
    .set('authorization', `bearer ${user.token}`)
    .send({ description: 'Updated' })
    .then((res) => {
      expect(res.status).toBe(201);
      expect(res.body.description).toBe('Updated');
    });
});

test('Should delete a transaction', async () => {
  const transationToRemove = await app.db('transactions').insert(
    { description: 'Transaction to delete', date: new Date(), ammount: 100, type: 'I', acc_id: accUser.id }, ['id']
  );

  await request(app).delete(`${MAIN_ROUTE}/${transationToRemove[0].id}`)
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(204);
    });
});

test('Should not perform any action in a transaction of another user', async () => {
  const transationToRemove = await app.db('transactions').insert(
    { description: 'Transaction to delete', date: new Date(), ammount: 100, type: 'I', acc_id: accUser2.id }, ['id']
  );
  transactions.push(transationToRemove[0]);

  // Should not return
  await request(app).get(`${MAIN_ROUTE}/${transationToRemove[0].id}`)
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Não autorizado');
    });

  // Should not modifier
  await request(app).put(`${MAIN_ROUTE}/${transationToRemove[0].id}`)
    .set('authorization', `bearer ${user.token}`)
    .send({ description: 'Updated' })
    .then((res) => {
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Não autorizado');
    });

  // Should not delete
  await request(app).delete(`${MAIN_ROUTE}/${transationToRemove[0].id}`)
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Não autorizado');
    });
});

test('Should not remove a account with transactions', async () => {
  const transaction = await app.db('transactions').insert(
    { description: 'Transaction to delete', date: new Date(), ammount: 100, type: 'I', acc_id: accUser.id }, ['id']
  );
  transactions.push(transaction[0]);

  await request(app).delete(`/v1/accounts/${accUser.id}`)
    .set('authorization', `bearer ${user.token}`)
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('This account have associated transactions');
    });
});
