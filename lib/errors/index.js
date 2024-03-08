const ErrorStackParser = require('error-stack-parser');
const path = require('path');

const rootPath = path.join(__dirname, '..', '..');

/**
 * Custom Error Class
 */
class CustomError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        this.status = 500;
        this.back_url = "/";
    }

    /**
     * Set the status code of the error
     * @param {Number} code 
     * @returns 
     */
    withStatus(code) {
        this.status = code;
        return this; // Allow chaining
    }

    /**
     * Set the info of the error
     * @param {String} info 
     * @returns 
     */
    withInfo(info) {
        this.info = info;
        return this; // Allow chaining
    }

    /**
     * Set the back URL of the error (if none is provided, error will be json)
     * @param {String} url 
     * @returns 
     */
    withBackUrl(url) {
        if(url === "none") return this.back_url = false;
        this.back_url = url;
        return this; // Allow chaining
    }
}

class PermissionsError extends Error {
    /**
     * Not enoth permissions for the requested resource
     * @param {String} message | The message to display to the user
     * @param {String} permission | The permission that was missing
     */
    constructor(message, permission) {
        super(message);
        const parsed = ErrorStackParser.parse(this);

        this.info = 'You do not have the required permissions to access this resource'
        this.reason = permission;
        this.status = 403;
        this.path = path.relative(rootPath, parsed[0].fileName);
        this.fileline = parsed[0].lineNumber;
        this.name = 'PermissionsError';
        this.back_url = "/dashboard"
    }
}

class InvalidRouteInput extends CustomError {
    /**
     * Invalid Route Input Error
     * @param {String} message | The message to display to the user
     */
    constructor(message) {
        super(message);
        const parsed = ErrorStackParser.parse(this);

        this.info = 'Validation returned empty or wrong data'
        this.reason = 'Invalid Route Input';
        this.status = 400;
        this.path = path.relative(rootPath, parsed[0].fileName);
        this.fileline = parsed[0].lineNumber;
        this.name = 'InvalidRouteInput';
        this.back_url = "/dashboard"
    }
}

class InvalidRouteJson extends Error {
    /**
     * Invalid Route Json Input Error
     * @param {String} message | The message to display to the user
     */
    constructor(message) {
        super(message);
        const parsed = ErrorStackParser.parse(this);

        this.info = 'Validation returned empty or wrong data'
        this.reason = 'Invalid Route Input';
        this.status = 400;
        this.path = path.relative(rootPath, parsed[0].fileName);
        this.fileline = parsed[0].lineNumber;
        this.name = 'InvalidRouteInput';
    }
}

class InvalidLogin extends Error {
    /**
     * Invalid Login Data Error
     * @param {String} message | The message to display to the user
     */
    constructor(message) {
        super(message);
        const parsed = ErrorStackParser.parse(this);

        this.info = 'User does not exist or password is wrong'
        this.reason = 'Invalid Login Data';
        this.status = 401;
        this.path = path.relative(rootPath, parsed[0].fileName);
        this.fileline = parsed[0].lineNumber;
        this.name = 'InvalidLogin';
    }
}

class InvalidRegister extends Error {
    /**
     * Invalid Login Data Error
     * @param {String} message | The message to display to the user
     */
    constructor(message) {
        super(message);
        const parsed = ErrorStackParser.parse(this);

        this.info = 'Generic Registration Error'
        this.reason = 'Something went wrong during registration';
        this.status = 401;
        this.path = path.relative(rootPath, parsed[0].fileName);
        this.fileline = parsed[0].lineNumber;
        this.name = 'InvalidLogin';
    }
}

class RequestBlocked extends Error {
    /**
     * Invalid Login Data Error
     * @param {String} message | The message to display to the user
     */
    constructor(message) {
        super(message);
        const parsed = ErrorStackParser.parse(this);

        this.info = 'The request has been blocked by the server'
        this.reason = 'Your request has been blocked';
        this.status = 423;
        this.path = path.relative(rootPath, parsed[0].fileName);
        this.fileline = parsed[0].lineNumber;
        this.name = 'BlockedRequest';
    }
}

