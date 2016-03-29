/**
@typedef {Array<whitelist_entry>} whitelist A whitelist array
*/

/**
@desc Popup view for Burnt Chrome
*/
class Popup {
  /**
  @desc Initialize the instance.
  @private
  */
  constructor() {
    // Setup defaults
    /**
    Background page.
    */
    this.background = chrome.extension.getBackgroundPage();
    /**
    Template element ID
    */
    this.templateId = 'frame';

    /**
    Static form data
    */
    this.formData = {}

    /**
    Last error message
    */
    this.lastErrorMessage = "";

    //
    this.setupTemplates();

    // Render initial page
    this.refresh();
  }

  /**
  @desc Setup handlebars views to render compiled templates to.
  @private
  */
  setupTemplates() {
    let handlebarsSelector = 'script[type="text/x-handlebars-template"]';
    $(handlebarsSelector).each((index, $el) => {
      // console.log($el, $el.id);
      var templateId = $el.id;
      if (!templateId) {
        return console.warn("Unknown id for element: ", $el);
      }
      let containerId = templateId.split('-template')[0];
      $($el).after($(`<div id="${containerId}"></div>`));
    });
  }

  /**
  @desc Generate the context to pass to the template to render.
  @private
  */
  getContext() {
    return {
      isLoggedIn: this.background.moderator.loggedIn,
      isLocked: this.background.moderator.isLocked(),
      isUnlocked: this.background.moderator.isUnlocked(),
      whitelist: this.background.moderator.getWhitelistJSON(),
      email: this.background.moderator.getEmail(),
      errorMessage: this.lastErrorMessage
    };
  }

  /**
  @desc Render the template with a context
  @private
  */
  render(id, context) {
    console.log('render', context);
    let el = document.getElementById(`${id}-template`);
    let source = el.innerHTML;
    let template = Handlebars.compile(source);
    let html = template(context);
    document.getElementById(id).innerHTML = html;
    // console.log('html', html);
    // Bind events
    this.bind();
  }

  /**
  @desc Bind the events
  @private
  */
  bind() {
    // console.log('Bind element events');
    $('#lock').click(() => this.lock());
    $('#logout').click(() => this.logout());
    $('#unlock').click(() => this.unlock());
    $('#add-to-whitelist').click(() => this.addToWhitelist());
    $('.delete').click(() => this.removeFromWhitelist(event.target.id));
    $('#loginIntro').click(() => this.loginIntro());
    $('#listIntro').click(() => this.listIntro());
    $('#lockedIntro').click(() => introJs().start());
    $('#export-whitelist').click(() => {
      let whitelistJSON = JSON.stringify(this.background.moderator.getWhitelistJSON());
      let email = this.background.moderator.getEmail();
      let fileName = `Whitelist for ${email}.json`;
      this.downloadData(fileName, whitelistJSON, "application/json");
    });
    $('#import-whitelist-file').change((event) => {
      let $el = $(event.currentTarget);
      // Source: http://stackoverflow.com/a/13747921/2578205
      let file = $el.prop('files')[0];
      let reader = new FileReader();
      reader.onload = () => {
        let data = reader.result;
        let json = JSON.parse(data);
        // Add each entry to current whitelist
        this.importWhitelist(json);
      };
      reader.readAsText(file);
    });
    $('#import-whitelist').click((event) => {
      let url = $('#import-whitelist-url').val();
      if (!url) {
        // Invalid URL
        return this.showError(new Error('Enter a URL to import whitelist from.'));
      } else {
        // Temporarily disable
        this.background.moderator.disable();

        let callback = (error) => {
          if (error) {
            this.showError(error);
          }
          // Re-enable
          this.background.moderator.enable();
        };

        // Source: https://developers.google.com/web/updates/2015/03/introduction-to-fetch?hl=en
        fetch(url)
        .then((response) => {
          if (response.status !== 200) {
            callback(new Error(`An error occurred reading ${url}`));
          } else {
            response.json().then((data) => {
              this.importWhitelist(data);
              callback();
            }).catch(callback);
          }
        })
        .catch(callback);
      }
    });

    // Clicking a whitelist entry fill in entry fields above
    $('.whitelist-entry').click((event) => {
      event.preventDefault();
      // console.log('whitelist-entry click', event, this);
      let $el = $(event.currentTarget);
      let title = $el.data('title');
      let url = $el.data('url');
      $('input[name="entry-title"]').val(title).change();
      $('input[name="entry-url"]').val(url).change();
    });

    // When Enter is pressed while focus is inside of password field
    // Login automatically
    $('input[name="password"]').keyup((event) => {
      if (event.keyCode === 13) {
        this.lock();
      }
    });
    // When Enter is pressed while focus is inside of password field
    // Login automatically
    $('input[name="entry-url"]').keyup((event) => {
      if (event.keyCode === 13) {
        this.addToWhitelist();
      }
    });

    // Make sure that input elements do not
    // have their value cleared when template is refreshed.
    // So every change to input, we store the state
    // On refresh, we sync the last state of the input field
    // back into the input field.
    const attr = "name";
      // We store state in formData property
    const formData = this.formData;
    // Iterate over all Input fields that should be syncing their value
    $(`input[type="text"][${attr}]`).each((idx, el) => {
      let $el = $(el);
      // Get the key to sync with in the formData
      let key = $el.attr(attr);
      // Get current value of input
      let val = _.get(formData, key);
      $el.val(val);
      // console.log($el, attr, key, val);

      // Handle changing input value
      // and storing state
      let changeHandler = (event) => {
          let text = $(event.currentTarget).val();
          // console.log(key, text);
          _.set(formData, key, text);
        }
        // Bind events to listen for changes to input field
      $el.change(changeHandler);
      $el.keyup(changeHandler);
    });

  }

