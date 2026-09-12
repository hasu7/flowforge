const errorHandler = (
  err,
  req,
  res,
  next
) => {
  console.error(err);

  const statusCode =
    err.statusCode || 500;

  const response = {
    success: false,
    message:
      err.message ||
      "Internal server error"
  };

  if (err.errors) {
    response.errors =
      err.errors;
  }

  if (statusCode >= 500) {
    response.message =
      "Internal server error";
  }

  return res
    .status(statusCode)
    .json(response);
};

export default errorHandler;