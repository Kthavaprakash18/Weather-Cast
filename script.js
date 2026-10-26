/**
 * script.js – Real-Time Weather Dashboard
 *
 * Demonstrates:
 *  • Fetch API + async/await
 *  • REST API integration (Open-Meteo geocoding + weather)
 *  • JSON parsing and DOM manipulation
 *  • Comprehensive error handling
 *  • Geolocation API
 */

'use strict';

/* ============================================================
   1.  API ENDPOINTS
   ============================================================ */
const GEO_API  = 'https://geocoding-api.open-meteo.com/v1/search';
const WX_API   = 'https://api.open-meteo.com/v1/forecast';

/* ============================================================
   2.  WMO WEATHER CODE MAP
   Maps Open-Meteo weather codes → { description, icon (emoji) }
   Reference: https://open-meteo.com/en/docs#weathervariables
   ============================================================ */
const WMO_CODES = {
  0:  { desc: 'Clear Sky',           icon: '☀️'  },
  1:  { desc: 'Mainly Clear',        icon: '🌤️'  },
  2:  { desc: 'Partly Cloudy',       icon: '⛅'  },
  3:  { desc: 'Overcast',            icon: '☁️'  },
  45: { desc: 'Foggy',               icon: '🌫️'  },
  48: { desc: 'Icy Fog',             icon: '🌫️'  },
  51: { desc: 'Light Drizzle',       icon: '🌦️'  },
  53: { desc: 'Moderate Drizzle',    icon: '🌦️'  },
  55: { desc: 'Dense Drizzle',       icon: '🌧️'  },
  56: { desc: 'Freezing Drizzle',    icon: '🌨️'  },
  57: { desc: 'Heavy Freezing Drizzle', icon: '🌨️' },
  61: { desc: 'Slight Rain',         icon: '🌧️'  },
  63: { desc: 'Moderate Rain',       icon: '🌧️'  },
  65: { desc: 'Heavy Rain',          icon: '🌧️'  },
  66: { desc: 'Light Freezing Rain', icon: '🌨️'  },
  67: { desc: 'Heavy Freezing Rain', icon: '🌨️'  },
  71: { desc: 'Slight Snowfall',     icon: '🌨️'  },
  73: { desc: 'Moderate Snowfall',   icon: '❄️'  },
  75: { desc: 'Heavy Snowfall',      icon: '❄️'  },
  77: { desc: 'Snow Grains',         icon: '🌨️'  },
  80: { desc: 'Slight Rain Showers', icon: '🌦️'  },
  81: { desc: 'Moderate Rain Showers', icon: '🌧️' },
  82: { desc: 'Violent Rain Showers', icon: '🌧️' },
  85: { desc: 'Slight Snow Showers', icon: '🌨️'  },
  86: { desc: 'Heavy Snow Showers',  icon: '❄️'  },
  95: { desc: 'Thunderstorm',        icon: '⛈️'  },
  96: { desc: 'Thunderstorm with Slight Hail', icon: '⛈️' },
  99: { desc: 'Thunderstorm with Heavy Hail',  icon: '⛈️' },
};

/* ============================================================
   3.  DOM REFERENCES
   ============================================================ */
const cityInput          = document.getElementById('cityInput');
const searchBtn          = document.getElementById('searchBtn');
const locationBtn        = document.getElementById('locationBtn');
const errorBanner        = document.getElementById('errorBanner');
const errorMessage       = document.getElementById('errorMessage');
const loadingIndicator   = document.getElementById('loadingIndicator');
const weatherDashboard   = document.getElementById('weatherDashboard');
const welcomeMsg         = document.getElementById('welcomeMsg');

// City header
const cityNameEl         = document.getElementById('cityName');
const cityCountryEl      = document.getElementById('cityCountry');
const currentDateEl      = document.getElementById('currentDate');
const currentTimeEl      = document.getElementById('currentTime');

// Hero card
const weatherIconEl      = document.getElementById('weatherIcon');
const temperatureEl      = document.getElementById('temperature');
const weatherDescriptionEl = document.getElementById('weatherDescription');
const dayNightLabelEl    = document.getElementById('dayNightLabel');

// Info cards
const cardTempEl         = document.getElementById('cardTemp');
const cardFeelsLikeEl    = document.getElementById('cardFeelsLike');
const cardHumidityEl     = document.getElementById('cardHumidity');
const cardWindEl         = document.getElementById('cardWind');
const cardPrecipEl       = document.getElementById('cardPrecip');
const cardDayNightEl     = document.getElementById('cardDayNight');
const dayNightIconEl     = document.getElementById('dayNightIcon');

/* ============================================================
   4.  STATE
   ============================================================ */
// Prevents duplicate requests while one is already in progress
let isFetching = false;

/* ============================================================
   5.  HELPER – UI STATE MANAGEMENT
   ============================================================ */

