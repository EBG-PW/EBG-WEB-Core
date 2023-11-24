require('dotenv').config();
require('module-alias/register')

process.env.LOG_LEVEL = 0; // OVERRIDE LOG LEVEL

const { log } = require('@lib/logger');

process.log = {};
process.log = log;

const app = require('../index.js'); // Load Webserver

let chai = require('chai');
let chaiHttp = require('chai-http');

chai.should();

const APIURL = 'http://localhost'

chai.use(chaiHttp);

describe('API', () => {
    // Lets wait for the server to start up...
    beforeEach(function (done) {
        setTimeout(function () {
            process.istest = true; // Disable logging of the server, since we test it anyway
            done();
        }, 1500);
    });
    describe('Framework', () => {
        it('It should get loaded plugins', (done) => {
            chai.request(APIURL)
                .get('/api/v1')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').eql('API - List of all loaded routs');
                    done();
                });
        });
    });
});