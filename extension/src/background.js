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
    /**
    @desc Whitelist to moderate
    */
    this.whitelist = null;
    /**
    @desc Administrator's Token
    */
    this.token = null;

    this.setup();

  }

  setup() {
    //
    if (this.isSetup()) {
      // Is Setup

    } else {
      // Is not setup

    }

  }

  /**
  @desc Get User's OAuth 2.0 authentication token
  @param {function(error: Error, token: string)} callback The callback
  */
  getAuthToken(callback) {
    // console.log('getAuthToken');
    return chrome.identity.getAuthToken({
      interactive: true
    }, (token) => {
      // console.log('token', chrome.runtime.lastError, token);
      return callback(chrome.runtime.lastError, token);
    });
  }

  /**
  @desc Get Profile User Info
  @param {function(error: Error, userInfo: Object)} callback The callback
  */
  getProfileUserInfo(callback) {
    // console.log('getProfileUserInfo');
    return chrome.identity.getProfileUserInfo((userInfo) => {
      // console.log('userInfo', userInfo);
      return callback(chrome.runtime.lastError, userInfo);
    });
  }

  /**
  @desc Login for the primary administrator.

  @param {function(error: Error, whitelist: whitelist)} callback The callback function
  @see https://developer.chrome.com/apps/identity
  @see https://developer.chrome.com/apps/app_identity
  */
  login(callback) {
    console.log('login');
    return this.getAuthToken((error, token) => {
      console.log('token', error, token);
      if (error) {
        return callback(error);
      }
      // Save token
      this.token = token;
      // Get User info
      return this.getProfileUserInfo((error, userInfo) => {
        console.log('userInfo', error, userInfo);
        if (error) {
          return callback(error);
        }
        let email = userInfo.email;
        this.setEmail(email);
        let whitelist = new Whitelist(email);
        return callback(null, whitelist);
      });
    });
  }

  /**
  @desc Removes an OAuth2 access token from the Identity API's token cache.

  @param {function(error: Error)} callback The callback function
  @see https://developer.chrome.com/apps/identity
  @see http://stackoverflow.com/a/27344088/2578205
  */
  logout(callback) {
    // this.getAuthToken((error, token) => {
    //   console.log('logout token', error, token);
    //   if (error) {
    //     return callback(error);
    //   }
      // console.log('getAuthToken');
      return chrome.identity.removeCachedAuthToken({
        token: this.token
      }, () => {
        chrome.identity.launchWebAuthFlow(
            {
              'url': 'https://accounts.google.com/logout',
              interactive: true
              // url: `https://accounts.google.com/o/oauth2/revoke?token=${token}`,
              // interactive: false
            },
            (tokenUrl) => {
                this.token = null;
                callback(chrome.runtime.lastError);
            }
        );
        // console.log('token', token);
        // this.token = null;
        // return callback(chrome.runtime.lastError);
      });
    // });
  }

  /**
  @desc Check if already setup with an administrator.
  @return {boolean} Whether already setup.
  */
  isSetup() {
    return !!this.getEmail();
  }

  /**
  @desc Check if admin is logged in.
  @return {boolean} Whether admin is logged in.
  */
  isLoggedIn() {
    console.log('isLoggedIn', this.token);
    return !!this.token;
  }

  /**
  @desc Get administator's email.
  @return {string} Admin email.
  */
  getEmail() {
    return localStorage['admin:email'];
  }

  setEmail(email) {
    localStorage['admin:email'] = email;
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

    // Initialize related classes
    /**
    @desc Session
    */
    this.session = new Session();

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
      if (!this.session.whitelist) {
        return {
          cancel: false
        };
      }
      let shouldAllow = this.session.whitelist.isAllowed(url);
      // console.log('URL: ', url, shouldAllow);
      return {
        cancel: !shouldAllow
      };
    }, {
      urls: ["<all_urls>"]
    }, ["blocking"]);

    // Message Passing listener
    // chrome.runtime.onMessage.addListener(
    //   (request, sender, sendResponse) => {
    //     console.log(sender.tab ?
    //       "from a content script:" + sender.tab.url :
    //       "from the extension");
    //     if (request.type == "login") {
    //       // Login!
    //       this.session.login((error, userInfo) => {
    //         console.log('userInfo', userInfo, error);
    //         sendResponse(userInfo);
    //       });
    //     } else {
    //       console.warn('Unknown message type', request);
    //     }
    //   });

  }

}

/**
===== Main =====
Start the background script

@ignore
*/
let moderator = window.moderator = new Moderator();