/** Shows the loading spinner and hides other dynamic content. */
function showLoading() {
  loadingIndicator.classList.remove('hidden');
  weatherDashboard.classList.add('hidden');
  errorBanner.classList.add('hidden');
  welcomeMsg.classList.add('hidden');
}

/** Hides the loading spinner. */
function hideLoading() {
  loadingIndicator.classList.add('hidden');
}

/**
 * Displays a user-friendly error message in the error banner.
 * @param {string} msg – The message to display.
 */
function showError(msg) {
  errorMessage.textContent = msg;
  errorBanner.classList.remove('hidden');
  weatherDashboard.classList.add('hidden');
  welcomeMsg.classList.add('hidden');
}

/** Hides the error banner. */
function hideError() {
  errorBanner.classList.add('hidden');
}

/** Disables or enables both search controls during a request. */
function setButtonsDisabled(disabled) {
  searchBtn.disabled   = disabled;
  locationBtn.disabled = disabled;
}

/* ============================================================
   6.  HELPER – DATE / TIME
   ============================================================ */

/**
 * Returns a formatted date and time string for the current moment.
 * @returns {{ date: string, time: string }}
 */
function getFormattedDateTime() {
  const now  = new Date();
  const date = now.toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const time = now.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
  return { date, time };
}

/* ============================================================
   7.  ASYNC FUNCTION – getCoordinates(city)
   Calls the Geocoding API to convert a city name to lat/lon.
   @param {string} city
   @returns {Promise<{ latitude, longitude, name, country }>}
   @throws {Error} if the city is not found or the network fails.
   ============================================================ */
