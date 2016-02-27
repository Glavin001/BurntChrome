/**
@typedef {Object} whitelist_entry A whitelist entry
@property {string} title The title of the whitelist entry.
@property {string} url The URL for the whitelist entry.
*/

/**
@typedef {Array<whitelist_entry>} whitelist A whitelist array
*/

/**
@desc TODO helper indicating at runtime that a method is not yet implemented.

@throws {Error} Not yet implemented.
*/
function TODO() {
  throw new Error('Not yet implemented.');
}

/**
@desc Session component
*/
class Session {

  /**
  @desc Initialize the instance.
  */
  constructor() {

  }

  /**
  @desc Get User's OAuth 2.0 authentication token
  @param {function(error: Error, token: string)} callback The callback
  */
  getToken(callback) {
    console.log('getToken');
    return chrome.identity.getAuthToken({
      interactive: true
    }, (token) => {
      console.log('token', token);
      return callback(chrome.runtime.lastError, token);
    });
  }

  /**
  @desc Login for the primary administrator.

  @param {function(error: Error, userInfo: Object)} callback The callback function
  @see https://developer.chrome.com/apps/identity
  @see https://developer.chrome.com/apps/app_identity
  */
  login(callback) {
    console.log('login');
    return this.getToken((error, token) => {
      console.log('token', token, error);
      if (error) {
        return callback(error);
      }
      return chrome.identity.getProfileUserInfo((userInfo) => {
        console.log('userInfo', userInfo);
        return callback(chrome.runtime.lastError, userInfo);
      });
    });
  }

}

/**
@desc Whitelist component
*/
class Whitelist {

  /**
  @desc Initialize the instance.
  */
  constructor(email) {
    /**
    @desc Whitelist's Email
    */
    this.email = email;
  }

  /**
  @desc Add URL to whitelist.

  @param {string} title - Title for whitelist entry
  @param {string} url - URL for whitelist entry
  @return {boolean} Was successfully added to whitelist
  @throws {Error} URL is already in whitelist.
  */
  addURL(title, url) {
    // Check that URL is not already in whitelist
    if (this.isAllowed(url)) {
      // Must already be in whitelist
      // Throw an error!
      throw new Error(`URL '${url}' is already in whitelist`);
    }
    // Not already in whitelist

    // Get whitelist
    let whitelist = this.get();
    // Create new entry
    let entry = {
      title,
      url
    };
    // Add entry to whitelist
    whitelist.push(entry);
    // Save whitelist
    set(whitelist);
    // Return successful
    return true;
  }

  /**
  @desc Remove URL from whitelist
  @param {string} url - The URL to remove from the whitelist
  @return {whitelist} whitelist The updated whitelist
  */
  removeURL(url) {
    // Get whitelist
    let whitelist = this.get();
    // Find entry with matching URL in whitelist
    // Remove entry
    whitelist = _.remove(whitelist, (entry) => {
      return Whitelist.matchURLs(url, entry.url);
    });
    // Save new whitelist
    this.set(whitelist);
    return whitelist;
  }

  /**
  @desc Check if URL is allowed
  @param {string} url - The URL to check if whitelist allows.
  @return {boolean} Whether the URL is allowed.
  */
  isAllowed(url) {
    // Get whitelist
    let whitelist = this.get();
    // Find entry with matching URL in whitelist
    let idx = _.findIndex(whitelist, (entry) => {
      return Whitelist.matchURLs(url, entry.url);
    });
    // Allow if not idx isnt -1
    // return idx !== -1;
    return true;
  }

  /**
  @desc Sync

  @see https://developer.chrome.com/extensions/storage
  @todo Implement.
  */
  sync(callback) {
    TODO();
  }

  /**
  @desc Get the whitelist in localStorage.

  @return {whitelist} The whitelist.
  */
  get() {
    return Whitelist.getWhitelistForEmail(this.email);
  }

  /**
  @desc Set the whitelist in localStorage.

  @param {whitelist} whitelist - The whitelist to save.
  @return {boolean} Whether successfully saved.
  */
  set(whitelist) {
    return Whitelist.setWhitelistForEmail(this.email, whitelist);
  }

  /**
  @desc Test URLs.
  @param {string} a - URL to test against. Can be a RegExp.
  @param {string} b - URL to test with.
  @return {boolean} If URL `a` matches URL `b`
  @private
  @example
  testURLs('google.com','google.com'); // True
  testURLs('google.com','google.ca'); // False
  */
  testURLs(a, b) {
    return (new RegExp(a)).test(b);
  }

  /**
  @desc Get the key to lookup in localStorage for the whitelist.
  @private
  @return {string} localStorage key for the whitelist for the given email.
  */
  static getWhitelistKeyForEmail(email) {
    return 'whitelist:' + email;
  }

  /**
  @desc Get the whitelist from localStorage
  @private
  @return {whitelist} The whitelist
  @see https://developer.chrome.com/extensions/storage
  @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
  */
  static getWhitelistForEmail(email) {
    let key = Whitelist.getWhitelistKeyForEmail(email);
    let whitelist = localStorage[key];
    if (typeof whitelist === 'string') {
      return JSON.parse(whitelist);
    }
    /*
      else if (typeof whitelist === 'object') {
      return whitelist;
    } */
    else {
      //console.warn('Unknown whitelist type: ', typeof whitelist, whitelist);
      return [];
    }
  }

  /**
  @desc Set the whitelist in localStorage
  @private
  @param {string} email - The admin's email address.
  @param {whitelist} whitelist - The whitelist to save.
  @return {boolean} Whether successfully saved.
  @see https://developer.chrome.com/extensions/storage
  @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
  */
  static setWhitelistForEmail(email, whitelist) {
    let key = Whitelist.getWhitelistKeyForEmail(email);
    if (typeof whitelist !== 'string') {
      whitelist = JSON.stringify(whitelist);
    }
    localStorage[key] = whitelist;
    // Return successful
    return true;
  }

}

/**
@desc Moderator component
*/
class Moderator {

  /**
  @desc Initialize the instance.
  */
  constructor() {

    var email = 'glavin.wiechert@gmail.com';

    // Initialize related classes
    /**
    @desc Session
    */
    this.session = new Session();

    /**
    @desc Whitelist to moderate
    */
    this.whitelist = new Whitelist(email);

    // Event listeners
    this.setupListeners();

  }

  /**
  @desc Setup all event listeners.

  @see https://developer.chrome.com/extensions/webRequest
  @listens {onBeforeRequest} Listens for before requests
  @private
  */
  setupListeners() {
    // Request listener
    chrome.webRequest.onBeforeRequest.addListener((info) => {
      var url = info.url;
      let shouldAllow = this.whitelist.isAllowed(url);
      // console.log('URL: ', url, shouldAllow);
      return {
        cancel: !shouldAllow
      };
    }, {
      urls: ["<all_urls>"]
    }, ["blocking"]);

    // Message Passing listener
    chrome.runtime.onMessage.addListener(
      (request, sender, sendResponse) => {
        console.log(sender.tab ?
          "from a content script:" + sender.tab.url :
          "from the extension");
        if (request.type == "login") {
          // Login!
          this.session.login((error, userInfo) => {
            console.log('userInfo', userInfo, error);
            sendResponse(userInfo);
          });
        } else {
          console.warn('Unknown message type', request);
        }
      });

  }

}

/**
===== Main =====
Start the background script

@ignore
*/
let moderator = window.moderator = new Moderator();