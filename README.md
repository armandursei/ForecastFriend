<img src="assets/images/online-weather-forecast-icon.jpeg" alt="ForecastFriend logo" width="80" />

# ForecastFriend

A vanilla JavaScript weather app: type a city, pick it from live autocomplete suggestions and see the current weather, a 5-day forecast and a photo of the city as the page background.

## Features

- City autocomplete while typing (from 3 characters, debounced) via the Geoapify Geocoding API
- Current conditions: temperature, "real feel", sky conditions, humidity and weather icon
- 5-day forecast with daily min/max temperatures, toggled with a button
- Page background replaced with a photo of the selected city (Pexels), with a gradient fallback
- Favorite cities: toggle the heart icon, then focus the empty search box to see and reopen them (kept for the current page session)
- Loading spinner while data is fetched and a Clear button to reset the search
- The entire UI is rendered by JavaScript into a single `<div id="root">`

## Tech stack

- HTML, CSS and vanilla JavaScript (Fetch API, `async`/`await`, JSON), no build step
- [Geoapify Geocoding API](https://www.geoapify.com/) for city autocomplete
- [WeatherAPI.com](https://www.weatherapi.com/docs/) for current weather and forecast
- [Pexels API](https://www.pexels.com/api/) for city photos
- [Font Awesome](https://fontawesome.com/) for the favorite icon
- GitHub Actions + GitHub Pages for deployment

## How it works

1. Input in the search box is debounced; queries of 3+ characters are sent to Geoapify, and the returned cities are shown as a clickable list.
2. Selecting a city takes its coordinates and requests the current weather and a 6-day forecast (today plus the next 5 days) from WeatherAPI.com, plus a matching photo from Pexels.
3. The weather card, forecast cards and favorites list are built with template strings and DOM APIs.

## Getting started

You need free API keys from [Geoapify](https://myprojects.geoapify.com/), [WeatherAPI.com](https://www.weatherapi.com/signup.aspx) and [Pexels](https://www.pexels.com/api/).

```bash
git clone https://github.com/armandursei/ForecastFriend.git
cd ForecastFriend
cp scripts/config.example.js scripts/config.js   # then fill in your three keys
python3 -m http.server 8000                      # or any static file server
```

Open http://localhost:8000. If `scripts/config.js` is missing or still has placeholder values, the page shows which keys are missing.

### Deployment

`.github/workflows/deploy-pages.yml` is run manually (Actions > Deploy to GitHub Pages > Run workflow): it writes `scripts/config.js` from the repository secrets `GEOAPIFY_API_KEY`, `WEATHER_API_KEY` and `PEXELS_API_KEY` and publishes the site to GitHub Pages (Pages source: "GitHub Actions").

> **Note on API keys:** this is a static site, so any key it uses is downloaded by the browser and visible to visitors. Keeping the keys out of the repository prevents them from leaking through the source code, but they should also be restricted to the site's domain (allowed origins / HTTP referrers) in each provider's dashboard.

## Project structure

```
ForecastFriend/
├── index.html                  # Page shell, loads config, script and styles
├── scripts/
│   ├── index.js                # App logic: API calls and UI rendering
│   └── config.example.js       # Template for scripts/config.js (API keys)
├── styles/
│   └── global.css
├── assets/images/              # App logo
└── .github/workflows/
    └── deploy-pages.yml        # GitHub Pages deployment
```

## Author

George-Armand Ursei - [GitHub](https://github.com/armandursei)
