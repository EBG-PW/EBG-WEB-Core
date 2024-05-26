const ErrorStackParser = require('error-stack-parser');
const path = require('path');

const rootPath = path.join(__dirname, '..', '..');

/**
 * Custom Error Class
 */
class CustomError extends Error {
    constructor(message) {
        super(message);
        const parsed = ErrorStackParser.parse(this);
        this.name = this.constructor.name;
        this.status = 500;
        this.back_url = null;
        this.path = path.relative(rootPath, parsed[0].fileName);
        this.fileline = parsed[0].lineNumber;
    }

    /**
     * Set the status code of the error
     * @param {Number} code 
     */
    withStatus(code) {
        this.status = code;
        return this; // Allow chaining
    }

    /**
     * Set the info of the error
     * @param {String} info 
     */
    withInfo(info) {
        this.info = info;
        return this; // Allow chaining
    }

    /**
     * Set the back URL of the error (if none is provided, error will be json)
     * @param {String} url 

     */
    withBackUrl(url) {
        if(url === "none"){
            this.back_url = false;
        } else {
            this.back_url = url;
        }
        return this; // Allow chaining
    }

    /**
     * Set the SQL table, where the error occured
     * @param {String} table 
     */
    setSQLTable(table){
        this.table = table;
        return this;
    }

    /**
     * Set the SQL column, where the error occured
     * @param {String} column
     */
    setSQLColumn(column){
        this.column = column;
        return this;
    }

    /**
     * Set the original error message
     * @param {Error} err 
     */
    setError(err){
        this.error = err;
        return this;
    }
}

class RenderError extends CustomError {
    /**
     * Error when rendering a view
     * @param {String} message | The message to display to the user
     */
    constructor(message) {
        super(message);

        this.info = 'Error Rendering View'
        this.reason = 'Error Rendering View';
        this.status = 500;
        this.name = 'RenderError';
        this.back_url = "/"
    }
}

class PermissionsError extends CustomError {
    /**
     * Not enoth permissions for the requested resource
     * @param {String} message | The message to display to the user
     * @param {String} permission | The permission that was missing
     */
    constructor(message, permission) {
        super(message);

        this.info = 'You do not have the required permissions to access this resource';
        this.reason = permission;
        this.status = 403;
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

        this.info = 'Validation returned empty or wrong data'
        this.reason = 'Invalid Route Input';
        this.status = 400;
        this.name = 'InvalidRouteInput';
        this.back_url = "/dashboard"
    }
}

class InvalidRouteJson extends CustomError {
    /**
     * Invalid Route Json Input Error
     * @param {String} message | The message to display to the user
     */
    constructor(message) {
        super(message);

        this.info = 'Validation returned empty or wrong data'
        this.reason = 'Invalid Route Input';
        this.status = 400;
        this.name = 'InvalidRouteInput';
    }
}

class InvalidLogin extends CustomError {
    /**
     * Invalid Login Data Error
     * @param {String} message | The message to display to the user
     */
    constructor(message) {
        super(message);

        this.info = 'User does not exist or password is wrong'
        this.reason = 'Invalid Login Data';
        this.status = 401;
        this.name = 'InvalidLogin';
    }
}

class InvalidRegister extends CustomError {
    /**
     * Invalid Login Data Error
     * @param {String} message | The message to display to the user
     */
    constructor(message) {
        super(message);

        this.info = 'Generic Registration Error'
        this.reason = 'Something went wrong during registration';
        this.status = 401;
        this.name = 'InvalidLogin';
    }
}

class RequestBlocked extends CustomError {
    /**
     * Invalid Login Data Error
     * @param {String} message | The message to display to the user
     */
    constructor(message) {
        super(message);

        this.info = 'The request has been blocked by the server'
        this.reason = 'Your request has been blocked';
        this.status = 423;
        this.name = 'BlockedRequest';
    }
}

class Invalid2FA extends CustomError {
    /**
     * Invalid processing of 2FA request
     * @param {String} message | The message to display to the user
     */
    constructor(message) {
        super(message);

        this.info = 'User does not exist or password is wrong'
        this.reason = 'Invalid Login Data';
        this.status = 401;
        this.name = 'Invalid2FA';
    }
}

class OAuthError extends CustomError {
    /**
     * Invalid processing of OAuth request
     * @param {String} message | The message to display to the user
    */
    constructor(message) {
        super(message);

        this.info = 'OAuth Error'
        this.reason = 'Invalid OAuth Request';
        this.status = 401;
        this.name = 'OAuthError';
        this.back_url = "/login"
    }
}

class DBError extends CustomError {
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

        this.info = 'DB Output not as expected'
        this.reason = 'Invalid DB Output';
        this.secret_reason = `Expected ${expected} (${expected_type}) but got ${got} (${got_type})`;
        this.status = 500;
        this.name = 'DBError';
    }
}

class SQLError extends CustomError {
    /**
     * Parses a SQL error and returns a custom error message
     * @param {Error} message 
     */
    constructor(message) {
        super(message);

        this.message = `SQL Error at table ${message.table} on column ${message.column}`
        this.info = 'SQL Error'
        this.reason = message.message;
        this.secret_reason = message.detail;
        this.status = 500;
        this.name = 'SQLError';
    }
}

class SQLDuplicateError extends CustomError {
    /**
     * Parses a SQL error and returns a custom error message
     * @param {Error} message 
     */
    constructor(message) {
        super(message);

        this.message = `SQLDuplication Error at table ${message.table} on column ${message.column} with value ${message.value} already exists`
        this.info = 'SQLDuplication Error'
        this.reason = message.message;
        this.secret_reason = message.detail;
        this.status = 409;
        this.name = 'SQLError';
    }
}

class InvalidToken extends CustomError {
    constructor(message) {
        super(message);

        this.info = 'Token is not valid'
        this.reason = 'Invalid Token';
        this.status = 400;
        this.name = 'InvalidToken';
        this.back_url = "/dashboard"
    }
}

class TooManyRequests extends CustomError {
    /**
     * Too many requests error
     * @param {String} message 
     * @param {Number} retryIn 
     */
    constructor(message, retryIn) {
        super(message);

        this.info = 'Too many requests'
        this.reason = 'Too Many Requests';
        this.headers = { name: 'Retry-At', value: retryIn };
        this.status = 429;
        this.name = 'TooManyRequests';
    }
}

module.exports = {
    CustomError,
    RenderError,
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
    SQLDuplicateError,
    InvalidToken,
    TooManyRequests,
}