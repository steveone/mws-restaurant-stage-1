
/**
 * Common database helper functions.
 */
 var dbPromise;
 var dbPromise_reviews;

 let connection = navigator.connection
 let type = connection.downlink;
 let networkStatus = true;

class DBHelper {


  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL_RESTAURANTS() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants/`;
  }
  static get DATABASE_URL_REVIEWS() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/reviews/`;
  }


static pushFavoritesOnReconnect(){
  dbPromise.then(function(db) {
   return db.transaction('keyval')
     .objectStore('keyval').getAll();
  }).then(function(restaurants) {
    console.log("about to check restaurants for flag");
  restaurants.forEach(function(restaurant){
          if (restaurant.offLineFlag == true){
            console.log(restaurant);
            console.log(restaurant.id + " being updated");
            const restaurant_id = restaurant.id;
            const favorite = restaurant.is_favorite;
            console.log("updating " + restaurant_id + " now that we are online again");
          restaurant = {...restaurant, is_favorite: favorite, offLineFlag:false};
          DBHelper.addOrUpdateDB(restaurant);
          DBHelper.updateRestaurantById(restaurant);
          return;
        }
        })
  })
}


static deleteReviewFromIDB(id) {
  dbPromise_reviews.then(function(db) {
    return db.transaction('keyval','readwrite')
      .objectStore('keyval').delete(id);
    }).then(function() {
      console.log('deleted item from idb');
    }).catch(error => {
      console.log("error deleting from id " + error);
    })
  }



static pushNewReviewsOnReconnect(){
  dbPromise_reviews.then(function(db) {
   return db.transaction('keyval')
     .objectStore('keyval').getAll();
  }).then(function(reviews) {
    console.log("about to check reviews for flag");
    reviews.forEach(function(review){
          if (review.offLineFlag == true){
            //delete from idb, we are saving to the server.
            const oldReviewID = review.id;
            review.id = '';
            console.log("adding the following review to server");
          review = {...review, offLineFlag:false};
          console.log(review);
          DBHelper.submitNewReviewToServer(review);
          DBHelper.deleteReviewFromIDB(oldReviewID);

          //after a submission from the server, remove from the idb
          //so it can have the udpated ID from the server
          return;
        }
        })
  })
}


  static pushOnNetworkReconnect(){
    console.log("in pushOnNetworkReconnect");
    DBHelper.pushFavoritesOnReconnect();
    DBHelper.pushNewReviewsOnReconnect();
  }


  static networkStatus(){
    return (networkStatus === true) ? true : false;
  }

   static updateConnectionStatus() {
//     console.log("updating connection status");
     if ((type == 0) && (connection.downlink > 0)) {
       console.log("We are back online, yeah!");
       networkStatus = true;
       console.log("Checking if any updates are pending");
       DBHelper.pushOnNetworkReconnect();
     }
     else {
       console.log("We just went offline, check your network properties");
       networkStatus = false;

     }
     console.log("Connection type changed from " + type + " to " + connection.downlink);
     type = connection.downlink;
   }


   static  submitNewReviewToServer(newReview) {
    const url =  DBHelper.DATABASE_URL_REVIEWS;
    DBHelper.networkStatus();
    console.log("network status is " + networkStatus);
    if (networkStatus === false) {
      console.log("offline, updating offline flag");
      const temp_id = new Date().getTime();
      newReview = {...newReview, offLineFlag:true, id:temp_id};
      DBHelper.addOrUpdateDB_review(newReview);
      return;
    }
    //if we aren not offline, we can submit to the server
    fetch(url, {
      method: 'post',
      body: JSON.stringify(newReview)
    }).then(function(response) {
      return response.json();
    }).then(function(data) {
      console.log(data.id + ' = ' + newReview.id);
      //put the returned review with it's new id in indexedb
      DBHelper.addOrUpdateDB_review(data);
      console.log("sent new review to server, response was " + data );
    }).catch(error => {
      console.log("error submitting review to server " + error);
    })
    //need a catch to handle being offline here
  }

   static updateRestaurantById(restaurant) {
     const id = restaurant.id;
     const startUrl = DBHelper.DATABASE_URL_RESTAURANTS + id;
     const endPoint = startUrl + '/?is_favorite=' + restaurant.is_favorite;
     fetch(endPoint, {method: "POST"})
     .then(response => response.json())
     .then(restaurants => {
       //if good do nothing?
       console.log("do nothing");
     })
     .then(data => {
     callback(null,data)})
     //if error occurs with fetch, fall back to data stored in indexeddb
     .catch(error => {
       dbPromise.then(function(db) {
        return db.transaction('keyval')
          .objectStore('keyval').getAll();
       })
       .catch(error =>{
         callback(error,null)});
       });
   }

