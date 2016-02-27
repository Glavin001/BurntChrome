
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
    /**
    Context to give to template to generate HTML
    @private
    */
    this.__context = {
      isLoggedIn: false,
      whitelist: [
        {
          title: 'Google',
          url: 'google.com'
        },
        {
          title: 'Facebook',
          url: 'facebook.com'
        },
        {
          title: 'Twitter',
          url: 'twitter.com'
        },
        {
          title: 'How to Cheat on Exams 101',
          url: 'cheatingonexams101.com'
        },
      ]
    };

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
    // Render initial page
    this.refresh();
  }
  /**
  @desc Render the template
  */
  render(id, context) {
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
    $('#sign-in').click(() => this.login());
  }
  /**
  @desc Refresh the template
  */
  refresh() {
    this.render(this.templateId, this.__context);
  }
  /**
  @desc Set a property on the context
  */
  set(key, val) {
    _.set(this.__context, key, val);
    this.refresh();
  }
  /**
  @desc Get a property on the context
  */
  get(key) {
    return _.get(this.__context, key);
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
      this.set('isLoggedIn', true);
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








