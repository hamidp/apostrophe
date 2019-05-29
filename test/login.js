const t = require('../test-lib/test.js');
const assert = require('assert');
const request = require('request-promise');

let apos;

describe('Login', function() {

  this.timeout(20000);

  after(function() {
    return t.destroy(apos);
  });

  // EXISTENCE

  it('should initialize', async function() {
    apos = await require('../index.js')({
      root: module,
      shortName: 'test',
      argv: {
        _: []
      },
      modules: {
        'apostrophe-express': {
          port: 7901,
          csrf: false,
          address: 'localhost',
          session: {
            secret: 'Cursus'
          }
        }
      },
      afterInit: function(callback) {
        // return callback(null);
      }
    });

    assert(apos.modules['apostrophe-login']);
    assert(apos.users.safe.remove);
    const response = await apos.users.safe.remove({});
    assert(response.result.ok === 1);
  });

  it('should be able to insert test user', async function() {
    assert(apos.users.newInstance);
    const user = apos.users.newInstance();
    assert(user);

    user.firstName = 'Harry';
    user.lastName = 'Putter';
    user.title = 'Harry Putter';
    user.username = 'HarryPutter';
    user.password = 'crookshanks';
    user.email = 'hputter@aol.com';

    assert(user.type === 'apostrophe-user');
    assert(apos.users.insert);
    const doc = await apos.users.insert(apos.tasks.getReq(), user);
    assert(doc._id);
  });

  it('should not see logout link yet', async function() {
    // otherwise logins are not remembered in a session
    request.jar();

    const response = await request({
      uri: 'http://localhost:7901/',
      resolveWithFullResponse: true
    });

    // Is our status code good?
    assert.strictEqual(response.statusCode, 200);
    // Did we get our page back?
    assert(response.body.match(/login/));
    assert(!response.body.match(/logout/));
  });

  const loginLogoutJar = request.jar();
  const loginEmailLogoutJar = request.jar();

  it('should be able to login a user', async function() {
    // otherwise logins are not remembered in a session
    const response = await request({
      method: 'POST',
      uri: 'http://localhost:7901/login',
      form: {
        username: 'HarryPutter',
        password: 'crookshanks'
      },
      jar: loginLogoutJar,
      followAllRedirects: true,
      json: true,
      resolveWithFullResponse: true
    });

    // Is our status code good?
    assert.strictEqual(response.statusCode, 200);
    // Did we get our page back?
    assert(response.body.match(/logout/));
  });

  it('should be able to login a user with their email', async function() {
    // otherwise logins are not remembered in a session
    const response = await request({
      method: 'POST',
      uri: 'http://localhost:7901/login',
      form: {
        username: 'hputter@aol.com',
        password: 'crookshanks'
      },
      followAllRedirects: true,
      jar: loginEmailLogoutJar,
      resolveWithFullResponse: true
    });

    // Is our status code good?
    assert.strictEqual(response.statusCode, 200);
    // Did we get our page back?
    assert(response.body.match(/logout/));
  });

  it('should be able to log out', async function() {
    // otherwise logins are not remembered in a session
    const response = await request({
      uri: 'http://localhost:7901/logout',
      followAllRedirects: true,
      jar: loginLogoutJar,
      resolveWithFullResponse: true
    });

    // Is our status code good?
    assert.strictEqual(response.statusCode, 200);
    // are we back to being able to log in?
    assert(response.body.match(/login/));
  });

  it('should be able to log out after having logged in with email', async function() {
    // otherwise logins are not remembered in a session
    const response = await request({
      uri: 'http://localhost:7901/logout',
      followAllRedirects: true,
      jar: loginEmailLogoutJar,
      resolveWithFullResponse: true
    });

    // Is our status code good?
    assert.strictEqual(response.statusCode, 200);
    // are we back to being able to log in?
    assert(response.body.match(/login/));
  });
});
