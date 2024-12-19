import*as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {GUI} from 'three/addons/libs/lil-gui.module.min.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'
import {PostProcessing} from "./post-processing.js"

export function Renderer(config) {
    //This is all the basic boilerplate to
    // set up a 3d scene, enable a shadow casting directional light...
    // A bit of an ambient light...

    const z = 15;
    const aspect = window.innerWidth / window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        precision: 'highp',
        toneMapping:THREE.ACESFilmicToneMapping
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    renderer.setPixelRatio(window.devicePixelRatio); 
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.body.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(config.fov || 55,aspect,0.1,1000);

    if(config.cameraPosition)
        camera.position.set(...config.cameraPosition)
    else camera.position.set(0, 10, .5);

    // 'rgb(245,212,55)'
    let directionalLight = new THREE.DirectionalLight('rgb(255,255,255)',1,5);
    scene.add(directionalLight);
    directionalLight.shadow.camera.left *= 5;
    directionalLight.shadow.camera.right *= 5;
    directionalLight.shadow.camera.top *= 5;
    directionalLight.shadow.camera.bottom *= 5;
    directionalLight.shadow.camera.updateProjectionMatrix();
    directionalLight.shadow.bias = -.001;

    directionalLight.castShadow = true;
    directionalLight.position.set(1.5, 5, 1.5);

    // Усиливаем тень
    /* const shadowMaterial = new THREE.ShadowMaterial({ opacity: 1 }); // Сделать тени темнее
    shadowMaterial.depthTest = true;

    const shadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        shadowMaterial
    );
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane); */
    //
    // Установить поворот на 90 градусов вокруг оси Y
    /* const quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
    shadowPlane.quaternion.multiplyQuaternions(quaternion, shadowPlane.quaternion); */
    // 

    let ambientLight = new THREE.AmbientLight('white',1.5);
    scene.add(ambientLight);

    let controls = new OrbitControls(camera,renderer.domElement);
    //controls.target.set(5,5,5); 
    
    if(config.cameraLookAt)
        controls.target.set(...config.cameraLookAt)
    else controls.target.set(0, 0,0);


    controls.enableDamping = true;
    let events = {
    }

    let postProcessing = new PostProcessing(renderer,scene,camera,config)

    let handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
        postProcessing.setSize(window.innerWidth, window.innerHeight)
    }
    handleResize();
    window.addEventListener('resize', handleResize, false)

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let clock = new THREE.Clock();

    renderer.setAnimationLoop( () => {
        raycaster.setFromCamera(pointer, camera);
        let dt = clock.getDelta();
        events.frame && events.frame(dt);
        controls.update(camera);
        //renderer.render(scene, camera);
        postProcessing.render(scene,camera);
    }
    );

    scene.background = new THREE.Color('#eee')
    const gui = new GUI();
    let glbLoader = new GLTFLoader();

    function onPointerMove(event) {

        // calculate pointer position in normalized device coordinates
        // (-1 to +1) for both components

        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

    }
    let pixelPoint = new THREE.Vector2();

    function raycastObjectAtPixel(object, x, y) {
        pixelPoint.x = (x / window.innerWidth) * 2 - 1;
        pixelPoint.y = -(y / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(pixelPoint, camera);
        return raycaster.intersectObject(object);
    }

    window.addEventListener('pointermove', onPointerMove);

    let raycasting = {
        raycaster,
        pointer,
        raycastObjectAtPixel
    }


this.loadEnvironment= async ()=>{
    var pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    var textureLoader = new THREE.TextureLoader();
    let txname = config.environmentUrl;
    let texture = await textureLoader.loadAsync(txname)
    texture.colorSpace = THREE.SRGBColorSpace;
    var equirect = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = equirect;
    scene.background = equirect;
    scene.backgroundRotation =
    scene.environmentRotation = config.environmentRotation || new THREE.Euler(...config.environmentRotation);
    pmremGenerator.dispose();
}
this.loadEnvironment()
    
controls.update();
controls.enabled=config.freeCamera || false;

    Object.assign(this, {
        THREE,
        scene,
        camera,
        renderer,
        controls,
        ambientLight,
        directionalLight,
        events,
        gui,
        glbLoader,
        raycasting,
        postProcessing,
    })

}
