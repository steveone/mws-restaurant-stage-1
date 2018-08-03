let restaurants,
  neighborhoods,
  cuisines
var newMap
var markers = []
//used for favorite button
const filledFavImage = '/heart-solid.svg';
const borderFavImage = '/heart-open.svg';


DBHelper.loadIDB();

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap();
  fetchNeighborhoods();
  fetchCuisines();
});


//handle clicking on favorites
var baseSelector = '#restaurants-list'; // selector for the container for the variable content
var base = document.querySelector(baseSelector);
base.addEventListener('click', function(event) {
const clickedItem = event.target
if (event.target.className == 'favorite')
   {
    const restaurant_id = clickedItem.getAttribute('restaurant_id');
    //get src and strip everything but the last / and name for comparison
    let currentSrc = clickedItem.src;
    let index = currentSrc.lastIndexOf('/');
    currentSrc = currentSrc.substring(index);
    //determine what the new status should be
    const favorite = (currentSrc == filledFavImage) ? 'false' : 'true';
    clickedItem.src = (favorite === 'false') ? borderFavImage : filledFavImage;
    //update local loadIDB
    //todo, update server with favorite/not favorite
  }
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */

 /**
  * Initialize leaflet map, called from HTML.
  */
 initMap = () => {
   self.newMap = L.map('map', {
         center: [40.722216, -73.987501],
         zoom: 12,
         scrollWheelZoom: false
       });
   L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
     mapboxToken: 'pk.eyJ1Ijoic3RldmVvbmUiLCJhIjoiY2ppZDVtbmlyMDg1dTNsczBpNHY2aWVmNSJ9.XZNAlyN_Xo46O3Dq7YdnBw',
     maxZoom: 18,
     attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
       '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
       'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
     id: 'mapbox.streets'
   }).addTo(newMap);
   updateRestaurants();
 }


/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;
  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {

  let img = DBHelper.imageUrlForRestaurant(restaurant);
  const li = document.createElement('div');
  li.className = 'card';
  const picture = document.createElement('picture');
  picture.innerHTML = img;
  li.append(picture);



//handle favorites

  const fav = document.createElement('button');
  fav.className = 'favorite_button';
  const favorite =   (restaurant.is_favorite === 'true') ? filledFavImage : borderFavImage;
  const favImg = document.createElement('img');
  const favorite_alt =   (restaurant.is_favorite === 'true') ? "Favorite" : "Not Favorite";
  favImg.setAttribute("alt",favorite_alt);
  favImg.setAttribute("role","button");
  favImg.className = 'favorite';
  favImg.setAttribute("restaurant_id",restaurant.id);

  favImg.src = favorite;
  fav.appendChild(favImg);

  const name = document.createElement('h2');
  name.className = 'restaurantName';
  name.innerHTML = restaurant.name;
  name.id = restaurant.name;
  name.appendChild(fav);
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.className = 'address';
  address.innerHTML = restaurant.address.replace(',','<br>');
  li.append(address);

  const button = document.createElement('a');
  button.className = 'center';
  button.innerHTML = 'View Details';
  const textNode = document.createTextNode('View Details');
  let link =  DBHelper.urlForRestaurant(restaurant);
  button.href = DBHelper.urlForRestaurant(restaurant);
  li.append(button);

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
  });
}
