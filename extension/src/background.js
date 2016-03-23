/**
@typedef {Object} whitelist_entry A whitelist entry
@property {string} title The title of the whitelist entry.
@property {string} url The URL for the whitelist entry.
*/

/**
@typedef {Array<whitelist_entry>} whitelist A whitelist array
*/

/**
@desc Whitelist component
*/
class Whitelist {

  /**
  @desc Initialize the instance.
  @private
  */
  constructor(email) {
    /**
    @desc Whitelist's Email
    @private
    */
    this.email = email;
  }

  /**
  @desc Add URL to whitelist.

  @param {string} title - Title for whitelist entry
  @param {string} url - URL for whitelist entry
  @return {boolean} Was successfully added to whitelist
  @throws {Error} URL is already in whitelist.
  @public
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
  @public
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
  @public
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
  @private
  */
  get() {
    return Whitelist.getWhitelistForEmail(this.email);
  }

  /**
  @desc Set the whitelist in localStorage.

  @param {whitelist} whitelist - The whitelist to save.
  @return {boolean} Whether successfully saved.
  @private
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
  @return {string} localStorage key for the whitelist for the given email.
  @private
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
  @private
  */
  constructor() {

    /**
    @desc Logged in state
    */
    this.loggedIn = false;
    /**
    @desc The Whitelist instance
    @private
    */
    this.whitelist = null;

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
  @public
  */
  isLocked() {
    return !this.isUnlocked();
  }

  /**
  @desc Check if Chrome is unlocked.
        Locked means that an admin has signed in with their email.
  @return {boolean} Whether Chrome is unlocked.
  @public
  */
  isUnlocked() {
    return !this.getEmail();
  }

  /**
  @desc Lock
  @return {boolean} Whether successfully locked
  @public
  */
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

  /**
  @desc Unlock
  @return {boolean} Whether successfully unlocked
  @public
  */
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

  /**
  @desc Login
  @return {boolean} Whether successfully logged in
  @public
  */
  login(email, password) {
    if (email === this.getEmail() && password === this.getPassword()) {
      this.loggedIn = true;
      this.whitelist = new Whitelist(this.getEmail());
      return true;
    } else {
      return false;
    }
  }

  /**
  @desc logout
  @return {boolean} Whether successfully logged out
  @public
  */
  logout() {
    this.loggedIn = false;
    this.whitelist = null;
    return true;
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
  @desc Get the current Whitelist instance.
  @return {Object} The whitelist instance.
  @private
  */
  getWhitelist() {
    return this.whitelist;
  }

  /**
  @desc Get the serialized JSON form of the Whitelist.
  @return {whitelist} The whitelist JSON.
  @public
  */
  getWhitelistJSON() {
    let whitelist = this.getWhitelist();
    if (whitelist) {
      return whitelist.get();
    } else {
      return [];
    }
  }

  /**
  @desc Add to Whitelist
  @return {boolean} Whether successfully added to whitelist.
  @public
  */
  addToWhitelist(title, url) {
    if (this.loggedIn && this.whitelist) {
      this.whitelist.addURL(title, url);
      return true;
    } else {
      return false;
    }
  }

  /**
  @desc Remove from Whitelist
  @return {boolean} Whether successfully removed from whitelist.
  @public
  */
  removeFromWhitelist(url) {
    if (this.loggedIn && this.whitelist) {
      this.whitelist.removeURL(url);
      return true;
    } else {
      return false;
    }
  }
  /*Toby add for chooseEntry feature*/
  chooseEntry(){
    //Allow for vendor prefixes
    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
    //create a variable that will wtore a reference to the Filesystem
    var filesystem = null;
    var form = document.getElementById('file-form');
    var filenameInput = document.getElementById('filename');
    var contentTextArea = document.getElementById('content');

    var fileList = document.getElementById('file-list');

    var messageBox = document.getElementById('messages');
    if (window.requestFileSystem){
      this.initFileSystem();
    } else {
      alert('Sorry, your bowser do not support the FileSystem API');
    }

  }
  /*error handler for chooseEntry*/
  errorHandler(error){
    var message = '';
    switch  (error.code){
  case FileError.SECURITY_ERR:
    message = 'Security Error';
    break;
  case FileError.NOT_FOUND_ERR:
    message = 'Not Found Error';
    break;
  case FileError.QUOTA_EXCEEDED_ERR:
    message = 'Quota Exceeded Error';
    break;
  case FileError.INVALID_MODIFICATION_ERR:
    message = 'Invalid Modification Error';
    break;
  case FileError.INVALID_STATE_ERR:
    message = 'Invalid State Error';
    break;
  default:
    message = 'Unknown Error';
    break;}
    console.log(message);
  }
  //Request a FileSYstem and set the filessystem variable
  initFileSystem() {
    navigator.webkitPersistentStorage.requestQuota(1024 * 1024 * 5,
        function(grantedSize) {

          // Request a file system with the new size.
          window.requestFileSystem(window.PERSISTENT, grantedSize, function(fs) {

            // Set the filesystem variable.
            filesystem = fs;

            // Setup event listeners on the form.
            this.setupFormEventListener();

            // Update the file browser.
            this.listFiles();

          }, errorHandler);

        }, errorHandler);

  }
  loadfile(filename){
    filesystem.root.getFile(filename, {}, function(fileEntry) {

      fileEntry.file(function(file) {
        var reader = new FileReader();

        reader.onload = function(e) {
          // Update the form fields.
          filenameInput.value = filename;
          contentTextArea.value = this.result;
        };

        reader.readAsText(file);
      }, this.errorHandler);

    }, this.errorHandler);
  }
  displayEntries(entries){
    // Clear out the current file browser entries.
    fileList.innerHTML = '';

    entries.forEach(function(entry, i) {
      var li = document.createElement('li');

      var link = document.createElement('a');
      link.innerHTML = entry.name;
      link.className = 'edit-file';
      li.appendChild(link);

      var delLink = document.createElement('a');
      delLink.innerHTML = '[x]';
      delLink.className = 'delete-file';
      li.appendChild(delLink);

      fileList.appendChild(li);

      // Setup an event listener that will load the file when the link
      // is clicked.
      link.addEventListener('click', function(e) {
        e.preventDefault();
        loadFile(entry.name);
      });

      // Setup an event listener that will delete the file when the delete link
      // is clicked.
      delLink.addEventListener('click', function(e) {
        e.preventDefault();
        deleteFile(entry.name);
      });
    });
  }

  listFiles(){
    var dirReader = filesystem.root.createReader();
    var entries = [];

    var fetchEntries = function() {
      dirReader.readEntries(function(results) {
        if (!results.length) {
          displayEntries(entries.sort().reverse());
        } else {
          entries = entries.concat(results);
          fetchEntries();
        }
      }, errorHandler);
    };

    fetchEntries();
  }

  /*Save a file in the FIleSystem*/

  saveFile(filename, content){
    filesystem.root.getFile(filename, {create: true}, function(fileEntry) {

      fileEntry.createWriter(function(fileWriter) {

        fileWriter.onwriteend = function(e) {
          // Update the file browser.
          listFiles();

          // Clean out the form field.
          filenameInput.value = '';
          contentTextArea.value = '';

          // Show a saved message.
          messageBox.innerHTML = 'File saved!';
        };

        fileWriter.onerror = function(e) {
          console.log('Write error: ' + e.toString());
          alert('An error occurred and your file could not be saved!');
        };

        var contentBlob = new Blob([content], {type: 'text/plain'});

        fileWriter.write(contentBlob);

      }, errorHandler);

    }, errorHandler);
  }
  deleteFile(filename){
    filesystem.root.getFile(filename, {create: false}, function(fileEntry) {

      fileEntry.remove(function(e) {
        // Update the file browser.
        listFiles();

        // Show a deleted message.
        messageBox.innerHTML = 'File deleted!';
      }, errorHandler);

    }, errorHandler);
  }
  /*add event listeners on the form*/
  setupFormEventListener(){
    form.addEventListener('submit', function(e) {
      e.preventDefault();

      // Get the form data.
      var filename = filenameInput.value;
      var content = contentTextArea.value;

      // Save the file.
      saveFile(filename, content);
    });
  }


}

/**
===== Main =====
Start the background script

@ignore
*/
let moderator = window.moderator = new Moderator();