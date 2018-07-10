

let registerServiceWorker = function() {
  console.log("in register service worker");
  if (!navigator.serviceWorker) return;

  var indexController = this;

  navigator.serviceWorker.register('/js/sw.js').then(function(reg) {
    if (!navigator.serviceWorker.controller) {
      return;
    }

    if (reg.waiting) {
      indexController._updateReady(reg.waiting);
      return;
    }

    if (reg.installing) {
      indexController._trackInstalling(reg.installing);
      return;
    }

    reg.addEventListener('updatefound', function() {
      indexController._trackInstalling(reg.installing);
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
