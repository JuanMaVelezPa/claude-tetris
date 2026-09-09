#!/usr/bin/env python3
"""Fetch weather via Open-Meteo (no API key). Default place: Medellin."""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.parse
import urllib.request

IPINFO_URL = "https://ipinfo.io/json"
GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"

# WMO Weather interpretation codes (simplified)
WMO = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


def http_get_json(url: str, timeout: float = 15.0) -> dict:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "claude-tetris-local-weather/1.0", "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"HTTP {exc.code} for {url}: {body[:200]}") from exc
    except urllib.error.URLError as exc:
        raise SystemExit(f"Network error fetching {url}: {exc.reason}") from exc


def resolve_local() -> tuple[float, float, str]:
    data = http_get_json(IPINFO_URL)
    if data.get("error") or "loc" not in data:
        raise SystemExit(
            "Could not detect local location from IP. Pass --place CITY instead."
        )
    lat_s, lon_s = data["loc"].split(",", 1)
    city = data.get("city") or "Unknown"
    region = data.get("region") or ""
    country = data.get("country") or ""
    label = ", ".join(p for p in (city, region, country) if p)
    return float(lat_s), float(lon_s), label


def resolve_place(place: str) -> tuple[float, float, str]:
    qs = urllib.parse.urlencode({"name": place, "count": 1, "language": "en", "format": "json"})
    data = http_get_json(f"{GEOCODE_URL}?{qs}")
    results = data.get("results") or []
    if not results:
        raise SystemExit(f"No geocoding match for place: {place!r}")
    hit = results[0]
    parts = [
        hit.get("name"),
        hit.get("admin1"),
        hit.get("country"),
    ]
    label = ", ".join(p for p in parts if p)
    return float(hit["latitude"]), float(hit["longitude"]), label


def fetch_weather(
    lat: float,
    lon: float,
    *,
    units: str,
    days: int,
) -> dict:
    temp_unit = "fahrenheit" if units == "imperial" else "celsius"
    wind_unit = "mph" if units == "imperial" else "kmh"
    params = {
        "latitude": f"{lat:.4f}",
        "longitude": f"{lon:.4f}",
        "current": ",".join(
            [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "weather_code",
                "wind_speed_10m",
            ]
        ),
        "daily": ",".join(
            [
                "weather_code",
                "temperature_2m_max",
                "temperature_2m_min",
                "precipitation_sum",
            ]
        ),
        "forecast_days": str(max(1, min(days, 7))),
        "timezone": "auto",
        "temperature_unit": temp_unit,
        "wind_speed_unit": wind_unit,
    }
    qs = urllib.parse.urlencode(params)
    return http_get_json(f"{FORECAST_URL}?{qs}")


def condition(code: int | None) -> str:
    if code is None:
        return "Unknown"
    return WMO.get(int(code), f"Weather code {code}")


def format_report(label: str, data: dict, units: str, days: int) -> str:
    cur = data.get("current") or {}
    daily = data.get("daily") or {}
    temp_u = "F" if units == "imperial" else "C"
    wind_u = "mph" if units == "imperial" else "km/h"

    lines = [
        f"Location: {label}",
        f"Observed: {cur.get('time', 'n/a')} ({data.get('timezone', 'local')})",
        f"Condition: {condition(cur.get('weather_code'))}",
        f"Temperature: {cur.get('temperature_2m')} {temp_u}",
        f"Feels like: {cur.get('apparent_temperature')} {temp_u}",
        f"Humidity: {cur.get('relative_humidity_2m')}%",
        f"Wind: {cur.get('wind_speed_10m')} {wind_u}",
    ]

    times = daily.get("time") or []
    if days > 0 and times:
        lines.append("")
        lines.append(f"Forecast ({min(days, len(times))} day(s)):")
        for i in range(min(days, len(times))):
            d = times[i]
            tmax = (daily.get("temperature_2m_max") or [None])[i]
            tmin = (daily.get("temperature_2m_min") or [None])[i]
            precip = (daily.get("precipitation_sum") or [None])[i]
            code = (daily.get("weather_code") or [None])[i]
            precip_u = "in" if units == "imperial" else "mm"
            lines.append(
                f"  {d}: {condition(code)}; "
                f"high {tmax} {temp_u} / low {tmin} {temp_u}; "
                f"precip {precip} {precip_u}"
            )

    return "\n".join(lines)


DEFAULT_PLACE = "Medellin"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Weather via Open-Meteo (default place: Medellin)"
    )
    parser.add_argument(
        "--place",
        default=DEFAULT_PLACE,
        help=f"City or place name (default: {DEFAULT_PLACE})",
    )
    parser.add_argument(
        "--ip",
        action="store_true",
        help="Use public IP geolocation instead of --place",
    )
    parser.add_argument(
        "--units",
        choices=("metric", "imperial"),
        default="metric",
        help="Temperature/wind units (default: metric)",
    )
    parser.add_argument(
        "--days",
        type=int,
        default=1,
        help="Daily forecast days to include, 1-7 (default: 1)",
    )
    args = parser.parse_args(argv)

    if args.ip:
        lat, lon, label = resolve_local()
    else:
        lat, lon, label = resolve_place(args.place)

    weather = fetch_weather(lat, lon, units=args.units, days=args.days)
    print(format_report(label, weather, args.units, args.days))
    return 0


if __name__ == "__main__":
    sys.exit(main())
