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

const EARTH_TEXTURE_URL = "https://cdn.jsdelivr.net/npm/three-globe@2.31.0/example/img/earth-blue-marble.jpg";
const EARTH_BUMP_URL = "https://cdn.jsdelivr.net/npm/three-globe@2.31.0/example/img/earth-topology.png";
const COUNTRIES_TOPO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Approximate centroids for continent labels.
const CONTINENT_LABELS: Array<{ name: string; lat: number; lng: number; size?: number }> = [
  { name: "NORTH AMERICA", lat: 48, lng: -100, size: 42 },
  { name: "SOUTH AMERICA", lat: -15, lng: -60, size: 38 },
  { name: "EUROPE",        lat: 54, lng: 15,   size: 32 },
  { name: "AFRICA",        lat: 4,  lng: 22,   size: 40 },
  { name: "ASIA",          lat: 42, lng: 92,   size: 44 },
  { name: "OCEANIA",       lat: -25, lng: 137, size: 32 },
  { name: "ANTARCTICA",    lat: -78, lng: 0,   size: 28 },
];

// Major countries for the labelled overlay.
const COUNTRY_LABELS: Array<{ name: string; lat: number; lng: number }> = [
  { name: "USA",       lat: 39,  lng: -98 },
  { name: "CANADA",    lat: 56,  lng: -96 },
  { name: "MEXICO",    lat: 23,  lng: -102 },
  { name: "BRAZIL",    lat: -10, lng: -55 },
  { name: "ARGENTINA", lat: -34, lng: -64 },
  { name: "UK",        lat: 54,  lng: -3 },
  { name: "FRANCE",    lat: 46,  lng: 2 },
  { name: "GERMANY",   lat: 51,  lng: 10 },
  { name: "SPAIN",     lat: 40,  lng: -4 },
  { name: "ITALY",     lat: 43,  lng: 12 },
  { name: "POLAND",    lat: 52,  lng: 19 },
  { name: "TURKEY",    lat: 39,  lng: 35 },
  { name: "RUSSIA",    lat: 61,  lng: 100 },
  { name: "UKRAINE",   lat: 49,  lng: 32 },
  { name: "EGYPT",     lat: 27,  lng: 30 },
  { name: "NIGERIA",   lat: 10,  lng: 8 },
  { name: "KENYA",     lat: -1,  lng: 38 },
  { name: "S. AFRICA", lat: -29, lng: 24 },
  { name: "SAUDI ARABIA", lat: 24, lng: 45 },
  { name: "IRAN",      lat: 32,  lng: 53 },
  { name: "IRAQ",      lat: 33,  lng: 44 },
  { name: "ISRAEL",    lat: 31,  lng: 35 },
  { name: "INDIA",     lat: 22,  lng: 79 },
  { name: "PAKISTAN",  lat: 30,  lng: 70 },
  { name: "CHINA",     lat: 35,  lng: 104 },
  { name: "JAPAN",     lat: 36,  lng: 138 },
  { name: "S. KOREA",  lat: 37,  lng: 128 },
  { name: "N. KOREA",  lat: 40,  lng: 127 },
  { name: "TAIWAN",    lat: 24,  lng: 121 },
  { name: "VIETNAM",   lat: 14,  lng: 108 },
  { name: "THAILAND",  lat: 15,  lng: 101 },
  { name: "INDONESIA", lat: -2,  lng: 118 },
  { name: "PHILIPPINES", lat: 13, lng: 122 },
  { name: "AUSTRALIA", lat: -26, lng: 133 },
];