static updateFavorite(id,favorite) {
  console.log("got id " + id )
  DBHelper.fetchRestaurantById(id, ((error, restaurant) => {
    console.log("got restauraunt by id returned");
    console.log(restaurant);
    restaurant.is_favorite = favorite;
//    DBHelper.networkStatus();
//    console.log("network status is " + networkStatus);
    DBHelper.networkStatus();
    console.log("network status is " + networkStatus);
    if (networkStatus === false) {
      console.log("offline, updating offline flag");
      restaurant = {...restaurant, offLineFlag:true, is_favorite: favorite};
      DBHelper.addOrUpdateDB(restaurant);
      return;
    }
    restaurant = {...restaurant, is_favorite: favorite};
    DBHelper.addOrUpdateDB(restaurant);
    DBHelper.updateRestaurantById(restaurant);
  }))
}

static loadIDB() {
  console.log("loading idb");
  dbPromise = idb.open('restaurants', 1, function(upgradeDb) {
    console.log("idb open called");
    switch(upgradeDb.oldVersion) {
      case 0:
        var keyValStore = upgradeDb.createObjectStore('keyval');
        //keyValStore.put("world", "hello");
        keyValStore.createIndex('neighborhood', 'neighborhood');
        keyValStore.createIndex('cuisine_type', 'cuisine_type');
    }
  });

  dbPromise_reviews = idb.open('restaurant_reviews', 1, function(upgradeDb) {
    console.log("idb for reviews open called");
    switch(upgradeDb.oldVersion) {
      case 0:
        var keyValStore = upgradeDb.createObjectStore('keyval');
        keyValStore.createIndex('restaurant_id', 'restaurant_id');

    }
  });
}



static addOrUpdateDB(restaurant){
  //console.log("in addorupdatedb working on " + restaurant.id);
  // set "foo" to be "bar" in "keyval"
  dbPromise.then(function(db) {
    //console.log("going to update with the following");
    //console.log(restaurant);
    var tx = db.transaction('keyval', 'readwrite');
    var keyValStore = tx.objectStore('keyval');
    //console.log("trying to update restaurant with id " + restaurant.id)
    keyValStore.put(restaurant, restaurant.id);
    return tx.complete;
  }).then(function() {
    //console.log('Added ' + restaurant.id + ' to keyval');
    //console.log(restaurant);
  }).catch(function(error) {
    console.log("error occured during update " + error);
  })
}

