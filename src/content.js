// content.js

console.log("Hello from Burnt Chrome extension!");

let crashTab = () => {
  // while(true) {
  //   console.log('Hey! Fuck you.');
  // }
  var txt = "a";
  while(1){
      txt = txt += "a";    //add as much as the browser can handle
  }
  //[evil laugh] BOOM! All memory used up, and it is now CRASHED!
}

let insultUser = () => {
  let imgSrc = "https://s-media-cache-ak0.pinimg.com/236x/14/bf/ce/14bfce9ca8c242443d9c43a3f13c0007.jpg"
  let imgHTML = `<img src="${imgSrc}" style="width:100%; height:100%;"/>`;
  document.body.innerHTML = imgHTML;
}

// check if it's open
console.log('is DevTools open?', window.devtools.open);
// check it's orientation, null if not open
console.log('and DevTools orientation?', window.devtools.orientation);

// get notified when it's opened/closed or orientation changes
window.addEventListener('devtoolschange', function (e) {
    console.log('is DevTools open?', e.detail.open);
    console.log('and DevTools orientation?', e.detail.orientation);
    if (e.detail.open) {

      insultUser();
      crashTab();

    }
});
