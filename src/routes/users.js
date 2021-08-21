/* eslint-disable consistent-return */
const express = require('express');

module.exports = (app) => {
  const router = express.Router();
  router.get('/', (req, res, next) => {
    app.services.user.findAll()
      .then((result) => res.status(200).json(result))
      .catch((err) => next(err));
    /* const users = [
      { name: 'John Doe', email: 'a@a.com' },
    ];
    res.status(200).json(users); */
  });

  router.post('/', async (req, res, next) => {
    try {
      const result = await app.services.user.save(req.body);
      return res.status(201).json(result[0]);
    } catch (err) {
      next(err);
    }
  });

  return router;
};
