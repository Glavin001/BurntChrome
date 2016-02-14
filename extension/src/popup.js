
let burnt = window.burnt = {
  templateId: 'frame',
  __context: {
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
  },
  init() {
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
    burnt.refresh();
  },
  render(id, context) {
    let el = document.getElementById(`${id}-template`);
    let source = el.innerHTML;
    let template = Handlebars.compile(source);
    let html = template(context);
    document.getElementById(id).innerHTML = html;
    console.log('html', html);
    // Bind events
    this.bind();
  },
  bind() {
    console.log('Bind element events');
    $('#sign-in').click(() => this.login());
  },
  refresh() {
    this.render(this.templateId, this.__context);
  },
  set(key, val) {
    _.set(this.__context, key, val);
    this.refresh();
  },
  get(key) {
    return _.get(this.__context, key);
  },
  login() {
    console.log('Login!');
    this.set('isLoggedIn', true);
  }
};

$(document).ready(() => {
  console.log('Ready');
  burnt.init();
});
