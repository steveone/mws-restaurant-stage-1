let restaurant;
let map;
const filledFavImage = '/heart-solid.svg';
const borderFavImage = '/heart-open.svg';



DBHelper.loadIDB();
/**
 * Initialize Google map, called from HTML.
 */

 /**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap();
});
 /**
  * Initialize leaflet map
  */
 initMap = () => {
   fetchRestaurantFromURL((error, restaurant) => {
     if (error) { // Got an error!
       console.error(error);
     } else {
       self.newMap = L.map('map', {
         center: [restaurant.latlng.lat, restaurant.latlng.lng],
         zoom: 16,
         scrollWheelZoom: false
       });
       L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token=pk.eyJ1Ijoic3RldmVvbmUiLCJhIjoiY2ppZDVtbmlyMDg1dTNsczBpNHY2aWVmNSJ9.XZNAlyN_Xo46O3Dq7YdnBw', {
         mapboxToken: '<your MAPBOX API KEY HERE>',
         maxZoom: 18,
         attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
           '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
           'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
         id: 'mapbox.streets'
       }).addTo(newMap);
       fillBreadcrumb();
       DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
     }
   });
   fetchRestaurantReviewsFromURL((error,restaurant)=> {
     if (error) { // Got an error!
       console.error(error);
     }
   })
 }


openReviewForm  = (id) => {
  console.log("should open review form here");
  const reviewForm = document.getElementById('reviewForm');
  //if the form is already open, clear it and start a fresh onkeyup
  //we may want to leave the current form in place in the future
  reviewForm.innerHTML = "";
  const form = document.createElement('form');

  const div1 = document.createElement('div');
  div1.className = 'inputDiv';
  const inputLabel = document.createElement('label');
  inputLabel.className = 'label';
  inputLabel.innerHTML = 'Your name:';
  inputLabel.setAttribute('for','nameInput');
  const input = document.createElement('input');
  input.className = 'inputLabel';
  input.id = 'nameInput';
  input.type = 'text';
  form.appendChild(div1);
  div1.appendChild(inputLabel);
  div1.appendChild(input);

//form element for rating to be fixed
const div2 = document.createElement('div');
div2.className = 'inputDiv';
const inputRating = document.createElement('label');
inputRating.innerHTML = 'Rating (1-4):';
inputRating.setAttribute('for','rating');
inputRating.className = 'label';
const inputRatingEntry = document.createElement('input');
inputRatingEntry.className = 'inputLabel';
inputRatingEntry.id = 'rating';
inputRatingEntry.type = 'text';
form.appendChild(div2);
div2.appendChild(inputRating);
div2.appendChild(inputRatingEntry);

  const commentLabel = document.createElement('label');
  commentLabel.innerHTML = 'Comment:'
  commentLabel.setAttribute('for', 'reviewComment');
  commentLabel.className = 'inpputLabel';
  const textarea = document.createElement('textarea');
  textarea.setAttribute('rows','10');
  textarea.setAttribute('cols','50');
  textarea.className = 'inputLabel';
  textarea.id = 'reviewComment';
  form.appendChild(commentLabel);
  form.appendChild(textarea);
  const submitCommentBtn = document.createElement('button');
  submitCommentBtn.innerHTML = 'Submit Review';
  submitCommentBtn.id = 'submitReview';
  form.appendChild(submitCommentBtn);
  const clearCommentBtn = document.createElement('button');
  clearCommentBtn.innerHTML = 'Clear Review';
  clearCommentBtn.id = 'clearReview'
  form.appendChild(clearCommentBtn);
  reviewForm.appendChild(form);
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)

    });

  }
}

fetchRestaurantReviewsFromURL = (callback) => {
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
        DBHelper.fetchReviewsByRestaurantId(id, (error, reviews) => {
          console.log("in restaurant reviews trying to get reviews")
          self.restaurant.reviews = reviews;
          if (!reviews) {
            console.error(error);
            return;
          }
          fillReviewsHTML();
      })

    }
}


//handle clicking on favorites
var baseSelector = '#restaurant-container'; // selector for the container for the variable content
var base = document.querySelector(baseSelector);
base.addEventListener('click', function(event) {
const clickedItem = event.target
console.log(event.target.className);
if (event.target.className == 'favorite'){
    event.preventDefault();
    const restaurant_id = clickedItem.getAttribute('restaurant_id');
    //get src and strip everything but the last / and name for comparison
    let currentSrc = clickedItem.src;
    let index = currentSrc.lastIndexOf('/');
    currentSrc = currentSrc.substring(index);
    //determine what the new status should be
    const favorite = (currentSrc == filledFavImage) ? false : true;
    clickedItem.src = (favorite === false) ? borderFavImage : filledFavImage;
    //update local loadIDB
    console.log("calling update fav " + restaurant_id);
    DBHelper.updateFavorite(restaurant_id,favorite);
    console.log("After update favorite");
    //todo, update server with favorite/not favorite
  }
});


