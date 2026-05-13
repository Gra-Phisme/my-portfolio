const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#bg-canvas'), alpha: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
camera.position.z = 5;

// Geological Terrain Mesh
const geometry = new THREE.PlaneGeometry(15, 15, 40, 40);
const material = new THREE.MeshBasicMaterial({ color: 0x00ffcc, wireframe: true, transparent: true, opacity: 0.1 });
const terrain = new THREE.Mesh(geometry, material);
terrain.rotation.x = -Math.PI / 3;
scene.add(terrain);

// Animation Logic
let mouseX = 0;
document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX - window.innerWidth / 2) / 500;
});

function animate() {
    requestAnimationFrame(animate);
    
    // Wave effect on vertices
    const time = Date.now() * 0.001;
    const positions = terrain.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        positions[i + 2] = Math.sin(positions[i] + time) * 0.3;
    }
    terrain.geometry.attributes.position.needsUpdate = true;

    terrain.rotation.z += 0.001;
    camera.position.x += (mouseX - camera.position.x) * 0.05;

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});