import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const loader = new GLTFLoader();
const cache = new Map();

/**
 * Load a GLTF/GLB model (static, no skeleton).
 */
export async function loadModel(path) {
  const gltf = await _load(path);
  const clone = gltf.scene.clone(true);

  clone.traverse((child) => {
    if (child.isMesh) {
      child.material = child.material.clone();
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return clone;
}

/**
 * Load a GLTF/GLB model with skeleton + animations.
 * Uses SkeletonUtils.clone() so bone bindings survive cloning.
 */
export async function loadAnimatedModel(path) {
  const gltf = await _load(path);

  // SkeletonUtils.clone properly re-binds SkinnedMesh to cloned Skeleton
  const model = SkeletonUtils.clone(gltf.scene);

  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return { model, clips: gltf.animations };
}

/**
 * Preload multiple paths in parallel. Returns when all are cached.
 * @param {string[]} paths
 * @param {(loaded: number, total: number) => void} [onProgress]
 */
export async function preloadAll(paths, onProgress) {
  let loaded = 0;
  const total = paths.length;
  await Promise.all(paths.map((path) =>
    _load(path).then(() => {
      loaded++;
      if (onProgress) onProgress(loaded, total);
    })
  ));
}

/**
 * Dispose all cached models.
 */
export function disposeAll() {
  cache.forEach((promise) => {
    promise.then((gltf) => {
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
  });
  cache.clear();
}

function _load(path) {
  if (!cache.has(path)) {
    cache.set(path, new Promise((resolve, reject) => {
      loader.load(path, resolve, undefined,
        (err) => reject(new Error(`Failed to load: ${path} — ${err.message || err}`))
      );
    }));
  }
  return cache.get(path);
}
