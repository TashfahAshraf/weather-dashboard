// --- DOM references ---
const form = document.getElementById('search-form');
const input = document.getElementById('city-input');
const clearBtn = document.getElementById('clear-btn');
const body = document.getElementById('body');

const stateIdle = document.getElementById('state-idle');
const stateLoading = document.getElementById('state-loading');
const stateError = document.getElementById('state-error');
const stateResult = document.getElementById('state-result');
const errorMessage = document.getElementById('error-message');

const resultCity = document.getElementById('result-city');
const resultDate = document.getElementById('result-date');
const resultTemp = document.getElementById('result-temp');
const resultDesc = document.getElementById('result-desc');
const weatherIcon = document.getElementById('weather-icon');
const statFeelsLike = document.getElementById('stat-feels-like');
const statHumidity = document.getElementById('stat-humidity');
const statWind = document.getElementById('stat-wind');

const severeBanner = document.getElementById('severe-banner');
const severeBannerText = document.getElementById('severe-banner-text');
const insightText = document.getElementById('insight-text');

// --- WMO weather code map: https://open-meteo.com/en/docs (WMO Weather interpretation codes) ---
const WEATHER_CODE_MAP = {
  0:  { desc: 'Clear sky',            icon: 'fa-sun',                  mood: 'clear' },
  1:  { desc: 'Mostly clear',         icon: 'fa-cloud-sun',            mood: 'clear' },
  2:  { desc: 'Partly cloudy',        icon: 'fa-cloud-sun',            mood: 'cloudy' },
  3:  { desc: 'Overcast',             icon: 'fa-cloud',                mood: 'cloudy' },
  45: { desc: 'Fog',                  icon: 'fa-smog',                 mood: 'cloudy' },
  48: { desc: 'Depositing rime fog',  icon: 'fa-smog',                 mood: 'cloudy' },
  51: { desc: 'Light drizzle',        icon: 'fa-cloud-rain',           mood: 'rain' },
  53: { desc: 'Moderate drizzle',     icon: 'fa-cloud-rain',           mood: 'rain' },
  55: { desc: 'Dense drizzle',        icon: 'fa-cloud-rain',           mood: 'rain' },
  56: { desc: 'Freezing drizzle',     icon: 'fa-cloud-rain',           mood: 'rain' },
  57: { desc: 'Dense freezing drizzle', icon: 'fa-cloud-rain',         mood: 'rain' },
  61: { desc: 'Slight rain',          icon: 'fa-cloud-rain',           mood: 'rain' },
  63: { desc: 'Moderate rain',        icon: 'fa-cloud-showers-heavy',  mood: 'rain' },
  65: { desc: 'Heavy rain',           icon: 'fa-cloud-showers-heavy',  mood: 'rain' },
  66: { desc: 'Freezing rain',        icon: 'fa-cloud-showers-heavy',  mood: 'rain' },
  67: { desc: 'Heavy freezing rain',  icon: 'fa-cloud-showers-heavy',  mood: 'rain' },
  71: { desc: 'Slight snow',          icon: 'fa-snowflake',            mood: 'snow' },
  73: { desc: 'Moderate snow',        icon: 'fa-snowflake',            mood: 'snow' },
  75: { desc: 'Heavy snow',           icon: 'fa-snowflake',            mood: 'snow' },
  77: { desc: 'Snow grains',          icon: 'fa-snowflake',            mood: 'snow' },
  80: { desc: 'Slight rain showers',  icon: 'fa-cloud-rain',           mood: 'rain' },
  81: { desc: 'Moderate rain showers',icon: 'fa-cloud-showers-heavy',  mood: 'rain' },
  82: { desc: 'Violent rain showers', icon: 'fa-cloud-showers-heavy',  mood: 'storm' },
  85: { desc: 'Slight snow showers',  icon: 'fa-snowflake',            mood: 'snow' },
  86: { desc: 'Heavy snow showers',   icon: 'fa-snowflake',            mood: 'snow' },
  95: { desc: 'Thunderstorm',         icon: 'fa-cloud-bolt',           mood: 'storm' },
  96: { desc: 'Thunderstorm, hail',   icon: 'fa-cloud-bolt',           mood: 'storm' },
  99: { desc: 'Severe thunderstorm, hail', icon: 'fa-cloud-bolt',      mood: 'storm' },
};

function getWeatherInfo(code, isDay) {
  const info = WEATHER_CODE_MAP[code] || { desc: 'Unknown', icon: 'fa-cloud', mood: 'cloudy' };
  if (!isDay && (info.mood === 'clear' || info.mood === 'cloudy')) {
    return { ...info, mood: 'night' };
  }
  return info;
}

// --- severe weather check ---
const SEVERE_CODES = new Set([65, 67, 82, 86, 95, 96, 99]); // heavy rain/snow, thunderstorms
const SEVERE_HAIL_CODES = new Set([96, 99]);

