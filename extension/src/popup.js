
$(document).ready(() => {

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

  let render = (id, context) => {
    let el = document.getElementById(`${id}-template`);
    let source = el.innerHTML;
    let template = Handlebars.compile(source);
    let html = template(context);
    document.getElementById(id).innerHTML = html;
  };

  render('whitelist', {
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
  });

});
