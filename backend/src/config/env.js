const isHostedEnvironment = () => process.env.NODE_ENV === "production" || process.env.RENDER === "true";

const getMissingCoreEnvVars = () => {
  const required = ["MONGODB_URI", "JWT_SECRET"];

  return required.filter((key) => !process.env[key]?.trim());
};

const getStartupWarnings = () => {
  const warnings = [];

  if (
    isHostedEnvironment() &&
    (process.env.MONGODB_URI?.includes("127.0.0.1") || process.env.MONGODB_URI?.includes("localhost"))
  ) {
    warnings.push(
      "MONGODB_URI points to localhost. This works on your computer but not on Render. Use a hosted MongoDB URI."
    );
  }

  if (
    !process.env.SUPABASE_URL?.trim() ||
    !process.env.SUPABASE_STORAGE_BUCKET?.trim() ||
    !(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_PUBLISHABLE_KEY?.trim())
  ) {
    warnings.push(
      "Supabase Storage is not fully configured. Uploads will fall back to local disk unless SUPABASE_URL, SUPABASE_STORAGE_BUCKET, and a Supabase key are set."
    );
  }

  return warnings;
};

const validateStartupEnv = () => {
  const missing = getMissingCoreEnvVars();

  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. Add them in Render before deploying.`
    );
  }

  if (
    isHostedEnvironment() &&
    (process.env.MONGODB_URI.includes("127.0.0.1") || process.env.MONGODB_URI.includes("localhost"))
  ) {
    throw new Error(
      "MONGODB_URI is set to localhost. On Render, use a hosted MongoDB connection string such as MongoDB Atlas."
    );
  }

  return getStartupWarnings();
};

module.exports = {
  validateStartupEnv
};
