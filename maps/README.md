# FlashGuard AI — Maps & Geospatial Routing

> **Geospatial processing, OpenStreetMap extracts, and hazard-avoidance safe evacuation routing for SIH 2026.**  
> Built with **OpenStreetMap (OSM)**, **OSRM**, **GeoJSON**, **GeoPandas**, and **Shapely**.

---

## 📌 Overview

The `maps/` module handles all spatial data preparation, hazard polygon buffering, and safe evacuation path calculation for FlashGuard AI.

### Target Geography: Uttarakhand, India
- Coordinate Reference System: strictly **WGS84 (`EPSG:4326`)**
- Coordinate ordering: strictly **`[longitude, latitude]`** in GeoJSON payloads and **`latitude`**, **`longitude`** in REST objects.

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

## 🛣️ Safe Evacuation Routing Algorithm (Member 3)

1. Backend requests candidate routes from Origin to Destination via OSRM.
2. Candidate route polylines are spatially intersected with active PostGIS `RiskZone` hazard polygons (derived from AI risk scores).
3. The routing engine applies dynamic penalties to paths intersecting `HIGH` or `CRITICAL` hazard zones.
4. The safest alternative path avoiding active danger zones is returned to the mobile client as GeoJSON.
