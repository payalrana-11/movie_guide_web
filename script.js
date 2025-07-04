//api key from tmdb
const api = "api_key=74e6aeb19e1940d454e55b02139a93d5" ;

//base url of the site
const base_url = "https://api.themoviedb.org/3";
const banner_url = "https://image.tmdb.org/t/p/original";
const img_url = "https://image.tmdb.org/t/p/w300";


//request for movie data
const requests ={
    fetchTrending: `${base_url}/trending/all/week?${api}&language=en-US`,
    fetchTopRated: `${base_url}/movie/top_rated?${api}&language=en-US`,  
    fetchSearch: `${base_url}/search/movie?${api}&query=`
};

//truncate the string
function truncate(str,n){
    return str.length > n ? str.substr(0 , n-1) + "..." : str;
}

//banner
fetch(requests.fetchTrending)
.then((res)=> res.json())

.then((data)=>{
   // console.log(data.results);
    //movie will change after refresh

    const setMovie = data.results[Math.floor(Math.random()* data.results.length)];

    var banner = document.getElementById("banner");
    var banner_title = document.getElementById("banner-title");
    var banner_desc = document.getElementById("banner-description");

    banner.style.backgroundImage = "url("+ banner_url + setMovie.backdrop_path + ")";
    banner_desc.innerText = truncate(setMovie.overview , 150);
    banner_title.innerText = setMovie.title || setMovie.name || setMovie.original_name;
})
.catch((error) => {
        console.error("Error fetching banner movie:", error);
        const banner_title = document.getElementById("banner-title");
        const banner_desc = document.getElementById("banner-description");
        banner_title.innerText = "Something went wrong 😞";
        banner_desc.innerText = "We couldn't load the banner movie. Please try again later.";
    })

//scroll navbar
window.addEventListener("scroll", () => {
  const header = document.querySelector(".header");
  if (window.scrollY > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

//trending
fetch(requests.fetchTrending)
  .then((res) => res.json())
  .then((data) => {
    const trendingGrid = document.querySelector(".trending .movies-grid");
  
    data.results.forEach((movie) => {
      if (movie.poster_path) {

      const card = document.createElement("div");
      card.className = "card";
      card.setAttribute("data-id", movie.id);

      card.innerHTML = `
        <div class="img">
          <img src="${img_url + movie.poster_path}" alt="${movie.title || movie.name}">
        </div>
        <div class="info">
          <h3>${movie.title || movie.name}</h3>
          <div class="single-info">
            <span>${movie.vote_average?.toFixed(1) || "N/A"}⭐</span>
          </div>
        </div>
      `;

      trendingGrid.appendChild(card);
    }
    });
  });

//top rated
  fetch(requests.fetchTopRated)
  .then(res => res.json())
  .then(data => {
    const topRatedGrid = document.getElementById("top-rated-grid");

    data.results.forEach(movie => {
      if (movie.poster_path) {
        const card = document.createElement("div");
        card.className = "card";
        card.setAttribute("data-id", movie.id);
        card.innerHTML = `
          <div class="img">
            <img src="${img_url + movie.poster_path}" alt="${movie.title}">
          </div>
          <div class="info">
            <h3>${movie.title}</h3>
            <div class="single-info">
              <span>${movie.vote_average?.toFixed(1) || "N/A"}⭐</span>
            </div>
          </div>
        `;

        topRatedGrid.appendChild(card);
      }
    });
  });


  //search
const input = document.getElementById('search');
const btn = document.querySelector('.search-icon');
const searchGrid = document.getElementById("search-grid");
const searchContainer = document.querySelector(".search-results");
const mainSections = document.querySelectorAll(".movies-container:not(.search-results), #banner");
const backBtn = document.querySelector(".back-button");

// Enter key
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const query = input.value.trim();
    if (query) {
      searchMovies(query);
    }
  }
});

// search icon submit
const form = document.getElementById("form");
form.addEventListener("submit", (e) => {
  e.preventDefault(); 
  const query = input.value.trim();
  if (query) {
    searchMovies(query); 
  }
});

