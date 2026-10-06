/**
 * Build a compact land mesh for the globe.
 *
 * Natural Earth 10m land (via world-atlas) is triangulated, simplified so
 * continents and larger islands stay recognizable, and packed as quantized
 * lon/lat plus triangle indices. Tiny islets are omitted. The browser only
 * uploads that buffer — it does not parse GeoJSON or rasterize a texture.
 *
 * Usage: node scripts/build-land-mesh.mjs [source.json]
 */
import { writeFileSync } from "node:fs";
import earcut from "earcut";

const SOURCE =
  process.argv[2] ?? "https://unpkg.com/world-atlas@2.0.2/land-10m.json";
const OUT = new URL("../public/data/land-mesh.bin", import.meta.url);

/** Max perpendicular error when dropping coastline points, in degrees (~5 km). */
const COAST_TOLERANCE_DEG = 0.045;
/** Islands smaller than this are left out. Continents and major islands stay. */
const MIN_ISLAND_AREA_KM2 = 50;
const EARTH_RADIUS_KM = 6371;
/** Split interior edges wider than this so chords stay outside the ocean sphere. */
const MAX_EDGE_DEG = 2;
const MAX_EDGE_RAD = (MAX_EDGE_DEG * Math.PI) / 180;
const DEG = Math.PI / 180;

const circumRadius = MAX_EDGE_RAD / Math.sqrt(3);
const oceanRadius = 1 - (1 - Math.cos(circumRadius)) * 1.75;

async function loadTopology() {
  if (SOURCE.startsWith("http://") || SOURCE.startsWith("https://")) {
    const response = await fetch(SOURCE);
    if (!response.ok) {
      throw new Error(`Failed to download ${SOURCE}: ${response.status}`);
    }
    return response.json();
  }
  const { readFile } = await import("node:fs/promises");
  return JSON.parse(await readFile(SOURCE, "utf8"));
}

function decodeArc(topology, index) {
  const reverse = index < 0;
  const arc = topology.arcs[reverse ? ~index : index];
  const { scale, translate } = topology.transform;
  let x = 0;
  let y = 0;
  const points = arc.map(([dx, dy]) => {
    x += dx;
    y += dy;
    return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
  });
  if (reverse) {
    points.reverse();
  }
  return points;
}

function stitchRing(topology, arcIndexes) {
  const ring = [];
  for (const arcIndex of arcIndexes) {
    const part = decodeArc(topology, arcIndex);
    const start = ring.length > 0 ? 1 : 0;
    for (let i = start; i < part.length; i += 1) {
      ring.push(part[i]);
    }
  }
  if (
    ring.length > 1 &&
    ring[0][0] === ring[ring.length - 1][0] &&
    ring[0][1] === ring[ring.length - 1][1]
  ) {
    ring.pop();
  }
  return ring;
}

function eachPolygon(topology, geometry, visit) {
  if (geometry.type === "Polygon") {
    visit(geometry.arcs.map((ring) => stitchRing(topology, ring)));
    return;
  }
  if (geometry.type === "MultiPolygon") {
    for (const polygon of geometry.arcs) {
      visit(polygon.map((ring) => stitchRing(topology, ring)));
    }
    return;
  }
  if (geometry.type === "GeometryCollection") {
    for (const child of geometry.geometries) {
      eachPolygon(topology, child, visit);
    }
  }
}

function unwrapRing(ring, anchorLon) {
  const out = [];
  let prev = anchorLon;
  for (const [lon0, lat] of ring) {
    let lon = lon0;
    if (prev !== null) {
      while (lon - prev > 180) lon -= 360;
      while (prev - lon > 180) lon += 360;
    }
    out.push([lon, lat]);
    prev = lon;
  }
  return out;
}

