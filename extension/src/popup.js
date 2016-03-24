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
      email: this.background.moderator.getEmail()
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
    // console.log(email, password);
    let successful = this.background.moderator.lock(email, password);
    console.log('successful', successful);
    this.refresh();
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
  }

  /**
  @desc Unlock
  @public
  */
  unlock() {
    // console.log('Unlock!');
    let context = this.getContext();
    let email = $('input[name="email"]').val() || context.email;
    let password = $('input[name="password"]').val(); // || prompt('Please confirm that you want to unlock Chrome by entering your password');
    // console.log(email, password);
    if (email && password) {
      let successful = this.background.moderator.unlock(email, password);
      // console.log('successful', successful);
      this.refresh();
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
    let successful = this.background.moderator.addToWhitelist(title, url);
    if (successful) this.refresh();
  }

  removeFromWhitelist(url) {
    let successful = this.background.moderator.removeFromWhitelist(url);
    if (successful) this.refresh();
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
