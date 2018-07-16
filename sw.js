var staticCacheName = "mws-restaurant";
var allCaches = [
  staticCacheName
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    //open the cache and save files needed for the project
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        '/index.html',
        '/js/main.js',
        '/css/styles.css',
        '/js/restaurant_info.js',
        '/js/dbhelper.js',

      //  '/data/restaurants.json',
        '/restaurant.html',
        '/img/1-200_small.jpg',
        '/img/3-400_medium.jpg',
        '/img/6-800_large.jpg',
        '/img/1-400_medium.jpg',
        '/img/3-800_large.jpg',
        '/img/7-200_small.jpg',
        '/img/1-800_large.jpg',
        '/img/4-200_small.jpg',
        '/img/7-400_medium.jpg',
        '/img/10-200_small.jpg',
        '/img/4-400_medium.jpg',
        '/img/7-800_large.jpg',
        '/img/10-400_medium.jpg',
        '/img/4-800_large.jpg',
        '/img/8-200_small.jpg',
        '/img/10-800_large.jpg',
        '/img/5-200_small.jpg',
        '/img/8-400_medium.jpg',
        '/img/2-200_small.jpg',
        '/img/5-400_medium.jpg',
        '/img/8-800_large.jpg',
        '/img/2-400_medium.jpg',
        '/img/5-800_large.jpg',
        '/img/9-200_small.jpg',
        '/img/2-800_large.jpg',
        '/img/6-200_small.jpg',
        '/img/9-400_medium.jpg',
        '/img/3-200_small.jpg',
        '/img/6-400_medium.jpg',
        '/img/9-800_large.jpg',
        '/manifest.json',
        'https://fonts.gstatic.com/s/roboto/v15/2UX7WLTfW3W8TclTUvlFyQ.woff',
        'https://fonts.gstatic.com/s/roboto/v15/d-6IYplOFocCacKzxwXSOD8E0i7KZn-EPnyo3HZu7kw.woff'
      ]);
    })
  );
});


self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('mws-') &&
                 !allCaches.includes(cacheName);
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});


//listen for and handle fetch accounts if in the cache
self.addEventListener('fetch', function(event) {
  console.log('sw doing fetch request');
  console.log(event.request);
  var requestUrl = new URL(event.request.url);
  if (requestUrl.origin === location.origin) {

console.log(requestUrl);
console.log("matched");
    if (requestUrl.pathname === '/') {
      event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
    }

}
  console.log('did not match location.origin');
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    }).catch(function(error) {
      console.log("fetch error, try using local cache");
      if (requestUrl.pathname === '/') {
      event.respondWith(caches.match('/index.html'));
      return;
    }
    if (requestUrl.pathname.startsWith('/img/')) {
      event.respondWith(servePhoto(event.request));
      return;
    }
  }))
      caches.match(event.request).then(function(response) {
      return response;
  });
})



self.addEventListener('message', function(event) {
  console.log('sw got message, message was ' + event.data.action);
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
})