  /**
  @desc Refresh the template
  @private
  */
  refresh() {
    this.render(this.templateId, this.getContext());
  }

  /**
  @desc Lock
  @public
  */
  lock() {
    // console.log('Lock!');
    let context = this.getContext();
    let email = $('input[name="email"]').val() || context.email;
    let password = $('input[name="password"]').val();

    let emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    let emailValid = (emailPattern.test(email) && email !== null);
    let passwordValid = (password !== "" && password !== null);
    $('#emailError').toggleClass("errorshow", !emailValid);
    $('#passwordError').toggleClass("errorshow", !passwordValid);

    if (emailValid && passwordValid) {
      // console.log(email, password);
      let successful = this.background.moderator.lock(email, password);
      // console.log('successful', successful);
      this.refresh();
      introJs().exit();
      $('#passwordError').toggleClass("errorshow", !successful);
    }
  }

  /**
  @desc Logout
  @public
  */
  logout() {
    // console.log('logout!');
    let successful = this.background.moderator.logout();
    // console.log('successful', successful);
    this.refresh();
    introJs().exit();
  }

  /**
  @desc Unlock
  @public
  */
  unlock() {
    // console.log('Unlock!');
    let context = this.getContext();
    let email = context.email;
    if (context.isLoggedIn) {
      let successful = this.background.moderator.unlock(email, null);
      this.refresh();
      introJs().exit();
      return;
    }
    let password = $('input[name="password"]').val();

    let passwordValid = (password !== "" && password !== null);
    $('#passwordError').toggleClass("errorshow", !passwordValid);
    // console.log(email, password);
    if (passwordValid) {
      let successful = this.background.moderator.unlock(email, password);
      this.refresh();
      introJs().exit();
      $('#passwordError').toggleClass("errorshow", !successful);
    }
  }

  /**
  @desc Add to Whitelist
  @public
  */
  addToWhitelist() {
    // console.log('addToWhitelist');
    let title = $('input[name="entry-title"]').val();
    let url = $('input[name="entry-url"]').val();
    try {
      let successful = this.background.moderator.addToWhitelist(title, url);
      if (successful) {
        // Clear fields
        $('input[name="entry-title"]').val('').change();
        $('input[name="entry-url"]').val('').change();
        // Refresh UI
        this.refresh();
      }
    } catch (error) {
      this.showError(error);
    }
  }

  /**
  @desc Remove entry from whitelist
  @public
  @param {string} url - URL pattern in an existing whitelist entry
  */
  removeFromWhitelist(url) {
    let successful = this.background.moderator.removeFromWhitelist(url);
    if (successful) this.refresh();
  }

