# Weather Dashboard

A responsive weather dashboard built for the Live Pakistan Internship Program — Week 2 (Front-End Web Development).

## Live Demo
https://tashfahashraf.github.io/weather-dashboard/

## API used

This project uses **[Open-Meteo](https://open-meteo.com)**, a free weather API that requires **no API key, no signup, and no account**.

- City search uses Open-Meteo's [Geocoding API](https://open-meteo.com/en/docs/geocoding-api) to convert a city name into latitude/longitude.
- Those coordinates are then used to fetch current conditions from the [Forecast API](https://open-meteo.com/en/docs).

Because no key is required, **there is nothing to hide or exclude from this repository** — no `.env` file, no secrets, no config needed. Both API endpoints are called directly from `script.js` and are safe to keep public.

## Features
- Search any city worldwide, with Enter-key support and a clear ("×") button in the search field
- Displays temperature, feels-like temperature, humidity, wind speed, and condition
- Weather-condition icon and an animated background that matches the live result — sun glow on clear days, drifting clouds when cloudy, falling rain in wet conditions, and a starry sky with a moon glow at night
- Smart insight sentence (e.g. "Good day for a run", "Bring an umbrella") generated from the current temperature, condition, wind, and humidity
- Severe weather banner — shown automatically for thunderstorms, hail, heavy rain/snow, extreme heat/cold, or high wind
- Loading state (skeleton UI) while data is being fetched
- Friendly error handling for invalid city names and network failures
- Fully responsive, mobile-first layout

## Tech stack
Plain HTML, CSS, and JavaScript (`fetch()`, `async/await`) — no frameworks or build tools required. Just open `index.html`.

## Files
- `index.html` — structure
- `style.css` — styling, responsive layout, dynamic sky gradients, loading/error/severe-banner states
- `script.js` — geocoding + weather fetch logic, weather-code mapping, severity/insight logic, DOM updates, error handling
