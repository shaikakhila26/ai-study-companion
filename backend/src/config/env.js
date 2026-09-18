require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  return value;
}

module.exports = {
  port: parseInt(required('PORT', '5000'), 10),
  nodeEnv: required('NODE_ENV', 'development'),
  clientUrl: required('CLIENT_URL', 'http://localhost:5173'),
  // CLIENT_URL may be a single origin or a comma-separated list, so that the
  // production Vercel domain and local dev can both be allowed at once.
  clientOrigins: required('CLIENT_URL', 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  // Set to 'true' to also allow Vercel preview deployments (*.vercel.app).
  allowVercelPreviews: required('ALLOW_VERCEL_PREVIEWS', 'false') === 'true',

  mongodbUri: required('MONGODB_URI', 'mongodb://localhost:27017/ai-study-companion'),

  jwtSecret: required('JWT_SECRET', 'dev_only_insecure_secret_change_me'),
  jwtExpiresIn: required('JWT_EXPIRES_IN', '7d'),

  groqApiKey: required('GROQ_API_KEY', ''),
  groqModel: required('GROQ_MODEL', 'llama-3.3-70b-versatile'),
  groqEvalModel: required('GROQ_EVAL_MODEL', 'llama-3.1-8b-instant'),

  storageDriver: required('STORAGE_DRIVER', 'local'),
  cloudinary: {
    cloudName: required('CLOUDINARY_CLOUD_NAME', ''),
    apiKey: required('CLOUDINARY_API_KEY', ''),
    apiSecret: required('CLOUDINARY_API_SECRET', ''),
  },

  jobPollIntervalMs: parseInt(required('JOB_POLL_INTERVAL_MS', '1000'), 10),
  jobMaxRetries: parseInt(required('JOB_MAX_RETRIES', '3'), 10),

  retrievalTopK: parseInt(required('RETRIEVAL_TOP_K', '5'), 10),
  retrievalMinScore: parseFloat(required('RETRIEVAL_MIN_SCORE', '0.08')),
};