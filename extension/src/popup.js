
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
      isSetup: this.background.moderator.session.isSetup(),
      isLoggedIn: this.background.moderator.session.isLoggedIn(),
      whitelist: this.background.moderator.session.whitelist ? this.background.moderator.session.whitelist.get() : [],
      adminEmail: this.background.moderator.session.getEmail()
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
    $('#setup').click(() => this.login());
    $('#sign-in').click(() => this.login());
    $('#logout').click(() => this.logout());
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
  @desc Login
  @deprecated Login will be outsourced to Google's chrome.identity API
  */
  login() {
    console.log('Login!');
    // chrome.runtime.sendMessage({type: "login"}, (response) => {
    //   console.log('response', response);
    // });
    this.background.moderator.session.login((error, userInfo) => {
      console.log('userInfo', userInfo, error);
      this.refresh();
    });
  }

  logout() {
    console.log('logout!');
    this.background.moderator.session.logout((error) => {
      console.log('error', error);
      this.refresh();
    });
  }

};

/**
Ready up!
*/
$(document).ready(() => {
  // console.log('Ready');
  let burnt = window.burnt = new Burnt();

});








