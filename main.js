// =========================================================
// 1. BACKGROUND 3D (Geological Terrain Mesh)
// =========================================================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#bg-canvas'), alpha: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
camera.position.z = 5;

// Maillage 3D ondulant en arrière-plan
const geometry = new THREE.PlaneGeometry(15, 15, 40, 40);
const material = new THREE.MeshBasicMaterial({ color: 0x00ffcc, wireframe: true, transparent: true, opacity: 0.1 });
const terrain = new THREE.Mesh(geometry, material);
terrain.rotation.x = -Math.PI / 3;
scene.add(terrain);

let mouseX = 0;
document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX - window.innerWidth / 2) / 500;
});

function animate() {
    requestAnimationFrame(animate);
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


// =========================================================
// 2. LEAPFROG 3D MODEL & DRILLHOLES (Projet Géologique)
// =========================================================
window.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('leapfrog-canvas-container');
    if (!container) return;

    // 1. Scène et Caméra
    const projectScene = new THREE.Scene();
    const projectCamera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 10000);

    // 2. Rendu WebGL (Fond transparent pour apercevoir le background 3D)
    const projectRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    projectRenderer.setSize(container.clientWidth, container.clientHeight);
    projectRenderer.setPixelRatio(window.devicePixelRatio);
    projectRenderer.setClearColor(0x000000, 0);
    container.appendChild(projectRenderer.domElement);

    // 3. Contrôle à la souris
    const controls = new THREE.OrbitControls(projectCamera, projectRenderer.domElement);
    controls.enableDamping = true;

    // 4. Éclairage
    projectScene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(100, 200, 100);
    projectScene.add(sun);

    // Groupe principal
    const mainGroup = new THREE.Group();
    projectScene.add(mainGroup);

    const objLoader = new THREE.OBJLoader();

    // 5. Chargement des modèles 3D (.OBJ) avec alignement géométrique précis
    const units = [
        { file: 'model/QFP.obj', color: 0xe74c3c, opacity: 0.85, wireframe: false },
        { file: 'model/AND.obj', color: 0x2ecc71, opacity: 0.85, wireframe: false },
        { file: 'model/BAS.obj', color: 0x3498db, opacity: 0.85, wireframe: false },
        { file: 'model/topo.obj', color: 0x888888, opacity: 0.3, wireframe: true }
    ];

    units.forEach(unit => {
        objLoader.load(
            unit.file,
            (obj) => {
                obj.traverse((child) => {
                    if (child.isMesh && child.geometry) {
                        // Permutation explicite des coordonnées Y et Z au niveau des sommets (Vertices)
                        // Permet de convertir les coordonnées Leapfrog (Z=Altitude) vers Three.js (Y=Altitude)
                        const position = child.geometry.attributes.position;
                        for (let i = 0; i < position.count; i++) {
                            const y = position.getY(i);
                            const z = position.getZ(i);
                            position.setY(i, z);
                            position.setZ(i, y);
                        }
                        position.needsUpdate = true;
                        child.geometry.computeVertexNormals();

                        child.material = new THREE.MeshStandardMaterial({
                            color: unit.color,
                            roughness: 0.4,
                            metalness: 0.1,
                            wireframe: unit.wireframe,
                            transparent: unit.opacity < 1.0,
                            opacity: unit.opacity,
                            side: THREE.DoubleSide
                        });
                    }
                });
                mainGroup.add(obj);
                adjustCameraToScene();
            },
            undefined,
            (err) => console.log("Fichier non trouvé :", unit.file)
        );
    });

    // 6. DRILL HOLES (Sondages CSV exacts)
    const drillGroup = new THREE.Group();

    const lithoIntervals = [
        // DH_01
        { id: 'DH_01', sx: 1000.0, sy: 250.0, sz: 2000.0, ex: 1000.0, ey: 220.0, ez: 2000.0, color: 0x2ecc71 },
        { id: 'DH_01', sx: 1000.0, sy: 220.0, sz: 2000.0, ex: 1000.0, ey: 155.0, ez: 2000.0, color: 0xe74c3c },
        { id: 'DH_01', sx: 1000.0, sy: 155.0, sz: 2000.0, ex: 1000.0, ey: 100.0, ez: 2000.0, color: 0x3498db },

        // DH_02 (Incliné -60°)
        { id: 'DH_02', sx: 1050.0, sy: 252.0, sz: 2000.0, ex: 1062.5, ey: 230.35, ez: 2000.0, color: 0x2ecc71 },
        { id: 'DH_02', sx: 1062.5, sy: 230.35, sz: 2000.0, ex: 1105.0, ey: 156.74, ez: 2000.0, color: 0xe74c3c },
        { id: 'DH_02', sx: 1105.0, sy: 156.74, sz: 2000.0, ex: 1130.0, ey: 113.44, ez: 2000.0, color: 0x3498db },

        // DH_03
        { id: 'DH_03', sx: 1100.0, sy: 255.0, sz: 2000.0, ex: 1100.0, ey: 215.0, ez: 2000.0, color: 0x2ecc71 },
        { id: 'DH_03', sx: 1100.0, sy: 215.0, sz: 2000.0, ex: 1100.0, ey: 170.0, ez: 2000.0, color: 0xe74c3c },
        { id: 'DH_03', sx: 1100.0, sy: 170.0, sz: 2000.0, ex: 1100.0, ey: 115.0, ez: 2000.0, color: 0x3498db },

        // DH_04 (Incliné -70°)
        { id: 'DH_04', sx: 1000.0, sy: 248.0, sz: 2100.0, ex: 1000.0, ey: 229.21, ez: 2093.16, color: 0x2ecc71 },
        { id: 'DH_04', sx: 1000.0, sy: 229.21, sz: 2093.16, ex: 1000.0, ey: 154.03, ez: 2065.80, color: 0xe74c3c },
        { id: 'DH_04', sx: 1000.0, sy: 154.03, sz: 2065.80, ex: 1000.0, ey: 107.05, ez: 2048.70, color: 0x3498db },

        // DH_05
        { id: 'DH_05', sx: 1050.0, sy: 250.0, sz: 2100.0, ex: 1050.0, ey: 215.0, ez: 2100.0, color: 0x2ecc71 },
        { id: 'DH_05', sx: 1050.0, sy: 215.0, sz: 2100.0, ex: 1050.0, ey: 130.0, ez: 2100.0, color: 0xe74c3c },
        { id: 'DH_05', sx: 1050.0, sy: 130.0, sz: 2100.0, ex: 1050.0, ey: 80.0, ez: 2100.0, color: 0x3498db }
    ];

    const collars = [
        { id: 'DH_01', x: 1000.0, y: 250.0, z: 2000.0 },
        { id: 'DH_02', x: 1050.0, y: 252.0, z: 2000.0 },
        { id: 'DH_03', x: 1100.0, y: 255.0, z: 2000.0 },
        { id: 'DH_04', x: 1000.0, y: 248.0, z: 2100.0 },
        { id: 'DH_05', x: 1050.0, y: 250.0, z: 2100.0 }
    ];

    // Construction des cylindres 3D
    lithoIntervals.forEach(seg => {
        const start = new THREE.Vector3(seg.sx, seg.sy, seg.sz);
        const end = new THREE.Vector3(seg.ex, seg.ey, seg.ez);
        
        const distance = start.distanceTo(end);
        const geometry = new THREE.CylinderGeometry(2, 2, distance, 12);
        const material = new THREE.MeshStandardMaterial({ 
            color: seg.color, 
            roughness: 0.3,
            metalness: 0.2
        });
        
        const cylinder = new THREE.Mesh(geometry, material);
        const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        cylinder.position.copy(midpoint);
        cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());
        
        drillGroup.add(cylinder);
    });

    // Marqueurs têtes de puits
    collars.forEach(c => {
        const collarGeo = new THREE.SphereGeometry(3.5, 16, 16);
        const collarMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const collarMesh = new THREE.Mesh(collarGeo, collarMat);
        collarMesh.position.set(c.x, c.y, c.z);
        drillGroup.add(collarMesh);
    });

    mainGroup.add(drillGroup);

    // Ajustement dynamique de la caméra
    function adjustCameraToScene() {
        const box = new THREE.Box3().setFromObject(mainGroup);
        if (box.isEmpty()) return;

        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        controls.target.copy(center);
        projectCamera.position.set(center.x + maxDim * 0.8, center.y + maxDim * 0.8, center.z + maxDim * 1.5);
        projectCamera.lookAt(center);
        controls.update();
    }

    // Boucle d'animation
    function animateProject() {
        requestAnimationFrame(animateProject);
        controls.update();
        projectRenderer.render(projectScene, projectCamera);
    }
    animateProject();

    // Redimensionnement
    window.addEventListener('resize', () => {
        projectCamera.aspect = container.clientWidth / container.clientHeight;
        projectCamera.updateProjectionMatrix();
        projectRenderer.setSize(container.clientWidth, container.clientHeight);
    });
});
function createTextSprite(message, color = '#ffffff') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;

    ctx.font = 'Bold 32px Arial';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(message, 128, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(40, 20, 1);
    return sprite;
}

// Exemple d'utilisation sur les sondages :
collars.forEach(c => {
    const label = createTextSprite(c.id, '#00ffcc');
    label.position.set(c.x, c.y + 15, c.z);
    drillGroup.add(label);
});
