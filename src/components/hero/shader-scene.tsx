"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/**
 * Liquid metaballs: flowing lime blobs that merge like a lava-lamp / water,
 * one tethered to the cursor, with caustic shimmer + bright surface rims.
 */
const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2  uMouse;
  uniform float uAspect;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i + vec2(1.0,0.0)), c = hash(i + vec2(0.0,1.0)), d = hash(i + vec2(1.0,1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
  }

  void main(){
    vec2 uv = vUv;
    vec2 p = uv - 0.5;
    p.x *= uAspect;

    float t = uTime * 0.25;

    vec2 mouse = uMouse * 0.5;
    mouse.x *= uAspect;

    float field = 0.0;
    for (int i = 0; i < 6; i++){
      float fi = float(i);
      vec2 c;
      if (i == 0) {
        c = mouse;
      } else {
        c = vec2(sin(t * 0.6 + fi * 1.7) * (0.26 + 0.045 * fi),
                 cos(t * 0.5 + fi * 2.3) * 0.22);
      }
      float r = 0.10 + 0.03 * sin(t + fi);
      field += r / (length(p - c) + 0.001);
    }

    float caustic = noise(p * 6.0 + vec2(t, -t)) * noise(p * 3.0 - t * 0.5);

    float surf = smoothstep(1.6, 2.4, field);
    float rim  = smoothstep(1.4, 1.72, field) - smoothstep(1.72, 2.2, field);

    vec3 base  = vec3(0.031, 0.033, 0.038);
    vec3 deep  = vec3(0.11, 0.19, 0.02);
    vec3 lime  = vec3(0.796, 1.0, 0.235);
    vec3 spark = vec3(0.93, 1.0, 0.80);

    vec3 col = base;
    col = mix(col, deep, smoothstep(0.6, 1.6, field));
    col = mix(col, lime, surf * (0.55 + 0.45 * caustic));
    col += spark * rim * 0.6;
    col += lime * pow(caustic, 3.0) * surf * 0.5;

    float spec = pow(max(0.0, 1.0 - length(p - vec2(sin(t * 0.7) * 0.3, 0.2))), 6.0);
    col += spark * spec * surf * 0.4;

    float vig = smoothstep(1.2, 0.3, length(uv - 0.5));
    col *= 0.4 + 0.6 * vig;

    col += (hash(uv * vec2(1000.0)) - 0.5) * 0.015;

    gl_FragColor = vec4(col, 1.0);
  }
`;

function Plane() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const mouse = useRef(new THREE.Vector2(0, 0));
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uAspect: { value: size.width / size.height },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame((state, delta) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value += Math.min(delta, 0.05);
    matRef.current.uniforms.uAspect.value = state.size.width / state.size.height;
    mouse.current.lerp(new THREE.Vector2(state.pointer.x, state.pointer.y), 0.06);
    matRef.current.uniforms.uMouse.value.copy(mouse.current);
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={matRef} vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} />
    </mesh>
  );
}

export default function ShaderScene({ active = true }: { active?: boolean }) {
  return (
    <Canvas
      className="absolute! inset-0"
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 1] }}
    >
      <Plane />
    </Canvas>
  );
}
