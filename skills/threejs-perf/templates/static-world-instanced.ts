import { BoxGeometry, InstancedMesh, Matrix4, MeshStandardMaterial, Scene } from "three";

const geometry = new BoxGeometry(1, 1, 1);
const material = new MeshStandardMaterial({ color: 0x7aa95c });
const scene = new Scene();
const instanceCount = 140 * 140;
const matrix = new Matrix4();
const instancedMesh = new InstancedMesh(geometry, material, instanceCount);

let index = 0;
for (let x = 0; x < 140; x += 1) {
  for (let z = 0; z < 140; z += 1) {
    matrix.makeTranslation(x * 1.5, 0, z * 1.5);
    instancedMesh.setMatrixAt(index, matrix);
    index += 1;
  }
}

instancedMesh.instanceMatrix.needsUpdate = true;
scene.add(instancedMesh);
