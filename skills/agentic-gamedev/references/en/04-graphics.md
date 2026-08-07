## 4. Zero-Asset Graphics & Visual Polish ("Escaping Indie Looks")

Generate all visual elements in code inside the `render` layer without external 3D models or art files.

| Technique | Visual Benefit | Core Implementation |
|-----------|----------------|---------------------|
| **Blob Shadows** | Anchors units visually to ground | Radial gradient ellipse under units |
| **Bloom** | Emissive surfaces glow vividly | Threshold filter + additive Gaussian blur |
| **Procedural Textures** | Unlimited themes from 1 texture | Grayscale noise × color palette multiplication |
| **Particle Pool** | Explosions, impacts, fire | Zero-allocation fixed arrays with TTL decay |
| **Floating Damage Numbers** | Impact feedback | Canvas strokeText + fillText fading upwards |
| **Camera Shake** | Hit weight & feedback | Cumulative impulse → squared decay curve |
| **Fog & Vignette** | Depth & environmental mood | Distance-based fog density attenuation |
| **Procedural Characters** | Distinct visual silhouettes | Primitive geometry + class props (helm, staff) |

```js
// Camera Shake: Accumulate impulse per hit, decay quadratically per frame
addShake(v) { this.shake = Math.min(0.8, this.shake + v); }
// Frame update:
this.shake = Math.max(0, this.shake - dt * 1.7);
const s2 = this.shake * this.shake;
cam.position.x += (Math.random() - 0.5) * s2 * 2.2;
```

### 4.1 Lighting, Real-time Shadows & Tone Mapping

1. **Real-time Shadows:** Use 1 Directional Light + PCFSoft 2048 shadow maps. Fit the shadow camera bounds tightly around the active playfield area.
2. **Filmic Tone Mapping:** Enable ACESFilmic tone mapping to prevent bright emissive particles from blowing out into pure white pixels.
3. **Automated Shadow Verification:** Verify shadow map rendering programmatically using pixel diffing (`readPixels`) between shadow ON/OFF frames.

### 4.2 Culling Off-Screen Elements (Frustum Checks)

In top-down or isometric cameras, avoid instantiating background elements (like sky domes or distant clouds) that lie outside the view frustum:

```js
const v = obj.position.clone().project(camera);
// Keep only if |v.x| < 1 && |v.y| < 1 && v.z < 1
```

Implement **Adaptive Quality Scaling**: Sample actual FPS 4 seconds after boot for 3 seconds. If FPS < 45, degrade bloom, DPR, and particle counts automatically, caching the choice in `localStorage`.

### 4.3 Integrating Textures: Separating Color from Bump

When applying textures to procedural meshes:
- **Natural surfaces (wood, dirt):** Use `map` (color map).
- **Stylized elements with defined colors (roof tiles, plaster):** Apply `bumpMap` only to gain surface depth while preserving palette colors.

### 4.4 Positional Impact Ring vs Camera Shake for Auto-Shooters

In games featuring rapid auto-firing weapons, triggering camera shake on every hit causes cumulative screen vibration and motion sickness. Replace global camera shake with **positional ground impact rings** (`ripple(x, z, power)`).

### 4.5 Mobile Viewport Optimization & Performance Profile

Detect mobile devices via `pointer: coarse` media queries and initialize at low quality from boot. Reclaim viewport area occupied by decorative background geometry by widening the camera FOV to enlarge touch targets.
