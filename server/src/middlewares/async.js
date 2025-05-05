/**
 * Wraps an async route handler and forwards errors to next()
 * @param {Function} fn - Async function (req, res, next)
 */
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
  