//fetching searched data
function searchMovies(query) {
  fetch(requests.fetchSearch+encodeURIComponent(query))
    .then(res => res.json())
    .then(data => {
      searchGrid.innerHTML = ""; 

      if (data.results.length === 0) {
        searchGrid.innerHTML = "<p>No results found.</p>";
        return;
      }

      data.results.forEach(movie => {
        if (!movie.poster_path) return;

        const card = document.createElement("div");
        card.className = "card";
        card.setAttribute("data-id", movie.id);
        card.innerHTML = `
          <div class="img">
            <img src="${img_url + movie.poster_path}" alt="${movie.title}">
          </div>
          <div class="info">
            <h3>${movie.title}</h3>
            <div class="single-info">
              <span>${movie.vote_average?.toFixed(1) || "N/A"}⭐</span>
            </div>
          </div>
        `;

        searchGrid.appendChild(card);
      });

      // Show search section and hide others
      mainSections.forEach(sec => sec.style.display = "none");
      searchContainer.style.display = "block";
    });
}

// Back Button 
backBtn.addEventListener("click", () => {
  searchContainer.style.display = "none";
  mainSections.forEach(sec => sec.style.display = "block");
  input.value = "";
});


// Popup container
const popup = document.querySelector(".popup-container");

function openPopup(id) {
  fetch(`${base_url}/movie/${id}?${api}&append_to_response=videos`)
    .then(res => res.json())
    .then(movie => {
      const trailer = movie.videos.results.find(v => v.type === "Trailer" && v.site === "YouTube");
      const trailerUrl = trailer ? `https://www.youtube.com/embed/${trailer.key}` : "";
      
    
      // Inject popup content with close button (moved below header)
      popup.innerHTML = `
        <div class="content">
          <span class="close-btn" style="position:absolute; top:3rem; right:2rem; font-size:2rem; color:red; cursor:pointer; z-index:9999;">&#10006;</span>
          <div class="left">
            <div class="poster-img"><img src="${img_url + movie.poster_path}" alt="${movie.title}"></div>
          </div>
          <div class="right">
            <h2>${movie.title}</h2>
            <h4>${movie.tagline || ""}</h4>
            <div class="single-info-container">
              <div class="single-info"><span>Language:</span><span>${movie.original_language.toUpperCase()}</span></div>
              <div class="single-info"><span>Length:</span><span>${movie.runtime} minutes</span></div>
              <div class="single-info"><span>Rating:</span><span>${movie.vote_average.toFixed(1)}⭐</span></div>
              <div class="single-info"><span>Budget:</span><span>$${movie.budget.toLocaleString()}</span></div>
              <div class="single-info"><span>Release Date:</span><span>${movie.release_date}</span></div>
            </div>
            <div class="genres"><h3>Genres</h3><ul>${movie.genres.map(g => `<li>${g.name}</li>`).join("")}</ul></div>
            <div class="overview"><h3>Overview</h3><p>${movie.overview}</p></div>
            <div class="trailer"><h3>Trailer</h3>${trailerUrl ? `<iframe src="${trailerUrl}" frameborder="0" allowfullscreen></iframe>` : "<p>No trailer available</p>"}</div>
          </div>
        </div>
      `;

      popup.style.transform = "scale(1)";
      document.body.style.overflow = "hidden";
    
      document.querySelector(".back-button").style.display = "none"; 
      // Add event to close button
      popup.querySelector(".close-btn").addEventListener("click", closePopup);

      document.querySelector(".header").style.display = "none";

    });
}

// Close popup
function closePopup() {
  popup.style.transform = "scale(0)";
  document.body.style.overflow = "";
  popup.innerHTML = ""; 

document.querySelector(".back-button").style.display = "block"; 

document.querySelector(".header").style.display = "flex";

}


// open popup when any .card is clicked
document.addEventListener("click", e => {
  const c = e.target.closest(".card");
  if (c && c.dataset.id) openPopup(c.dataset.id);
});