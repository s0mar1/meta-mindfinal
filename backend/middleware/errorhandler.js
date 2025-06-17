module.exports = function errorHandler(err, req, res, next) {
  console.error(err.stack);
  const status = err.status || err.response?.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
};