async function getCoordinates(city) {
  const url = `${GEO_API}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

  const response = await fetch(url);

  // Check HTTP-level errors
  if (!response.ok) {
    throw new Error(`Geocoding API error: HTTP ${response.status}`);
  }

  const data = await response.json();

  // Validate that we got at least one result
  if (!data.results || data.results.length === 0) {
    throw new Error(`City "${city}" not found. Please check the spelling and try again.`);
  }

  const location = data.results[0];

  // Extract only the fields we need, with safe fallbacks
  return {
    latitude:  location.latitude,
    longitude: location.longitude,
    name:      location.name    || city,
    country:   location.country || '',
    admin1:    location.admin1  || '',  // State / province
  };
}

/* ============================================================
   8.  ASYNC FUNCTION – getWeather(latitude, longitude)
   Calls the Weather API to get current conditions.
   @param {number} latitude
   @param {number} longitude
   @returns {Promise<Object>} – The parsed JSON response
   @throws {Error} on network or API failure.
   ============================================================ */
async function getWeather(latitude, longitude) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
    ].join(','),
    timezone: 'auto',
  });

  const url = `${WX_API}?${params.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Weather API error: HTTP ${response.status}`);
  }

  const data = await response.json();

  // Validate that the essential "current" block exists
  if (!data.current) {
    throw new Error('Unexpected response format from the Weather API.');
  }

  return data;
}

/* ============================================================
   9.  HELPER – updateDashboard(weatherData, locationInfo)
   Reads the API responses and updates all DOM elements.
   ============================================================ */
function updateDashboard(weatherData, locationInfo) {
  const current = weatherData.current;

  // --- Safe value extraction with fallbacks ---
  const temp        = current.temperature_2m       ?? '—';
  const feelsLike   = current.apparent_temperature ?? '—';
  const humidity    = current.relative_humidity_2m ?? '—';
  const wind        = current.wind_speed_10m       ?? '—';
  const precip      = current.precipitation        ?? '—';
  const weatherCode = current.weather_code         ?? null;
  const isDay       = current.is_day               ?? 1;   // default to day

  // Look up WMO code → description & icon (graceful unknown)
  const weatherInfo = WMO_CODES[weatherCode] || { desc: 'Unknown', icon: '🌡️' };

  // Night override: if code 0 (clear) and it's night → moon icon
  const displayIcon = (weatherCode === 0 && isDay === 0) ? '🌙' : weatherInfo.icon;

  const dayNightText = isDay === 1 ? 'Daytime' : 'Night-time';
  const dayNightIcon = isDay === 1 ? '☀️' : '🌙';

  // --- City header ---
  cityNameEl.textContent    = locationInfo.name;
  cityCountryEl.textContent = [locationInfo.admin1, locationInfo.country]
    .filter(Boolean).join(', ');

  const { date, time } = getFormattedDateTime();
  currentDateEl.textContent = date;
  currentTimeEl.textContent = time;

  // --- Hero card ---
  weatherIconEl.textContent        = displayIcon;
  temperatureEl.textContent        = typeof temp === 'number' ? temp.toFixed(1) : temp;
  weatherDescriptionEl.textContent = weatherInfo.desc;
  dayNightLabelEl.textContent      = dayNightText;

  // --- Info cards ---
  cardTempEl.textContent      = typeof temp      === 'number' ? temp.toFixed(1)      : temp;
  cardFeelsLikeEl.textContent = typeof feelsLike === 'number' ? feelsLike.toFixed(1) : feelsLike;
  cardHumidityEl.textContent  = typeof humidity  === 'number' ? humidity.toFixed(0)  : humidity;
  cardWindEl.textContent      = typeof wind      === 'number' ? wind.toFixed(1)      : wind;
  cardPrecipEl.textContent    = typeof precip    === 'number' ? precip.toFixed(2)    : precip;
  cardDayNightEl.textContent  = dayNightText;
  dayNightIconEl.textContent  = dayNightIcon;

  // --- Reveal dashboard ---
  weatherDashboard.classList.remove('hidden');
  welcomeMsg.classList.add('hidden');
}

/* ============================================================
   10. MAIN FUNCTION – searchWeather()
   Orchestrates the full city-search flow.
   ============================================================ */
async function searchWeather() {
  // Prevent overlapping requests
  if (isFetching) return;

  // --- Input validation ---
  const city = cityInput.value.trim();

  if (!city) {
    showError('Please enter a city name before searching.');
    return;
  }

  // Only allow reasonable city-name characters
  if (city.length < 2) {
    showError('City name is too short. Please enter at least 2 characters.');
    return;
  }

  // --- Begin fetch cycle ---
  isFetching = true;
  setButtonsDisabled(true);
  hideError();
  showLoading();

  try {
    // Step 1 – Resolve city name → coordinates
    const locationInfo = await getCoordinates(city);

    // Step 2 – Fetch live weather data
    const weatherData  = await getWeather(locationInfo.latitude, locationInfo.longitude);

    // Step 3 – Render results
    updateDashboard(weatherData, locationInfo);

  } catch (error) {
    // Show a friendly message instead of raw error
    showError(error.message || 'Something went wrong. Please try again.');
    console.error('[Weather Dashboard] searchWeather error:', error);

  } finally {
    // Always stop the loading indicator, even on failure
    hideLoading();
    isFetching = false;
    setButtonsDisabled(false);
  }
}

/* ============================================================
   11. FUNCTION – getWeatherByLocation()
   Uses the browser Geolocation API to get the user's position,
   then fetches weather without going through the geocoding step.
   ============================================================ */
async function getWeatherByLocation() {
  // Guard: browser does not support geolocation
  if (!('geolocation' in navigator)) {
    showError('Geolocation is not supported by your browser. Please search by city name.');
    return;
  }

  if (isFetching) return;
  isFetching = true;
  setButtonsDisabled(true);
  hideError();
  showLoading();

  try {
    // Request position (prompts the user for permission)
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 10000,          // 10-second timeout
        maximumAge: 60000,       // Accept a cached position up to 1 minute old
        enableHighAccuracy: false,
      });
    });

    const { latitude, longitude } = position.coords;

    // Fetch weather using the raw coordinates
    const weatherData = await getWeather(latitude, longitude);

    // For a location-based search, build a minimal location object
    // (no city name available from coords alone without reverse geocoding)
    const locationInfo = {
      name:    'Your Location',
      country: '',
      admin1:  `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`,
    };

    updateDashboard(weatherData, locationInfo);

  } catch (error) {
    // Handle GeolocationPositionError codes specifically
    if (error instanceof GeolocationPositionError) {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          showError('Location access was denied. Please allow location access or search by city name.');
          break;
        case error.POSITION_UNAVAILABLE:
          showError('Your location could not be determined. Please search by city name instead.');
          break;
        case error.TIMEOUT:
          showError('Location request timed out. Please search by city name instead.');
          break;
        default:
          showError('An unknown geolocation error occurred. Please search by city name.');
      }
    } else {
      showError(error.message || 'Failed to fetch weather for your location.');
    }
    console.error('[Weather Dashboard] getWeatherByLocation error:', error);

  } finally {
    hideLoading();
    isFetching = false;
    setButtonsDisabled(false);
  }
}

/* ============================================================
   12. EVENT LISTENERS
   ============================================================ */

// Search button click
searchBtn.addEventListener('click', searchWeather);

// Allow pressing Enter to trigger search
cityInput.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    searchWeather();
  }
});

// "My Location" button click
locationBtn.addEventListener('click', getWeatherByLocation);

// Clear the error banner whenever the user starts typing
cityInput.addEventListener('input', function () {
  if (!errorBanner.classList.contains('hidden')) {
    hideError();
  }
});

/* ============================================================
   13. INITIALISATION
   ============================================================ */
// Focus the city input on page load for convenience
cityInput.focus();

// Note: location permission is NOT requested automatically on load.
// The user must explicitly click the "My Location" button.