//handle clicking on add review btn
var baseSelector = '#reviews-container'; // selector for the container for the variable content
var base = document.querySelector(baseSelector);

base.addEventListener('click', function(event){
const restaurant_id = getParameterByName('id');
const clickedItem = event.target
if (event.target.className == 'reviewBtn'){
    event.preventDefault();
    console.log("review btn clicked " + restaurant_id);
    openReviewForm(restaurant_id);
    }
else if (event.target.id == 'clearReview'){
  event.preventDefault();
  console.log("clearing review entries")
  openReviewForm(restaurant_id);
  }
else if (event.target.id == 'submitReview'){
  event.preventDefault();
  let submission = {}
  //while submitting the id field is not needed, it keeps the returned json results in the same order
  //which increases readability
  submission.id = '';
  submission.restaurant_id = restaurant_id;
  submission.rating = document.getElementById('rating').value;
  submission.name = document.getElementById('nameInput').value;
  submission.comments = document.getElementById('reviewComment').value;
  submission.date = new Date();
  console.log("time to submit the review")
  console.log(submission);
  DBHelper.submitNewReviewToServer(submission);
  }
});
/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {

  //is it a favorite or not
  const fav = document.createElement('button');
  fav.className = 'favorite_button';
  console.log("fav yes/no " + restaurant.is_favorite);
  const favorite =   (restaurant.is_favorite === 'true') ? filledFavImage : borderFavImage;
  const favImg = document.createElement('img');
  const favorite_alt =   (restaurant.is_favorite === true) ? "Favorite" : "Not Favorite";
  favImg.setAttribute("alt",favorite_alt);
  favImg.setAttribute("role","button");
  favImg.className = 'favorite';
  favImg.setAttribute("restaurant_id",restaurant.id);
  console.log(favorite);
  favImg.src = favorite;
  fav.appendChild(favImg);


  const name = document.getElementById('restaurant-name');
  name.className = 'restaurantName';

  name.innerHTML = restaurant.name;
  name.appendChild(fav);

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  const img = DBHelper.imageUrlForRestaurant(restaurant);
  image.innerHTML = (img) ? img : 'No Image Available';

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews

//  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.setAttribute('tabindex','0');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
// fillReviewsHTML = (reviews = self.restaurant.reviews) => {
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  const newReviewBtn = document.createElement('button');
  newReviewBtn.innerHTML= 'Add Review';
  newReviewBtn.setAttribute("alt","Add Review");
  newReviewBtn.setAttribute("role","button");
  newReviewBtn.className = 'reviewBtn';
  title.appendChild(newReviewBtn);
  container.appendChild(title);

  const reviewForm = document.createElement('p');
  reviewForm.innerHtml = 'Review Form';
  reviewForm.className = 'reviewForm';
  reviewForm.id = 'reviewForm';
  container.appendChild(reviewForm);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  let i =1;
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review,i));
    i++;
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review,i) => {
  const li = document.createElement('li');
  li.id = i;
  li.setAttribute('tabindex',0);
  li.setAttribute('closed', true);
  li.className = 'review';
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = new Date(review.createdAt).toDateString();
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.className = 'reviewText';
  comments.id = 'reviewText' + i;
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

document.body.onkeyup = function(e){
    if(e.keyCode == 32){
        clicked(e);
    }
}

document.addEventListener("click", function(el){
  clicked(el);
});

var clicked = function(el){
  if ((el.target.className == 'review') || (el.target.className == 'reviewText')) {

    document.querySelectorAll('.review').forEach(function(item) {
      if (item.id !== el.target.id){
        console.log("in if not equal");
        item.setAttribute('closed', 'true');
        let reviewTextId = 'reviewText' + item.id;
        document.getElementById(reviewTextId).style.whiteSpace='nowrap';
      }
    });

    let review = document.getElementById(el.target.id);
    if (review.getAttribute('closed') == 'true'){
      el.target.setAttribute('closed', 'false');
      let reviewTextId = 'reviewText' + el.target.id;
      document.getElementById(reviewTextId).style.whiteSpace='normal';
    }
    else {
      el.target.setAttribute('closed', 'true');
      let reviewTextId = 'reviewText' + el.target.id;
      document.getElementById(reviewTextId).style.whiteSpace='nowrap';
    }
  }
};
