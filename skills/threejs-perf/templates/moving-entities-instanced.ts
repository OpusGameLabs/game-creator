import { BoxGeometry, InstancedMesh, Matrix4, MeshStandardMaterial, Scene } from "three";

const scene = new Scene();
const geometry = new BoxGeometry(0.5, 0.5, 0.5);
const material = new MeshStandardMaterial({ color: 0x4ea7d8 });
const entities = 8000;
const matrix = new Matrix4();
const instancedMesh = new InstancedMesh(geometry, material, entities);

for (let index = 0; index < entities; index += 1) {
  matrix.makeTranslation(0, 0, 0);
  instancedMesh.setMatrixAt(index, matrix);
}

instancedMesh.instanceMatrix.needsUpdate = true;
scene.add(instancedMesh);
