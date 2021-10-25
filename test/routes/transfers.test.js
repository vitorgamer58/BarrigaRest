/* eslint-disable jest/expect-expect */
/* eslint-disable arrow-body-style */
const request = require('supertest');
const app = require('../../src/app');

const MAIN_ROUTE = '/v1/transfers';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMDAwIiwibmFtZSI6IlVzZXIgIzEiLCJlbWFpbCI6InVzZXIxQG1haWwuY29tIn0.chU-tuZlkvmmHF_1hfprTmRYeInr88iVgXysvfj73Cs';

beforeAll(async () => {
  // await app.db.migrate.rollback();
  // await app.db.migrate.latest();
  await app.db.seed.run();
});

test('Should list only transfers of one user', async () => {
  await request(app).get(MAIN_ROUTE)
    .set('authorization', `bearer ${TOKEN}`)
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].description).toBe('Transfer #1');
    });
});

test('Should insert a transfer with successful', async () => {
  await request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${TOKEN}`)
    .send({ description: 'Regular transfer', user_id: 10000, acc_ori_id: 10000, acc_dest_id: 10001, ammount: 100, date: new Date() })
    .then(async (res) => {
      expect(res.status).toBe(201);
      expect(res.body.description).toBe('Regular transfer');

      const transactions = await app.db('transactions').where({ transfer_id: res.body.id });
      expect(transactions).toHaveLength(2);
      expect(transactions[0].description).toBe('Transfer to acc #10001');
      expect(transactions[1].description).toBe('Transfer from acc #10000');
      expect(transactions[0].ammount).toBe('-100.00');
      expect(transactions[1].ammount).toBe('100.00');
      expect(transactions[0].acc_id).toBe(10000);
      expect(transactions[1].acc_id).toBe(10001);
    });
});

describe('When create a valid transfer...', () => {
  // This group of tests is for teaching purposes
  let transferId;
  let incometransaction;
  let outcometransaction;
  test('Should return status 201 and the data of transfer', async () => {
    await request(app).post(MAIN_ROUTE)
      .set('authorization', `bearer ${TOKEN}`)
      .send({ description: 'Regular transfer2', user_id: 10000, acc_ori_id: 10000, acc_dest_id: 10001, ammount: 100, date: new Date() })
      .then(async (res) => {
        expect(res.status).toBe(201);
        expect(res.body.description).toBe('Regular transfer2');
        transferId = res.body.id;
      });
  });

  test('Respective transactions should be generated', async () => {
    const transactions = await app.db('transactions').where({ transfer_id: transferId }).orderBy('ammount');
    expect(transactions).toHaveLength(2);
    [outcometransaction, incometransaction] = transactions;
  });

  test('Transaction of output should be negative', async () => {
    expect(outcometransaction.description).toBe('Transfer to acc #10001');
    expect(outcometransaction.ammount).toBe('-100.00');
    expect(outcometransaction.acc_id).toBe(10000);
    expect(outcometransaction.type).toBe('O');
  });

  test('Transaction of income should be positive', async () => {
    expect(incometransaction.description).toBe('Transfer from acc #10000');
    expect(incometransaction.ammount).toBe('100.00');
    expect(incometransaction.acc_id).toBe(10001);
  });

  test('Both transactions should refer transfer', async () => {
    expect(incometransaction.transfer_id).toBe(transferId);
    expect(outcometransaction.transfer_id).toBe(transferId);
  });
});

describe('When try to save a invalid transfer', () => {
  const validtransfer = { description: 'Regular transfer', user_id: 10000, acc_ori_id: 10000, acc_dest_id: 10001, ammount: 100, date: new Date() };
  const savetransaction = (newdata, errorMessage) => request(app).post(MAIN_ROUTE)
    .set('authorization', `bearer ${TOKEN}`)
    .send({ ...validtransfer, ...newdata })
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe(errorMessage);
    });

  test('Should not insert a transfer without description', async () => {
    await savetransaction({ description: null }, 'description é um atributo obrigatório');
  });
  test('Should not insert a transfer without ammount', async () => {
    await savetransaction({ ammount: null }, 'ammount é um atributo obrigatório');
  });
  test('Should not insert a transfer without date', async () => {
    await savetransaction({ date: null }, 'date é um atributo obrigatório');
  });
  test('Should not insert a transfer without account of origin', async () => {
    await savetransaction({ acc_ori_id: null }, 'acc_ori_id é um atributo obrigatório');
  });
  test('Should not insert a transfer without account of destination', async () => {
    await savetransaction({ acc_dest_id: null }, 'acc_dest_id é um atributo obrigatório');
  });
  test('Should not insert if the account of origin and destination be the same', async () => {
    await savetransaction({ acc_ori_id: 10000, acc_dest_id: 10000 }, 'Não é possível transferir de uma conta para ela mesma');
  });
  test('Should not insert if the accounts belong to another user', async () => {
    await savetransaction({ acc_ori_id: 10002 }, 'Conta #10002 não pertence ao usuário');
  });
});

test('Should return a transfer by ID', async () => {
  await request(app).get(`${MAIN_ROUTE}/10000`)
    .set('authorization', `bearer ${TOKEN}`)
    .then((res) => {
      expect(res.status).toBe(200);
      expect(res.body.description).toBe('Transfer #1');
    });
});

describe('When changing a valid transfer', () => {
  // WORK IN PROGRESS
  let transferId;
  let incometransaction;
  let outcometransaction;
  test('Should return status 200 and the data of transfer', async () => {
    await request(app).put(`${MAIN_ROUTE}/10000`)
      .set('authorization', `bearer ${TOKEN}`)
      .send({ description: 'Transfer Updated', user_id: 10000, acc_ori_id: 10000, acc_dest_id: 10001, ammount: 500, date: new Date() })
      .then(async (res) => {
        expect(res.status).toBe(200);
        expect(res.body.description).toBe('Transfer Updated');
        expect(res.body.ammount).toBe('500.00');
        transferId = res.body.id;
      });
  });

  test('Respective transactions should be generated', async () => {
    const transactions = await app.db('transactions').where({ transfer_id: transferId }).orderBy('ammount');
    expect(transactions).toHaveLength(2);
    [outcometransaction, incometransaction] = transactions;
  });

  test('Transaction of output should be negative', async () => {
    expect(outcometransaction.description).toBe('Transfer to acc #10001');
    expect(outcometransaction.ammount).toBe('-500.00');
    expect(outcometransaction.acc_id).toBe(10000);
    expect(outcometransaction.type).toBe('O');
  });

  test('Transaction of income should be positive', async () => {
    expect(incometransaction.description).toBe('Transfer from acc #10000');
    expect(incometransaction.ammount).toBe('500.00');
    expect(incometransaction.acc_id).toBe(10001);
  });

  test('Both transactions should refer transfer', async () => {
    expect(incometransaction.transfer_id).toBe(transferId);
    expect(outcometransaction.transfer_id).toBe(transferId);
  });
});

describe('When try to change a invalid transfer', () => {
  const validtransfer = { description: 'Regular transfer', user_id: 10000, acc_ori_id: 10000, acc_dest_id: 10001, ammount: 100, date: new Date() };
  const savetransaction = (newdata, errorMessage) => request(app).put(`${MAIN_ROUTE}/10000`)
    .set('authorization', `bearer ${TOKEN}`)
    .send({ ...validtransfer, ...newdata })
    .then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error).toBe(errorMessage);
    });

  test('Should not change a transfer without description', async () => {
    await savetransaction({ description: null }, 'description é um atributo obrigatório');
  });
  test('Should not change a transfer without ammount', async () => {
    await savetransaction({ ammount: null }, 'ammount é um atributo obrigatório');
  });
  test('Should not change a transfer without date', async () => {
    await savetransaction({ date: null }, 'date é um atributo obrigatório');
  });
  test('Should not change a transfer without account of origin', async () => {
    await savetransaction({ acc_ori_id: null }, 'acc_ori_id é um atributo obrigatório');
  });
  test('Should not change a transfer without account of destination', async () => {
    await savetransaction({ acc_dest_id: null }, 'acc_dest_id é um atributo obrigatório');
  });
  test('Should not change if the account of origin and destination be the same', async () => {
    await savetransaction({ acc_ori_id: 10000, acc_dest_id: 10000 }, 'Não é possível transferir de uma conta para ela mesma');
  });
  test('Should not change if the accounts belong to another user', async () => {
    await savetransaction({ acc_ori_id: 10002 }, 'Conta #10002 não pertence ao usuário');
  });
});

describe('When remove a transfer', () => {
  test('Should return status 204', async () => {
    await request(app).delete(`${MAIN_ROUTE}/10000`)
      .set('authorization', `bearer ${TOKEN}`)
      .then((res) => expect(res.status).toBe(204));
  });

  test('Transfer should be removed of database', async () => {
    await app.db('transfers').where({ id: 10000 })
      .then((result) => expect(result).toHaveLength(0)); // Empty array
  });

  test('Associated transactions should be removed', async () => {
    await app.db('transactions').where({ transfer_id: 10000 })
      .then((result) => expect(result).toHaveLength(0));
  });
});

test('Should not return a transfer of another user', async () => {
  await request(app).get(`${MAIN_ROUTE}/10001`)
    .set('authorization', `bearer ${TOKEN}`)
    .then((res) => {
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Não autorizado');
    });
});