function getSevereWarning(code, tempC, windKmh) {
  if (SEVERE_HAIL_CODES.has(code)) return 'Thunderstorm with hail expected — take precautions.';
  if (code === 95) return 'Thunderstorm in the area — stay indoors if possible.';
  if (code === 65 || code === 67) return 'Heavy rain expected — watch for flooding.';
  if (code === 82) return 'Violent rain showers — avoid unnecessary travel.';
  if (code === 86) return 'Heavy snow expected — travel may be affected.';
  if (tempC >= 40) return 'Extreme heat warning — stay hydrated and avoid direct sun.';
  if (tempC <= -5) return 'Extreme cold warning — bundle up and limit time outside.';
  if (windKmh >= 50) return 'High winds expected — secure loose objects outdoors.';
  return null;
}

// --- smart insight sentence ---
function getInsight(mood, code, tempC, windKmh, humidity) {
  if (mood === 'storm') return "Stormy out there — best to stay indoors.";
  if (mood === 'rain') return code >= 80 ? "Showers expected — bring an umbrella." : "Light rain around — an umbrella will help.";
  if (mood === 'snow') return "Snow expected — dress warm and watch your step.";
  if (tempC >= 38) return "Very hot today — stay hydrated and limit time in the sun.";
  if (tempC <= 5) return "Cold out there — bundle up before heading outside.";
  if (windKmh >= 35) return "Quite windy today — secure hats and loose items.";
  if (mood === 'clear' && tempC >= 15 && tempC <= 28) return "Good day for a run or a walk outside.";
  if (mood === 'night') return "Clear night — a good time for a walk if it's not too cold.";
  if (humidity >= 80) return "Humid conditions — it may feel warmer than it is.";
  return "A calm day overall — dress comfortably.";
}

// --- state helpers ---
function showState(state) {
  stateIdle.hidden = state !== 'idle';
  stateLoading.hidden = state !== 'loading';
  stateError.hidden = state !== 'error';
  stateResult.hidden = state !== 'result';
}

function setSky(mood) {
  body.setAttribute('data-weather', mood);
}

function showSevereBanner(text) {
  severeBannerText.textContent = text;
  severeBanner.hidden = false;
}

function hideSevereBanner() {
  severeBanner.hidden = true;
}

// --- API calls ---
async function geocodeCity(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('geocoding-failed');
  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error('city-not-found');
  }
  return data.results[0];
}

async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('weather-failed');
  const data = await res.json();
  if (!data.current) throw new Error('weather-failed');
  return data.current;
}

function formatDate(isoString) {
  const date = isoString ? new Date(isoString) : new Date();
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// --- main search flow ---
async function searchCity(cityName) {
  showState('loading');
  hideSevereBanner();

  try {
    const place = await geocodeCity(cityName);
    const current = await fetchWeather(place.latitude, place.longitude);
    const weatherInfo = getWeatherInfo(current.weather_code, current.is_day === 1);

    const locationLabel = [place.name, place.admin1, place.country]
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .join(', ');

    resultCity.textContent = locationLabel;
    resultDate.textContent = formatDate(current.time);
    resultTemp.innerHTML = `${Math.round(current.temperature_2m)}&deg;C`;
    resultDesc.textContent = weatherInfo.desc;
    weatherIcon.innerHTML = `<i class="fa-solid ${weatherInfo.icon}"></i>`;

    statFeelsLike.innerHTML = `${Math.round(current.apparent_temperature)}&deg;C`;
    statHumidity.textContent = `${Math.round(current.relative_humidity_2m)}%`;
    statWind.textContent = `${Math.round(current.wind_speed_10m)} km/h`;

    insightText.textContent = getInsight(
      weatherInfo.mood,
      current.weather_code,
      current.temperature_2m,
      current.wind_speed_10m,
      current.relative_humidity_2m
    );

    const warning = getSevereWarning(current.weather_code, current.temperature_2m, current.wind_speed_10m);
    if (warning) {
      showSevereBanner(warning);
    } else {
      hideSevereBanner();
    }

    setSky(weatherInfo.mood);
    showState('result');
  } catch (err) {
    let message = "Couldn't fetch weather right now. Check your connection and try again.";
    if (err.message === 'city-not-found') {
      message = "We couldn't find that city. Check the spelling and try again.";
    } else if (err.message === 'geocoding-failed' || err.message === 'weather-failed') {
      message = "Something went wrong reaching the weather service. Please try again.";
    }
    errorMessage.textContent = message;
    hideSevereBanner();
    showState('error');
  }
}

// --- events ---
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const city = input.value.trim();
  if (!city) {
    errorMessage.textContent = 'Please enter a city name to search.';
    showState('error');
    return;
  }
  searchCity(city);
});

// initial state
showState('idle');

// clear button: show/hide based on input content, clear on click
function updateClearBtn() {
  clearBtn.hidden = input.value.length === 0;
}

input.addEventListener('input', updateClearBtn);

clearBtn.addEventListener('click', () => {
  input.value = '';
  updateClearBtn();
  input.focus();
});

updateClearBtn();