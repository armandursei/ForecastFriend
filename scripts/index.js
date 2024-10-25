// // Register a listener for the DOMContentLoaded event. This is triggered when the HTML is loaded and the DOM is constructed.
// // We are doing this because the script is loaded in the head of the document, so the DOM is not yet constructed when the script is executed.
// document.addEventListener("DOMContentLoaded", (_event) => {
//     alert("After DOM has loaded");
//     // todo: Add code here that updates the HTML, registers event listeners, calls HTTP endpoints, etc.
// });


document.addEventListener("DOMContentLoaded", (_event) => {
    const apiKey = 'a8212296036b4e8480ef4f1d4abce4b9'; 
    const weatherApiKey = '24aa62358784461da60231921241201'; 

    let favoriteCities = [];

    const bg = document.createElement('p');
     bg.setAttribute('id','bg');
     document.body.style.backgroundImage="linear-gradient(to bottom,#FBFBFB,#FFFFF4)";


    const car = document.getElementById('root');
    car.classList.add("card");

    car.innerHTML = `
      <div id="actual">
      <img src="assets/images/online-weather-forecast-icon.jpeg" alt="weather-icon-title"></img>
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
      <div id="favorites-list" id="autocomplete-list"></div>
      <div id="autocomplete-list"></div>
      <div id="weather-card">
      </div>

      <div id="spinner" style="display:none;"></div>

    `;

    const inputField = document.getElementById('city-input');
    const autocompleteList = document.getElementById('autocomplete-list');
    const weatherCard = document.getElementById('weather-card');
    const forecastContainer = document.getElementById('forecast-container');


    const clearButton = document.getElementById('clear-button');
    clearButton.addEventListener('click', clearInput);

    inputField.addEventListener('input', debounce(handleInput, 40));

   const spinner = document.getElementById("spinner");




    async function fetchCityData(query) {
        const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=${apiKey}&type=city`;
        console.log('city url data:', url);

        try {
            const response = await fetch(url);
            const data = await response.json();
            console.log('city data:', data.features);
            return data.features;
        } catch (error) {
            console.error('Error fetching city data:', error);
            return [];
        }
    }

    async function fetchWeatherData(lat, lon) {
        const url = `https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${lat},${lon}`;

        console.log('WeatherAPI URL:', url);

        try {
            
            const response = await fetch(url);
            const data = await response.json();
            console.log("weather data",data);
            return data;
        } catch (error) {
            console.error('Error fetching weather data:', error);
            return null;
        }
    }

    async function fetchForecastData(lat, lon) {
        const url = `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${lat},${lon}&days=6`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            console.log("forecast data", data);
            return data;
        } catch (error) {
            console.error('Error fetching forecast data:', error);
            return null;
        }
    }

    async function fetchCityImage(cityName) {
        const apiUrl = `https://api.pexels.com/v1/search?query=${cityName}`;
        
        const pexelsApiKey = 'T43xFB27dVsmS27OjHwT1kgo9oZUrcB5TUJpzb4eP4k2n07hINdPTxdG';


        try {
            const response = await fetch(apiUrl, {


                headers: {
                    'Authorization':  pexelsApiKey,
                },
            });
    
            const data = await response.json();
            const imageUrl = data.photos.length > 0 ? data.photos[0].src.large : null;
            console.log(imageUrl);
            return imageUrl;
        } catch (error) {
            document.body.style.backgroundImage="linear-gradient(to bottom,#FBFBFB,#FFFFF4)";
            console.error('Error fetching city image:', error);
            return null;
        }
    }

    const Spinner = document.getElementById('spinner');


    function displayAutocomplete(data) {


        autocompleteList.innerHTML = '';
        const ul = document.createElement('ul');
        data.forEach(city => {
            if(city.properties.city || city.properties.locality){
            const listItem = document.createElement('li');
            const cityName = city.properties.city || city.properties.locality  ;
            const county = city.properties.county || '';
            const country = city.properties.country || '';
            const displayText = `${cityName ? cityName + ', ' : ''}${county ? county + ', ' : ''}${country}`;

            listItem.textContent = displayText;
            
            listItem.addEventListener('click', async () => {

                inputField.value = displayText;
                clearAutocomplete();


               const { coordinates } = city.geometry;
                const [lon, lat] = coordinates;
                showLoadingSpinner(); // Show loading spinner when fetching data
               const weatherData = await fetchWeatherData(lat, lon);
               const forecastData= await fetchForecastData(lat,lon);
               const backgroundImageUrl = await fetchCityImage(cityName);
               if (backgroundImageUrl) {
                document.body.style.backgroundImage = `url(${backgroundImageUrl})`;
                }
                else{
                    document.body.style.backgroundImage="linear-gradient(to bottom,#FBFBFB,#FFFFF4)";

                }
               hideLoadingSpinner(); // Hide loading spinner after fetching data
               
               updateWeatherCard(weatherData, forecastData, cityName, lat, lon);
            });



            ul.appendChild(listItem);}
        });
        autocompleteList.appendChild(ul);

    
    }

    function showLoadingSpinner() {
       spinner.style.display = 'block';
       console.log("apare spinner");
    }

    function hideLoadingSpinner() {
        spinner.style.display = 'none';
        console.log("nu mai apare spinner");

    }

    function clearAutocomplete() {
        autocompleteList.innerHTML = '';
    }

    function updateWeatherCard(weatherData, forecastData, cityName, lat, lon) {

        console.log("weather data",weatherData);
        if (!weatherData) {
            console.error('Invalid or missing weather data:', weatherData);
            alert('Error fetching weather data.');
            return;
        }
    
        const temperature = weatherData.current.temp_c;
        const skyConditions = weatherData.current.condition.text || '';
        const icon = `https:${weatherData.current.condition.icon}`;
        const humidity = weatherData.current.humidity || '';
        const feelTemp=weatherData.current.feelslike_c;
    
        weatherCard.innerHTML = `
            <div id="actual">
            <h2>${cityName} <i id="favorite-button" class="fa-regular fa-heart fa-xs" style="margin-left: 6px"></i></h2>
            </div>

            <div id="actual">
            <img id="imag" src="${icon}" alt="Weather Condition Icon">
            <p>${temperature}°C</p>
            </div>

            
            <p id="details">Real feel: ${feelTemp} °C</p>
            <p id="details">Sky Conditions: ${skyConditions}</p>
            <p id="details">Humidity: ${humidity}%</p>
            
            <button id="forecast-button">Forecast for the next 5 days</button>
        `;
        clearAutocomplete();
        const forecastButton = document.getElementById('forecast-button');
        forecastButton.addEventListener('click',  () => {updateForecast(forecastData);});
        clearAutocomplete();

        for (let i = 0; i < favoriteCities.length; i++) {
            if (favoriteCities[i].name == cityName && favoriteCities[i].lat && favoriteCities[i].lon == lon) {
                const heart = document.getElementById("favorite-button");

                heart.classList.add("fa-solid");
                heart.classList.add("favorite");
                heart.classList.remove("fa-regular");

                break;
            }
        }

        document.getElementById("favorite-button").addEventListener("click", function() {
            let found = false;
            const heart = document.getElementById("favorite-button");

            for (let i = 0; i < favoriteCities.length; i++) {
                if (favoriteCities[i].name == cityName && favoriteCities[i].lat && favoriteCities[i].lon == lon) {
                    found = true;
                    favoriteCities.splice(i, 1);
                    heart.classList.remove("fa-solid");
                    heart.classList.remove("favorite");
                    heart.classList.add("fa-regular");

                    break;
                }
            }

            if (!found) {
                heart.classList.add("fa-solid");
                heart.classList.add("favorite");
                heart.classList.remove("fa-regular");

                favoriteCities.push({"name": cityName, "lat": lat, "lon": lon});
            }

            console.log(favoriteCities);
        });
    }

    async function handleInput() {
        const inputValue = inputField.value;
        weatherCard.innerHTML = '';

        if (inputValue.length >= 3) {
            const data = await fetchCityData(inputValue);
            displayAutocomplete(data);
        } 
        else if(favoriteCities && inputField.value === ''){
            renderFavoriteCities();
        }
        else{
            clearAutocomplete();
        }
    }

    // Debounce function to limit the frequency of API requests
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
       // forecastContainer.innerHTML = ''; 

    }

    
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
        
        forecastContainer.innerHTML = '';

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
        clearAutocomplete();
    }


    inputField.addEventListener('focus', () => {
        if (inputField.value === '') {
            renderFavoriteCities();
        }
    });

    if (inputField.value === '' && favoriteCities.length===0) {
        autocompleteList.innerHTML = '';

    }

    function renderFavoriteCities() {
        console.log(favoriteCities);

        autocompleteList.innerHTML = '';
        if(favoriteCities.length>0){
            console.log(favoriteCities);
        const fav = document.createElement('h1');
        fav.setAttribute('id','your_fav');
        fav.textContent='Your favorites:';
        autocompleteList.appendChild(fav);
    }

        const ul = document.createElement('ul');

        favoriteCities.forEach(city => {
            const listItem = document.createElement("li");
            listItem.textContent = city.name;

            listItem.addEventListener('click', async () => {
                inputField.value = city.name;
                //inputField.value = '';
                //clearAutocomplete();
                showLoadingSpinner(); // Show loading spinner when fetching data

                const weatherData = await fetchWeatherData(city.lat, city.lon);
                const forecastData= await fetchForecastData(city.lat,city.lon);
                const backgroundImageUrl = await fetchCityImage(city.name);
                if (backgroundImageUrl) {
                 document.body.style.backgroundImage = `url(${backgroundImageUrl})`;
                 }
                 else{
                     document.body.style.backgroundImage="linear-gradient(to bottom,#FBFBFB,#FFFFF4)";
 
                 }
                hideLoadingSpinner(); // Hide loading spinner after fetching data
                
                updateWeatherCard(weatherData, forecastData, city.name, city.lat, city.lon);
            });

            ul.appendChild(listItem);
        });

        autocompleteList.appendChild(ul);
    }

});
