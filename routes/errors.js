/* eslint-disable class-methods-use-this */

class BadRequest extends Error {
  get status() {
    return 400;
  }
}

class Unauthorized extends Error {
  get status() {
    return 401;
  }
}

class NotFound extends Error {
  get status() {
    return 404;
  }
}

class ServiceUnavailable extends Error {
  get status() {
    return 503;
  }

  get message() {
    return 'Service Unavailable';
  }
}

class RecaptchaFailed extends Unauthorized {
  get message() {
    return 'ReCAPTCHA failed';
  }

  get code() {
    return 1;
  }
}

class UsernameTaken extends BadRequest {
  get message() {
    return 'Username taken';
  }

  get code() {
    return 2;
  }
}

class InvalidActivation extends BadRequest {
  get message() {
    return 'Invalid activation token';
  }

  get code() {
    return 3;
  }
}

class UserNotActive extends BadRequest {
  get message() {
    return 'User not activated';
  }

  get code() {
    return 4;
  }
}

class AuthenticationFailed extends Unauthorized {
  get message() {
    return 'Authentication failed';
  }

  get code() {
    return 5;
  }
}

class UserNotFound extends NotFound {
  get message() {
    return 'User not found';
  }

  get code() {
    return 6;
  }
}

class InvalidResetToken extends BadRequest {
  get message() {
    return 'Invalid password reset token';
  }

  get code() {
    return 7;
  }
}

class InvalidUserToken extends Unauthorized {
  constructor(msg = 'Invalid user token') {
    super();
    this.message = msg;
  }

  get code() {
    return 11;
  }
}

class InsufficientFunds extends BadRequest {
  get message() {
    return 'Insufficient funds';
  }

  get code() {
    return 13;
  }
}

class InvalidTwofaToken extends Unauthorized {
  get message() {
    return 'Invalid 2FA token';
  }

  get code() {
    return 16;
  }
}

class TwofaAlreadyEnabled extends BadRequest {
  get message() {
    return '2FA is already enabled';
  }

  get code() {
    return 17;
  }
}

class Invalid2faSecret extends BadRequest {
  get message() {
    return 'Invalid 2FA secret';
  }

  get code() {
    return 18;
  }
}

class TwofaNotEnabled extends BadRequest {
  get message() {
    return '2FA is not enabled';
  }

  get code() {
    return 19;
  }
}

class CurrencyNotFound extends NotFound {
  get message() {
    return 'Currency not found';
  }

  get code() {
    return 22;
  }
}

class InvalidCSRFToken extends Unauthorized {
  get message() {
    return 'Invalid CSRF token';
  }

  get code() {
    return 40;
  }
}

class CurrencyAlreadyExists extends BadRequest {
  get message() {
    return 'Currency already exist';
  }

  get code() {
    return 45;
  }
}

module.exports = {
  ServiceUnavailable,
  NotFound,
  BadRequest,
  Unauthorized,
  RecaptchaFailed,
  UsernameTaken,
  UserNotFound,
  UserNotActive,
  InvalidActivation,
  AuthenticationFailed,
  InvalidResetToken,
  InvalidUserToken,
  InsufficientFunds,
  InvalidTwofaToken,
  TwofaAlreadyEnabled,
  Invalid2faSecret,
  TwofaNotEnabled,
  CurrencyNotFound,
  InvalidCSRFToken,
  CurrencyAlreadyExists,
};
