import { KondutoHTTPException } from './KondutoHTTPException';

class KondutoHTTPBadRequestException extends KondutoHTTPException {
  constructor(responseBody: string) {
    super('Your request is incorrect. Please review the parameters sent.', responseBody);
    this.name = 'KondutoHTTPBadRequestException';
  }
}

class KondutoHTTPUnauthorizedException extends KondutoHTTPException {
  constructor(responseBody: string) {
    super('Invalid API Key', responseBody);
    this.name = 'KondutoHTTPUnauthorizedException';
  }
}

class KondutoHTTPForbiddenException extends KondutoHTTPException {
  constructor(responseBody: string) {
    super('There are problems with your account. Please contact our support team.', responseBody);
    this.name = 'KondutoHTTPForbiddenException';
  }
}

class KondutoHTTPNotFoundException extends KondutoHTTPException {
  constructor(responseBody: string) {
    super('The requested resource could not be found.', responseBody);
    this.name = 'KondutoHTTPNotFoundException';
  }
}

class KondutoHTTPMethodNotAllowedException extends KondutoHTTPException {
  constructor(responseBody: string) {
    super("Sorry, we don't accept this HTTP method.", responseBody);
    this.name = 'KondutoHTTPMethodNotAllowedException';
  }
}

class KondutoHTTPUnprocessableEntityException extends KondutoHTTPException {
  constructor(responseBody: string) {
    super('Unprocessable entity', responseBody);
    this.name = 'KondutoHTTPUnprocessableEntityException';
  }
}

class KondutoHTTPTooManyRequestsException extends KondutoHTTPException {
  constructor(responseBody: string) {
    super('Your free plan reached the transactions limit.', responseBody);
    this.name = 'KondutoHTTPTooManyRequestsException';
  }
}

class KondutoHTTPInternalErrorException extends KondutoHTTPException {
  constructor(responseBody: string) {
    super(
      'Oh no...something wrong happened at our servers. Please contact our support team.',
      responseBody
    );
    this.name = 'KondutoHTTPInternalErrorException';
  }
}

export {
  KondutoHTTPBadRequestException,
  KondutoHTTPUnauthorizedException,
  KondutoHTTPForbiddenException,
  KondutoHTTPNotFoundException,
  KondutoHTTPMethodNotAllowedException,
  KondutoHTTPUnprocessableEntityException,
  KondutoHTTPTooManyRequestsException,
  KondutoHTTPInternalErrorException,
};

/**
 * Factory for creating HTTP exceptions based on status code.
 */
export class KondutoHTTPExceptionFactory {
  static buildException(statusCode: number, responseBody: string): KondutoHTTPException | null {
    switch (statusCode) {
      case 400:
        return new KondutoHTTPBadRequestException(responseBody);
      case 401:
        return new KondutoHTTPUnauthorizedException(responseBody);
      case 403:
        return new KondutoHTTPForbiddenException(responseBody);
      case 404:
        return new KondutoHTTPNotFoundException(responseBody);
      case 405:
        return new KondutoHTTPMethodNotAllowedException(responseBody);
      case 422:
        return new KondutoHTTPUnprocessableEntityException(responseBody);
      case 429:
        return new KondutoHTTPTooManyRequestsException(responseBody);
      case 500:
        return new KondutoHTTPInternalErrorException(responseBody);
      default:
        return null;
    }
  }
}
