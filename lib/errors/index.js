const ErrorStackParser = require('error-stack-parser');
const path = require('path');

const rootPath = path.join(__dirname, '..', '..');

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
    }
}

class InvalidRouteInput extends Error {
    /**
     * Invalid Route Input Error
     * @param {String} message | The message to display to the user
     */
    constructor(message) {
        super(message);
        const parsed = ErrorStackParser.parse(this);

        this.info = 'Validation returned empty data'
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
        this.status = 400;
        this.path = path.relative(rootPath, parsed[0].fileName);
        this.fileline = parsed[0].lineNumber;
        this.name = 'InvalidLogin';
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
        this.status = 400;
        this.path = path.relative(rootPath, parsed[0].fileName);
        this.fileline = parsed[0].lineNumber;
        this.name = 'Invalid2FA';
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
    InvalidLogin,
    Invalid2FA,
    DBError,
    SQLError,
    InvalidToken,
    TooManyRequests
}