  /**
  @desc Show error in User Interface
  @public
  @param {Error} error - The error to show
  */
  showError(error) {
    let message = error.message;
    this.lastErrorMessage = message
    this.refresh();
    // $('#entryError').text(message).toggleClass("errorshow", !error);
  }

  /**
  @desc Import entries from an existing whitelist
  @public
  @param {whitelist} whitelist - An existing whitelist to copy entries from
  */
  importWhitelist(whitelist) {
    _.each(whitelist, ({
      title,
      url
    }) => {
      try {
        this.background.moderator.addToWhitelist(title, url);
      } catch (error) {
        this.showError(error);
      }
    });
    this.refresh();
  }

  /**
  @desc Show IntroJS tutorial for login page
  */
  loginIntro() {
    let intro = introJs();
    intro.setOptions({
      steps: [{
        intro: 'Welcome to Burnt Chrome!<br>If this is your first time \
        using Burnt Chrome, use these steps to get started!'
      }, {
        element: document.querySelector('input[name="email"]'),
        intro: 'First lets create your account. Please enter a valid \
        email address.',
        position: 'right'
      }, {
        element: document.querySelector('input[name="password"]'),
        intro: 'Next, choose the password you would like to use.',
        position: 'right'
      }, {
        element: document.querySelector('#lock'),
        intro: 'Click \"login and lock\" to login and setup your whitelist!',
        position: 'left'
      }]
    });
    intro.start();
  }

  /**
  @desc Show IntroJS tutorial for whitelist list page
  */
  listIntro() {
    let intro = introJs();
    intro.setOptions({
      steps: [{
        intro: 'Welcome to your whitelist!<br>Only websites on your list will be available \
          while your browser is locked with Burnt Chrome. Lets get started by adding some entries.'
      }, {
        element: document.querySelector('input[name="entry-title"]'),
        intro: 'First give your entry a title or short description.',
        position: 'right'
      }, {
        element: document.querySelector('input[name="entry-url"]'),
        intro: 'Next, enter the URL you wish to permit.',
        position: 'right'
      }, {
        element: document.querySelector('#add-to-whitelist'),
        intro: 'Click here to add your entry to the whitelist.',
        position: 'right'
      }, {
        element: document.querySelector('#options'),
        intro: 'Click here for more options.',
        position: 'bottom'
      }, {
        element: document.querySelector('#export-whitelist'),
        intro: 'Click here to export your current whitelist to a file.',
        position: 'right'
      }, {
        element: document.querySelector('#import-whitelist-file'),
        intro: 'Click here to import a whitelist from a file.',
        position: 'right'
      }, {
        element: document.querySelector('#import-whitelist-url'),
        intro: 'Enter a URL to read and import a remote whitelist from.',
        position: 'right'
      }, {
        element: document.querySelector('#import-whitelist'),
        intro: 'Click here to start importing a remote whitelist from the URL you previously entered.',
        position: 'right'
      }, {
        element: document.querySelector('#logout'),
        intro: 'When finished logout. Browsing will remain locked \
          to your whitelist until you choose to unlock it.',
        position: 'right'
      }, {
        element: document.querySelector('#unlock'),
        intro: 'Click here to logout and unlock your browser.',
        position: 'right'
      }]
    });
    intro.start();
  }

  /**
  @desc Download the given data to the users computer as a file
  @param {string} name - Name of the file
  @param {string} data - Contents of the file
  @param {string} type - MIME type of the file
  */
  downloadData(name, data, type) {
    // Browser support
    window.URL = window.URL || window.webkitURL;
    // Arg defaults
    type = type || "text/plain";
    name = name || "download";
    data = data || "";
    // Create Blob
    let blob;
    if (data instanceof Blob) {
      blob = data;
    } else {
      blob = new Blob([data], {
        type: type
      });
    }
    let url = window.URL.createObjectURL(blob)
      // Create link
    let link = document.createElement("a")
    link.download = name
    link.href = url
      // Download!
      // See http://stackoverflow.com/a/25047811/2578205 for more details
    let event = document.createEvent("MouseEvents")
    event.initMouseEvent(
      "click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null
    )
    link.dispatchEvent(event)
  }

};
/**
Ready up!

@ignore
*/
$(document).ready(() => {
  // console.log('Ready');
  let burnt = window.burnt = new Popup();

});
