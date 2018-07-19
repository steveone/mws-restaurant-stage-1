


let registerServiceWorker = function() {
  console.log("in register service worker");
  if (!navigator.serviceWorker) return;
  console.log("server worker is supported");
  var indexController = this;

  navigator.serviceWorker.register('sw.js').then(function(reg) {
    console.log("service worker registered");
    if (!navigator.serviceWorker.controller) {
      return;
    }

    if (reg.waiting) {
      console.log("update ready");
//      indexController._updateReady(reg.waiting);
      return;
    }

    if (reg.installing) {
      console.log("update installing");
  //    indexController._trackInstalling(reg.installing);
      return;
    }

    reg.addEventListener('updatefound', function() {
      console.log("update found");
    //  indexController._trackInstalling(reg.installing);
        reg.installing.addEventListener('statechange',function(){
          if (this.state == 'installed') {
            console.log("there is an update ready");
          }
        });
    });
  });


  // Ensure refresh is only called once.
  // This works around a bug in "force update on reload".
  var refreshing;
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    if (refreshing) return;
    console.log("refreshing")
    window.location.reload();
    refreshing = true;
  });
};

if('serviceWorker' in navigator) {
    registerServiceWorker();
}