function perpendicularDistance(point, start, end) {
  const lat = ((start[1] + end[1] + point[1]) / 3) * DEG;
  const cos = Math.cos(lat);
  const ax = start[0] * cos;
  const ay = start[1];
  const bx = end[0] * cos;
  const by = end[1];
  const px = point[0] * cos;
  const py = point[1];
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) {
    return Math.hypot(px - ax, py - ay);
  }
  const t = Math.min(1, Math.max(0, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function simplifyOpen(points, tolerance) {
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length > 0) {
    const [start, end] = stack.pop();
    let maxDistance = 0;
    let index = -1;
    for (let i = start + 1; i < end; i += 1) {
      const distance = perpendicularDistance(points[i], points[start], points[end]);
      if (distance > maxDistance) {
        maxDistance = distance;
        index = i;
      }
    }
    if (index !== -1 && maxDistance > tolerance) {
      keep[index] = 1;
      stack.push([start, index], [index, end]);
    }
  }
  const out = [];
  for (let i = 0; i < points.length; i += 1) {
    if (keep[i]) out.push(points[i]);
  }
  return out;
}

function simplifyClosed(ring, tolerance) {
  if (ring.length <= 8) return ring;
  let far = 1;
  let farDistance = -1;
  for (let i = 1; i < ring.length; i += 1) {
    const distance = Math.hypot(ring[i][0] - ring[0][0], ring[i][1] - ring[0][1]);
    if (distance > farDistance) {
      farDistance = distance;
      far = i;
    }
  }
  const head = simplifyOpen(ring.slice(0, far + 1), tolerance);
  const tail = simplifyOpen(ring.slice(far), tolerance);
  const simplified = head.concat(tail.slice(1));
  return simplified.length >= 3 ? simplified : ring;
}

function dedupe(ring) {
  const out = [];
  for (const point of ring) {
    const prev = out[out.length - 1];
    if (
      prev &&
      Math.abs(prev[0] - point[0]) < 1e-7 &&
      Math.abs(prev[1] - point[1]) < 1e-7
    ) {
      continue;
    }
    out.push(point);
  }
  if (out.length > 2) {
    const first = out[0];
    const last = out[out.length - 1];
    if (Math.abs(first[0] - last[0]) < 1e-7 && Math.abs(first[1] - last[1]) < 1e-7) {
      out.pop();
    }
  }
  return out;
}

function sealWrappingRing(ring) {
  if (ring.length < 3) return ring;
  const gap = Math.abs(ring[0][0] - ring[ring.length - 1][0]);
  if (gap <= 180) return ring;

  const meanLat = ring.reduce((sum, point) => sum + point[1], 0) / ring.length;
  const pole = meanLat < 0 ? -90 : 90;
  const last = ring[ring.length - 1];
  const first = ring[0];
  const sealed = ring.slice();
  sealed.push([last[0], pole]);
  const span = first[0] - last[0];
  const steps = Math.max(2, Math.ceil(Math.abs(span) / MAX_EDGE_DEG));
  for (let step = 1; step < steps; step += 1) {
    sealed.push([last[0] + (span * step) / steps, pole]);
  }
  sealed.push([first[0], pole]);
  return sealed;
}

function ringAreaKm2(ring) {
  let total = 0;
  for (let index = 0; index < ring.length; index += 1) {
    const [lon1, lat1] = ring[index];
    const [lon2, lat2] = ring[(index + 1) % ring.length];
    let dLon = lon2 - lon1;
    if (dLon > 180) dLon -= 360;
    if (dLon < -180) dLon += 360;
    total +=
      dLon *
      DEG *
      (2 + Math.sin(lat1 * DEG) + Math.sin(lat2 * DEG));
  }
  return Math.abs((total * EARTH_RADIUS_KM * EARTH_RADIUS_KM) / 2);
}

function prepareRing(ring, anchorLon) {
  return sealWrappingRing(
    dedupe(simplifyClosed(unwrapRing(ring, anchorLon), COAST_TOLERANCE_DEG)),
  );
}

function edgeLength(a, b) {
  const dLon = Math.abs(b[0] - a[0]);
  if (dLon > 180) {
    return Math.PI;
  }
  return angularDistance(a, b);
}

function angularDistance(a, b) {
  const lat1 = a[1] * DEG;
  const lat2 = b[1] * DEG;
  const dLat = lat2 - lat1;
  let dLon = (b[0] - a[0]) * DEG;
  if (dLon > Math.PI) dLon -= Math.PI * 2;
  if (dLon < -Math.PI) dLon += Math.PI * 2;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}

function subdivideTriangle(a, b, c, out) {
  const stack = [[a, b, c, 0]];
  while (stack.length > 0) {
    const [p, q, r, depth] = stack.pop();
    const ab = edgeLength(p, q);
    const bc = edgeLength(q, r);
    const ca = edgeLength(r, p);
    if (depth >= 16 || Math.max(ab, bc, ca) <= MAX_EDGE_RAD) {
      out.push(p, q, r);
      continue;
    }
    let start = p;
    let end = q;
    let other = r;
    let longest = ab;
    if (bc > longest) {
      start = q;
      end = r;
      other = p;
      longest = bc;
    }
    if (ca > longest) {
      start = r;
      end = p;
      other = q;
    }
    const mid = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
    stack.push([start, mid, other, depth + 1], [mid, end, other, depth + 1]);
  }
}

function project(lon, lat) {
  const lambda = lon * DEG;
  const phi = lat * DEG;
  const cosPhi = Math.cos(phi);
  return [cosPhi * Math.cos(lambda), Math.sin(phi), -cosPhi * Math.sin(lambda)];
}

function solidAngle(a, b, c) {
  const triple =
    a[0] * (b[1] * c[2] - b[2] * c[1]) +
    a[1] * (b[2] * c[0] - b[0] * c[2]) +
    a[2] * (b[0] * c[1] - b[1] * c[0]);
  const denom = 1 + dot(a, b) + dot(b, c) + dot(c, a);
  return 2 * Math.atan2(triple, denom);
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function quantLon(lon) {
  let value = lon % 360;
  if (value > 180) value -= 360;
  if (value <= -180) value += 360;
  let quantized = Math.round((value / 180) * 32767);
  if (quantized >= 32767) quantized = -32767;
  if (quantized < -32767) quantized = -32767;
  return quantized;
}

function quantLat(lat) {
  let quantized = Math.round((lat / 90) * 32767);
  if (quantized > 32767) quantized = 32767;
  if (quantized < -32767) quantized = -32767;
  return quantized;
}

function buildMesh(topology) {
  const lonLat = [];
  const indices = [];
  const weld = new Map();
  let dropped = 0;
  let droppedIslandKm2 = 0;
  let sourcePoints = 0;

  function addVertex(lon, lat) {
    const qLon = quantLon(lon);
    const qLat = quantLat(lat);
    const key = (qLon + 32768) * 65536 + (qLat + 32768);
    const existing = weld.get(key);
    if (existing !== undefined) return existing;
    const id = lonLat.length / 2;
    lonLat.push(qLon, qLat);
    weld.set(key, id);
    return id;
  }

  function emit(a, b, c) {
    let pa = project(a[0], a[1]);
    let pb = project(b[0], b[1]);
    let pc = project(c[0], c[1]);
    if (solidAngle(pa, pb, pc) < 0) {
      const swap = b;
      b = c;
      c = swap;
      const swapP = pb;
      pb = pc;
      pc = swapP;
    }
    if (Math.abs(solidAngle(pa, pb, pc)) < 1e-12) return;
    indices.push(addVertex(a[0], a[1]), addVertex(b[0], b[1]), addVertex(c[0], c[1]));
  }

  eachPolygon(topology, topology.objects.land, (rings) => {
    for (const ring of rings) sourcePoints += ring.length;
    const unwrapped = dedupe(unwrapRing(rings[0], null));
    const areaKm2 = ringAreaKm2(unwrapped);
    if (areaKm2 < MIN_ISLAND_AREA_KM2) {
      dropped += 1;
      droppedIslandKm2 += areaKm2;
      return;
    }
    const outer = prepareRing(rings[0], null);
    if (outer.length < 3) {
      dropped += 1;
      if (rings[0].length > 40) {
        console.warn("dropped simplified ring", rings[0].length, "->", outer.length);
      }
      return;
    }
    const prepared = [outer];
    for (let i = 1; i < rings.length; i += 1) {
      const hole = prepareRing(rings[i], outer[0][0]);
      if (hole.length >= 3) prepared.push(hole);
    }

    const flat = [];
    const holes = [];
    for (let r = 0; r < prepared.length; r += 1) {
      if (r > 0) holes.push(flat.length / 2);
      for (const [lon, lat] of prepared[r]) {
        flat.push(lon, lat);
      }
    }

    let triangles;
    try {
      triangles = earcut(flat, holes.length > 0 ? holes : null, 2);
    } catch (error) {
      dropped += 1;
      console.warn("earcut failed", prepared[0].length, error);
      return;
    }
    if (triangles.length < 3) {
      dropped += 1;
      if (prepared[0].length > 40) {
        console.warn("empty triangulation", prepared[0].length);
      }
      return;
    }

    const refined = [];
    for (let i = 0; i < triangles.length; i += 3) {
      const ia = triangles[i] * 2;
      const ib = triangles[i + 1] * 2;
      const ic = triangles[i + 2] * 2;
      subdivideTriangle(
        [flat[ia], flat[ia + 1]],
        [flat[ib], flat[ib + 1]],
        [flat[ic], flat[ic + 1]],
        refined,
      );
    }
    for (let i = 0; i < refined.length; i += 3) {
      emit(refined[i], refined[i + 1], refined[i + 2]);
    }
  });

  return { lonLat, indices, dropped, droppedIslandKm2, sourcePoints };
}

function measureCoverage(lonLat, indices) {
  let sum = 0;
  const vertex = (id) => {
    const lon = (lonLat[id * 2] / 32767) * 180;
    const lat = (lonLat[id * 2 + 1] / 32767) * 90;
    return project(lon, lat);
  };
  for (let i = 0; i < indices.length; i += 3) {
    sum += solidAngle(vertex(indices[i]), vertex(indices[i + 1]), vertex(indices[i + 2]));
  }
  return sum / (4 * Math.PI);
}

function writeMesh({ lonLat, indices }) {
  const vertexCount = lonLat.length / 2;
  const indexCount = indices.length;
  const bytes = 16 + vertexCount * 4 + indexCount * 4;
  const buffer = Buffer.alloc(bytes);
  buffer.write("LND1", 0, "ascii");
  buffer.writeFloatLE(oceanRadius, 4);
  buffer.writeUInt32LE(vertexCount, 8);
  buffer.writeUInt32LE(indexCount, 12);
  for (let i = 0; i < lonLat.length; i += 1) {
    buffer.writeInt16LE(lonLat[i], 16 + i * 2);
  }
  const indexOffset = 16 + vertexCount * 4;
  for (let i = 0; i < indices.length; i += 1) {
    buffer.writeUInt32LE(indices[i], indexOffset + i * 4);
  }
  writeFileSync(OUT, buffer);
  return bytes;
}

const topology = await loadTopology();
if (!topology.transform || !topology.objects?.land) {
  throw new Error("Expected a world-atlas land topology");
}

console.time("build");
const mesh = buildMesh(topology);
console.timeEnd("build");

const coverage = measureCoverage(mesh.lonLat, mesh.indices);
const bytes = writeMesh(mesh);
const vertexCount = mesh.lonLat.length / 2;

console.log(
  JSON.stringify(
    {
      vertices: vertexCount,
      triangles: mesh.indices.length / 3,
      sourcePoints: mesh.sourcePoints,
      droppedPolygons: mesh.dropped,
      droppedIslandKm2: Math.round(mesh.droppedIslandKm2),
      landFraction: Number(coverage.toFixed(4)),
      oceanRadius: Number(oceanRadius.toFixed(6)),
      bytes,
    },
    null,
    2,
  ),
);

if (coverage < 0.26 || coverage > 0.34) {
  throw new Error(`Land coverage ${coverage.toFixed(4)} is outside the expected range`);
}
