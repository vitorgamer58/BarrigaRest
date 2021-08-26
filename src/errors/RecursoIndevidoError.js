module.exports = function RecursoIndevidoError(message = 'Não autorizado') {
  this.name = 'RecursoIndevidoError';
  this.message = message;
};
