---
name: local-weather
description: >-
  Fetch weather and short forecasts via free public APIs (no API key). Default
  city is Medellin. Use when the user runs /local-weather or asks for weather,
  forecast, temperature, conditions, or climate for Medellin or another place.
---

# Local Weather

## Command

```
/local-weather
```

Also trigger on plain requests for weather, forecast, or temperature.

**Default place:** Medellin (when no city is named).

## Quick start

Run from the repo root (stdlib only, no pip install):

```bash
# Default: Medellin
python3 .cursor/skills/local-weather/scripts/weather.py

# Another place
python3 .cursor/skills/local-weather/scripts/weather.py --place "Bogota"

# IP-based location instead of default city
python3 .cursor/skills/local-weather/scripts/weather.py --ip

# Fahrenheit + 3-day daily summary
python3 .cursor/skills/local-weather/scripts/weather.py --units imperial --days 3
```

Prefer executing the script over inventing weather data. Do not guess conditions.

## Workflow

1. On `/local-weather` or weather with no city -> run with default Medellin (no flags).
2. If the user names a city/place, pass `--place "..."`.
3. If they ask for IP/"here"/auto-detect, pass `--ip`.
4. If they ask for F/C or a multi-day outlook, set `--units` / `--days`.
5. Summarize the script stdout for the user in a short, readable reply.
6. If the script fails, report the error and ask for a city name.

## Output style

Keep the reply concise:

- Place and approximate time (from API)
- Temperature, feels-like if present, humidity, wind
- Plain-language condition (from WMO weather code)
- Optional: next days if requested

Do not dump raw JSON unless the user asks.

## APIs used

- Default / named place: Open-Meteo Geocoding API
- Optional `--ip`: `https://ipinfo.io/json`
- Weather: Open-Meteo Forecast API

No API keys required.

## Additional resources

- Script details and flags: [scripts/weather.py](scripts/weather.py)
