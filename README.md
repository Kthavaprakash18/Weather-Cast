# 🌤️ Real-Time Weather Dashboard

A fully functional, responsive weather dashboard built with **HTML5**, **CSS3**, and **Vanilla JavaScript** that fetches live weather data from public REST APIs using the **Fetch API** with `async/await`.

---

## 📌 Project Overview

This project demonstrates the integration of **Asynchronous JavaScript** with **RESTful APIs**. The user can search for any city and instantly see current weather conditions including temperature, humidity, wind speed, precipitation, and more — all without refreshing the page.

The application is built as an academic practical assignment to illustrate key concepts of modern JavaScript development.

---

## ✨ Features

- 🔍 **City Search** — search weather for any city worldwide
- 📍 **My Location** — one-click weather using browser geolocation
- 🌡️ **Live Temperature** — real-time temperature in °C
- 🤔 **Feels-Like Temperature** — apparent temperature
- 💧 **Humidity** — relative humidity percentage
- 💨 **Wind Speed** — in km/h
- 🌧️ **Precipitation** — current precipitation in mm
- ☀️ **Day / Night Status** — dynamically detected from the API
- 🏷️ **Weather Description** — mapped from WMO weather codes
- ⚡ **Loading Indicator** — animated spinner during API calls
- ⚠️ **Error Handling** — user-friendly messages for all failure cases
- 📱 **Fully Responsive** — mobile, tablet, and desktop layouts
- ⌨️ **Enter Key Support** — press Enter to search

---

## 🛠️ Technologies Used

| Technology       | Purpose                                      |
|------------------|----------------------------------------------|
| HTML5            | Semantic page structure                      |
| CSS3             | Responsive layout, animations, design system |
| Vanilla JavaScript (ES2021) | App logic, DOM manipulation, API calls |
| Fetch API        | HTTP requests to REST APIs                   |
| async / await    | Non-blocking asynchronous code               |
| Open-Meteo API   | Free, open-source weather data               |
| Geolocation API  | Browser-based device location                |

---

## 🌐 API Endpoints

### Geocoding (City → Coordinates)
```
GET https://geocoding-api.open-meteo.com/v1/search?name={CITY}&count=1&language=en&format=json
```

### Weather (Coordinates → Conditions)
```
GET https://api.open-meteo.com/v1/forecast
      ?latitude={LAT}&longitude={LON}
      &current=temperature_2m,relative_humidity_2m,apparent_temperature,
               is_day,precipitation,weather_code,wind_speed_10m
      &timezone=auto
```

Both APIs are **free**, require **no API key**, and have generous rate limits suitable for learning projects.

---

## 📁 Project Folder Structure

```
weather-dashboard/
│
├── index.html   ← Page structure (semantic HTML5)
├── style.css    ← All styles (responsive, dark-navy/sky-blue palette)
├── script.js    ← App logic (Fetch API, async/await, DOM updates)
└── README.md    ← This documentation
```

---

## 🚀 How to Run the Application

> **Requirement:** An internet connection is needed to fetch live weather data.

### Option A — Python (easiest, no install needed on macOS)
```bash
# Navigate into the project folder
cd weather-dashboard

# Python 3
python3 -m http.server 8080
```
Then open **http://localhost:8080** in your browser.

### Option B — Node.js `serve`
```bash
npx serve weather-dashboard
```

### Option C — VS Code Live Server Extension
1. Open the `weather-dashboard/` folder in VS Code.
2. Right-click `index.html` → **Open with Live Server**.

> ⚠️ **Do not open `index.html` directly as a `file://` URL.** Modern browsers may block Fetch API calls on `file://` pages due to CORS policy. Always use a local HTTP server.

---

## 📖 Fetch API and async/await Explanation

### The Problem with Synchronous Code
Making a network request synchronously would **freeze the browser tab** until data arrives. JavaScript solves this with its event loop and **asynchronous** patterns.

### How async/await Works
```js
// async marks a function as asynchronous — it always returns a Promise
async function getCoordinates(city) {
  // await pauses THIS function (not the whole browser)
  // and resumes it when the Promise resolves
  const response = await fetch(`https://geocoding-api.open-meteo.com/...`);

  // Check the HTTP status before trusting the body
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  // .json() also returns a Promise; await it too
  const data = await response.json();
  return data.results[0];
}
```

### Call Chain
```
searchWeather()
  └─► getCoordinates(city)   → Geocoding API → latitude, longitude
        └─► getWeather(lat, lon) → Weather API  → current conditions
              └─► updateDashboard()              → DOM update
```

All steps are `await`-ed inside a single `try/catch/finally` block so errors anywhere in the chain are caught in one place and the loading indicator is always hidden in `finally`.

---

## 🛡️ Error Handling Approach

The application handles errors at multiple layers:

| Scenario                      | Handling                                                      |
|-------------------------------|---------------------------------------------------------------|
| Empty city input              | Validates before any API call, shows inline message           |
| City not found                | Checks `data.results.length === 0`, throws named error        |
| HTTP error (non-2xx)          | Checks `response.ok`, throws with status code                 |
| Network failure (offline)     | `fetch()` rejects; caught in `catch`, user-friendly message shown |
| Invalid JSON                  | `response.json()` rejects; caught and relayed to user         |
| Missing API fields            | Uses `?? '—'` (nullish coalescing) for every field            |
| Geolocation denied            | Checks `GeolocationPositionError.code` and maps each case     |
| Geolocation timeout           | 10-second timeout passed to `getCurrentPosition` options      |
| Duplicate submissions         | `isFetching` flag prevents overlapping requests               |

---

## ⚠️ Known Limitations

- **No API key required, no rate-limit configuration** — Open-Meteo is generous for development use, but do not use this in a high-traffic production app without checking their usage policy.
- **Geolocation only returns coordinates** — "My Location" shows coordinates as the location label; a reverse-geocoding step would be needed to display a city name.
- **No forecast / hourly data** — only current conditions are displayed; extending to multi-day forecasts is a natural next step.
- **Internet connection required** — all data is live; there is no offline caching.
- **Temperature in Celsius only** — a toggle between °C / °F could be added.
- **Emoji weather icons** — emoji rendering varies slightly across operating systems. A dedicated icon library (e.g. weather-icons) could replace them for pixel-perfect consistency.

---

## 👨‍💻 Author

Built as a practical assignment demonstrating **Asynchronous JavaScript** and **RESTful API** integration using only HTML, CSS, and Vanilla JavaScript.
