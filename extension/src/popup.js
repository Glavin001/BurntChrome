/**
@desc Burnt Chrome namespace
*/
class Burnt {
  /**
  @desc Initialize the instance.
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
  @desc Render the template
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
    */
  bind() {
      // console.log('Bind element events');
      $('#lock').click(() => this.lock());
      $('#logout').click(() => this.logout());
      $('#unlock').click(() => this.unlock());
      $('#add-to-whitelist').click(() => this.addToWhitelist());
    }
    /**
    @desc Refresh the template
    */
  refresh() {
      this.render(this.templateId, this.getContext());
    }
    /**
    @desc Get a property on the context
    */
  get(key) {
      return _.get(this.getContext(), key);
    }
    /**
    @desc Lock
    */
  lock() {
    console.log('Lock!');
    // chrome.runtime.sendMessage({type: "login"}, (response) => {
    //   console.log('response', response);
    // });
    let context = this.getContext();
    let email = $('input[name="email"]').val() || context.email;
    let password = $('input[name="password"]').val();
    console.log(email, password);
    let successful = this.background.moderator.lock(email, password);
    console.log('successful', successful);
    this.refresh();
  }

  logout() {
    console.log('logout!');
    let successful = this.background.moderator.logout();
    console.log('successful', successful);
    this.refresh();
  }

  unlock() {
    console.log('Unlock!');
    // chrome.runtime.sendMessage({type: "login"}, (response) => {
    //   console.log('response', response);
    // });
    let context = this.getContext();
    let email = $('input[name="email"]').val() || context.email;
    let password = $('input[name="password"]').val(); // || prompt('Please confirm that you want to unlock Chrome by entering your password');
    console.log(email, password);
    if (email && password) {
      let successful = this.background.moderator.unlock(email, password);
      console.log('successful', successful);
      this.refresh();
    }
  }

  addToWhitelist() {
    console.log('addToWhitelist');
    let title = $('input[name="entry-title"]').val();
    let url = $('input[name="entry-url"]').val();
    let successful = this.background.moderator.addToWhitelist(title, url);
    if (successful) this.refresh();
  }

};

/**
Ready up!
*/
$(document).ready(() => {
  // console.log('Ready');
  let burnt = window.burnt = new Burnt();

});