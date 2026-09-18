// Wraps a zod schema as Express middleware. Rejects invalid input before it
// ever reaches business logic or gets near the database / AI layer.
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });
    if (!result.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
      return;
    }
    req.validated = result.data;
    next();
  };
}

module.exports = { validate };
