/**
 * Common database helper functions.
 */

let db_name = "restaurants";
let restaurantObjectStoreName = "restaurantStore"
let reviewsObjectStoreName = "reviewsStore"
class DBHelper {

 /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
  
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  

  
  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
   
    this._dbPromise = openDatabase();
    this._dbPromise.then(function(db) {
      var transaction = db.transaction(restaurantObjectStoreName, 'readonly');
       var objectStore = transaction.objectStore(restaurantObjectStoreName);
  
      objectStore.count()
      .then((res)=>{
        var condition = navigator.onLine ? "online" : "offline";
        if(res === 0){
          console.log("conditon : "+condition);
         if(condition ===  "online"){
          fetch(DBHelper.DATABASE_URL)
          .then((res)=> res.json())
          .then((data) => {
           callback(null, data);
           var dbPromise = openDatabase();
           dbPromise.then(function(db) {
            if (!db) return;
           var tx = db.transaction(restaurantObjectStoreName, 'readwrite');
           var store = tx.objectStore(restaurantObjectStoreName);
           data.forEach(function(message) {
           store.put(message);
          });
          })      

        });
       }else{
         alert("sorry! you are offline. Please connect to internet to ");
       }   }else{
          //there is data in index db fetch it
          
      var index = db.transaction(restaurantObjectStoreName)
      .objectStore(restaurantObjectStoreName);

    return index.getAll().then(function(restaurants) {
      console.log("we are returning the indexeddb data..");
      callback(null,restaurants);
    });
        }
    
    });
  });
  }

  static sendReviewWhenOnline(offlineReview){
    //store the review in localstorage
    console.log("storing review in localstorage "+ offlineReview);
    localStorage.setItem("data",JSON.stringify(offlineReview.data));

    //set listener to check when the user comes online using `onLine` eventListener
    window.addEventListener('online', function(){
        console.log("user came back online :)");
        let review = JSON.parse(localStorage.getItem('data'));
        console.log("review got after user came online is "+review.name);
        // pass this review from localstorage to server
        if(review!== null){
        DBHelper.submitReview(review);
        localStorage.removeItem('data');
        console.log("removed the review from offline storage");
    }
    });

  }
    
  static fetchReviewsFromReviewsEndPoint(id,callback){
    let fetchUrl =  `http://localhost:1337/reviews/?restaurant_id=${id}`;
    console.log("fetch url : "+fetchUrl);

    fetch(fetchUrl)
    .then(response => response.json())
    .then(reviews =>{
      callback(null,reviews);
      //we got the reviews now lets store it into idb :)
      var dbPromise = openDatabase();
      dbPromise.then(function(db) {
       if (!db) return;
      var tx = db.transaction(reviewsObjectStoreName, 'readwrite');
      var store = tx.objectStore(reviewsObjectStoreName);
      if(Array.isArray(reviews)){
      reviews.forEach(function(review) {
      store.put(review);
      });
    }else{
      store.put(reviews);
    }
     });
    })
  
  //  return Promise.resolve(reviews);
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
   
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    var photograph = restaurant.photograph;

   if(photograph === undefined){
    photograph = 10;
   }
    return (`/img/${photograph}.jpg`);
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



  static submitReview(reviewBody){
    //TODO: Check if the user is online or offline. If offline store it in localStorage else send to server. If user comes online again send the review stored in localStorage to server and remove from localStorage
    let offlineReviewObj = {
      name: "addReview",
      data : reviewBody,
      object_type : "review"
    }

    if(!navigator.onLine && offlineReviewObj.name === "addReview"){
      //That means the user is offline
      DBHelper.sendReviewWhenOnline(offlineReviewObj);
      return;
    }
    //otherwise the user is online just send the review to server using fetch method

    let serverReview = {
      "name": reviewBody.name,
      "rating": parseInt(reviewBody.rating),
      "comments": reviewBody.comments,
      "restaurant_id": parseInt(reviewBody.restaurant_id)
    };

    let fetchOptions = {
      method: "POST",
      body: JSON.stringify(serverReview),
      headers: new Headers({
        "content-Type" : "application/json"
      })


    }
    console.log("sending review to server...");

    fetch(`http://localhost:1337/reviews/`,fetchOptions)
    .then(response=>{
      const contentType = response.headers.get("content-Type");
      if(contentType && contentType.indexOf("application/json")!==-1){
        return response.json();
      }else{
        console.log("api call successful");
      }})
      .then(data =>{
        console.log("fetch successfull")
      })
      .catch(error =>{
        console.log("error occured in review fetch "+error);
      });


    }
  


  static updateFavoriteStatus(restaurant_id, isFavorite){
    console.log("changing fav status on server");
    var isFavoriteString = isFavorite.toString(); 

    fetch(`http://localhost:1337/restaurants/${restaurant_id}/?is_favorite=${isFavoriteString}`,{
      method : 'PUT'
    }).then(()=>{
      console.log("yay! changed fav on server");
      var dbPromise = openDatabase();
      dbPromise.then((db)=> {
  
      var tx = db.transaction(restaurantObjectStoreName, 'readwrite');
      var store = tx.objectStore(restaurantObjectStoreName);
      console.log("opening the objectstore");
   
      
       store.get(restaurant_id).then(restaurant=>{
       restaurant.is_favorite = isFavoriteString;
       console.log("update server check type of is_favorite "+ restaurant.is_favorite);
       console.log(typeof restaurant.is_favorite);
       console.log("isFavorite "+isFavorite);

       store.put(restaurant);
       console.log("putting updated restaurant in objectstore");

     });
     })      

    })
  
  }

  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}

function openDatabase() {
  // If the browser doesn't support service worker,
  // we don't care about having a database
  if (!navigator.serviceWorker) {
    return Promise.resolve();
  }

  //TODO: upgrade database because we want to add another object store for reviews.
  return idb.open(db_name, 2, function(upgradeDb) {
    switch(upgradeDb.oldVersion){

    case 0:
      var store = upgradeDb.createObjectStore(restaurantObjectStoreName, {keyPath: 'id'});
    case 1:
    var store = upgradeDb.createObjectStore(reviewsObjectStoreName, {keyPath: 'id'});
    console.log("wohoo! created reviews object store");
    }
    
  });
}


