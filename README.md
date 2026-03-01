# Cortex Glass

An interactive, high-performance web application showcasing a beautifully rendered 3D brain model using modern real-time graphics techniques. This project leverages the power of WebGL through Three.js to simulate complex optical phenomena including transmission, iridescence, and subsurface scattering on a complex biological mesh.

## Features

- **Physically Based Rendering (PBR)**: Utilizes `MeshPhysicalMaterial` to create a stunning, realistic glass-like material with configurable refraction and thickness.
- **Advanced Post-Processing**: Features a customizable `UnrealBloomPass` mapped perfectly to the lighting environment to give off cinematic, sci-fi glowing effects without washing out details.
- **Approximated Iridescence & SSS**: Simulates advanced subsurface scattering (SSS) and iridescence colors through fine-tuned attenuation arrays and emissive light mixing.
- **Dynamic Lighting**: Includes point lights, ambient environment lighting, and HDRI reflections generated via `PMREMGenerator` mapping a `RoomEnvironment`.
- **Developer Interface**: Integrated `lil-gui` panel allowing real-time tweaking of:
  - Transmission, IOR, Roughness, and Metalness
  - Lighting position and intensity
  - Bloom thresholds and tone-mapping exposure
  - Iridescent shader colors and intensity
- **Unrestricted Camera**: Smooth `OrbitControls` that easily allow zooming, panning, and orbiting the model at any distance without clipping. 

## Technologies Used

- [Three.js](https://threejs.org/) - Core WebGL abstraction library mapping the 3D scene and materials.
- [Vite.js](https://vitejs.dev/) - Lightning-fast frontend build tool and dev server.
- [lil-gui](https://lil-gui.georgealways.com/) - Floating panel hardware for runtime variable manipulation.

## Getting Started

### Prerequisites
Make sure you have Node.js and NPM installed on your machine.

### Installation

1. Clone or download this repository.
2. Navigate to the project directory:
   ```bash
   cd "Three js"
   ```
3. Install the required dependencies:
   ```bash
   npm install
   ```

### Running Locally

To start the Vite development server with hot-module replacement (HMR), run:

```bash
npm run dev
```

Then, open your browser and navigate to the local host address provided (typically `http://localhost:5173`).

### Building for Production

To create an optimized, minified production build:

```bash
npm run build
```

This will create a `dist` folder containing your static site ready to be deployed to Vercel, Netlify, GitHub Pages, or any standard web server.

## Future Improvements

- Add Caustics floor to receive light refractions from the model.
- Further refine custom GLSL shader hooks to improve authentic iridescent color shifting based on viewing angles.
- Implement responsive mesh tessellation based on screen size for performance/quality scaling.