function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Render a text label as an HTML5 canvas, then wrap it in a Three.js sprite.
function makeTextSprite(text: string, opts: { size?: number; color?: string; weight?: number; outline?: string } = {}): THREE.Sprite {
  const size = opts.size ?? 32;
  const color = opts.color ?? "rgba(255,255,255,0.92)";
  const weight = opts.weight ?? 600;
  const outline = opts.outline ?? "rgba(0,0,0,0.85)";
  const padding = 8;
  const fontFamily = "Inter, system-ui, sans-serif";
  // Measure
  const measureCanvas = document.createElement("canvas");
  const mctx = measureCanvas.getContext("2d");
  if (!mctx) throw new Error("no canvas ctx");
  mctx.font = `${weight} ${size}px ${fontFamily}`;
  const metrics = mctx.measureText(text);
  const w = Math.ceil(metrics.width) + padding * 2;
  const h = size + padding * 2;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas ctx");
  ctx.font = `${weight} ${size}px ${fontFamily}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.lineWidth = Math.max(3, size * 0.12);
  ctx.strokeStyle = outline;
  ctx.fillStyle = color;
  ctx.strokeText(text, padding, h / 2);
  ctx.fillText(text, padding, h / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 4;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  // Scale so the text retains a stable readable size in scene units.
  const aspect = w / h;
  const baseScale = (size / 32) * 0.32;
  sprite.scale.set(baseScale * aspect, baseScale, 1);
  return sprite;
}

// Project TopoJSON country arcs onto a sphere as LineSegments.
type Topo = { type: "Topology"; arcs: number[][][]; transform?: { scale: [number, number]; translate: [number, number] }; objects: Record<string, unknown> };

function buildCountryBordersGeometry(topo: Topo, radius: number): THREE.BufferGeometry | null {
  const obj = topo.objects?.countries as { type?: string; geometries?: Array<{ type?: string; arcs?: number[] | number[][] | number[][][] }> } | undefined;
  if (!obj?.geometries) return null;
  const transform = topo.transform;
  const decode = (i: number): [number, number][] => {
    const arc = topo.arcs[i < 0 ? ~i : i];
    if (!arc) return [];
    let x = 0, y = 0;
    const pts: [number, number][] = [];
    for (const [dx, dy] of arc) {
      x += dx; y += dy;
      const lng = transform ? (x * transform.scale[0]) + transform.translate[0] : x;
      const lat = transform ? (y * transform.scale[1]) + transform.translate[1] : y;
      pts.push([lng, lat]);
    }
    return i < 0 ? pts.reverse() : pts;
  };

  const allSegments: number[] = [];
  const pushRing = (arcsForRing: number[]) => {
    const points: [number, number][] = [];
    for (const ai of arcsForRing) {
      const seg = decode(ai);
      // Drop the first point of subsequent arcs to avoid duplicates.
      const start = points.length === 0 ? 0 : 1;
      for (let i = start; i < seg.length; i++) points.push(seg[i]);
    }
    // Convert ring to line segments.
    for (let i = 0; i < points.length - 1; i++) {
      const a = latLngToVec3(points[i][1], points[i][0], radius);
      const b = latLngToVec3(points[i + 1][1], points[i + 1][0], radius);
      allSegments.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  };

  for (const g of obj.geometries) {
    if (!g.arcs) continue;
    if (g.type === "Polygon") {
      for (const ring of g.arcs as number[][]) pushRing(ring);
    } else if (g.type === "MultiPolygon") {
      for (const poly of g.arcs as number[][][]) {
        for (const ring of poly) pushRing(ring);
      }
    }
  }
  if (allSegments.length === 0) return null;
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(allSegments, 3));
  return geom;
}

export default function Globe({ points, onHover, onClick }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState<GlobePoint | null>(null);
  const [showCountryLabels, setShowCountryLabels] = useState(false);
  const [showBorders, setShowBorders] = useState(true);

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

    // Lighting tuned for textured Earth: directional sun + soft ambient + cool rim.
    scene.add(new THREE.AmbientLight(0x8090b0, 0.45));
    const sun = new THREE.DirectionalLight(0xfff4d6, 1.35);
    sun.position.set(5, 3, 4);
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0x7ab8ff, 0.55);
    rim.position.set(-4, -1, -2);
    scene.add(rim);

    const root = new THREE.Group();
    scene.add(root);

    const RADIUS = 1.6;

    // Earth sphere — start with shader fallback, swap to textured material once loaded.
    const earthGeometry = new THREE.SphereGeometry(RADIUS, 96, 96);
    const fallbackMaterial = new THREE.ShaderMaterial({
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
    const earth = new THREE.Mesh<THREE.SphereGeometry, THREE.Material>(earthGeometry, fallbackMaterial);
    root.add(earth);

    // Async swap to textured Earth surface once jpg loads.
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";
    let texturedMaterial: THREE.MeshStandardMaterial | null = null;
    loader.load(EARTH_TEXTURE_URL, (mapTex) => {
      mapTex.colorSpace = THREE.SRGBColorSpace;
      mapTex.anisotropy = 4;
      texturedMaterial = new THREE.MeshStandardMaterial({
        map: mapTex,
        roughness: 0.85,
        metalness: 0.05,
      });
      earth.material = texturedMaterial;
      // Optional: load bump map for terrain
      loader.load(EARTH_BUMP_URL, (bumpTex) => {
        if (texturedMaterial) {
          texturedMaterial.bumpMap = bumpTex;
          texturedMaterial.bumpScale = 0.012;
          texturedMaterial.needsUpdate = true;
        }
      }, undefined, () => undefined);
    }, undefined, () => undefined); // failure → keep fallback

    // Country borders overlay (loaded async).
    const borderGroup = new THREE.Group();
    borderGroup.visible = showBorders;
    root.add(borderGroup);
    fetch(COUNTRIES_TOPO_URL)
      .then((r) => r.ok ? r.json() : null)
      .then((topo: Topo | null) => {
        if (!topo) return;
        const geom = buildCountryBordersGeometry(topo, RADIUS * 1.002);
        if (!geom) return;
        const lines = new THREE.LineSegments(
          geom,
          new THREE.LineBasicMaterial({ color: 0xf5f7ff, transparent: true, opacity: 0.32, depthWrite: false }),
        );
        borderGroup.add(lines);
      })
      .catch(() => undefined);

    // Continent labels.
    const continentLabelGroup = new THREE.Group();
    root.add(continentLabelGroup);
    for (const c of CONTINENT_LABELS) {
      try {
        const sprite = makeTextSprite(c.name, { size: c.size ?? 36, color: "rgba(255,255,255,0.96)", weight: 700, outline: "rgba(2,4,10,0.95)" });
        const pos = latLngToVec3(c.lat, c.lng, RADIUS * 1.05);
        sprite.position.copy(pos);
        continentLabelGroup.add(sprite);
      } catch {}
    }

    // Country labels (toggleable).
    const countryLabelGroup = new THREE.Group();
    countryLabelGroup.visible = showCountryLabels;
    root.add(countryLabelGroup);
    for (const c of COUNTRY_LABELS) {
      try {
        const sprite = makeTextSprite(c.name, { size: 20, color: "rgba(180,220,255,0.95)", weight: 500, outline: "rgba(2,4,10,0.90)" });
        const pos = latLngToVec3(c.lat, c.lng, RADIUS * 1.035);
        sprite.position.copy(pos);
        countryLabelGroup.add(sprite);
      } catch {}
    }

    // Atmosphere glow (back-faced sphere).
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS * 1.16, 64, 64),
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
      const pos = latLngToVec3(p.lat, p.lng, RADIUS * 1.012);

      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.016, 12, 12),
        new THREE.MeshBasicMaterial({ color }),
      );
      marker.position.copy(pos);
      markerGroup.add(marker);

      const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.025, 0.031, 32),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.55,
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

      // Fade out labels on the back hemisphere.
      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir).negate();
      const fadeLabel = (sprite: THREE.Object3D) => {
        const worldPos = new THREE.Vector3();
        sprite.getWorldPosition(worldPos);
        const normal = worldPos.clone().normalize();
        const dot = normal.dot(camDir);
        const sm = sprite as THREE.Sprite;
        const mat = sm.material as THREE.SpriteMaterial;
        mat.opacity = Math.max(0, Math.min(1, (dot - 0.1) * 1.6));
      };
      continentLabelGroup.children.forEach(fadeLabel);
      if (countryLabelGroup.visible) countryLabelGroup.children.forEach(fadeLabel);

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

    // Expose toggle setters so React state changes can affect the live scene.
    (renderer.domElement.dataset as Record<string, string>).inited = "1";
    const handleTogglesChange = () => {
      borderGroup.visible = showBorders;
      countryLabelGroup.visible = showCountryLabels;
    };
    handleTogglesChange();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      renderer.dispose();
      earthGeometry.dispose();
      fallbackMaterial.dispose();
      texturedMaterial?.dispose();
      markerData.forEach((m) => {
        m.mesh.geometry.dispose();
        (m.mesh.material as THREE.Material).dispose();
        m.halo.geometry.dispose();
        (m.halo.material as THREE.Material).dispose();
      });
      starGeometry.dispose();
      continentLabelGroup.children.forEach((s) => {
        const sm = s as THREE.Sprite;
        sm.material.map?.dispose();
        sm.material.dispose();
      });
      countryLabelGroup.children.forEach((s) => {
        const sm = s as THREE.Sprite;
        sm.material.map?.dispose();
        sm.material.dispose();
      });
      borderGroup.children.forEach((l) => {
        const ls = l as THREE.LineSegments;
        ls.geometry.dispose();
        (ls.material as THREE.Material).dispose();
      });
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointsKey, showCountryLabels, showBorders]);

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
      {/* Layer toggles */}
      <div style={{
        position: "absolute", top: 12, right: 12, zIndex: 4,
        display: "flex", gap: 6,
      }}>
        <button
          onClick={() => setShowBorders((b) => !b)}
          className="wm-mono"
          style={{
            padding: "4px 10px",
            fontSize: 9, letterSpacing: "0.18em",
            background: showBorders ? "rgba(125,240,194,0.18)" : "transparent",
            color: showBorders ? "var(--accent)" : "var(--ink-2)",
            border: `1px solid ${showBorders ? "var(--accent)" : "var(--line-strong)"}`,
            borderRadius: 5, cursor: "pointer",
          }}
        >
          BORDERS
        </button>
        <button
          onClick={() => setShowCountryLabels((c) => !c)}
          className="wm-mono"
          style={{
            padding: "4px 10px",
            fontSize: 9, letterSpacing: "0.18em",
            background: showCountryLabels ? "rgba(125,240,194,0.18)" : "transparent",
            color: showCountryLabels ? "var(--accent)" : "var(--ink-2)",
            border: `1px solid ${showCountryLabels ? "var(--accent)" : "var(--line-strong)"}`,
            borderRadius: 5, cursor: "pointer",
          }}
        >
          COUNTRIES
        </button>
      </div>

      {hovered ? (
        <div
          style={{
            position: "absolute",
            bottom: 18,
            left: 18,
            maxWidth: 320,
            padding: "12px 14px",
            background: "rgba(8, 12, 24, 0.85)",
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
