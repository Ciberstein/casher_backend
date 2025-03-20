const corsConfig = {
    origin: process.env.FRONTEND_DOMAIN,
    credentials: true,
};

module.exports = { corsConfig };