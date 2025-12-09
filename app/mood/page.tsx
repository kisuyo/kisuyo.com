"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GUI } from "lil-gui";
import { perlinNoiseShader } from "./shaders"; // your GLSL shader string

export default function PerlinLightingWithGUI() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene and camera
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Shader uniforms
    const uniforms = {
      u_time: { value: 0 },
      u_resolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      u_scale: { value: 3.0 },
      u_gain: { value: 0.5 },
      u_octaves: { value: 3.0 }, // pass float, cast in GLSL
      u_warpStrength: { value: 2.0 },
      u_intensity: { value: 1.5 },
    };

    // Shader material
    const material = new THREE.ShaderMaterial({
      vertexShader: `
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: perlinNoiseShader,
      uniforms,
    });

    // Fullscreen quad
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    // Handle resize
    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // lil-gui controls
    const gui = new GUI();
    gui.add(uniforms.u_scale, "value", 1.0, 10.0).name("Scale");
    gui.add(uniforms.u_octaves, "value", 1.0, 8.0, 1).name("Octaves");
    gui.add(uniforms.u_gain, "value", 0.2, 0.9, 0.01).name("Gain");
    gui
      .add(uniforms.u_warpStrength, "value", 0.0, 10.0, 0.1)
      .name("Warp Strength");
    gui.add(uniforms.u_intensity, "value", 0.5, 3.0, 0.01).name("Intensity");

    // Animate
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      uniforms.u_time.value += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      gui.destroy();
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      material.dispose();
      mesh.geometry.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
