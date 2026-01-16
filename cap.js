// Using free APIs - no API keys required!
const GEOCODE_SEARCH_URL = "https://photon.komoot.io/api/";
const FOURSQUARE_SEARCH_URL = "https://api.foursquare.com/v2/venues/explore?&client_id=UZD3LGAGEODLXRADR530ZNHVCWFVA4V3B4ESJ52IB2YWQR0M&client_secret=L0OKMQE4AO1J24VTOD0FN15MUX3V3SUXRMYB4AABEL0RHCOH&v=20170915";
const WEATHER_SEARCH_URL = "https://api.open-meteo.com/v1/forecast";

function scrollPageTo(myTarget, topPadding) {
    if (topPadding == undefined) {
        topPadding = 0;
    };
    var moveTo = $(myTarget).offset().top - topPadding;
    $('html, body').stop().animate({
        scrollTop: moveTo
    }, 200);
}

function getGeocodeData(searchTerm, callback) {
    // Using Photon API - free, browser-friendly, no API key needed
    const query = {
        q: searchTerm,
        limit: 1
    };
    
    $.ajax({
        url: GEOCODE_SEARCH_URL,
        data: query,
        dataType: 'json',
        type: 'GET',
        success: callback,
        error: function(xhr, status, error) {
            console.error('Geocoding error:', error);
            alert('Unable to find location. Please try again with a different search term.');
        }
    });
}

function enterLocation() {
    $('.category-button').click(function () {
        $('button').removeClass("selected");
        $(this).addClass("selected");
    });
    $('.search-form').submit(function (event) {
        event.preventDefault();
        const queryTarget = $(event.currentTarget).find('.js-query');
        const query = queryTarget.val().trim();
        console.log(query);
        
        // Check if query is empty
        if (!query) {
            alert('Please enter a location');
            return;
        }
        
        queryTarget.val("");
        
        // Relaxed restriction to allow commas and periods for better location support
        const restriction = /[^a-zA-Z0-9\s,.-]/;
        if (restriction.test(query)) {
            $("#errMsg").text("Please use only letters, numbers, spaces, commas, and periods").removeClass("hidden");
        } else {
            $("#errMsg").addClass("hidden");
            $('.navigation').removeClass("hide");
            $('#weather-display').html('<p>Loading weather data...</p>');
            $('#foursquare-results').html("");
            $('button').removeClass("selected");
            getGeocodeData(query, handleGeocodeResponse);
        }
    });
}

function handleGeocodeResponse(response) {
    console.log("the server responded!");
    console.log(response);
    
    // Photon returns features array in GeoJSON format
    if (response.features && response.features.length > 0) {
        const first = response.features[0];
        const latitude = first.geometry.coordinates[1]; // Note: GeoJSON is [lon, lat]
        const longitude = first.geometry.coordinates[0];
        const locationName = first.properties.name || first.properties.city || first.properties.country || 'Unknown Location';
        
        getFourSquareData(latitude, longitude);
        console.log(latitude, longitude);
        getWeatherData(latitude, longitude, locationName);
    } else {
        alert('Location not found. Please try a different search term.');
        $('#weather-display').html("");
    }
}

function getWeatherData(latitude, longitude, locationName) {
    $.ajax(WEATHER_SEARCH_URL, {
        data: {
            latitude: latitude,
            longitude: longitude,
            current: 'temperature_2m,relative_humidity_2m,weather_code',
            temperature_unit: 'fahrenheit'
        },
        dataType: 'json',
        type: 'GET',
        success: function (data) {
            let widget = displayWeather(data, locationName);
            $('#weather-display').html(widget);
            scrollPageTo('#weather-display', 15);
        },
        error: function () {
            $('#weather-display').html("<div class='weather-results'><p>Unable to fetch weather data.</p></div>");
        }
    });
}

