# 🗺️ KorayRender - RStudio 3D Map Simulator

Interactive web tool for generating 3D map visualizations using RayRender in R.

![KorayRender Interface](https://img.shields.io/badge/Status-Active-success)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🌟 Features

- **Interactive Map Interface**: Select any location on OpenStreetMap
- **3D Camera Control**: Adjust camera position, FOV, and rotation with real-time preview
- **Multiple OSM Layers**: Buildings, parks, water, roads, railways, and land use
- **Customizable Rendering**: 
  - Multiple aspect ratios (16:9, 1:1, 4:3, 21:9, 9:16)
  - Adjustable quality settings
  - Custom lighting controls
- **Automatic R Code Generation**: Export ready-to-run R scripts for RayRender
- **Layer Customization**: Individual color controls for each map layer

## 🚀 Quick Start

1. Open `index.html` in a web browser
2. Click on the map to select your location
3. Adjust radius and camera settings
4. Toggle desired OSM layers
5. Copy generated R code
6. Run in RStudio with RayRender installed

## 📋 Requirements

For running the generated R code:
```r
install.packages("pacman")
pacman::p_load(osmdata, sf, dplyr, rayrender)
```

## 🎨 Customization Options

### Camera Settings
- **Position (X, Y, Z)**: 3D coordinates for camera placement
- **FOV**: Field of view angle (30°-90°)
- **Rotation (Theta, Phi)**: Camera orientation angles

### Render Settings
- **Aspect Ratios**: 
  - 📺 Wide (16:9) - 1920x1080
  - ⬛ Square (1:1) - 1800x1800
  - 📺 Classic (4:3) - 1600x1200
  - 🎬 Cinema (21:9) - 2560x1080
  - 📱 Vertical (9:16) - 1080x1920
  - ⚙️ Custom dimensions
- **Quality**: Sample count (50-500)
- **Denoise**: Noise reduction option
- **Ambient Light**: Global illumination toggle

### OSM Layers
- 🏢 Buildings (with height-based coloring)
- 🌳 Parks and green spaces
- 💧 Water bodies
- 🛣️ Roads and highways
- 🚂 Railways
- 🏞️ Land use areas

## 🎯 Usage Example

1. Search for "Istanbul, Turkey" or any location
2. Set radius to 1000m
3. Position camera at Y: 650m for aerial view
4. Enable Buildings, Water, and Roads layers
5. Select 16:9 Wide format
6. Copy R code and run in RStudio

## 📸 Output

The tool generates photorealistic 3D map renders using raytracing technology. Perfect for:
- Urban planning visualizations
- Architectural presentations
- Geographic analysis
- Educational materials
- Social media content

## 🔧 Technical Details

- **Frontend**: HTML5, CSS3, Leaflet.js
- **Backend**: R with RayRender package
- **Data Source**: OpenStreetMap via Overpass API
- **Rendering**: RayRender (raytracing engine)

## 🐛 Troubleshooting

If you encounter "doc nesnesi bulunamadı" errors:
- Check internet connection (OSM data download required)
- Try reducing radius or area complexity
- Increase timeout value in generated R code

## 📝 License

MIT License - Feel free to use and modify!

## 👤 Author

**Koray Aclan**
- GitHub: [@korayaclan](https://github.com/korayaclan)
- Twitter: [@kryaclan](https://twitter.com/kryaclan)

## 🙏 Acknowledgments

- [RayRender](https://www.rayrender.net/) by Tyler Morgan-Wall
- [Leaflet.js](https://leafletjs.com/) for interactive maps
- [OpenStreetMap](https://www.openstreetmap.org/) for map data
- [MilosMakesMap](https://www.youtube.com/@milos-makes-maps) for map tutorials

---

Made with ❤️ for the R and geospatial visualization community
