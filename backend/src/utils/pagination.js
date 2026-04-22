const getPagination = (pageQuery, limitQuery, defaultLimit = 9) => {
  const page = Math.max(Number(pageQuery) || 1, 1);
  const limit = Math.min(Math.max(Number(limitQuery) || defaultLimit, 1), 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

module.exports = getPagination;
