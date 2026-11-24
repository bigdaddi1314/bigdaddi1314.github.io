import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  createPurseBodyGroup,
  createPurseLidGroup,
  createPurseMaterials,
  disposeObject3D,
  getResolvedDimensions,
  getSilhouettePoint,
} from '../three/purseGeometry';
import type { PurseConfig } from '../types/store';

export type CameraPreset = 'hero' | 'front' | 'side' | 'top' | 'peek';

interface Purse3DViewportProps {
  config: PurseConfig;
  cameraPreset?: CameraPreset;
  presetNonce?: number;
  autoRotate?: boolean;
  enableZoom?: boolean;
  compact?: boolean;
  className?: string;
}

const _targetPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export const Purse3DViewport: React.FC<Purse3DViewportProps> = ({
  config,
  cameraPreset = 'hero',
  presetNonce = 0,
  autoRotate = true,
  enableZoom = true,
  compact = false,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const purseRootRef = useRef<THREE.Group | null>(null);
  const texturesRef = useRef<THREE.Texture[]>([]);
  const requestRenderRef = useRef<() => void>(() => {});
  const isSoftwareGlRef = useRef<boolean>(false);

  const transitionActiveRef = useRef(false);
  const desiredCamPosRef = useRef(new THREE.Vector3(68, 152, 268));
  const desiredTargetRef = useRef(new THREE.Vector3(0, 60, 0));
  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const isSoftwareGl = detectSoftwareWebGL();
    isSoftwareGlRef.current = isSoftwareGl;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglFailed(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(Math.max(1, mount.clientWidth), Math.max(1, mount.clientHeight));
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Mandatory studio environment reflection via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      compact ? 36 : 38,
      Math.max(1, mount.clientWidth) / Math.max(1, mount.clientHeight),
      1,
      2400
    );
    camera.position.set(compact ? 62 : 76, compact ? 142 : 158, compact ? 252 : 288);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 58, 0);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.enableZoom = enableZoom;
    controls.minDistance = 155;
    controls.maxDistance = 460;
    controls.maxPolarAngle = Math.PI * 0.56;
    controls.autoRotate = !isSoftwareGl && autoRotateRef.current;
    controls.autoRotateSpeed = compact ? 1.8 : 1.3;
    controlsRef.current = controls;

    // Balanced warm/cool studio 3-point lighting rig
    const hemi = new THREE.HemisphereLight(0xf8fafc, 0xcbd5e1, 0.9);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfffaf2, 1.05);
    key.position.set(170, 290, 230);
    key.castShadow = !isSoftwareGl;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.02;
    scene.add(key);

    const coolFill = new THREE.DirectionalLight(0xd8f1ff, 0.55);
    coolFill.position.set(-210, 140, 140);
    scene.add(coolFill);

    const tealRim = new THREE.DirectionalLight(0xb2f2f5, 0.55);
    tealRim.position.set(140, 180, -240);
    scene.add(tealRim);

    // Soft radial grounded contact shadow disc
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sg = shadowCanvas.getContext('2d')!;
    const rad = sg.createRadialGradient(128, 128, 12, 128, 128, 118);
    rad.addColorStop(0, 'rgba(11, 17, 23, 0.24)');
    rad.addColorStop(0.55, 'rgba(11, 17, 23, 0.09)');
    rad.addColorStop(1, 'rgba(248, 250, 252, 0)');
    sg.fillStyle = rad;
    sg.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    const shadowDisc = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), shadowMat);
    shadowDisc.rotation.x = -Math.PI / 2;
    shadowDisc.position.y = -0.5;
    scene.add(shadowDisc);

    const purseRoot = new THREE.Group();
    scene.add(purseRoot);
    purseRootRef.current = purseRoot;

    // Context lost/restored safety
    const handleContextLost = (e: Event) => {
      e.preventDefault();
    };
    const handleContextRestored = () => {
      requestRenderRef.current();
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    const handleControlStart = () => {
      transitionActiveRef.current = false;
    };
    controls.addEventListener('start', handleControlStart);

    // Frame pacing & on-demand rendering
    let frameId = 0;
    let disposed = false;
    let isVisible = true;
    let renderBusy = false;
    let renderDirty = false;
    const clock = new THREE.Clock();

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const requestRender = () => {
      if (disposed) return;
      if (!isSoftwareGl) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;
        if (transitionActiveRef.current) {
          camera.position.copy(desiredCamPosRef.current);
          controls.target.copy(desiredTargetRef.current);
          transitionActiveRef.current = false;
        }
        controls.update();
        renderer.render(scene, camera);
        const done = () => {
          renderBusy = false;
          if (renderDirty) requestRender();
        };
        afterDraw(done);
      });
    };
    requestRenderRef.current = requestRender;

    controls.addEventListener('change', () => {
      if (isSoftwareGl) requestRender();
    });

    const tick = () => {
      if (disposed) return;
      frameId = requestAnimationFrame(tick);
      if (!isVisible) return;

      const delta = Math.min(0.05, clock.getDelta());
      if (transitionActiveRef.current) {
        _targetPos.copy(desiredCamPosRef.current);
        _targetLook.copy(desiredTargetRef.current);
        const alpha = 1 - Math.exp(-7 * delta);
        camera.position.lerp(_targetPos, alpha);
        controls.target.lerp(_targetLook, alpha);
        if (
          camera.position.distanceTo(_targetPos) < 0.8 &&
          controls.target.distanceTo(_targetLook) < 0.8
        ) {
          transitionActiveRef.current = false;
        }
      }

      controls.autoRotate = autoRotateRef.current;
      controls.update();
      renderer.render(scene, camera);
    };

    const resizeObserver = new ResizeObserver(() => {
      if (!mount.clientWidth || !mount.clientHeight || disposed) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      if (isSoftwareGl) requestRender();
    });
    resizeObserver.observe(mount);

    let intersectionObserver: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      intersectionObserver = new IntersectionObserver((entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      });
      intersectionObserver.observe(mount);
    }

    if (isSoftwareGl) {
      requestRender();
    } else {
      renderer.compile(scene, camera);
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      intersectionObserver?.disconnect();
      controls.removeEventListener('start', handleControlStart);
      controls.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      if (purseRootRef.current) disposeObject3D(purseRootRef.current);
      texturesRef.current.forEach((t) => t.dispose());
      texturesRef.current = [];
      shadowTex.dispose();
      shadowMat.dispose();
      shadowDisc.geometry.dispose();
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [compact, enableZoom]);

  // Rebuild purse mesh cleanly whenever config updates
  useEffect(() => {
    const purseRoot = purseRootRef.current;
    const renderer = rendererRef.current;
    if (!purseRoot || !renderer) return;

    disposeObject3D(purseRoot);
    texturesRef.current.forEach((t) => t.dispose());
    texturesRef.current = [];

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const materials = createPurseMaterials(config, maxAniso);
    texturesRef.current = materials.textures;

    const body = createPurseBodyGroup(config, materials, maxAniso);
    const lid = createPurseLidGroup(config, materials);

    const dims = getResolvedDimensions(config);
    const backPt = getSilhouettePoint(0.75, config.shape, dims.width, dims.depth);
    const hingeZ = backPt.z - 4.2;

    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, dims.height, hingeZ);
    lid.position.set(0, 0, -hingeZ);
    lidPivot.rotation.x = -(config.lidAngle * Math.PI) / 180;
    lidPivot.add(lid);

    purseRoot.add(body, lidPivot);
    requestRenderRef.current();
  }, [config]);

  // Smooth camera preset transitions
  useEffect(() => {
    if (!presetNonce) return;
    if (cameraPreset === 'front') {
      desiredCamPosRef.current.set(0, 118, 290);
      desiredTargetRef.current.set(0, 60, 0);
    } else if (cameraPreset === 'side') {
      desiredCamPosRef.current.set(285, 118, 28);
      desiredTargetRef.current.set(0, 60, 0);
    } else if (cameraPreset === 'top') {
      desiredCamPosRef.current.set(0, 315, 72);
      desiredTargetRef.current.set(0, 58, 0);
    } else if (cameraPreset === 'peek') {
      desiredCamPosRef.current.set(38, 230, 210);
      desiredTargetRef.current.set(0, 74, 0);
    } else {
      desiredCamPosRef.current.set(76, 158, 288);
      desiredTargetRef.current.set(0, 58, 0);
    }
    transitionActiveRef.current = true;
    requestRenderRef.current();
  }, [cameraPreset, presetNonce]);

  if (webglFailed) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-8 text-center bg-[#EEF3F7] ${className}`}
      >
        <div
          className="w-24 h-24 rounded-full mb-4 shadow-inner border border-white"
          style={{
            background: `linear-gradient(135deg, ${config.primaryHex}, ${config.secondaryHex})`,
          }}
        />
        <div className="font-serif text-xl font-semibold text-[#0B1117]">
          Interactive 3D Preview Ready
        </div>
        <p className="text-xs text-[#475569] mt-1 max-w-xs">
          Your color selections ({config.primaryHex} / {config.secondaryHex}) are live and ready to add to bag.
        </p>
      </div>
    );
  }

  return <div ref={mountRef} className={`three-stage-mount w-full h-full ${className}`} />;
};
