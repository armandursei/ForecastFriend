/**
 * ForecastFriend - client-side weather viewer.
 *
 * Builds the whole UI inside <div id="root">, suggests cities while the user types
 * (Geoapify), shows current conditions and a 5-day forecast (WeatherAPI.com),
 * uses a photo of the selected city as the page background (Pexels) and keeps
 * an in-memory list of favorite cities.
 *
 * API keys are read from window.APP_CONFIG, defined in scripts/config.js
 * (see scripts/config.example.js).
 */

// The script is loaded in <head>, so wait until the DOM is ready.
document.addEventListener("DOMContentLoaded", (_event) => {
    const DEFAULT_BACKGROUND = "linear-gradient(to bottom,#FBFBFB,#FFFFF4)";
    const REQUIRED_CONFIG_KEYS = ["GEOAPIFY_API_KEY", "WEATHER_API_KEY", "PEXELS_API_KEY"];

    const root = document.getElementById('root');
    root.classList.add("card");
    document.body.style.backgroundImage = DEFAULT_BACKGROUND;

    const config = window.APP_CONFIG || {};
    const missingKeys = REQUIRED_CONFIG_KEYS.filter(key => !isConfigured(config[key]));
    if (missingKeys.length > 0) {
        showConfigError(missingKeys);
        return;
    }

    const geoapifyApiKey = config.GEOAPIFY_API_KEY;
    const weatherApiKey = config.WEATHER_API_KEY;
    const pexelsApiKey = config.PEXELS_API_KEY;

    // Favorites live only for the current page session: { name, lat, lon }.
    let favoriteCities = [];

    root.innerHTML = `
      <div id="actual">
        <img src="assets/images/online-weather-forecast-icon.jpeg" alt="weather-icon-title" />
        <h3>Find weather in:</h3>
      </div>
      <div class="search-container">
        <input
          type="text"
          id="city-input"
          autocomplete="off"
          placeholder="type location e.g. Bucharest"
        />
        <button id="clear-button">Clear</button>
      </div>
      <div id="favorites-list"></div>
      <div id="autocomplete-list"></div>
      <div id="weather-card"></div>
      <div id="spinner" style="display:none;"></div>
    `;

    const inputField = document.getElementById('city-input');
    const autocompleteList = document.getElementById('autocomplete-list');
    const weatherCard = document.getElementById('weather-card');
    const spinner = document.getElementById('spinner');

    document.getElementById('clear-button').addEventListener('click', clearInput);
    inputField.addEventListener('input', debounce(handleInput, 40));
    inputField.addEventListener('focus', () => {
        if (inputField.value === '') {
            renderFavoriteCities();
        }
    });

    /** Returns true when a config value is set and is not the example placeholder. */
    function isConfigured(value) {
        return typeof value === "string" && value.trim() !== "" && !value.startsWith("your-");
    }

    /** Replaces the app with a setup message when API keys are missing. */
    function showConfigError(keys) {
        const message = `Missing API configuration: ${keys.join(", ")}. ` +
            "Copy scripts/config.example.js to scripts/config.js and add your API keys.";
        console.error(message);

        const notice = document.createElement('p');
        notice.textContent = message;
        root.replaceChildren(notice);
    }

    /** City autocomplete suggestions from Geoapify. */
    async function fetchCityData(query) {
        const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=${geoapifyApiKey}&type=city`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            return data.features;
        } catch (error) {
            console.error('Error fetching city data:', error);
            return [];
        }
    }

    /** Current weather conditions from WeatherAPI.com. */
    async function fetchWeatherData(lat, lon) {
        const url = `https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${lat},${lon}`;

        try {
            const response = await fetch(url);
            return await response.json();
        } catch (error) {
            console.error('Error fetching weather data:', error);
            return null;
        }
    }

    /** Today plus the next 5 days from WeatherAPI.com. */
    async function fetchForecastData(lat, lon) {
        const url = `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${lat},${lon}&days=6`;

        try {
            const response = await fetch(url);
            return await response.json();
        } catch (error) {
            console.error('Error fetching forecast data:', error);
            return null;
        }
    }

    /** URL of the first Pexels photo matching the city name, or null. */
    async function fetchCityImage(cityName) {
        const apiUrl = `https://api.pexels.com/v1/search?query=${cityName}`;

        try {
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': pexelsApiKey,
                },
            });
            const data = await response.json();
            return data.photos.length > 0 ? data.photos[0].src.large : null;
        } catch (error) {
            document.body.style.backgroundImage = DEFAULT_BACKGROUND;
            console.error('Error fetching city image:', error);
            return null;
        }
    }

    /** Fetches weather, forecast and background photo for a city, then renders them. */
    async function loadCity(cityName, lat, lon) {
        showLoadingSpinner();
        const weatherData = await fetchWeatherData(lat, lon);
        const forecastData = await fetchForecastData(lat, lon);
        const backgroundImageUrl = await fetchCityImage(cityName);
        document.body.style.backgroundImage = backgroundImageUrl
            ? `url(${backgroundImageUrl})`
            : DEFAULT_BACKGROUND;
        hideLoadingSpinner();

        updateWeatherCard(weatherData, forecastData, cityName, lat, lon);
    }

    function displayAutocomplete(data) {
        autocompleteList.innerHTML = '';
        const ul = document.createElement('ul');

        data.forEach(city => {
            const cityName = city.properties.city || city.properties.locality;
            if (!cityName) {
                return;
            }

            const county = city.properties.county || '';
            const country = city.properties.country || '';
            const displayText = `${cityName}, ${county ? county + ', ' : ''}${country}`;

            const listItem = document.createElement('li');
            listItem.textContent = displayText;
            listItem.addEventListener('click', () => {
                inputField.value = displayText;
                clearAutocomplete();

                // GeoJSON coordinates are [longitude, latitude].
                const [lon, lat] = city.geometry.coordinates;
                loadCity(cityName, lat, lon);
            });

            ul.appendChild(listItem);
        });

        autocompleteList.appendChild(ul);
    }

    function showLoadingSpinner() {
        spinner.style.display = 'block';
    }

    function hideLoadingSpinner() {
        spinner.style.display = 'none';
    }

    function clearAutocomplete() {
        autocompleteList.innerHTML = '';
    }

    function findFavoriteIndex(cityName, lat, lon) {
        return favoriteCities.findIndex(city => city.name == cityName && city.lat == lat && city.lon == lon);
    }

    function setHeartFilled(heart, filled) {
        heart.classList.toggle("fa-solid", filled);
        heart.classList.toggle("favorite", filled);
        heart.classList.toggle("fa-regular", !filled);
    }

    /** Renders the current conditions card with a favorite toggle and a forecast button. */
    function updateWeatherCard(weatherData, forecastData, cityName, lat, lon) {
        if (!weatherData) {
            console.error('Invalid or missing weather data:', weatherData);
            alert('Error fetching weather data.');
            return;
        }

        const temperature = weatherData.current.temp_c;
        const skyConditions = weatherData.current.condition.text || '';
        const icon = `https:${weatherData.current.condition.icon}`;
        const humidity = weatherData.current.humidity || '';
        const feelsLikeTemp = weatherData.current.feelslike_c;

        weatherCard.innerHTML = `
            <div id="actual">
                <h2>${cityName} <i id="favorite-button" class="fa-regular fa-heart fa-xs" style="margin-left: 6px"></i></h2>
            </div>

            <div id="actual">
                <img id="imag" src="${icon}" alt="Weather Condition Icon">
                <p>${temperature}°C</p>
            </div>

            <p id="details">Real feel: ${feelsLikeTemp} °C</p>
            <p id="details">Sky Conditions: ${skyConditions}</p>
            <p id="details">Humidity: ${humidity}%</p>

            <button id="forecast-button">Forecast for the next 5 days</button>
        `;
        clearAutocomplete();

        document.getElementById('forecast-button').addEventListener('click', () => {
            updateForecast(forecastData);
        });

        const heart = document.getElementById("favorite-button");
        setHeartFilled(heart, findFavoriteIndex(cityName, lat, lon) !== -1);

        heart.addEventListener("click", () => {
            const index = findFavoriteIndex(cityName, lat, lon);
            if (index !== -1) {
                favoriteCities.splice(index, 1);
                setHeartFilled(heart, false);
            } else {
                favoriteCities.push({ name: cityName, lat: lat, lon: lon });
                setHeartFilled(heart, true);
            }
        });
    }

    async function handleInput() {
        const inputValue = inputField.value;
        weatherCard.innerHTML = '';

        if (inputValue.length >= 3) {
            const data = await fetchCityData(inputValue);
            displayAutocomplete(data);
        } else if (inputValue === '') {
            renderFavoriteCities();
        } else {
            clearAutocomplete();
        }
    }

    /** Delays calls to `func` until `delay` ms have passed without a new call. */
    function debounce(func, delay) {
        let timeout;
        return function () {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, delay);
        };
    }

    function clearInput() {
        inputField.value = '';
        clearAutocomplete();
        weatherCard.innerHTML = '';
    }

    /** Toggles the 5-day forecast below the weather card. */
    function updateForecast(forecastData) {
        clearAutocomplete();
        if (!forecastData) {
            console.error('Invalid or missing forecast data:', forecastData);
            alert('Error fetching forecast data.');
            return;
        }

        const existingForecastContainer = document.getElementById('forecast-container');
        if (existingForecastContainer) {
            existingForecastContainer.remove();
            return;
        }

        const forecastContainer = document.createElement("div");
        forecastContainer.classList.add("forecast-container");
        forecastContainer.setAttribute("id", "forecast-container");
        weatherCard.appendChild(forecastContainer);

        // Index 0 is today, so start from tomorrow.
        for (let i = 1; i < forecastData.forecast.forecastday.length; i++) {
            const day = forecastData.forecast.forecastday[i];

            const date = day.date;
            const minTemp = day.day.mintemp_c;
            const maxTemp = day.day.maxtemp_c;
            const icon = `https:${day.day.condition.icon}`;

            const forecastCard = document.createElement('div');
            forecastCard.classList.add('forecast-card');
            forecastCard.innerHTML = `
            <div id="element">
                <p id="date_resize">${date}</p>
                <img src="${icon}" alt="Weather Condition Icon">
                <p id="temp_resize">Max Temp: ${maxTemp} °C</p>
                <p id="temp_resize">Min Temp: ${minTemp} °C</p>
            </div>
            `;

            forecastContainer.appendChild(forecastCard);
        }
    }

    /** Shows the saved favorites in the suggestions list. */
    function renderFavoriteCities() {
        autocompleteList.innerHTML = '';

        if (favoriteCities.length > 0) {
            const heading = document.createElement('h1');
            heading.setAttribute('id', 'your_fav');
            heading.textContent = 'Your favorites:';
            autocompleteList.appendChild(heading);
        }

        const ul = document.createElement('ul');

        favoriteCities.forEach(city => {
            const listItem = document.createElement("li");
            listItem.textContent = city.name;
            listItem.addEventListener('click', () => {
                inputField.value = city.name;
                loadCity(city.name, city.lat, city.lon);
            });

            ul.appendChild(listItem);
        });

        autocompleteList.appendChild(ul);
    }
});
