# FlashGuard AI — Maps & Geospatial Routing

> **Geospatial processing, OpenStreetMap extracts, and hazard-avoidance safe evacuation routing for SIH 2026.**  
> Built with **OpenStreetMap (OSM)**, **OSRM**, **GeoJSON**, **GeoPandas**, and **Shapely**.

---

## 📌 Overview

The `maps/` module handles spatial data preparation, hazard polygon buffering, and safe evacuation path calculation for FlashGuard AI.

### Target Geography: Uttarakhand, India
* Coordinate Reference System: strictly **WGS84 (`EPSG:4326`)**
* Coordinate ordering: strictly **`[longitude, latitude]`** in GeoJSON payloads and **`latitude`**, **`longitude`** in REST objects.

---

## 📂 Directory Structure

```text
maps/
├── data/       # Target region OpenStreetMap extract files (.osm.pbf)
├── geojson/    # Static and precomputed GeoJSON boundary layers
├── routing/    # OSRM routing profiles and hazard-avoidance graph scripts
├── scripts/    # Preprocessing and polygon intersection utilities
└── README.md
```

---

## 🗺️ Geospatial & Routing Architecture

### 1. Active Implementation
* **GeoJSON Generation**: The backend actively generates RFC 7946 `FeatureCollection` payloads at `GET /api/v1/risk/uttarakhand/geojson`.
* **Coordinate Standards**: Point coordinates are formatted strictly as `[longitude, latitude]` for direct rendering on Flutter and Leaflet map clients.

### 2. Planned / Future Scope (Safe Evacuation Routing)
* Candidate routes between origin and destination requested via an OSRM backend instance.
* Route polylines spatially intersected against active PostGIS `RiskZone` polygons derived from the AI risk engine.
* Dynamic penalty scoring applied to segments crossing `HIGH` or `CRITICAL` hazard zones.
* Safest alternative route avoiding danger zones returned to the mobile app.
