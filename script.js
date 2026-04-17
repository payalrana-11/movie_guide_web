// API key from TMDB
const API_KEY = "api_key=74e6aeb19e1940d454e55b02139a93d5";

// Base URL of the site
const BASE_URL = "https://api.themoviedb.org/3";
const BANNER_URL = "https://image.tmdb.org/t/p/original";
const IMG_URL = "https://image.tmdb.org/t/p/w300";

// Request URLs for movie data
const requests = {
    fetchTrending: `${BASE_URL}/trending/all/week?${API_KEY}&language=en-US`,
    fetchTopRated: `${BASE_URL}/movie/top_rated?${API_KEY}&language=en-US`,
    fetchSearch: `${BASE_URL}/search/movie?${API_KEY}&query=`
};

// Favorites management
function getFavorites() {
    return JSON.parse(localStorage.getItem('favorites')) || [];
}

function saveFavorites(favorites) {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function isFavorite(movieId) {
    return getFavorites().includes(movieId);
}

function toggleFavorite(movieId) {
    let favorites = getFavorites();
    if (favorites.includes(movieId)) {
        favorites = favorites.filter(id => id !== movieId);
    } else {
        favorites.push(movieId);
    }
    saveFavorites(favorites);
    return favorites.includes(movieId);
}

// Create movie card with favorite button
function createCard(movie) {
    const card = document.createElement("div");
    card.className = "card";
    card.setAttribute("data-id", movie.id);

    const isFav = isFavorite(movie.id);
    card.innerHTML = `
        <div class="img">
            <img src="${IMG_URL + movie.poster_path}" alt="${movie.title || movie.name}">
            <button class="favorite-btn ${isFav ? 'favorited' : ''}" data-id="${movie.id}">
                <i class="fa${isFav ? 's' : 'r'} fa-heart"></i>
            </button>
        </div>
        <div class="info">
            <h3>${movie.title || movie.name}</h3>
            <div class="single-info">
                <span>${movie.vote_average?.toFixed(1) || "N/A"}⭐</span>
            </div>
        </div>
    `;

    // Add event listener to favorite button
    const favBtn = card.querySelector('.favorite-btn');
    favBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card click
        const isNowFav = toggleFavorite(movie.id);
        favBtn.classList.toggle('favorited', isNowFav);
        favBtn.innerHTML = `<i class="fa${isNowFav ? 's' : 'r'} fa-heart"></i>`;
        // Reload favorites if needed
        loadFavorites();
    });

    return card;
}

// Truncate string utility
function truncate(str, n) {
    return str.length > n ? str.substr(0, n - 1) + "..." : str;
}

// Async function to fetch data from API
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching data:", error);
        throw error;
    }
}

// Setup banner with random trending movie
async function setupBanner() {
    try {
        const data = await fetchData(requests.fetchTrending);
        const setMovie = data.results[Math.floor(Math.random() * data.results.length)];

        const banner = document.getElementById("banner");
        const bannerTitle = document.getElementById("banner-title");
        const bannerDesc = document.getElementById("banner-description");

        if (setMovie.backdrop_path) {
            banner.style.backgroundImage = `url(${BANNER_URL + setMovie.backdrop_path})`;
        } else {
            console.warn("No backdrop path for banner movie");
        }
        bannerDesc.innerText = truncate(setMovie.overview, 150);
        bannerTitle.innerText = setMovie.title || setMovie.name || setMovie.original_name;

        // Setup watch trailer button
        const watchBtn = document.getElementById('watch-trailer');
        watchBtn.addEventListener('click', async () => {
            try {
                const movieData = await fetchData(`${BASE_URL}/movie/${setMovie.id}?${API_KEY}&append_to_response=videos`);
                const trailer = movieData.videos?.results.find(
                    v => v.type === "Trailer" && v.site === "YouTube"
                );
                if (trailer) {
                    window.open(`https://www.youtube.com/watch?v=${trailer.key}`, "_blank");
                } else {
                    alert("Trailer not available.");
                }
            } catch (error) {
                console.error("Error fetching trailer:", error);
                alert("Unable to fetch trailer.");
            }
        });
    } catch (error) {
        console.error("Error setting up banner:", error);
        const bannerTitle = document.getElementById("banner-title");
        const bannerDesc = document.getElementById("banner-description");
        bannerTitle.innerText = "Something went wrong 😞";
        bannerDesc.innerText = "We couldn't load the banner movie. Please try again later.";
    }
}

// Scroll navbar effect
window.addEventListener("scroll", () => {
    const header = document.querySelector(".header");
    if (window.scrollY > 50) {
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }
});

