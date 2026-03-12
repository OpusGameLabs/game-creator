import { BoxGeometry, Mesh, MeshStandardMaterial, Scene } from "three";

const geometry = new BoxGeometry(1, 1, 1);
const material = new MeshStandardMaterial({ color: 0x7aa95c });
const scene = new Scene();

for (let x = 0; x < 140; x += 1) {
  for (let z = 0; z < 140; z += 1) {
    const mesh = new Mesh(geometry, material);
    mesh.position.set(x * 1.5, 0, z * 1.5);
    scene.add(mesh);
  }
}
