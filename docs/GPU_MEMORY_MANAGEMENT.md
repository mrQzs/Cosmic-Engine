# GPU Memory Management

## Core Rule

R3F auto-dispose only covers resources created as **direct JSX children** of the
scene graph. Anything loaded via `useLoader`, `useTexture`, or manually constructed
must be disposed explicitly in a `useEffect` cleanup.

## Dispose Patterns

### Textures and Materials (useLoader / useTexture)

```tsx
const texture = useTexture('/maps/planet.jpg');

useEffect(() => {
  return () => {
    texture.dispose();
  };
}, [texture]);
```

### Geometry + Material + Texture (full cleanup)

```tsx
useEffect(() => {
  const geometry = new THREE.SphereGeometry(1, 64, 64);
  const material = new THREE.MeshStandardMaterial({ map: texture });
  meshRef.current.geometry = geometry;
  meshRef.current.material = material;

  return () => {
    geometry.dispose();
    material.dispose();
    texture.dispose();
  };
}, [texture]);
```

### LOD Switches

When switching LOD levels, dispose the geometry/material of the level being
replaced **before** assigning the new one. Never let replaced resources linger.

### RenderTargets

`WebGLRenderTarget` allocates GPU framebuffers. Always dispose after use:

```tsx
useEffect(() => {
  const rt = new THREE.WebGLRenderTarget(width, height);
  return () => rt.dispose();
}, [width, height]);
```

## Dev Monitoring

During development, log GPU memory usage to detect leaks:

```tsx
useFrame(({ gl }) => {
  if (frameCount.current % 300 === 0) {
    const info = gl.info.memory;
    console.log(`Geometries: ${info.geometries}, Textures: ${info.textures}`);
  }
});
```

Watch for monotonically increasing counts — that indicates a leak.

## Checklist

- [ ] Every `useLoader`/`useTexture` resource has a cleanup `.dispose()`?
- [ ] LOD switches dispose replaced geometry/material?
- [ ] RenderTargets disposed in useEffect cleanup?
- [ ] Dev build logs `renderer.info.memory` periodically?
