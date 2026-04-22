const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  if (error.name === "CastError") {
    return res.status(400).json({
      message: "A provided ID was invalid."
    });
  }

  if (error.name === "MulterError" && error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "Image uploads must be 5MB or smaller."
    });
  }

  if (error.code === 11000) {
    return res.status(400).json({
      message: "That value is already in use."
    });
  }

  return res.status(statusCode).json({
    message: error.message || "Something went wrong on the server."
  });
};

module.exports = errorHandler;
