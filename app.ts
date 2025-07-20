import * as TWEEN from "@tweenjs/tween.js";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

class ThreeJSContainer {
    private scene: THREE.Scene;
    private light: THREE.Light;
    private clouds: THREE.Points[] = [];

    constructor() { }

    // 画面部分の作成(表示する枠ごとに)*
    public createRendererDOM = (width: number, height: number, cameraPos: THREE.Vector3) => {
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(width, height);
        renderer.setClearColor(new THREE.Color(0x000000));
        renderer.shadowMap.enabled = true;//シャドウマップを有効にする

        //カメラの設定
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.copy(cameraPos);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        const orbitControls = new OrbitControls(camera, renderer.domElement);


        // シーンの作成(全体で1回)
        this.createScene();
        // 毎フレームのupdateを呼んで，render
        // reqestAnimationFrame により次フレームを呼ぶ
        const render: FrameRequestCallback = () => {
            orbitControls.update();
            renderer.render(this.scene, camera);
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);

        renderer.domElement.style.cssFloat = "left";
        renderer.domElement.style.margin = "10px";
        return renderer.domElement;
    };

    private createScene = () => {
        this.scene = new THREE.Scene();

        //ライトの設定
        this.light = new THREE.DirectionalLight(0xffffff);
        const lvec = new THREE.Vector3(1, 1, 1).normalize();
        this.light.position.set(lvec.x, lvec.y, lvec.z);
        this.scene.add(this.light);

        //花火の発射位置
        const launchHeight = 9;
        const colors = [0xff0000, 0x00ffff, 0xffff00, 0xff00ff];
        const positions = [
            new THREE.Vector3(-10, 0, 0),
            new THREE.Vector3(-5, 0, 5),
            new THREE.Vector3(0, 0, -5),
            new THREE.Vector3(5, 0, 2),
            new THREE.Vector3(10, 0, -3),
        ];

        // 各位置に色違い花火を同時発射
        positions.forEach(pos => {
            colors.forEach(color => {
                this.createParticles(pos, launchHeight, color);
            });
        });

        // 毎フレームのupdateを呼んで，更新
        // reqestAnimationFrame により次フレームを呼ぶ
        const update: FrameRequestCallback = () => {
            TWEEN.update();
            requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
    };

    private createParticles = (origin: THREE.Vector3, launchHeight: number, color: number) => {
        const particleNum = 1000;
        const r = 3;

        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleNum * 3);

        const material = new THREE.PointsMaterial({
            color,
            size: 0.1,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });

        const cloud = new THREE.Points(geometry, material);
        this.scene.add(cloud);
        this.clouds.push(cloud);

        for (let i = 0; i < particleNum; ++i) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.cos(phi);
            const z = r * Math.sin(phi) * Math.sin(theta);

            positions[i * 3 + 0] = origin.x;
            positions[i * 3 + 1] = origin.y;
            positions[i * 3 + 2] = origin.z;

            const tweeninfo = {
                x: origin.x,
                y: origin.y,
                z: origin.z,
                index: i,
                targetX: origin.x + x,
                targetY: origin.y + y + launchHeight,
                targetZ: origin.z + z,
                opacity: 1,
            };

            // 毎フレームのupdateを呼んで，更新
            // reqestAnimationFrame により次フレームを呼ぶ
            const updateExplosion = () => {
                const geometry = cloud.geometry as THREE.BufferGeometry;
                const positions = geometry.getAttribute("position");
                positions.setXYZ(tweeninfo.index, tweeninfo.x, tweeninfo.y, tweeninfo.z);
                positions.needsUpdate = true;
                (cloud.material as THREE.PointsMaterial).opacity = tweeninfo.opacity;
            };

            const launchTween = new TWEEN.Tween(tweeninfo)
                .to({ y: origin.y + launchHeight }, 1000)
                .easing(TWEEN.Easing.Circular.Out);

            const explodeTween = new TWEEN.Tween(tweeninfo)
                .to({ x: tweeninfo.targetX, y: tweeninfo.targetY, z: tweeninfo.targetZ }, 1000)
                .easing(TWEEN.Easing.Quartic.Out);

            const fadeTween = new TWEEN.Tween(tweeninfo)
                .to({ opacity: 0 }, 1500)
                .easing(TWEEN.Easing.Back.Out);

            launchTween.onUpdate(updateExplosion);
            explodeTween.onUpdate(updateExplosion);
            fadeTween.onUpdate(updateExplosion);

            fadeTween.onComplete(() => {
                tweeninfo.x = origin.x;
                tweeninfo.y = origin.y;
                tweeninfo.z = origin.z;
                tweeninfo.opacity = 1;
            });

            launchTween.chain(explodeTween);
            explodeTween.chain(fadeTween);
            fadeTween.chain(launchTween);

            launchTween.start();
        }

        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    }
}

window.addEventListener("DOMContentLoaded", init);

function init() {
    const container = new ThreeJSContainer();
    const viewport = container.createRendererDOM(640, 480, new THREE.Vector3(0, 10, 25));
    document.body.appendChild(viewport);
}
