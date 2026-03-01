import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import GUI from 'lil-gui';
import { inject } from '@vercel/analytics';

// Initialize Vercel Analytics
inject();

// 1. Setup Scene, Camera, and Renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(100, -10, 78);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  antialias: true,
  alpha: false
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// Env map for glass refraction
const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

// 2. Post-processing (Bloom)
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.205, 0.4, 0.9);
const outputPass = new OutputPass();

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);
composer.addPass(outputPass);

// 3. Lighting
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(-1.465, 2.32, 2);
scene.add(pointLight);
const ambientLight = new THREE.AmbientLight(0x404040, 1.0);
scene.add(ambientLight);

// 4. Material definition
const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0.5521,
  roughness: 0.01,
  clearcoat: 1.0,
  clearcoatRoughness: 1.0,
  transmission: 1.0,
  thickness: 1.5,
  ior: 1.5,
  opacity: 1.0,
  envMapIntensity: 1.0,
  // Simulate Subsurface + Iridescence visually
  iridescence: 1.0,
  iridescenceIOR: 1.5,
  attenuationColor: new THREE.Color(0xffffff),
  attenuationDistance: 0.8
});

// Custom Shader/Colors to mimic iridescence + SSS
const iridescenceColor = new THREE.Color(0x1e00ff); // From screenshot
// We blend this into specularColor / emissive slightly to fake the shader if needed.
glassMaterial.emissive = new THREE.Color(0x000000);

// To get the background "rays" effect resembling caustics/subsurface light rays
// Let's add some faint blooming planes behind the brain or just depend on bloom from strong reflections.

let brainWrapper = null;

// 5. Load the Brain Model
const loader = new ColladaLoader();
loader.load('/brain.dae', (collada) => {
  const model = collada.scene;

  // Center and scale the model depending on its raw size
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3()).length();
  const scale = 2.0 / size; // target size approx 2
  model.scale.setScalar(scale);

  // Center the model
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center.multiplyScalar(scale));

  // Apply our custom glass material to all sub-meshes
  model.traverse((child) => {
    if (child.isMesh) {
      child.material = glassMaterial;
      // Smooth the geometry normals
      if (child.geometry) {
        child.geometry = BufferGeometryUtils.mergeVertices(child.geometry);
        child.geometry.computeVertexNormals();
      }
    }
  });

  // Create a wrapper to nicely hold the centered brain
  const wrapper = new THREE.Group();
  wrapper.add(model);
  scene.add(wrapper);
  brainWrapper = wrapper;
}, (xhr) => {
  console.log((xhr.loaded / xhr.total * 100) + '% loaded');
}, (error) => {
  console.error('An error happened', error);
});

// 6. GUI parameters
const params = {
  // Point Light
  lightIntensity: 1,
  lightX: -1.465, lightY: 2.32, lightZ: 2,
  lightColor: 0xffffff,

  // Performance & Settings
  enableBloom: true,
  bloomIntensity: 0.05,
  enableToneMapping: true,
  meshDetail: 1,
  enableShadows: true,
  exposure: 1,
  pixelRatio: 1,

  // Material 
  color: 0xffffff,
  metalness: 0.5521,
  roughness: 0.01,
  clearcoat: 1,
  clearcoatRoughness: 1,
  transmission: 1,
  thickness: 1.5,
  ior: 1.5,
  opacity: 1,
  envMapIntensity: 1,

  // Shader (Approximated)
  iridescenceColor: 0x1e00ff,
  iridescenceIntensity: 2, // We'll map this to iridescence + emissive

  // Subsurface Scattering (Approximated)
  sssColor: 0xffffff,
  sssIntensity: 0.8,

  // Caustics (Approximated or ignored since no floor)
  causticIntensity: 2,
  causticScale: 10
};

// Setup GUI
const gui = new GUI();

const gCamera = gui.addFolder('Camera Controls');
const gLight = gui.addFolder('Point Light');
gLight.add(params, 'lightIntensity', 0, 5).name('Intensity').onChange(v => pointLight.intensity = v);
gLight.add(params, 'lightX', -5, 5).name('X').onChange(v => pointLight.position.x = v);
gLight.add(params, 'lightY', -5, 5).name('Y').onChange(v => pointLight.position.y = v);
gLight.add(params, 'lightZ', -5, 5).name('Z').onChange(v => pointLight.position.z = v);
gLight.addColor(params, 'lightColor').name('color').onChange(v => pointLight.color.setHex(v));

