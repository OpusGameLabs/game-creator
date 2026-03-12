import { BoxGeometry, Mesh, MeshStandardMaterial, Scene } from "three";

const scene = new Scene();
const geometry = new BoxGeometry(0.5, 0.5, 0.5);
const material = new MeshStandardMaterial({ color: 0x4ea7d8 });

for (let index = 0; index < 8000; index += 1) {
  const mesh = new Mesh(geometry, material);
  scene.add(mesh);
}
