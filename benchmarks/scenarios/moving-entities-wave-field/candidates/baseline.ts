import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Scene,
} from "three";

const ENTITY_COUNT = 8000;
const GRID_WIDTH = 100;

function createInitialPosition(index: number): { x: number; z: number } {
  const x = (index % GRID_WIDTH) - GRID_WIDTH / 2;
  const z = Math.floor(index / GRID_WIDTH) - GRID_WIDTH / 2;
  return { x: x * 0.9, z: z * 0.9 };
}

export function buildMovingEntitiesBaseline() {
  const scene = new Scene();
  const root = new Group();
  const geometry = new BoxGeometry(0.5, 0.5, 0.5);
  const material = new MeshStandardMaterial({ color: 0x4ea7d8 });
  const meshes: Mesh[] = [];

  for (let index = 0; index < ENTITY_COUNT; index += 1) {
    const mesh = new Mesh(geometry, material);
    const position = createInitialPosition(index);
    mesh.position.set(position.x, 0, position.z);
    meshes.push(mesh);
    root.add(mesh);
  }

  scene.add(root);

  return {
    cleanup: () => {
      geometry.dispose();
      material.dispose();
    },
    metadata: { entityCount: ENTITY_COUNT },
    root,
    scene,
    step: (tick: number) => {
      for (let index = 0; index < meshes.length; index += 1) {
        const mesh = meshes[index];
        const position = createInitialPosition(index);
        mesh.position.x = position.x + Math.sin(tick * 0.03 + index * 0.01) * 0.35;
        mesh.position.y = Math.sin(tick * 0.08 + index * 0.03) * 1.4;
        mesh.position.z = position.z + Math.cos(tick * 0.02 + index * 0.015) * 0.35;
      }
    },
  };
}