static addOrUpdateDB_review(review){
  // set "foo" to be "bar" in "keyval"
  dbPromise_reviews.then(function(db) {
    var tx = db.transaction('keyval', 'readwrite');
    var keyValStore = tx.objectStore('keyval');
    console.log("about to save to db");
    console.log(review);
    keyValStore.put(review, review.id);
    return tx.complete;
  }).then(function() {
    console.log(`Added ${review.id} - ${review} to keyval`);
  }).catch(error => {
    console.log("there was an error saving to indexeddb");
  })
}


  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    console.log('about to try fetching ' + DBHelper.DATABASE_URL_RESTAURANTS)
    fetch(DBHelper.DATABASE_URL_RESTAURANTS)
    .then(response => response.json())
    .then(restaurants => {
      restaurants.forEach(function(restaurant){
        //console.log(restaurant);
        DBHelper.addOrUpdateDB(restaurant);
      })
      return restaurants;
    })
    .then(data => {
    callback(null,data)})
    //if error occurs with fetch, fall back to data stored in indexeddb
    .catch(error => {
//      console.log('in catch inside dbhelper')
//      console.log(dbPromise);
      dbPromise.then(function(db) {
       return db.transaction('keyval')
         .objectStore('keyval').getAll();
      }).then(function(data) {
//        console.log('data returned:');
//        console.log(data);
        callback(null,data);
      })
      .catch(error =>{
        callback(error,null)});
      });
  }

  static fetchRestaurant_reviews(callback) {
    console.log('about to try fetching')
    fetch(DBHelper.DATABASE_URL_REVIEWS)
    .then(response => response.json())
    .then(reviews => {
      reviews.forEach(function(review){
        DBHelper.addOrUpdateDB_review(review)
      })
      return reviews;
    })
    .then(data => {
      callback(null,data)
    })
    //if error occurs with fetch, fall back to data stored in indexeddb
    .catch(error => {
      dbPromise_reviews.then(function(db) {
       return db.transaction('keyval')
         .objectStore('keyval').getAll();
      }).then(function(data) {
  //        console.log('data returned:');
  //        console.log(data);
        callback(null,data);
      })
      .catch(error =>{
        callback(error,null)});
      });
  }


  /**
   * Fetch a restaurant review by its restaurant ID.
   */
/*  static fetchReviewsByRestaurantId(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurant_reviews((error, reviews) => {
      if (error) {
        callback(error, null);
      } else {
        const review = reviews.filter(r => r.restaurant_id == id);
        if (review) { // Got the restaurant
          callback(null, review);
        } else { // Restaurant does not exist in the database
          callback('No Reviews exist for this restaurant id does not exist', null);
        }
      }
    });
  }*/

  static fetchReviewsByRestaurantId(id, callback) {
      const url = DBHelper.DATABASE_URL_REVIEWS + '?restaurant_id=' + id;
      console.log(url);
      fetch(url)
      .then(response => response.json())
      .then(reviews => {
          if (!reviews) {
          callback(error, null);
        } else {
          reviews.forEach(function(review){
            DBHelper.addOrUpdateDB_review(review);
          })
          callback(null,reviews);
        }
    })
    .catch((error) => {
      console.log("An error occurred getting review for id " + id);
      console.log("Error was " + error);
      console.log("we will load the reviews from the local database instead");
      dbPromise_reviews.then(function(db) {
       return db.transaction('keyval')
         .objectStore('keyval').getAll();
      }).then(function(data) {
        let results = data.filter(r => r.restaurant_id == id);
        callback(null,results);
      })



  })
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        console.log(results);
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    //console.log(`/restaurant.html?id=${restaurant.id}`);
    return (`/restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
/*  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}`);
  }
*/
  static imageUrlForRestaurant(restaurant) {
    let img = `/img/${restaurant.photograph}`;
    //var locJPG = img.indexOf('.');
    //var baseJPG = img.slice(0,locJPG);
    let baseJPG = `/img/${restaurant.photograph}`;
    let picture = `
      <source media='(min-width:800px)' srcset='${baseJPG}-800_large.jpg 1x'/>
      <source media='(min-width:400px)' srcset='${baseJPG}-400_medium.jpg 1x'/>
      <source media='(min-width:200px)' srcset='${baseJPG}-200_small.jpg 1x'/>
      <img src='http://localhost:8000${baseJPG}-800_medium.jpg' class='restaurant-img'
      alt='Restaurant image for ${restaurant.name}'/>
    `;

    return (picture);
  }


  /**
  * Map marker for a restaurant.
  */
  static mapMarkerForRestaurant(restaurant, map) {
   // https://leafletjs.com/reference-1.3.0.html#marker
   const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
     {title: restaurant.name,
     alt: restaurant.name,
     url: DBHelper.urlForRestaurant(restaurant)
     })
     marker.addTo(newMap);
   return marker;
 }


}

//used to setup listener for network change events

connection.addEventListener('change', DBHelper.updateConnectionStatus);
