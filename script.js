// Leaflet Map Setup
// Leaflet Map Setup
let map = L.map('map', { zoomControl: false }).setView([41.0082, 28.9784], 13);
L.control.zoom({ position: 'topright' }).addTo(map);
let marker = null;
let radiusCircle = null;
let isDraggingRadius = false;
let radiusMarker = null;

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Map Click Event
map.on('click', function (e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    if (marker) {
        marker.setLatLng([lat, lng]);
    } else {
        marker = L.marker([lat, lng], { draggable: true }).addTo(map);
        marker.on('dragend', function (e) {
            const pos = marker.getLatLng();
            document.getElementById('center-lat').value = pos.lat.toFixed(6);
            document.getElementById('center-lon').value = pos.lng.toFixed(6);
            updateRadiusCircle();
            updateRCode();
        });
    }

    document.getElementById('center-lat').value = lat.toFixed(6);
    document.getElementById('center-lon').value = lng.toFixed(6);

    updateRadiusCircle();
    updateRCode();
});

function updateMapCenter() {
    const lat = parseFloat(document.getElementById('center-lat').value);
    const lon = parseFloat(document.getElementById('center-lon').value);

    if (!isNaN(lat) && !isNaN(lon)) {
        map.setView([lat, lon], 13);
        if (marker) {
            marker.setLatLng([lat, lon]);
        } else {
            marker = L.marker([lat, lon], { draggable: true }).addTo(map);
        }
        updateRadiusCircle();
        updateRCode();
    }
}

// Search Logic
const searchInput = document.getElementById('location-search');
const suggestionsBox = document.getElementById('search-suggestions');
let debounceTimer;

searchInput.addEventListener('input', function () {
    clearTimeout(debounceTimer);
    const query = this.value.trim();

    if (query.length < 3) {
        suggestionsBox.style.display = 'none';
        return;
    }

    debounceTimer = setTimeout(() => {
        fetchSuggestions(query);
    }, 500); // 500ms debounce
});

// Close suggestions when clicking outside
document.addEventListener('click', function (e) {
    if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
        suggestionsBox.style.display = 'none';
    }
});

// Handle Enter key
searchInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        searchLocation();
        suggestionsBox.style.display = 'none';
    }
});

