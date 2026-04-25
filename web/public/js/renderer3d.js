(function () {
    const THREE_MODULE_URL = 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
    const ORBIT_CONTROLS_URL = 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/controls/OrbitControls.js';

    let modulePromise = null;

    function loadThreeModules() {
        if (!modulePromise) {
            modulePromise = Promise.all([
                import(THREE_MODULE_URL),
                import(ORBIT_CONTROLS_URL)
            ]).then(([THREE, controlsModule]) => {
                return {
                    THREE,
                    OrbitControls: controlsModule.OrbitControls
                };
            });
        }

        return modulePromise;
    }

    function createStatusOverlay(container) {
        const node = document.createElement('div');
        node.style.position = 'absolute';
        node.style.inset = '0';
        node.style.display = 'none';
        node.style.alignItems = 'center';
        node.style.justifyContent = 'center';
        node.style.textAlign = 'center';
        node.style.padding = '12px';
        node.style.fontSize = '13px';
        node.style.color = '#d8e2f2';
        node.style.background = 'rgba(5, 10, 18, 0.64)';
        node.style.borderRadius = '8px';
        container.style.position = 'relative';
        container.appendChild(node);
        return node;
    }

    function colorFromState(THREE, state) {
        const paint = Number(state.paintId || 0);
        const wear = Number(state.wear || 0);
        const seed = Number(state.seed || 1);
        const hue = ((paint * 37 + seed * 11) % 360) / 360;
        const saturation = 0.62;
        const lightness = Math.max(0.22, 0.62 - wear * 0.3);
        return new THREE.Color().setHSL(hue, saturation, lightness);
    }

    function getModelDescriptor(weaponId) {
        return {
            weaponId: weaponId == null ? null : String(weaponId),
            modelUrl: null,
            isPlaceholder: true
        };
    }

    class SkinRenderer3D {
        constructor(container) {
            this.container = container;
            this.overlay = createStatusOverlay(container);
            this.state = null;

            this.THREE = null;
            this.OrbitControls = null;

            this.scene = null;
            this.camera = null;
            this.renderer = null;
            this.controls = null;
            this.weaponMesh = null;
            this.stickerMarkers = null;
            this.mountReady = false;

            this.animationFrame = null;
            this.onResize = this.onResize.bind(this);
            this.renderFrame = this.renderFrame.bind(this);
        }

        async mount(initialState) {
            this.state = window.renderer3dContract
                ? window.renderer3dContract.createEditorState(initialState)
                : initialState;

            if (!this.container || !window.WebGLRenderingContext) {
                this.setOverlayMessage('3D preview unavailable: WebGL is not supported on this device.');
                return false;
            }

            try {
                const modules = await loadThreeModules();
                this.THREE = modules.THREE;
                this.OrbitControls = modules.OrbitControls;
                this.bootstrapScene();
                this.applyState(this.state);
                this.setOverlayMessage('');
                this.startRenderLoop();
                return true;
            } catch (error) {
                console.error('Failed to initialize 3D preview', error);
                this.setOverlayMessage('3D preview unavailable: failed to load renderer modules.');
                return false;
            }
        }

        setOverlayMessage(message) {
            if (!this.overlay) {
                return;
            }

            if (!message) {
                this.overlay.style.display = 'none';
                this.overlay.textContent = '';
                return;
            }

            this.overlay.textContent = message;
            this.overlay.style.display = 'flex';
        }

        bootstrapScene() {
            if (this.mountReady) {
                return;
            }

            const THREE = this.THREE;
            const width = Math.max(this.container.clientWidth, 320);
            const height = Math.max(this.container.clientHeight, 220);

            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color('#07101a');

            this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
            this.camera.position.set(0, 0.55, 2.8);

            this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            this.renderer.setSize(width, height);
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
            this.renderer.domElement.style.width = '100%';
            this.renderer.domElement.style.height = '100%';
            this.container.innerHTML = '';
            this.container.appendChild(this.renderer.domElement);
            this.container.appendChild(this.overlay);

            const hemisphere = new THREE.HemisphereLight('#f0f5ff', '#34465f', 0.85);
            this.scene.add(hemisphere);

            const keyLight = new THREE.DirectionalLight('#ffffff', 1.1);
            keyLight.position.set(1.8, 2.2, 1.2);
            this.scene.add(keyLight);

            const fillLight = new THREE.DirectionalLight('#8ab4ff', 0.35);
            fillLight.position.set(-1.3, 0.8, -1.0);
            this.scene.add(fillLight);

            this.controls = new this.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.enablePan = false;
            this.controls.minDistance = 1.4;
            this.controls.maxDistance = 4.2;
            this.controls.target.set(0, 0.22, 0);

            this.createPlaceholderWeapon();
            this.stickerMarkers = new THREE.Group();
            this.scene.add(this.stickerMarkers);

            window.addEventListener('resize', this.onResize);
            this.mountReady = true;
        }

        createPlaceholderWeapon() {
            const THREE = this.THREE;
            const material = new THREE.MeshStandardMaterial({
                color: '#5485c9',
                metalness: 0.45,
                roughness: 0.38
            });

            const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.25, 0.35), material);
            const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.2, 16), material);
            barrel.rotation.z = Math.PI / 2;
            barrel.position.set(1.25, 0.02, 0);

            const stock = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.2, 0.35), material);
            stock.position.set(-1.05, -0.06, 0);

            const group = new THREE.Group();
            group.add(body);
            group.add(barrel);
            group.add(stock);
            group.rotation.set(0.12, -0.45, -0.03);

            this.scene.add(group);
            this.weaponMesh = group;
        }

        applyState(nextState) {
            this.state = window.renderer3dContract
                ? window.renderer3dContract.createEditorState(nextState)
                : nextState;

            if (!this.weaponMesh || !this.THREE) {
                return;
            }

            const descriptor = getModelDescriptor(this.state.weaponId);
            if (!descriptor.isPlaceholder) {
                // Placeholder: model loader adapter hook for future GLB implementation.
            }

            const color = colorFromState(this.THREE, this.state);
            this.weaponMesh.traverse((child) => {
                if (!child.isMesh || !child.material) {
                    return;
                }

                child.material.color = color.clone();
                child.material.roughness = Math.max(0.12, 0.6 - this.state.wear * 0.4);
                child.material.metalness = Math.min(0.85, 0.35 + (this.state.seed % 100) / 200);
                child.material.needsUpdate = true;
            });

            this.syncStickerMarkers();
        }

        syncStickerMarkers() {
            if (!this.stickerMarkers || !this.THREE) {
                return;
            }

            while (this.stickerMarkers.children.length) {
                const marker = this.stickerMarkers.children.pop();
                if (marker.geometry && typeof marker.geometry.dispose === 'function') {
                    marker.geometry.dispose();
                }
                if (marker.material && typeof marker.material.dispose === 'function') {
                    marker.material.dispose();
                }
            }

            const stickers = Array.isArray(this.state.stickers) ? this.state.stickers : [];
            stickers.forEach((sticker, index) => {
                const size = 0.03 + Math.min(0.08, (Number(sticker.scale || 1) * 0.04));
                const marker = new this.THREE.Mesh(
                    new this.THREE.SphereGeometry(size, 16, 16),
                    new this.THREE.MeshStandardMaterial({
                        color: new this.THREE.Color().setHSL((index * 0.19) % 1, 0.72, 0.55),
                        emissive: '#202936',
                        roughness: 0.35,
                        metalness: 0.2
                    })
                );

                const x = Number(sticker.position && sticker.position.x) || 0;
                const y = Number(sticker.position && sticker.position.y) || 0;
                marker.position.set(-0.45 + (x * 0.45), 0.06 + (y * 0.26), 0.24);
                this.stickerMarkers.add(marker);
            });
        }

        updateState(nextState) {
            this.applyState(nextState);
        }

        getState() {
            return this.state || {
                version: 1,
                weaponId: null,
                paintId: null,
                wear: 0.000001,
                seed: 1,
                stickers: []
            };
        }

        onResize() {
            if (!this.renderer || !this.camera || !this.container) {
                return;
            }

            const width = Math.max(this.container.clientWidth, 320);
            const height = Math.max(this.container.clientHeight, 220);
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        }

        renderFrame() {
            if (!this.renderer || !this.scene || !this.camera) {
                return;
            }

            if (this.weaponMesh) {
                this.weaponMesh.rotation.y += 0.003;
            }

            if (this.controls) {
                this.controls.update();
            }

            this.renderer.render(this.scene, this.camera);
            this.animationFrame = window.requestAnimationFrame(this.renderFrame);
        }

        startRenderLoop() {
            if (this.animationFrame != null) {
                return;
            }

            this.animationFrame = window.requestAnimationFrame(this.renderFrame);
        }

        stopRenderLoop() {
            if (this.animationFrame == null) {
                return;
            }

            window.cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        unmount() {
            this.stopRenderLoop();
            window.removeEventListener('resize', this.onResize);

            if (this.controls && typeof this.controls.dispose === 'function') {
                this.controls.dispose();
            }

            if (this.scene) {
                this.scene.traverse((node) => {
                    if (node.geometry && typeof node.geometry.dispose === 'function') {
                        node.geometry.dispose();
                    }

                    if (node.material) {
                        const materials = Array.isArray(node.material) ? node.material : [node.material];
                        materials.forEach((material) => {
                            if (material && typeof material.dispose === 'function') {
                                material.dispose();
                            }
                        });
                    }
                });
            }

            if (this.renderer) {
                this.renderer.dispose();
                this.renderer.forceContextLoss();
            }

            if (this.container) {
                this.container.innerHTML = '';
                this.container.appendChild(this.overlay);
            }

            this.scene = null;
            this.camera = null;
            this.renderer = null;
            this.controls = null;
            this.weaponMesh = null;
            this.stickerMarkers = null;
            this.mountReady = false;
        }
    }

    window.createSkinRenderer3D = function createSkinRenderer3D(options) {
        const container = options && options.container ? options.container : null;
        if (!container) {
            return null;
        }

        return new SkinRenderer3D(container);
    };
})();
