/**
 * Senior-level Response Utility for consistent API output
 */

const sendSuccess = (reply, data, statusCode = 200) => {
  return reply.status(statusCode).send({
    success: true,
    data,
    timestamp: new Date().toISOString()
  });
};

const sendError = (reply, message, statusCode = 500, details = null) => {
  return reply.status(statusCode).send({
    success: false,
    error: message,
    details,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  sendSuccess,
  sendError
};
