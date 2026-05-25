"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

export type GlobePoint = {
  id: string | number;
  lat: number;
  lng: number;
  severity: "low" | "moderate" | "elevated" | "high" | "critical" | string;
  label: string;
  href?: string;
};

type Props = {
  points: GlobePoint[];
  onHover?: (point: GlobePoint | null) => void;
  onClick?: (point: GlobePoint) => void;
};

const SEVERITY_COLOR: Record<string, string> = {
  low: "#7df0c2",
  moderate: "#a8e6ff",
  elevated: "#f6c177",
  high: "#ff8a5b",
  critical: "#ff6b81",
};

function latLngToVec3(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export default function Globe({ points, onHover, onClick }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState<GlobePoint | null>(null);

  // Stable points reference; only re-instantiate scene markers when points change identity.
  const pointsKey = useMemo(
    () => points.map((p) => `${p.id}:${p.lat}:${p.lng}:${p.severity}`).join("|"),
    [points],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 6.4);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Ambient + directional lighting for that "lit object" feel.
    scene.add(new THREE.AmbientLight(0x6a7da8, 0.55));
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(5, 3, 4);
    scene.add(dir);
    const rim = new THREE.DirectionalLight(0x7df0c2, 0.45);
    rim.position.set(-4, -1, -2);
    scene.add(rim);

    const root = new THREE.Group();
    scene.add(root);

    // Earth sphere — dark navy with subtle fresnel rim.
    const earthGeometry = new THREE.SphereGeometry(1.6, 96, 96);
    const earthMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uBase: { value: new THREE.Color(0x0a1430) },
        uHigh: { value: new THREE.Color(0x122a55) },
        uRim: { value: new THREE.Color(0x7df0c2) },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewDir = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        uniform vec3 uBase;
        uniform vec3 uHigh;
        uniform vec3 uRim;
        void main() {
          float lambert = max(dot(vNormal, normalize(vec3(0.6, 0.4, 0.7))), 0.0);
          float fres = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 2.5);
          vec3 base = mix(uBase, uHigh, lambert * 0.85);
          vec3 col = base + uRim * fres * 0.55;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    root.add(earth);

    // Atmosphere glow (back-faced sphere).
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.85, 64, 64),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        uniforms: { uColor: { value: new THREE.Color(0x7ab8ff) } },
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          uniform vec3 uColor;
          void main() {
            float intensity = pow(0.75 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.4);
            gl_FragColor = vec4(uColor, intensity * 0.85);
          }
        `,
      }),
    );
    root.add(atmosphere);

    // Latitude / longitude wireframe.
    const wireframe = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.SphereGeometry(1.605, 36, 24)),
      new THREE.LineBasicMaterial({
        color: 0x7ab8ff,
        transparent: true,
        opacity: 0.07,
      }),
    );
    root.add(wireframe);

    // Starfield background.
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1400;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 18 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({
        size: 0.025,
        color: 0xc6d3ff,
        transparent: true,
        opacity: 0.55,
        sizeAttenuation: true,
      }),
    );
    scene.add(stars);

    // Signal markers + halos.
    const markerGroup = new THREE.Group();
    root.add(markerGroup);

    const markerData: {
      mesh: THREE.Mesh;
      halo: THREE.Mesh;
      point: GlobePoint;
      basePos: THREE.Vector3;
    }[] = [];

    for (const p of points) {
      const color = new THREE.Color(SEVERITY_COLOR[p.severity] ?? SEVERITY_COLOR.low);
      const pos = latLngToVec3(p.lat, p.lng, 1.62);

      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 12, 12),
        new THREE.MeshBasicMaterial({ color }),
      );
      marker.position.copy(pos);
      markerGroup.add(marker);

      const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.028, 0.034, 32),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      halo.position.copy(pos);
      halo.lookAt(0, 0, 0);
      markerGroup.add(halo);

      markerData.push({ mesh: marker, halo, point: p, basePos: pos.clone() });
    }

    // Subtle orbital arcs (decorative).
    const arcGroup = new THREE.Group();
    root.add(arcGroup);
    for (let i = 0; i < 3; i++) {
      const arc = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(
          (() => {
            const pts: THREE.Vector3[] = [];
            const segments = 128;
            const tilt = (i - 1) * 0.5;
            for (let s = 0; s <= segments; s++) {
              const t = (s / segments) * Math.PI * 2;
              const r = 2.05 + i * 0.05;
              pts.push(new THREE.Vector3(r * Math.cos(t), r * Math.sin(t) * Math.sin(tilt), r * Math.sin(t) * Math.cos(tilt)));
            }
            return pts;
          })(),
        ),
        new THREE.LineBasicMaterial({
          color: 0x7ab8ff,
          transparent: true,
          opacity: 0.18,
        }),
      );
      arcGroup.add(arc);
    }

    // Pointer interaction (hover detection on markers).
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 0.05 };
    const pointer = new THREE.Vector2(-2, -2);
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let velX = 0;
    let velY = 0;
    let lastHovered: GlobePoint | null = null;

    function onPointerMove(ev: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      if (dragging) {
        const dx = ev.clientX - lastX;
        const dy = ev.clientY - lastY;
        velX = dx * 0.005;
        velY = dy * 0.003;
        root.rotation.y += velX;
        root.rotation.x = Math.max(-0.7, Math.min(0.7, root.rotation.x + velY));
        lastX = ev.clientX;
        lastY = ev.clientY;
      }
    }
    let downX = 0, downY = 0, downT = 0;
    function onPointerDown(ev: PointerEvent) {
      dragging = true;
      lastX = ev.clientX;
      lastY = ev.clientY;
      downX = ev.clientX; downY = ev.clientY; downT = performance.now();
      (ev.target as Element).setPointerCapture?.(ev.pointerId);
    }
    function onPointerUp(ev: PointerEvent) {
      dragging = false;
      (ev.target as Element).releasePointerCapture?.(ev.pointerId);
      const dx = Math.abs(ev.clientX - downX);
      const dy = Math.abs(ev.clientY - downY);
      const dt = performance.now() - downT;
      if (dx < 6 && dy < 6 && dt < 400 && lastHovered && onClick) {
        onClick(lastHovered);
      }
    }

    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);

    function handleResize() {
      const w = container!.clientWidth;
      const h = container!.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    let frame = 0;
    const clock = new THREE.Clock();

    function animate() {
      frame = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const tNow = clock.elapsedTime;

      if (!dragging) {
        root.rotation.y += dt * 0.06 + velX * 0.92 * dt;
        velX *= 0.92;
        velY *= 0.92;
      }

      // Marker halo pulsing scaled by severity intensity.
      for (const m of markerData) {
        const baseScale = 1 + Math.sin(tNow * 1.6 + (m.point.id as number || 0)) * 0.25;
        m.halo.scale.setScalar(baseScale);
        (m.halo.material as THREE.MeshBasicMaterial).opacity = 0.35 + 0.25 * Math.sin(tNow * 1.6 + Number(m.point.id || 0));
      }

      // Hover detection.
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(markerData.map((m) => m.mesh));
      const hit = hits[0];
      const matchedPoint = hit
        ? markerData.find((m) => m.mesh === hit.object)?.point ?? null
        : null;
      if (matchedPoint !== lastHovered) {
        lastHovered = matchedPoint;
        setHovered(matchedPoint);
        onHover?.(matchedPoint);
        renderer.domElement.style.cursor = matchedPoint ? "pointer" : dragging ? "grabbing" : "grab";
      }

      stars.rotation.y += dt * 0.005;
      arcGroup.rotation.y -= dt * 0.04;
      arcGroup.rotation.x = 0.15 + Math.sin(tNow * 0.15) * 0.04;

      renderer.render(scene, camera);
    }
    renderer.domElement.style.cursor = "grab";
    animate();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      renderer.dispose();
      earthGeometry.dispose();
      earthMaterial.dispose();
      markerData.forEach((m) => {
        m.mesh.geometry.dispose();
        (m.mesh.material as THREE.Material).dispose();
        m.halo.geometry.dispose();
        (m.halo.material as THREE.Material).dispose();
      });
      starGeometry.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointsKey]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 480,
      }}
      aria-label="Interactive 3D globe of live monitoring signals"
    >
      {hovered ? (
        <div
          style={{
            position: "absolute",
            bottom: 18,
            left: 18,
            maxWidth: 320,
            padding: "12px 14px",
            background: "rgba(8, 12, 24, 0.78)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 12,
            backdropFilter: "blur(10px)",
            pointerEvents: "none",
            fontSize: 13,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: SEVERITY_COLOR[hovered.severity] ?? SEVERITY_COLOR.low,
              marginBottom: 4,
            }}
          >
            {hovered.severity}
          </div>
          <div style={{ lineHeight: 1.35, color: "var(--ink-0)" }}>{hovered.label}</div>
        </div>
      ) : null}
    </div>
  );
}
