// This tests a function to find the lowest default group of a user.
// The default group is a group that must be in every permissions chain, as the application needs it to separate users from members.
// Users are not assosiated with the party, while members are part of party.

require('dotenv').config();
require('module-alias/register')

let chai = require('chai');
const { getNextLowerDefaultGroup } = require('@lib/permission');
const { default_group, default_member_group } = require("@config/permissions.js");


describe('getNextLowerDefaultGroup', () => {
    // Every Group needs to be validated, from the config file.
    const groups_keys_default = ["user"];
    const groups_keys_member = ["member", "admin", "kassierer", "schriftführer", "obmann"];

    for (let key of groups_keys_default) {
        it(`It should return the default group for ${key}`, (done) => {
            let result = getNextLowerDefaultGroup(key);
            chai.expect(result).to.equal(default_group);
            done();
        });
    }

    for (let key of groups_keys_member) {
        it(`It should return the member group for ${key}`, (done) => {
            let result = getNextLowerDefaultGroup(key);
            chai.expect(result).to.equal(default_member_group);
            done();
        });
    }

});