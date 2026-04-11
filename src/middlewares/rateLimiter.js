const createRateLimiter = ({
  windowMs,
  max,
  message = "Too many requests. Please try again later.",
  keyGenerator = (req) => req.ip,
}) => {
  const requestStore = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = keyGenerator(req);
    const existing = requestStore.get(key);

    if (!existing || now >= existing.resetTime) {
      requestStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });

      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", max - 1);
      return next();
    }

    if (existing.count >= max) {
      const retryAfter = Math.ceil((existing.resetTime - now) / 1000);
      res.setHeader("Retry-After", retryAfter);
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", 0);

      return res.status(429).json({
        success: false,
        message,
      });
    }

    existing.count += 1;
    requestStore.set(key, existing);

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - existing.count));

    return next();
  };
};

module.exports = {
  createRateLimiter,
};