// Weather code to description mapping (WMO Weather interpretation codes)
function getWeatherDescription(code) {
    const weatherCodes = {
        0: { main: 'Clear', description: 'clear sky', icon: '01' },
        1: { main: 'Mainly Clear', description: 'mainly clear', icon: '01' },
        2: { main: 'Partly Cloudy', description: 'partly cloudy', icon: '02' },
        3: { main: 'Overcast', description: 'overcast', icon: '03' },
        45: { main: 'Foggy', description: 'fog', icon: '50' },
        48: { main: 'Foggy', description: 'depositing rime fog', icon: '50' },
        51: { main: 'Drizzle', description: 'light drizzle', icon: '09' },
        53: { main: 'Drizzle', description: 'moderate drizzle', icon: '09' },
        55: { main: 'Drizzle', description: 'dense drizzle', icon: '09' },
        61: { main: 'Rain', description: 'slight rain', icon: '10' },
        63: { main: 'Rain', description: 'moderate rain', icon: '10' },
        65: { main: 'Rain', description: 'heavy rain', icon: '10' },
        71: { main: 'Snow', description: 'slight snow', icon: '13' },
        73: { main: 'Snow', description: 'moderate snow', icon: '13' },
        75: { main: 'Snow', description: 'heavy snow', icon: '13' },
        77: { main: 'Snow', description: 'snow grains', icon: '13' },
        80: { main: 'Rain Showers', description: 'slight rain showers', icon: '09' },
        81: { main: 'Rain Showers', description: 'moderate rain showers', icon: '09' },
        82: { main: 'Rain Showers', description: 'violent rain showers', icon: '09' },
        85: { main: 'Snow Showers', description: 'slight snow showers', icon: '13' },
        86: { main: 'Snow Showers', description: 'heavy snow showers', icon: '13' },
        95: { main: 'Thunderstorm', description: 'thunderstorm', icon: '11' },
        96: { main: 'Thunderstorm', description: 'thunderstorm with slight hail', icon: '11' },
        99: { main: 'Thunderstorm', description: 'thunderstorm with heavy hail', icon: '11' }
    };
    
    return weatherCodes[code] || { main: 'Unknown', description: 'unknown conditions', icon: '01' };
}

function displayWeather(data, locationName) {
    const current = data.current;
    const tempF = current.temperature_2m;
    const tempC = ((tempF - 32) * (5/9)).toFixed(2);
    const humidity = current.relative_humidity_2m;
    const weatherInfo = getWeatherDescription(current.weather_code);
    
    return `
    <div class="weather-results">
        <h1><strong>Current Weather for ${locationName.split(',')[0]}</strong></h1>
        <img src="https://openweathermap.org/img/w/${weatherInfo.icon}d.png" alt="current weather icon">
        <p style="font-size:30px; margin-top:10px;">${weatherInfo.main}</p>
        <p style="color:steelblue;">Description:</p><p>${weatherInfo.description}</p>
        <p style="color:steelblue;">Temperature:</p><p>${tempF} &#8457; / ${tempC} &#8451;</p>
        <p style="color:steelblue;">Humidity:</p><p>${humidity} &#37;</p>
        <p style="font-size:12px; margin-top:10px; color:#666;">Weather data from Open-Meteo.com</p>
    </div>
`;
}

function getFourSquareData(latitude, longitude) {
    $('.category-button').click(function () {
        let category = $(this).text();
        $.ajax(FOURSQUARE_SEARCH_URL, {
            data: {
                ll: `${latitude},${longitude}`,
                radius: 500,
                venuePhotos: 1,
                limit: 9,
                query: 'recommended',
                section: category,
            },
            dataType: 'json',
            type: 'GET',
            success: function (data) {
                let results = data.response.groups[0].items.map(function (item, index) {
                    return displayResults(item);
                });
                $('#foursquare-results').html(results);
                scrollPageTo('#foursquare-results', 15);
            },
            error: function () {
                $('#foursquare-results').html("<div class='result'><p>Sorry! No Results Found.</p></div>");
            }
        });
    });
}

function displayResults(result) {
    console.log(result);
    return `
<div class="result col-3">
<div class="result-description">
    <h2 class="result-name"><a href="https://foursquare.com/v/${result.venue.id}" target="_blank">${result.venue.name}</a></h2>
    <span class="icon">
        <img src="${result.venue.categories[0].icon.prefix}bg_32${result.venue.categories[0].icon.suffix}" alt="category-icon">
    </span>
    <span class="icon-text">
        ${result.venue.categories[0].name}
    </span>
    <p class="result-address">${result.venue.location.formattedAddress[0]}</p>
    <p class="result-address">${result.venue.location.formattedAddress[1]}</p>
    <p class="result-address">${result.venue.location.formattedAddress[2]}</p>
</div>
</div>
`;
}

$(enterLocation);