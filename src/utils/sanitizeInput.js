const toPlainObject = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value;
};

const pickAllowedFields = (payload, allowedFields) => {
  const source = toPlainObject(payload);

  return allowedFields.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      acc[key] = source[key];
    }

    return acc;
  }, {});
};

const trimStringFields = (payload, fields) => {
  const sanitized = {};

  Object.keys(payload).forEach((key) => {
    sanitized[key] = payload[key];
  });

  fields.forEach((field) => {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = sanitized[field].trim();
    }
  });

  return sanitized;
};

const toNumberOrOriginal = (value) => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return value;
    }

    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return value;
};

const toBooleanOrOriginal = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }

  return value;
};

module.exports = {
  pickAllowedFields,
  trimStringFields,
  toNumberOrOriginal,
  toBooleanOrOriginal,
};
