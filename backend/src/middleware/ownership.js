const asyncHandler = require('express-async-handler');

// Generic ownership-check middleware factory. Loads a document by
// req.params[paramName] and 404s (not 403) if it doesn't belong to the
// requesting user -- avoids leaking the existence of other users' data,
// which is the isolation requirement the PRD calls out explicitly.
function ownsResource(Model, paramName = 'id', resourceKey = 'resource') {
  return asyncHandler(async (req, res, next) => {
    const doc = await Model.findOne({ _id: req.params[paramName], user: req.user._id });
    if (!doc) {
      res.status(404);
      throw new Error(`${Model.modelName} not found`);
    }
    req[resourceKey] = doc;
    next();
  });
}

module.exports = { ownsResource };
