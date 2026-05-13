export class ApiError extends Error {
  constructor(status, message, code, details = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