const gPerf = gui.addFolder('Performance');
gPerf.add(params, 'enableBloom').name('Enable Bloom').onChange(v => {
  bloomPass.enabled = v;
});

const gBloom = gui.addFolder('Bloom Settings');
gBloom.add(params, 'bloomIntensity', 0, 5).name('Bloom Intensity').onChange(v => bloomPass.strength = v);

gui.add(params, 'enableToneMapping').name('Enable Tone Mapping').onChange(v => {
  renderer.toneMapping = v ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
});
gui.add(params, 'meshDetail', 1, 10, 1).name('Mesh Detail').onChange(v => {
  // Normally would tessellate geometry here, omit for simplicity
});
gui.add(params, 'enableShadows').name('Enable Shadows').onChange(v => {
  renderer.shadowMap.enabled = v;
});
gui.add(params, 'exposure', 0, 5).name('Exposure').onChange(v => {
  renderer.toneMappingExposure = v;
});
gui.add(params, 'pixelRatio', 0.1, 2).name('Pixel Ratio').onChange(v => {
  renderer.setPixelRatio(window.devicePixelRatio * v);
});

const gMat = gui.addFolder('Material');
gMat.addColor(params, 'color').name('color').onChange(v => glassMaterial.color.setHex(v));
gMat.add(params, 'metalness', 0, 1).name('metalness').onChange(v => glassMaterial.metalness = v);
gMat.add(params, 'roughness', 0, 1).name('roughness').onChange(v => glassMaterial.roughness = v);
gMat.add(params, 'clearcoat', 0, 1).name('clearcoat').onChange(v => glassMaterial.clearcoat = v);
gMat.add(params, 'clearcoatRoughness', 0, 1).name('clearcoatRoughness').onChange(v => glassMaterial.clearcoatRoughness = v);
gMat.add(params, 'transmission', 0, 1).name('transmission').onChange(v => glassMaterial.transmission = v);
gMat.add(params, 'thickness', 0, 5).name('thickness').onChange(v => glassMaterial.thickness = v);
gMat.add(params, 'ior', 1, 2.3).name('ior').onChange(v => glassMaterial.ior = v);
gMat.add(params, 'opacity', 0, 1).name('opacity').onChange(v => glassMaterial.opacity = v);
gMat.add(params, 'envMapIntensity', 0, 5).name('envMapIntensity').onChange(v => glassMaterial.envMapIntensity = v);

const gShader = gui.addFolder('Shader');
gShader.addColor(params, 'iridescenceColor').name('iridescenceColor').onChange(updateShaders);
gShader.add(params, 'iridescenceIntensity', 0, 5).name('iridescenceIntensity').onChange(updateShaders);

const gSSS = gui.addFolder('Subsurface Scattering');
gSSS.addColor(params, 'sssColor').name('color').onChange(updateShaders);
gSSS.add(params, 'sssIntensity', 0, 5).name('intensity').onChange(updateShaders);

const gCaustic = gui.addFolder('Caustics');
gCaustic.add(params, 'causticIntensity', 0, 5).name('intensity').onChange(updateShaders);
gCaustic.add(params, 'causticScale', 0, 20).name('scale').onChange(updateShaders);

function updateShaders() {
  // Use these values to approximate the look
  glassMaterial.iridescence = Math.min(1.0, params.iridescenceIntensity * 0.5);
  glassMaterial.attenuationColor.setHex(params.sssColor);
  glassMaterial.attenuationDistance = params.sssIntensity * 2.0;

  // Add emissive tint to mimic iridescence/caustic glow
  const rCol = new THREE.Color(params.iridescenceColor);
  glassMaterial.emissive.copy(rCol).multiplyScalar(params.iridescenceIntensity * 0.02);
}

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Handle Window Resize
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// Background rays removed as requested

// Animation Loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime();

  controls.update();

  if (brainWrapper) {
    // Optionally rotate the entire brain slowly
    brainWrapper.rotation.y = time * 0.1;
  }

  // Use composer instead of renderer due to bloom
  if (params.enableBloom) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }
}

animate();

// Initialize the shader approximations
updateShaders();