class Invalid2FA extends Error {
    /**
     * Invalid processing of 2FA request
     * @param {String} message | The message to display to the user
     */
    constructor(message) {
        super(message);
        const parsed = ErrorStackParser.parse(this);

        this.info = 'User does not exist or password is wrong'
        this.reason = 'Invalid Login Data';
        this.status = 401;
        this.path = path.relative(rootPath, parsed[0].fileName);
        this.fileline = parsed[0].lineNumber;
        this.name = 'Invalid2FA';
    }
}

class OAuthError extends Error {
    /**
     * Invalid processing of OAuth request
     * @param {String} message | The message to display to the user
    */
    constructor(message) {
        super(message);
        const parsed = ErrorStackParser.parse(this);

        this.info = 'OAuth Error'
        this.reason = 'Invalid OAuth Request';
        this.status = 401;
        this.path = path.relative(rootPath, parsed[0].fileName);
        this.fileline = parsed[0].lineNumber;
        this.name = 'OAuthError';
        this.back_url = "/login"
    }
}

class DBError extends Error {
    /**
     * Error when the output of the database is not as expected
     * @param {String} message | The message to display to the user
     * @param {String} expected | The expected output
     * @param {String} expected_type | The expected output type
     * @param {String} got | The output that was received
     * @param {String} got_type | The output type that was received
     */
    constructor(message, expected, expected_type, got, got_type) {
        super(message);
        const parsed = ErrorStackParser.parse(this);

        this.info = 'DB Output not as expected'
        this.reason = 'Invalid DB Output';
        this.secret_reason = `Expected ${expected} (${expected_type}) but got ${got} (${got_type})`;
        this.status = 500;
        this.path = path.relative(rootPath, parsed[0].fileName);
        this.fileline = parsed[0].lineNumber;
        this.name = 'DBError';
    }
}

class SQLError extends Error {
    /**
     * Parses a SQL error and returns a custom error message
     * @param {Error} message 
     */
    constructor(message) {
        super(message);
        const parsed = ErrorStackParser.parse(this);

        this.message = `SQL Error at table ${message.table} on column ${message.column}`
        this.info = 'SQL Error'
        this.reason = message.message;
        this.secret_reason = message.detail;
        this.status = 500;
        this.path = path.relative(rootPath, parsed[0].fileName);
        this.fileline = parsed[0].lineNumber;
        this.name = 'SQLError';
    }
}

class SQLDuplicateError extends Error {
    /**
     * Parses a SQL error and returns a custom error message
     * @param {Error} message 
     */
    constructor(message) {
        super(message);
        const parsed = ErrorStackParser.parse(this);

        this.message = `SQLDuplication Error at table ${message.table} on column ${message.column} with value ${message.value} already exists`
        this.info = 'SQLDuplication Error'
        this.reason = message.message;
        this.secret_reason = message.detail;
        this.status = 409;
        this.path = path.relative(rootPath, parsed[0].fileName);
        this.fileline = parsed[0].lineNumber;
        this.name = 'SQLError';
    }
}

class InvalidToken extends Error {
    constructor(message) {
        super(message);
        const parsed = ErrorStackParser.parse(this);

        this.info = 'Token is not valid'
        this.reason = 'Invalid Token';
        this.status = 400;
        this.path = path.relative(rootPath, parsed[0].fileName);
        this.fileline = parsed[0].lineNumber;
        this.name = 'InvalidToken';
        this.back_url = "/dashboard"
    }
}

class TooManyRequests extends Error {
    /**
     * Too many requests error
     * @param {String} message 
     * @param {Number} retryIn 
     */
    constructor(message, retryIn) {
        super(message);
        const parsed = ErrorStackParser.parse(this);

        this.info = 'Too many requests'
        this.reason = 'Too Many Requests';
        this.headers = { name: 'Retry-At', value: retryIn };
        this.status = 429;
        this.path = path.relative(rootPath, parsed[0].fileName);
        this.fileline = parsed[0].lineNumber;
        this.name = 'TooManyRequests';
    }
}

module.exports = {
    PermissionsError,
    InvalidRouteInput,
    InvalidRouteJson,
    InvalidLogin,
    InvalidRegister,
    Invalid2FA,
    RequestBlocked,
    OAuthError,
    DBError,
    SQLError,
    InvalidToken,
    TooManyRequests,
}