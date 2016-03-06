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
    // Get whitelist
    let whitelist = this.get();

    // Check that URL is not already in whitelist
    if (_.findIndex(whitelist, (entry) => { return entry.url === url; }) !== -1) {
      // Must already be in whitelist
      // Throw an error!
      throw new Error(`URL '${url}' is already in whitelist`);
    }
    // Not already in whitelist

    // Create new entry
    title = title || url;
    let entry = {
      title,
      url
    };
    // Add entry to whitelist
    whitelist.push(entry);
    // Save whitelist
    this.set(whitelist);
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
      return Whitelist.testURLs(url, entry.url);
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
    // Check if Chrome extension
    if (url.indexOf('chrome-extension://') !== -1) {
      return true;
    }
    // Get whitelist
    let whitelist = this.get();
    // Find entry with matching URL in whitelist
    let idx = _.findIndex(whitelist, (entry) => {
      return Whitelist.testURLs(url, entry.url);
    });
    // Allow if not idx isnt -1
    console.log('isAllowed', url, idx !== -1);
    return idx !== -1;
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
  testURLs('https://google.com','google.com'); // True
  testURLs('https://google.com','google.ca'); // False
  */
  static testURLs(a, b) {
    return (a.indexOf(b) !== -1) || (new RegExp(a)).test(b);
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

    /**
    @desc Logged in state
    */
    this.loggedIn = false;

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
      let whitelist = this.getWhitelist();
      if (!whitelist) {
        return {
          cancel: false
        };
      }
      let shouldAllow = whitelist.isAllowed(url);
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

  /**
  @desc Check if Chrome is locked.
        Locked means that an admin has signed in with their email.
  @return {boolean} Whether Chrome is locked.
  */
  isLocked() {
    return !this.isUnlocked();
  }

  /**
  @desc Check if Chrome is unlocked.
        Locked means that an admin has signed in with their email.
  @return {boolean} Whether Chrome is unlocked.
  */
  isUnlocked() {
    return !this.getEmail();
  }

  lock(email, password) {
    // Check to make sure it is not already locked
    if (this.isUnlocked()) {
      // Not already locked
      this.setEmail(email);
      this.setPassword(password);
      return this.login(email, password);
    } else {
      return this.login(email, password);
    }
  }

  unlock(email, password) {
    if (this.login(email, password)) {
      // Logged in now
      this.setEmail(null);
      this.setPassword(null);
      return this.logout();
    } else {
      // Could not login to unlock
      return false;
    }
  }

  login(email, password) {
    if (email === this.getEmail() && password === this.getPassword()) {
      this.loggedIn = true;
      this.whitelist = new Whitelist(this.getEmail());
      return true;
    } else {
      return false;
    }
  }

  logout() {
    this.loggedIn = false;
    this.whitelist = null;
  }

  /**
  @desc Get administator's email.
  @private
  @return {string} Admin email.
  */
  getEmail() {
    return localStorage['admin:email'];
  }
  /**
  @desc Set administrator's email.
  @private
  @param {string} email - The new email.
  @return {void} Void.
  */
  setEmail(email) {
    if (email === null) {
      delete localStorage['admin:email'];
    } else {
      localStorage['admin:email'] = email;
    }
  }

  /**
  @desc Get administator's password.
  @private
  @return {string} Admin password.
  */
  getPassword() {
    return localStorage['admin:password'];
  }
  /**
  @desc Set administrator's password.
  @private
  @param {string} password - The new password.
  @return {void} Void.
  */
  setPassword(password) {
    if (password === null) {
      delete localStorage['admin:password'];
    } else {
      localStorage['admin:password'] = password;
    }
  }

  /**
  @desc Get the serialized JSON form of the Whitelist.
  @return {whitelist} The whitelist JSON.
  */
  getWhitelist() {
    return this.whitelist;
    // if (this.isLocked()) {
    //   return new Whitelist(this.getEmail());
    // } else {
    //   return null;
    // }
  }

  getWhitelistJSON() {
    let whitelist = this.getWhitelist();
    if (whitelist) {
      return whitelist.get();
    } else {
      return [];
    }
  }

  addToWhitelist(title, url) {
    if (this.loggedIn && this.whitelist) {
      this.whitelist.addURL(title, url);
      return true;
    } else {
      return false;
    }
  }

  removeFromWhitelist(url) {
    if (this.loggedIn && this.whitelist) {
      this.whitelist.removeURL(url);
      return true;
    } else {
      return false;
    }
  }


}

/**
===== Main =====
Start the background script

@ignore
*/
let moderator = window.moderator = new Moderator();