function fetchSuggestions(query) {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`)
        .then(response => response.json())
        .then(data => {
            suggestionsBox.innerHTML = '';
            if (data && data.length > 0) {
                data.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'suggestion-item';
                    // Split display_name for cleaner look
                    const parts = item.display_name.split(', ');
                    const mainText = parts[0];
                    const secText = parts.slice(1, 3).join(', '); // Show next 2 parts (Region, Country)

                    div.innerHTML = `
                        <div>${mainText}</div>
                        <span class="secondary-text">${secText}</span>
                    `;
                    div.onclick = () => {
                        searchInput.value = item.display_name; // Or just mainText? keep full for accuracy
                        selectLocation(item.lat, item.lon);
                        suggestionsBox.style.display = 'none';
                    };
                    suggestionsBox.appendChild(div);
                });
                suggestionsBox.style.display = 'block';
            } else {
                displayNoResults();
            }
        })
        .catch(err => {
            console.error(err);
        });
}

function displayNoResults() {
    suggestionsBox.innerHTML = '<div class="suggestion-item" style="cursor: default; color: var(--text-muted);">No results found</div>';
    suggestionsBox.style.display = 'block';
}

function selectLocation(lat, lon) {
    document.getElementById('center-lat').value = parseFloat(lat).toFixed(6);
    document.getElementById('center-lon').value = parseFloat(lon).toFixed(6);
    updateMapCenter();
}

function searchLocation() {
    const query = searchInput.value;
    if (!query) return;

    // If user clicks glass button manually, assume top result or specific search
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                selectLocation(data[0].lat, data[0].lon);
            } else {
                alert('Location not found!');
            }
        });
}

// Update Radius Circle
function updateRadiusCircle() {
    const lat = parseFloat(document.getElementById('center-lat').value);
    const lon = parseFloat(document.getElementById('center-lon').value);
    const radius = parseFloat(document.getElementById('radius').value);

    if (radiusCircle) {
        map.removeLayer(radiusCircle);
    }

    if (radiusMarker) {
        map.removeLayer(radiusMarker);
    }

    // Create Radius Circle
    radiusCircle = L.circle([lat, lon], {
        color: '#ff6b35',
        fillColor: '#ff9966',
        fillOpacity: 0.25,
        radius: radius,
        weight: 3,
        dashArray: '5, 10',
        interactive: false
    }).addTo(map);

    // Add draggable marker on radius edge
    const angle = 45; // Top-right corner
    const earthRadius = 6371000; // meters
    const dLat = (radius / earthRadius) * (180 / Math.PI);
    const dLon = (radius / earthRadius) * (180 / Math.PI) / Math.cos(lat * Math.PI / 180);

    const markerLat = lat + dLat * Math.cos(angle * Math.PI / 180);
    const markerLon = lon + dLon * Math.sin(angle * Math.PI / 180);

    // Custom icon
    const radiusIcon = L.divIcon({
        className: 'radius-drag-marker',
        html: '<div style="width: 20px; height: 20px; background: #ff6b35; border: 3px solid white; border-radius: 50%; cursor: move; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    radiusMarker = L.marker([markerLat, markerLon], {
        icon: radiusIcon,
        draggable: true
    }).addTo(map);

    // Radius marker drag event
    radiusMarker.on('drag', function (e) {
        const markerPos = radiusMarker.getLatLng();
        const centerLat = parseFloat(document.getElementById('center-lat').value);
        const centerLon = parseFloat(document.getElementById('center-lon').value);

        // Calculate distance (Haversine formula)
        const R = 6371000;
        const dLat = (markerPos.lat - centerLat) * Math.PI / 180;
        const dLon = (markerPos.lng - centerLon) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(centerLat * Math.PI / 180) * Math.cos(markerPos.lat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        // Update radius value (limit 100-3000)
        const newRadius = Math.max(100, Math.min(3000, Math.round(distance)));

        document.getElementById('radius').value = newRadius;
        document.getElementById('radius-val').textContent = newRadius;

        // Update circle
        if (radiusCircle) {
            map.removeLayer(radiusCircle);
        }
        radiusCircle = L.circle([centerLat, centerLon], {
            color: '#ff6b35',
            fillColor: '#ff9966',
            fillOpacity: 0.25,
            radius: newRadius,
            weight: 3,
            dashArray: '5, 10',
            interactive: false
        }).addTo(map);
    });

    // Update R code on drag end
    radiusMarker.on('dragend', function (e) {
        updateRCode();
    });
}

// Get Direction Name
function getDirectionName(camLat, camLon, targetLat, targetLon) {
    const dx = targetLon - camLon;
    const dy = targetLat - camLat;
    const angle = Math.atan2(dx, dy) * 180 / Math.PI;
    const normalized = (angle + 360) % 360;

    if (normalized >= 337.5 || normalized < 22.5) return "North ⬆️";
    if (normalized >= 22.5 && normalized < 67.5) return "Northeast ↗️";
    if (normalized >= 67.5 && normalized < 112.5) return "East ➡️";
    if (normalized >= 112.5 && normalized < 157.5) return "Southeast ↘️";
    if (normalized >= 157.5 && normalized < 202.5) return "South ⬇️";
    if (normalized >= 202.5 && normalized < 247.5) return "Southwest ↙️";
    if (normalized >= 247.5 && normalized < 292.5) return "West ⬅️";
    if (normalized >= 292.5 && normalized < 337.5) return "Northwest ↖️";
}

// Canvas and 3D Visualization
const canvas = document.getElementById('preview-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    draw3DPreview();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Canvas mouse interaction variables
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

// Mouse events
canvas.addEventListener('mousedown', function (e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = 0.15;
    const lookFromX = parseFloat(document.getElementById('lookfrom-x').value);
    const lookFromY = parseFloat(document.getElementById('lookfrom-y').value);
    const camX = centerX + lookFromX * scale;
    const camY = centerY + lookFromY * scale;

    // Check if clicked on camera icon (15px radius)
    const distance = Math.sqrt((mouseX - camX) ** 2 + (mouseY - camY) ** 2);
    if (distance <= 15) {
        isDragging = true;
        dragOffset.x = mouseX - camX;
        dragOffset.y = mouseY - camY;
        canvas.style.cursor = 'grabbing';
    }
});

canvas.addEventListener('mousemove', function (e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = 0.15;

    if (isDragging) {
        // Calculate new camera position
        const newCamX = mouseX - dragOffset.x;
        const newCamY = mouseY - dragOffset.y;

        // Convert canvas coordinates to lookfrom values
        const newLookFromX = (newCamX - centerX) / scale;
        const newLookFromY = (newCamY - centerY) / scale;

        // Update input values
        document.getElementById('lookfrom-x').value = Math.round(newLookFromX);
        document.getElementById('lookfrom-y').value = Math.round(newLookFromY);
        document.getElementById('lookfrom-x-val').textContent = Math.round(newLookFromX);
        document.getElementById('lookfrom-y-val').textContent = Math.round(newLookFromY);

        // Update visualization
        draw3DPreview();
        updateRCode();
        updateRadiusCircle();
    } else {
        // Hover check
        const lookFromX = parseFloat(document.getElementById('lookfrom-x').value);
        const lookFromY = parseFloat(document.getElementById('lookfrom-y').value);
        const camX = centerX + lookFromX * scale;
        const camY = centerY + lookFromY * scale;

        const distance = Math.sqrt((mouseX - camX) ** 2 + (mouseY - camY) ** 2);
        canvas.style.cursor = distance <= 15 ? 'grab' : 'default';
    }
});

canvas.addEventListener('mouseup', function () {
    isDragging = false;
    canvas.style.cursor = 'default';
});

canvas.addEventListener('mouseleave', function () {
    isDragging = false;
    canvas.style.cursor = 'default';
});

const params = ['lookfrom-z', 'lookfrom-x', 'lookfrom-y', 'fov', 'radius', 'theta', 'phi'];

params.forEach(param => {
    const input = document.getElementById(param);
    const display = document.getElementById(param + '-val');

    input.addEventListener('input', function () {
        let value = this.value;
        if (param === 'fov' || param === 'theta' || param === 'phi') {
            display.textContent = value + '°';
        } else {
            display.textContent = value;
        }

        // Update circle if radius or camera position changes
        if (param === 'radius' || param === 'lookfrom-x' || param === 'lookfrom-y') {
            updateRadiusCircle();
        }

        draw3DPreview();
        updateRCode();
    });
});

function draw3DPreview() {
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Grid drawing
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = -5; i <= 5; i++) {
        ctx.beginPath();
        ctx.moveTo(centerX + i * 50, 0);
        ctx.lineTo(centerX + i * 50, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, centerY + i * 50);
        ctx.lineTo(canvas.width, centerY + i * 50);
        ctx.stroke();
    }

    // Get parameters
    const lookFromZ = parseFloat(document.getElementById('lookfrom-z').value);
    const lookFromX = parseFloat(document.getElementById('lookfrom-x').value);
    const lookFromY = parseFloat(document.getElementById('lookfrom-y').value);
    const fov = parseFloat(document.getElementById('fov').value);
    const radius = parseFloat(document.getElementById('radius').value);
    const theta = parseFloat(document.getElementById('theta').value);

    // Center point (lookat)
    ctx.fillStyle = '#00E5FF';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#00E5FF';
    ctx.font = '12px Inter';
    ctx.fillText('Lookat (0,0,0)', centerX + 15, centerY - 10);

    // Camera position
    const scale = 0.15;
    const camX = centerX + lookFromX * scale;
    const camY = centerY + lookFromY * scale;

    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.arc(camX, camY, 8, 0, Math.PI * 2);
    ctx.fill();

    // Camera direction line
    ctx.strokeStyle = '#FF6B6B';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(camX, camY);
    ctx.lineTo(centerX, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // FOV visualization
    const fovRad = (fov * Math.PI) / 180;
    const angle = Math.atan2(centerY - camY, centerX - camX);

    ctx.strokeStyle = 'rgba(255, 107, 107, 0.3)';
    ctx.fillStyle = 'rgba(255, 107, 107, 0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(camX, camY);
    ctx.lineTo(
        camX + Math.cos(angle - fovRad / 2) * radius * scale,
        camY + Math.sin(angle - fovRad / 2) * radius * scale
    );
    ctx.arc(camX, camY, radius * scale, angle - fovRad / 2, angle + fovRad / 2);
    ctx.lineTo(camX, camY);
    ctx.fill();
    ctx.stroke();

    // Camera info
    ctx.fillStyle = '#FF6B6B';
    ctx.font = 'bold 12px Inter';
    ctx.fillText('Camera', camX + 15, camY - 10);
    ctx.font = '10px Inter';
    ctx.fillText(`Z: ${lookFromZ}m`, camX + 15, camY + 5);

    // Direction info
    const direction = getDirectionName(camY, camX, centerY, centerX);
    ctx.fillStyle = '#FFEB3B';
    ctx.font = 'bold 14px Inter';
    ctx.fillText(`📷 Camera Direction: ${direction}`, 20, 30);

    // Radius info
    ctx.fillStyle = '#81C784';
    ctx.font = '11px Inter';
    const midX = (camX + centerX) / 2;
    const midY = (camY + centerY) / 2;
    ctx.fillText(`Radius: ${radius}`, midX, midY - 10);
}

function updateRCode() {
    const lat = document.getElementById('center-lat').value;
    const lon = document.getElementById('center-lon').value;
    const lookFromX = document.getElementById('lookfrom-x').value;
    const lookFromY = document.getElementById('lookfrom-y').value;
    const lookFromZ = document.getElementById('lookfrom-z').value;
    const fov = document.getElementById('fov').value;
    const radius = document.getElementById('radius').value;
    const theta = document.getElementById('theta').value;
    const phi = document.getElementById('phi').value;

    // New settings
    const layerBuildings = document.getElementById('layer-buildings').checked;
    const layerParks = document.getElementById('layer-parks').checked;
    const layerWater = document.getElementById('layer-water').checked;
    const layerRoads = document.getElementById('layer-roads').checked;
    const layerRails = document.getElementById('layer-rails').checked;
    const layerLanduse = document.getElementById('layer-landuse').checked;

    const colorBldLow = document.getElementById('color-bld-low').value;
    const colorBldMid = document.getElementById('color-bld-mid').value;
    const colorBldHigh = document.getElementById('color-bld-high').value;
    const colorPark = document.getElementById('color-park').value;
    const colorWater = document.getElementById('color-water').value;
    const colorRoad = document.getElementById('color-road').value;
    const colorRoadHi = document.getElementById('color-road-hi').value;
    const colorLanduse = document.getElementById('color-landuse').value;

    const bldHeightMult = document.getElementById('bld-height-mult').value;
    const waterFuzz = document.getElementById('water-fuzz').value;
    const roadWidth = document.getElementById('road-width').value;
    const railWidth = document.getElementById('rail-width').value;

    const renderWidth = document.getElementById('render-width').value;
    const renderHeight = document.getElementById('render-height').value;
    const renderSamples = document.getElementById('render-samples').value;
    const renderDenoise = document.getElementById('render-denoise').checked;
    const renderAmbient = document.getElementById('render-ambient').checked;

    const lightIntensity = document.getElementById('light-intensity').value;
    const lightX = document.getElementById('light-x').value;
    const lightY = document.getElementById('light-y').value;
    const lightZ = document.getElementById('light-z').value;
    const lightRadius = document.getElementById('light-radius').value;

    const bgHigh = document.getElementById('bg-high').value;
    const bgLow = document.getElementById('bg-low').value;

    const code = `# RayRender 3D Map Render Script
    # KorayRender - x/kryaclan
# Created: ${new Date().toLocaleString('en-US')}

# Required libraries
pacman::p_load(
    osmdata, sf, dplyr, rayrender
)

# Center coordinates
lon <- ${lon}
lat <- ${lat}

ctr_wgs <- sf::st_sfc(
    sf::st_point(c(lon, lat)), crs = 4326
)

# UTM projection
utm_epsg <- function(lon, lat) {
    stopifnot(is.finite(lon), is.finite(lat))
    if (lat >= 84) return(32661)
    if (lat <= -80) return(32761)
    zone <- floor((lon + 180) / 6) + 1
    if (lat >= 0) 32600 + zone else 32700 + zone
}

crs_m <- utm_epsg(lon, lat)
ctr_m <- sf::st_transform(ctr_wgs, crs_m)
radius <- ${radius}
aoi_m <- sf::st_buffer(ctr_m, radius)
aoi_wgs <- sf::st_transform(aoi_m, 4326)
bb <- sf::st_bbox(aoi_wgs)

# OSM data fetching functions
get_polys <- function(q) {
    Sys.sleep(2)
    tryCatch({
        dat <- osmdata::osmdata_sf(q)
        polys <- list()
        if (!is.null(dat$osm_polygons) && nrow(dat$osm_polygons) > 0) {
            polys[[length(polys) + 1]] <- sf::st_make_valid(dat$osm_polygons)
        }
        if (!is.null(dat$osm_multipolygons) && nrow(dat$osm_multipolygons) > 0) {
            polys[[length(polys) + 1]] <- sf::st_make_valid(dat$osm_multipolygons)
        }
        if (!length(polys)) {
            return(sf::st_sf(geometry = sf::st_sfc(crs = 4326)))
        }
        dplyr::bind_rows(polys)
    }, error = function(e) {
        message("Error: ", conditionMessage(e))
        return(sf::st_sf(geometry = sf::st_sfc(crs = 4326)))
    })
}

get_lines <- function(q) {
    tryCatch({
        x <- osmdata::osmdata_sf(q)$osm_lines
        if (is.null(x)) {
            sf::st_sf(geometry = sf::st_sfc(crs = 4326))
        } else {
            sf::st_make_valid(x)
        }
    }, error = function(e) {
        message("Error: ", conditionMessage(e))
        return(sf::st_sf(geometry = sf::st_sfc(crs = 4326)))
    })
}

# Fetch OSM data

${layerBuildings ? `message("Fetching buildings...")
bld <- get_polys(osmdata::opq(bb, timeout = 180) |>
    osmdata::add_osm_feature("building"))
` : '# Buildings layer disabled\nbld <- sf::st_sf(geometry = sf::st_sfc(crs = 4326))\n'}

${layerLanduse ? `message("Fetching land use...")
landuse <- get_polys(osmdata::opq(bb, timeout = 180) |>
    osmdata::add_osm_feature("landuse"))
` : '# Land use layer disabled\nlanduse <- sf::st_sf(geometry = sf::st_sfc(crs = 4326))\n'}
${layerParks ? `
green_cover <- if (nrow(landuse) > 0) {
    subset(landuse, landuse %in% c("grass", "recreation_ground", "forest", "greenery"))
} else {
    sf::st_sf(geometry = sf::st_sfc(crs = 4326))
}
message("Fetching parks...")
parks <- dplyr::bind_rows(
    green_cover,
    get_polys(osmdata::opq(bb, timeout = 180) |>
        osmdata::add_osm_feature("leisure", "park")),
    get_polys(osmdata::opq(bb, timeout = 180) |>
        osmdata::add_osm_feature("natural", c("wood", "scrub")))
)
` : '# Parks layer disabled\nparks <- sf::st_sf(geometry = sf::st_sfc(crs = 4326))\n'}

${layerWater ? `message("Fetching water bodies...")
water <- dplyr::bind_rows(
    get_polys(osmdata::opq(bb, timeout = 180) |>
        osmdata::add_osm_feature("natural", c("water", "bay", "sea", "lagoon"))),
    get_polys(osmdata::opq(bb, timeout = 180) |>
        osmdata::add_osm_feature("water", c("river", "riverbank", "sea", "harbor", "basin", "reservoir", "canal"))),
    get_polys(osmdata::opq(bb, timeout = 180) |>
        osmdata::add_osm_feature("waterway", "riverbank"))
)
if (nrow(water) > 0) water <- dplyr::distinct(water)
` : '# Water bodies layer disabled\nwater <- sf::st_sf(geometry = sf::st_sfc(crs = 4326))\n'}

${layerRoads ? `message("Fetching roads...")
roads <- get_lines(osmdata::opq(bb, timeout = 180) |>
    osmdata::add_osm_feature("highway"))
` : '# Roads layer disabled\nroads <- sf::st_sf(geometry = sf::st_sfc(crs = 4326))\n'}

${layerRails ? `message("Fetching railways...")
rails <- get_lines(osmdata::opq(bb, timeout = 180) |>
    osmdata::add_osm_feature("railway"))
` : '# Railways layer disabled\nrails <- sf::st_sf(geometry = sf::st_sfc(crs = 4326))\n'}

message("Data fetching complete!")

# Clip and project data
clip_m <- function(x) {
    if (is.null(x) || nrow(x) == 0) {
        return(sf::st_sf(geometry = sf::st_sfc(crs = crs_m)))
    }
    x <- suppressWarnings(sf::st_intersection(x, aoi_wgs))
    if (nrow(x) == 0) {
        return(sf::st_sf(geometry = sf::st_sfc(crs = crs_m)))
    }
    sf::st_transform(x, crs_m)
}

bld <- clip_m(bld)
parks <- clip_m(parks)
landuse <- clip_m(landuse)
water <- clip_m(water)

if (nrow(water) > 0) {
    water <- sf::st_collection_extract(water, "POLYGON")
    if (nrow(water) > 0) {
        water <- sf::st_cast(water, "MULTIPOLYGON")
        water <- sf::st_make_valid(sf::st_union(water))
        water <- sf::st_as_sf(water)
    }
}

roads <- clip_m(roads)
rails <- clip_m(rails)

# Building heights
if (nrow(bld) > 0) {
    h_raw <- suppressWarnings(as.numeric(gsub(",", ".", bld$height)))
    levraw <- suppressWarnings(as.numeric(gsub(",", ".", bld$\`building:levels\`)))
    bld$h <- ifelse(!is.na(h_raw), h_raw,
        ifelse(!is.na(levraw), pmax(levraw, 1) * 3.2, 12)
    )
    bld$h <- pmin(bld$h * ${bldHeightMult}, 80)
}

# Road and rail buffers
roads_buf <- if (nrow(roads) > 0) sf::st_buffer(roads, ${roadWidth}) else sf::st_sf(geometry = sf::st_sfc(crs = crs_m))
rails_buf <- if (nrow(rails) > 0) sf::st_buffer(rails, ${railWidth}) else sf::st_sf(geometry = sf::st_sfc(crs = crs_m))
roads_crown <- if (nrow(roads) > 0) sf::st_buffer(roads, ${roadWidth / 2.3}) else sf::st_sf(geometry = sf::st_sfc(crs = crs_m))

# Recenter
center_xy <- sf::st_coordinates(ctr_m)[1, 1:2]
recenter <- function(x) {
    if (is.null(x) || nrow(x) == 0) return(x)
    sf::st_geometry(x) <- sf::st_geometry(x) - center_xy
    x 
}

bld <- recenter(bld)
landuse <- recenter(landuse)
parks <- recenter(parks)
water <- recenter(water)
roads_buf <- recenter(roads_buf)
rails_buf <- recenter(rails_buf)
roads_crown <- recenter(roads_crown)

# Colors and Materials
col_bld_low <- "${colorBldLow}"
col_bld_mid <- "${colorBldMid}"
col_bld_high <- "${colorBldHigh}"
col_landuse <- "${colorLanduse}"
col_park <- "${colorPark}"
col_road <- "${colorRoad}"
col_road_hi <- "${colorRoadHi}"
col_water <- "${colorWater}"

mat_landuse <- rayrender::diffuse(col_landuse)
mat_park <- rayrender::diffuse(col_park)
mat_road <- rayrender::diffuse(col_road)
mat_road_hi <- rayrender::diffuse(col_road_hi)
mat_water <- rayrender::metal(color = col_water, fuzz = ${waterFuzz})

# Create Scene Objects
objs <- list()

if (nrow(landuse) > 0) {
    objs <- append(objs, list(
        rayrender::extruded_polygon(landuse, top = 0.5, bottom = 0.02, material = mat_landuse)
    ))
}

if (nrow(parks) > 0) {
    objs <- append(objs, list(
        rayrender::extruded_polygon(parks, top = 0.5, bottom = 0.02, material = mat_park)
    ))
}

if (nrow(water) > 0) {
    objs <- append(objs, list(
        rayrender::extruded_polygon(water, top = 0.5, bottom = -1, material = mat_water)
    ))
}

rr <- dplyr::bind_rows(roads_buf, rails_buf)
if (nrow(rr) > 0) {
    objs <- append(objs, list(
        rayrender::extruded_polygon(rr, top = 1.0, bottom = 0.02, material = mat_road)
    ))
}

if (nrow(roads_crown) > 0) {
    objs <- append(objs, list(
        rayrender::extruded_polygon(roads_crown, top = 1.12, bottom = 1.02, material = mat_road_hi)
    ))
}

# Bin buildings
bin_buildings <- function(bld) {
    bld <- bld[!is.na(bld$h) & is.finite(bld$h) & bld$h > 0, ]
    if (nrow(bld) == 0) return(bld)
    brks <- c(-Inf, 12, 24, Inf)
    bld$bin <- cut(bld$h, breaks = brks, labels = c("low", "mid", "high"), 
                   include.lowest = TRUE, right = TRUE)
    bld
}

bld <- bin_buildings(bld)
pal <- c(low = col_bld_low, mid = col_bld_mid, high = col_bld_high)
mat_map <- setNames(lapply(pal, rayrender::diffuse), names(pal))

# Add buildings to scene
add_buildings <- function(scene, b) {
    if (is.null(b) || nrow(b) == 0) return(scene)
    for(lev in levels(b$bin)) {
        sel <- b[b$bin == lev, ]
        if (nrow(sel)) {
            scene <- rayrender::add_object(scene,
                rayrender::extruded_polygon(sel, data_column_top = "h", 
                                          scale_data = 1, material = mat_map[[lev]]))
        }
    }
    scene
}

# Build Scene
scene <- objs[[1]]
if (length(objs) > 1) for (i in 2:length(objs)) scene <- rayrender::add_object(scene, objs[[i]])
scene <- add_buildings(scene, bld)

# Camera Settings
lookfrom <- c(${lookFromX}, ${lookFromY}, ${lookFromZ})
lookat <- c(0, 10, 50)

# Light Source
scene <- rayrender::add_object(scene,
    rayrender::sphere(
        x = ${lightX}, y = ${lightY}, z = ${lightZ}, 
        radius = ${lightRadius},
        material = rayrender::light(intensity = ${lightIntensity})
    )
)

# Render
rayrender::render_scene(
    scene = scene,
    lookfrom = lookfrom,
    lookat = lookat,
    fov = ${fov},
    width = ${renderWidth}, 
    height = ${renderHeight},
    samples = ${renderSamples},
    sample_method = "sobol",
    aperture = 0,
    denoise = ${renderDenoise ? 'TRUE' : 'FALSE'},
    ambient_light = ${renderAmbient ? 'TRUE' : 'FALSE'},
    clamp_value = 1,
    min_variance = 1e-15,
    backgroundhigh = "${bgHigh}",
    backgroundlow = "${bgLow}",
    parallel = TRUE,
    interactive = FALSE,
    filename = "render-output.png"
)
`;

    document.getElementById('r-code').textContent = code;
}

// Copy Code
function copyCode() {
    const code = document.getElementById('r-code').textContent;
    navigator.clipboard.writeText(code).then(() => {
        const btn = document.querySelector('button[onclick="copyCode()"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Copied!';
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 2000);
    });
}

// Export Settings
function exportSettings() {
    const settings = {
        center: {
            lat: document.getElementById('center-lat').value,
            lon: document.getElementById('center-lon').value
        },
        camera: {
            x: document.getElementById('lookfrom-x').value,
            y: document.getElementById('lookfrom-y').value,
            z: document.getElementById('lookfrom-z').value,
            fov: document.getElementById('fov').value,
            radius: document.getElementById('radius').value,
            theta: document.getElementById('theta').value,
            phi: document.getElementById('phi').value
        },
        layers: {
            buildings: document.getElementById('layer-buildings').checked,
            parks: document.getElementById('layer-parks').checked,
            water: document.getElementById('layer-water').checked,
            roads: document.getElementById('layer-roads').checked,
            rails: document.getElementById('layer-rails').checked,
            landuse: document.getElementById('layer-landuse').checked
        },
        colors: {
            bldLow: document.getElementById('color-bld-low').value,
            bldMid: document.getElementById('color-bld-mid').value,
            bldHigh: document.getElementById('color-bld-high').value,
            park: document.getElementById('color-park').value,
            water: document.getElementById('color-water').value,
            road: document.getElementById('color-road').value,
            roadHi: document.getElementById('color-road-hi').value,
            landuse: document.getElementById('color-landuse').value
        },
        render: {
            width: document.getElementById('render-width').value,
            height: document.getElementById('render-height').value,
            samples: document.getElementById('render-samples').value,
            denoise: document.getElementById('render-denoise').checked,
            ambient: document.getElementById('render-ambient').checked
        }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "korayrender-settings.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// Presets
function applyPreset(name) {
    const presets = {
        aerial: { z: 1000, x: 0, y: 650, fov: 60, radius: 1000 },
        street: { z: 200, x: 0, y: 100, fov: 80, radius: 500 },
        bird: { z: 500, x: 500, y: 500, fov: 70, radius: 800 },
        dramatic: { z: 300, x: -800, y: 400, fov: 45, radius: 1200 }
    };

    const p = presets[name];
    if (p) {
        document.getElementById('lookfrom-z').value = p.z;
        document.getElementById('lookfrom-x').value = p.x;
        document.getElementById('lookfrom-y').value = p.y;
        document.getElementById('fov').value = p.fov;
        document.getElementById('radius').value = p.radius;

        // Update displays
        document.getElementById('lookfrom-z-val').textContent = p.z;
        document.getElementById('lookfrom-x-val').textContent = p.x;
        document.getElementById('lookfrom-y-val').textContent = p.y;
        document.getElementById('fov-val').textContent = p.fov + '°';
        document.getElementById('radius-val').textContent = p.radius;

        updateRadiusCircle();
        draw3DPreview();
        updateRCode();
    }
}

// Tab Switching
function switchTab(tabName) {
    // Buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    // Content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById('tab-' + tabName).classList.add('active');
}

// Aspect Ratio Change
document.getElementById('aspect-ratio').addEventListener('change', function () {
    const val = this.value;
    const wInput = document.getElementById('render-width');
    const hInput = document.getElementById('render-height');
    const customDiv = document.getElementById('custom-dimensions');

    if (val === 'custom') {
        customDiv.style.display = 'block';
    } else {
        customDiv.style.display = 'none';
        let w, h;
        switch (val) {
            case '16:9': w = 1920; h = 1080; break;
            case '1:1': w = 1800; h = 1800; break;
            case '4:3': w = 1600; h = 1200; break;
            case '21:9': w = 2560; h = 1080; break;
            case '9:16': w = 1080; h = 1920; break;
        }
        wInput.value = w;
        hInput.value = h;
        document.getElementById('render-width-val').textContent = w;
        document.getElementById('render-height-val').textContent = h;
    }
    updateRCode();
});

// Mobile Menu Toggle
function toggleMobileMenu() {
    const leftPanel = document.getElementById('leftPanel');
    const rightPanel = document.getElementById('rightPanel');

    // Simple toggle for now, can be improved
    leftPanel.classList.toggle('active');
}

// Initial Call
updateRCode();

// --- Three.js 3D Preview Logic ---

let scene, camera, renderer, controls;
let buildingsGroup;

function openPreviewModal() {
    document.getElementById('preview-modal').style.display = 'block';
    init3DPreview();
    fetchOSMData();
}

function closePreviewModal() {
    document.getElementById('preview-modal').style.display = 'none';
    // Clean up Three.js resources if needed
}

function init3DPreview() {
    const container = document.getElementById('three-container');

    // If already initialized, just resize
    if (renderer) {
        resizeThreeCanvas();
        return;
    }

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x121212); // Arkaplan rengi
    scene.fog = new THREE.Fog(0x121212, 500, 4000); // Sis efekti

    // Camera
    camera = new THREE.PerspectiveCamera(60, container.offsetWidth / container.offsetHeight, 1, 5000);
    camera.position.set(0, 1000, 1000);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.offsetWidth, container.offsetHeight);

    // GÖLGELERİ AKTİF ETME
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Yumuşak gölgeler

    container.appendChild(renderer.domElement);

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 100;
    controls.maxDistance = 3000;

    // Lights (Işıklandırma)
    // Ortam ışığı (Hemisphere Light - Gökyüzü/Zemin)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemiLight.position.set(0, 1000, 0);
    scene.add(hemiLight);

    // Güneş Işığı (Directional Light - Gölge Veren)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(1000, 2000, -1000);
    dirLight.castShadow = true; // Gölge atmasını sağla

    // Gölge kalitesi ayarları
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 5000;
    const d = 2000;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Buildings Group
    buildingsGroup = new THREE.Group();
    scene.add(buildingsGroup);

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // Handle Resize
    window.addEventListener('resize', resizeThreeCanvas);
}

function resizeThreeCanvas() {
    const container = document.getElementById('three-container');
    if (camera && renderer && container) {
        camera.aspect = container.offsetWidth / container.offsetHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.offsetWidth, container.offsetHeight);
    }
}

function fetchOSMData() {
    const lat = parseFloat(document.getElementById('center-lat').value);
    const lon = parseFloat(document.getElementById('center-lon').value);
    const radius = parseFloat(document.getElementById('radius').value);

    // Show loading
    document.getElementById('preview-loading').style.display = 'flex';

    // Calculate bounding box
    const R = 6378137; // Earth radius
    const dLat = (radius / R) * (180 / Math.PI);
    const dLon = (radius / R) * (180 / Math.PI) / Math.cos(lat * Math.PI / 180);

    const south = lat - dLat;
    const north = lat + dLat;
    const west = lon - dLon;
    const east = lon + dLon;

    // Overpass API Query
    const query = `
        [out:json][timeout:25];
        (
          way["building"](${south},${west},${north},${east});
          relation["building"](${south},${west},${north},${east});
          way["highway"](${south},${west},${north},${east});
          relation["highway"](${south},${west},${north},${east});
          way["railway"](${south},${west},${north},${east});
          relation["railway"](${south},${west},${north},${east});
          way["man_made"="bridge"](${south},${west},${north},${east});
          relation["man_made"="bridge"](${south},${west},${north},${east});
          way["natural"="water"](${south},${west},${north},${east});
          relation["natural"="water"](${south},${west},${north},${east});
          way["water"](${south},${west},${north},${east});
          relation["water"](${south},${west},${north},${east});
          way["landuse"="basin"](${south},${west},${north},${east});
          relation["landuse"="basin"](${south},${west},${north},${east});
          way["leisure"="park"](${south},${west},${north},${east});
          relation["leisure"="park"](${south},${west},${north},${east});
          way["landuse"="forest"](${south},${west},${north},${east});
          relation["landuse"="forest"](${south},${west},${north},${east});
          way["leisure"="garden"](${south},${west},${north},${east});
          relation["leisure"="garden"](${south},${west},${north},${east});
          way["landuse"="grass"](${south},${west},${north},${east});
          relation["landuse"="grass"](${south},${west},${north},${east});
        );
        out body;
        >;
        out skel qt;
    `;

    const url = 'https://overpass-api.de/api/interpreter';

    fetch(url, {
        method: 'POST',
        body: query
    })
        .then(response => response.json())
        .then(data => {
            createSceneObjects(data, lat, lon);
            document.getElementById('preview-loading').style.display = 'none';
        })
        .catch(error => {
            console.error('Error fetching OSM data:', error);
            document.getElementById('preview-loading').innerHTML = '<i class="ph ph-warning"></i> Error fetching data';
        });
}

function createSceneObjects(data, centerLat, centerLon) {
    // Clear old objects
    while (buildingsGroup.children.length > 0) {
        buildingsGroup.remove(buildingsGroup.children[0]);
    }

    const nodes = {};
    data.elements.forEach(el => {
        if (el.type === 'node') {
            nodes[el.id] = { lat: el.lat, lon: el.lon };
        }
    });

    // Arayüzden Renkleri ve Ayarları Al
    const showBuildings = document.getElementById('layer-buildings').checked;
    const showWater = document.getElementById('layer-water').checked;
    const showParks = document.getElementById('layer-parks').checked;

    const colorBld = document.getElementById('color-bld-mid').value; // Binalar için orta renk
    const colorWater = document.getElementById('color-water').value;
    const colorPark = document.getElementById('color-park').value;

    const centerLatRad = centerLat * Math.PI / 180;
    const R_EARTH = 6378137;

    // 1. Grid Helper (Previous Design)
    const gridHelper = new THREE.GridHelper(4000, 40, 0x333333, 0x222222);
    buildingsGroup.add(gridHelper);

    // Binalar: "Kil / Karton" görünümü (Mat)
    const matBuilding = new THREE.MeshStandardMaterial({
        color: colorBld,
        roughness: 0.6,
        metalness: 0.1
    });

    // Su: Parlak ve yarı saydam
    const matWater = new THREE.MeshStandardMaterial({
        color: colorWater,
        roughness: 0.1,
        metalness: 0.5,
        transparent: true,
        opacity: 0.8
    });

    // Park: Mat yeşil yüzey
    const matPark = new THREE.MeshStandardMaterial({
        color: colorPark,
        roughness: 0.8,
        metalness: 0
    });

    // Pre-process Relations to inherit tags for member ways
    const wayInheritedTags = {};
    data.elements.forEach(el => {
        if (el.type === 'relation' && el.members) {
            let type = null;
            if (el.tags.natural === 'water' || el.tags.water || el.tags.natural === 'coastline' || el.tags.place === 'sea' || el.tags.landuse === 'basin') type = 'water';
            else if (el.tags.leisure === 'park' || el.tags.landuse === 'forest' || el.tags.leisure === 'garden' || el.tags.landuse === 'grass') type = 'park';
            else if (el.tags.building) type = 'building';

            if (type) {
                el.members.forEach(member => {
                    if (member.type === 'way') {
                        wayInheritedTags[member.ref] = type;
                    }
                });
            }
        }
    });

    // Roads: Gri tonları
    const matRoad = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.9,
        metalness: 0
    });

    // Railways: Koyu gri/Metalik
    const matRail = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.7,
        metalness: 0.4
    });

    // --- Building Materials ---
    // Historic: Stone/Brick look (Warm Grey/Brown)
    const matHistoric = new THREE.MeshStandardMaterial({
        color: 0x8D7F73, // Stone color
        roughness: 0.9,
        metalness: 0
    });

    // Commercial: Glassy/Blueish (Modern)
    const matCommercial = new THREE.MeshStandardMaterial({
        color: 0x607D8B, // Blue-grey
        roughness: 0.2,
        metalness: 0.6
    });

    // Residential: Warm white/Beige
    const matResidential = new THREE.MeshStandardMaterial({
        color: 0xD7CCC8, // Light beige
        roughness: 0.8,
        metalness: 0
    });

    // Industrial: Dark/Concrete
    const matIndustrial = new THREE.MeshStandardMaterial({
        color: 0x546E7A,
        roughness: 0.9,
        metalness: 0.2
    });

    data.elements.forEach(el => {
        if (el.type === 'way' && el.nodes) {
            // Determine type and visibility
            let type = null;
            let width = 2; // Default width in meters
            let buildingType = 'default'; // default, historic, commercial, residential, industrial

            // Check direct tags
            if (el.tags) {
                if (el.tags.building) {
                    type = 'building';
                    // Determine Building Sub-type
                    const b = el.tags.building;
                    if (el.tags.historic || el.tags.amenity === 'place_of_worship' || el.tags.tourism === 'attraction' || b === 'church' || b === 'cathedral' || b === 'mosque') {
                        buildingType = 'historic';
                    } else if (b === 'commercial' || b === 'office' || b === 'retail' || b === 'hotel' || el.tags.office) {
                        buildingType = 'commercial';
                    } else if (b === 'industrial' || b === 'warehouse' || b === 'factory') {
                        buildingType = 'industrial';
                    } else if (b === 'residential' || b === 'house' || b === 'apartments' || b === 'detached') {
                        buildingType = 'residential';
                    }
                }
                else if (el.tags.natural === 'water' || el.tags.water || el.tags.natural === 'coastline' || el.tags.place === 'sea' || el.tags.landuse === 'basin') type = 'water';
                else if (el.tags.leisure === 'park' || el.tags.landuse === 'forest' || el.tags.leisure === 'garden' || el.tags.landuse === 'grass') type = 'park';
                else if (el.tags.highway) {
                    type = 'road';
                    // Adjust width based on highway type
                    const hw = el.tags.highway;
                    if (hw === 'motorway' || hw === 'trunk') width = 12;
                    else if (hw === 'primary') width = 10;
                    else if (hw === 'secondary') width = 8;
                    else if (hw === 'tertiary') width = 6;
                    else if (hw === 'residential' || hw === 'service') width = 4;
                    else width = 2;
                }
                else if (el.tags.railway) {
                    type = 'rail';
                    width = 3;
                    if (el.tags.railway === 'tram') width = 2;
                }
            }
            // If not found, check inherited tags
            if (!type && wayInheritedTags[el.id]) {
                type = wayInheritedTags[el.id];
            }

            if (!type) return;
            if (type === 'building' && !showBuildings) return;
            if (type === 'water' && !showWater) return;
            if (type === 'park' && !showParks) return;

            // ... (Point processing same as before)
            const pathPoints = [];
            el.nodes.forEach(nodeId => {
                const node = nodes[nodeId];
                if (node) {
                    const dLat = (node.lat - centerLat) * Math.PI / 180;
                    const dLon = (node.lon - centerLon) * Math.PI / 180;
                    const x = dLon * R_EARTH * Math.cos(centerLatRad);
                    const z = -dLat * R_EARTH;
                    pathPoints.push(new THREE.Vector3(x, 0, z));
                }
            });

            if (pathPoints.length < 2) return;

            if (type === 'road' || type === 'rail') {
                // Create Ribbon Mesh for Roads/Rails
                const shape = new THREE.Shape();
                // Simple approach: Create a tube or ribbon
                // Better for performance: extrude along path? 
                // Or custom geometry. Let's use a simple custom geometry function below
                // For MVP: Use simple Line for now? No user asked for width. 
                // User said "TREN, TRAMVAY, yolları vs eklenebilirse iyi olur".
                // Let's try to make a mesh from points.

                const geometry = createRibbonGeometry(pathPoints, width);
                const material = type === 'road' ? matRoad : matRail;
                const mesh = new THREE.Mesh(geometry, material);
                mesh.receiveShadow = true;

                // Y-Offset
                let yOffset = 0.1; // Just above ground
                if (el.tags && el.tags.bridge === 'yes') {
                    yOffset = 8; // Bridge height
                }

                mesh.position.y = yOffset;
                buildingsGroup.add(mesh);
                return; // Skip normal extrusion logic
            }

            // Normal Extrusion Logic for Buildings/Water/Parks
            const shape = new THREE.Shape();
            if (pathPoints.length > 0) {
                shape.moveTo(pathPoints[0].x, pathPoints[0].z);
                for (let i = 1; i < pathPoints.length; i++) {
                    shape.lineTo(pathPoints[i].x, pathPoints[i].z);
                }
            }

            // Extrude settings based on type
            let height = 0;
            let material = matBuilding;
            let yOffset = 0;

            if (type === 'building') {
                height = 12; // Default
                if (el.tags['building:levels']) {
                    height = parseInt(el.tags['building:levels']) * 3.5;
                } else if (el.tags.height) {
                    height = parseFloat(el.tags.height);
                }

                // Assign Material based on Building Type
                if (buildingType === 'historic') {
                    material = matHistoric;
                    if (!el.tags['building:levels'] && !el.tags.height) height = 20; // Default taller for historic/monuments
                } else if (buildingType === 'commercial') {
                    material = matCommercial;
                    if (!el.tags['building:levels'] && !el.tags.height) height = 18; // Modern buildings often taller
                } else if (buildingType === 'residential') {
                    material = matResidential;
                } else if (buildingType === 'industrial') {
                    material = matIndustrial;
                } else {
                    material = matBuilding; // Default Karton look
                }

            } else if (type === 'water') {
                height = 1;
                yOffset = -1; // Slightly below ground
                material = matWater;
            } else if (type === 'park') {
                height = 0.5;
                yOffset = 0.1; // Slightly above ground
                material = matPark;
            }

            const geometry = new THREE.ExtrudeGeometry(shape, {
                depth: height,
                bevelEnabled: false
            });

            // Rotate to stand up (Extrude creates along Z)
            geometry.rotateX(-Math.PI / 2);

            // Apply Y offset if needed
            if (yOffset !== 0) {
                geometry.translate(0, yOffset, 0);
            }

            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;    // Gölge at
            mesh.receiveShadow = true; // Gölge al
            buildingsGroup.add(mesh);
        }
    });
}

// Helper to create a flat ribbon geometry from a path
function createRibbonGeometry(pathPoints, width) {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];

    const halfWidth = width / 2;

    for (let i = 0; i < pathPoints.length; i++) {
        const curr = pathPoints[i];

        // Calculate direction
        let dir = new THREE.Vector3();
        if (i < pathPoints.length - 1) {
            dir.subVectors(pathPoints[i + 1], curr);
        } else if (i > 0) {
            dir.subVectors(curr, pathPoints[i - 1]);
        }
        dir.normalize();

        // Calculate perpendicular vector (assuming flat on XZ plane)
        const perp = new THREE.Vector3(-dir.z, 0, dir.x);

        // Create two points (left and right)
        const p1 = new THREE.Vector3().copy(curr).addScaledVector(perp, halfWidth);
        const p2 = new THREE.Vector3().copy(curr).addScaledVector(perp, -halfWidth);

        vertices.push(p1.x, 0, p1.z);
        vertices.push(p2.x, 0, p2.z);
    }

    // Create triangles
    for (let i = 0; i < pathPoints.length - 1; i++) {
        const base = i * 2;
        // Triangle 1
        indices.push(base, base + 1, base + 2);
        // Triangle 2
        indices.push(base + 1, base + 3, base + 2);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
}
