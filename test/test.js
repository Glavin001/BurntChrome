let assert = require('assert');
let {
  Whitelist
} = require('../extension/src/background');

describe('Whitelist', () => {
  describe('#testURLs', () => {

    describe('Pattern without suffix /**', () => {

      it('should allow URLs with each pattern', () => {
        assert.equal(Whitelist.testURLs('http://www.cbc.ca', 'www.cbc.ca'), true);
        assert.equal(Whitelist.testURLs('http://www.cbc.ca', 'http://www.cbc.ca'), true);
        assert.equal(Whitelist.testURLs('http://www.cbc.ca', '*://www.cbc.ca'), true);

        assert.equal(Whitelist.testURLs('http://www.cbc.ca/', 'www.cbc.ca'), true);
        assert.equal(Whitelist.testURLs('http://www.cbc.ca/', 'http://www.cbc.ca'), true);
        assert.equal(Whitelist.testURLs('http://www.cbc.ca/', '*://www.cbc.ca'), true);

      });

      it('should reject URLs with each pattern', () => {

        assert.equal(Whitelist.testURLs('http://www.cbc.ca/path', 'www.cbc.ca'), false);
        assert.equal(Whitelist.testURLs('http://www.cbc.ca/path', 'http://www.cbc.ca'), false);
        assert.equal(Whitelist.testURLs('http://www.cbc.ca/path', '*://www.cbc.ca'), false);

        assert.equal(Whitelist.testURLs('http://www.cbc.ca/', 'www.cbc.ca/*'), false);
        assert.equal(Whitelist.testURLs('http://www.cbc.ca/', 'http://www.cbc.ca/*'), false);
        assert.equal(Whitelist.testURLs('http://www.cbc.ca/', '*://www.cbc.ca/*'), false);

      });

    });

    describe('Pattern with suffix /**', () => {
      it('should allow URLs with each pattern', () => {

        assert.equal(Whitelist.testURLs('http://www.cbc.ca', 'www.cbc.ca/**'), true);
        assert.equal(Whitelist.testURLs('http://www.cbc.ca', 'http://www.cbc.ca/**'), true);
        assert.equal(Whitelist.testURLs('http://www.cbc.ca', '*://www.cbc.ca/**'), true);

        assert.equal(Whitelist.testURLs('http://www.cbc.ca/', 'www.cbc.ca/**'), true);
        assert.equal(Whitelist.testURLs('http://www.cbc.ca/', 'http://www.cbc.ca/**'), true);
        assert.equal(Whitelist.testURLs('http://www.cbc.ca/', '*://www.cbc.ca/**'), true);

        assert.equal(Whitelist.testURLs('http://www.cbc.ca/path', 'www.cbc.ca/**'), true);
        assert.equal(Whitelist.testURLs('http://www.cbc.ca/path', 'http://www.cbc.ca/**'), true);
        assert.equal(Whitelist.testURLs('http://www.cbc.ca/path', '*://www.cbc.ca/**'), true);

      });

    });

    describe('Pattern matches exactly one of the patterns provided (`@(pattern|pat*|pat?erN)`)', () => {

      it('should allow URLs with each pattern', () => {
        assert.equal(Whitelist.testURLs('http://www.cbc.ca', 'www.cbc.@(ca|com)'), true);
        assert.equal(Whitelist.testURLs('http://www.cbc.ca', 'http://www.cbc.@(ca|com)'), true);
        assert.equal(Whitelist.testURLs('http://www.cbc.ca', '*://www.cbc.@(ca|com)'), true);

        assert.equal(Whitelist.testURLs('http://www.cbc.ca/', 'www.cbc.@(ca|com)'), true);
        assert.equal(Whitelist.testURLs('http://www.cbc.ca/', 'http://www.cbc.@(ca|com)'), true);
        assert.equal(Whitelist.testURLs('http://www.cbc.ca/', '*://www.cbc.@(ca|com)'), true);

        assert.equal(Whitelist.testURLs('http://www.cbc.ca', '@(http|https)://www.cbc.ca'), true);
        assert.equal(Whitelist.testURLs('https://www.cbc.ca', '@(http|https)://www.cbc.ca'), true);

      });

      it('should reject URLs with each pattern', () => {

        assert.equal(Whitelist.testURLs('http://www.cbc.co', 'www.cbc.@(ca|com)'), false);
        assert.equal(Whitelist.testURLs('http://www.cbc.co', 'http://www.cbc.@(ca|com)'), false);
        assert.equal(Whitelist.testURLs('http://www.cbc.co', '*://www.cbc.@(ca|com)'), false);

        assert.equal(Whitelist.testURLs('http://www.cbc.co/', 'www.cbc.@(ca|com)'), false);
        assert.equal(Whitelist.testURLs('http://www.cbc.co/', 'http://www.cbc.@(ca|com)'), false);
        assert.equal(Whitelist.testURLs('http://www.cbc.co/', '*://www.cbc.@(ca|com)'), false);

        assert.equal(Whitelist.testURLs('ftp://www.cbc.ca', '@(http|https)://www.cbc.ca'), false);
        assert.equal(Whitelist.testURLs('ftp://www.cbc.ca', '@(http|https)://www.cbc.ca'), false);

      });

    });

    describe('Pattern using optional (`?(pattern)`)', () => {

      it('should allow URLs with each pattern', () => {
        assert.equal(Whitelist.testURLs('http://www.cbc.ca', '?(www.)cbc.ca'), true);
        assert.equal(Whitelist.testURLs('http://cbc.ca', '?(www.)cbc.ca'), true);

        assert.equal(Whitelist.testURLs('http://www.cbc.ca', 'http?(s)://www.cbc.ca'), true);
        assert.equal(Whitelist.testURLs('https://www.cbc.ca', 'http?(s)://www.cbc.ca'), true);

        assert.equal(Whitelist.testURLs('http://www.cbc.ca', '*://www.cbc.ca'), true);

        assert.equal(Whitelist.testURLs('http://www.cbc.ca/', 'www.cbc.ca'), true);
        assert.equal(Whitelist.testURLs('http://www.cbc.ca/', 'http://www.cbc.ca'), true);
        assert.equal(Whitelist.testURLs('http://www.cbc.ca/', '*://www.cbc.ca'), true);

      });

      it('should reject URLs with each pattern', () => {

        assert.equal(Whitelist.testURLs('http://www.cbc.ca/path', 'www.cbc.ca'), false);
        assert.equal(Whitelist.testURLs('http://www.cbc.ca/path', 'http://www.cbc.ca'), false);
        assert.equal(Whitelist.testURLs('http://www.cbc.ca/path', '*://www.cbc.ca'), false);

      });

    });


  });
});