// Load trending movies
async function loadTrendingMovies() {
    try {
        const data = await fetchData(requests.fetchTrending);
        const trendingGrid = document.querySelector(".trending .movies-grid");

        data.results.forEach((movie) => {
            if (movie.poster_path) {
                const card = createCard(movie);
                trendingGrid.appendChild(card);
            }
        });
    } catch (error) {
        console.error("Error loading trending movies:", error);
    }
}

// Load top rated movies
async function loadTopRatedMovies() {
    try {
        const data = await fetchData(requests.fetchTopRated);
        const topRatedGrid = document.getElementById("top-rated-grid");

        data.results.forEach(movie => {
            if (movie.poster_path) {
                const card = createCard(movie);
                topRatedGrid.appendChild(card);
            }
        });
    } catch (error) {
        console.error("Error loading top rated movies:", error);
    }
}

// Load favorite movies
async function loadFavorites() {
    try {
        const favoritesGrid = document.getElementById("favorites-grid");
        favoritesGrid.innerHTML = ""; // Clear existing

        const favoriteIds = getFavorites();
        if (favoriteIds.length === 0) {
            favoritesGrid.innerHTML = "<p>No favorite movies yet. Click the heart icon on movies to add them!</p>";
            return;
        }

        // Fetch details for each favorite movie
        const favoriteMovies = [];
        for (const id of favoriteIds) {
            try {
                const movie = await fetchData(`${BASE_URL}/movie/${id}?${API_KEY}`);
                if (movie.poster_path) {
                    favoriteMovies.push(movie);
                }
            } catch (error) {
                console.error(`Error fetching favorite movie ${id}:`, error);
                // Remove invalid favorite
                toggleFavorite(id);
            }
        }

        favoriteMovies.forEach(movie => {
            const card = createCard(movie);
            favoritesGrid.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading favorites:", error);
    }
}

// Search functionality
const input = document.getElementById('search');
const btn = document.querySelector('.search-icon');
const searchGrid = document.getElementById("search-grid");
const searchContainer = document.querySelector(".search-results");
const mainSections = document.querySelectorAll(".movies-container:not(.search-results), #banner");
const backBtn = document.querySelector(".back-button");

// Enter key for search
input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        const query = input.value.trim();
        if (query) {
            searchMovies(query);
        }
    }
});

// Search form submit
const form = document.getElementById("form");
form.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (query) {
        searchMovies(query);
    }
});

// Fetch and display searched movies
async function searchMovies(query) {
    try {
        const data = await fetchData(requests.fetchSearch + encodeURIComponent(query));
        searchGrid.innerHTML = "";

        if (data.results.length === 0) {
            searchGrid.innerHTML = "<p>No results found.</p>";
            return;
        }

        data.results.forEach(movie => {
            if (!movie.poster_path) return;

            const card = createCard(movie);
            searchGrid.appendChild(card);
        });

        // Show search results and hide main sections
        mainSections.forEach(sec => sec.style.display = "none");
        searchContainer.style.display = "block";
    } catch (error) {
        console.error("Error searching movies:", error);
        searchGrid.innerHTML = "<p>Error loading search results.</p>";
    }
}

// Back button to return to main view
backBtn.addEventListener("click", () => {
    searchContainer.style.display = "none";
    mainSections.forEach(sec => sec.style.display = "block");
    input.value = "";
});

// Popup container
const popup = document.querySelector(".popup-container");

// Open popup with movie details
async function openPopup(id) {
    try {
        const movie = await fetchData(`${BASE_URL}/movie/${id}?${API_KEY}&append_to_response=videos`);
        const trailer = movie.videos.results.find(v => v.type === "Trailer" && v.site === "YouTube");
        const trailerUrl = trailer ? `https://www.youtube.com/embed/${trailer.key}` : "";

        // Inject popup content
        popup.innerHTML = `
            <div class="content">
                <span class="close-btn" style="position:absolute; top:3rem; right:2rem; font-size:2rem; color:red; cursor:pointer; z-index:9999;">&#10006;</span>
                <div class="left">
                    <div class="poster-img"><img src="${IMG_URL + movie.poster_path}" alt="${movie.title}"></div>
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
        document.querySelector(".header").style.display = "none";

        // Add event to close button
        popup.querySelector(".close-btn").addEventListener("click", closePopup);
    } catch (error) {
        console.error("Error opening popup:", error);
        alert("Unable to load movie details.");
    }
}

// Close popup
function closePopup() {
    popup.style.transform = "scale(0)";
    document.body.style.overflow = "";
    popup.innerHTML = "";

    document.querySelector(".back-button").style.display = "block";
    document.querySelector(".header").style.display = "flex";
}

// Event listener for card clicks to open popup
document.addEventListener("click", e => {
    const card = e.target.closest(".card");
    if (card && card.dataset.id) openPopup(card.dataset.id);
});

// Initialize the app
async function init() {
    await setupBanner();
    await loadTrendingMovies();
    await loadTopRatedMovies();
    await loadFavorites();
}

init();
