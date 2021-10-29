/* eslint-disable object-shorthand */
const request = require('supertest');
const moment = require('moment');
const app = require('../../src/app');

const MAIN_ROUTE = '/v1/balance';
const ROUTE_TRANSACTION = '/v1/transactions';
const ROUTE_TRANSFER = '/v1/transfers';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAxMDAsIm5hbWUiOiJVc2VyIGZvciBiYWxhbmNlICMxIiwiZW1haWwiOiJ1c2VyMTIzQG1haWwuY29tIn0.zDSmqk79BUEx8_N6aFkJkNW--FmRBQtRjouZU9hyW8Y';
const TOKEN2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMTAyIiwibmFtZSI6IlVzZXIgZm9yIGJhbGFuY2UgIzMiLCJlbWFpbCI6InVzZXI3ODlAbWFpbC5jb20ifQ.B4JlkdJUsta_2mK_-YGVO8CSW3anJZ_8VPRUc6RVKVc';

const date = moment().format('YYYY-MM-DD');

beforeAll(async () => {
  await app.db.seed.run();
});

describe('When calculate the user balance...', () => {
  test('Deve retornar apenas as contas com alguma transação', async () => {
    await request(app).get(MAIN_ROUTE)
      .set('authorization', `bearer ${TOKEN}`)
      .then((res) => {
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(0);
      });
  });
  test('Should add the input values', async () => {
    await request(app).post(ROUTE_TRANSACTION)
      .send({ description: '1', date: date, ammount: 100, type: 'I', acc_id: 10100, status: true })
      .set('authorization', `bearer ${TOKEN}`)
      .then(async () => {
        await request(app).get(MAIN_ROUTE)
          .set('authorization', `bearer ${TOKEN}`)
          .then((res) => {
            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].id).toBe(10100);
            expect(res.body[0].sum).toBe('100.00');
          });
      });
  });
  test('Should subtract the output values', async () => {
    await request(app).post(ROUTE_TRANSACTION)
      .send({ description: '1', date: date, ammount: 200, type: 'O', acc_id: 10100, status: true })
      .set('authorization', `bearer ${TOKEN}`)
      .then(async () => {
        await request(app).get(MAIN_ROUTE)
          .set('authorization', `bearer ${TOKEN}`)
          .then((res) => {
            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].id).toBe(10100);
            expect(res.body[0].sum).toBe('-100.00');
          });
      });
  });
  test('Should not consider pending transactions', async () => {
    await request(app).post(ROUTE_TRANSACTION)
      .send({ description: '1', date: date, ammount: 200, type: 'O', acc_id: 10100, status: false })
      .set('authorization', `bearer ${TOKEN}`)
      .then(async () => {
        await request(app).get(MAIN_ROUTE)
          .set('authorization', `bearer ${TOKEN}`)
          .then((res) => {
            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].id).toBe(10100);
            expect(res.body[0].sum).toBe('-100.00');
          });
      });
  });
  test('Should not mix balances from different accounts', async () => {
    await request(app).post(ROUTE_TRANSACTION)
      .send({ description: '1', date: date, ammount: 50, type: 'I', acc_id: 10101, status: true })
      .set('authorization', `bearer ${TOKEN}`)
      .then(async () => {
        await request(app).get(MAIN_ROUTE)
          .set('authorization', `bearer ${TOKEN}`)
          .then((res) => {
            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0].id).toBe(10100);
            expect(res.body[0].sum).toBe('-100.00');
            expect(res.body[1].id).toBe(10101);
            expect(res.body[1].sum).toBe('50.00');
          });
      });
  });
  test("Should not mix the balance of other users' accounts", async () => {
    await request(app).post(ROUTE_TRANSACTION)
      .send({ description: '1', date: date, ammount: 200, type: 'O', acc_id: 10102, status: true })
      .set('authorization', `bearer ${TOKEN}`)
      .then(async () => {
        await request(app).get(MAIN_ROUTE)
          .set('authorization', `bearer ${TOKEN}`)
          .then((res) => {
            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0].id).toBe(10100);
            expect(res.body[0].sum).toBe('-100.00');
            expect(res.body[1].id).toBe(10101);
            expect(res.body[1].sum).toBe('50.00');
          });
      });
  });
  test('Should consider past transaction', async () => {
    await request(app).post(ROUTE_TRANSACTION)
      .send({ description: '1', date: moment().subtract({ days: 5 }), ammount: 250, type: 'I', acc_id: 10100, status: true })
      .set('authorization', `bearer ${TOKEN}`)
      .then(async () => {
        await request(app).get(MAIN_ROUTE)
          .set('authorization', `bearer ${TOKEN}`)
          .then((res) => {
            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0].id).toBe(10100);
            expect(res.body[0].sum).toBe('150.00');
            expect(res.body[1].id).toBe(10101);
            expect(res.body[1].sum).toBe('50.00');
          });
      });
  });
  test('Should not consider future transaction', async () => {
    await request(app).post(ROUTE_TRANSACTION)
      .send({ description: '1', date: moment().add({ days: 5 }), ammount: 250, type: 'I', acc_id: 10100, status: true })
      .set('authorization', `bearer ${TOKEN}`)
      .then(async () => {
        await request(app).get(MAIN_ROUTE)
          .set('authorization', `bearer ${TOKEN}`)
          .then((res) => {
            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0].id).toBe(10100);
            expect(res.body[0].sum).toBe('150.00');
            expect(res.body[1].id).toBe(10101);
            expect(res.body[1].sum).toBe('50.00');
          });
      });
  });
  test('Should consider transfers', async () => {
    await request(app).post(ROUTE_TRANSFER)
      .send({ description: '1', date: date, ammount: 250, acc_ori_id: 10100, acc_dest_id: 10101 })
      .set('authorization', `bearer ${TOKEN}`)
      .then(async () => {
        await request(app).get(MAIN_ROUTE)
          .set('authorization', `bearer ${TOKEN}`)
          .then((res) => {
            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0].id).toBe(10100);
            expect(res.body[0].sum).toBe('-100.00');
            expect(res.body[1].id).toBe(10101);
            expect(res.body[1].sum).toBe('300.00');
          });
      });
  });
});

test('Should calculate balance of accounts of the user', async () => {
  await request(app).get(MAIN_ROUTE)
    .set('authorization', `bearer ${TOKEN2}`)
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].id).toBe(10104);
      expect(res.body[0].sum).toBe('162.00');
      expect(res.body[1].id).toBe(10105);
      expect(res.body[1].sum).toBe('-248.00');
    });
});
