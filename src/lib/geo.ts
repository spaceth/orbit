import { BufferAttribute, BufferGeometry, Sphere, Vector3 } from "three";

const DEG = Math.PI / 180;

export interface LandMesh {
  geometry: BufferGeometry;
  oceanRadius: number;
}

/** Decode the prebuilt land mesh. Positions are stored as quantized lon/lat. */
export function decodeLandMesh(buffer: ArrayBuffer): LandMesh {
  const view = new DataView(buffer);
  const magic = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3),
  );
  if (magic !== "LND1") {
    throw new Error("Invalid land mesh");
  }

  const oceanRadius = view.getFloat32(4, true);
  const vertexCount = view.getUint32(8, true);
  const indexCount = view.getUint32(12, true);
  const quantized = new Int16Array(buffer, 16, vertexCount * 2);
  const positions = new Float32Array(vertexCount * 3);

  for (let index = 0; index < vertexCount; index += 1) {
    const lon = (quantized[index * 2] / 32767) * 180 * DEG;
    const lat = (quantized[index * 2 + 1] / 32767) * 90 * DEG;
    const cosLat = Math.cos(lat);
    const position = index * 3;
    positions[position] = cosLat * Math.cos(lon);
    positions[position + 1] = Math.sin(lat);
    positions[position + 2] = -cosLat * Math.sin(lon);
  }

  const indexOffset = 16 + vertexCount * 4;
  const indices = new Uint32Array(buffer, indexOffset, indexCount);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setIndex(new BufferAttribute(indices, 1));
  geometry.boundingSphere = new Sphere(new Vector3(0, 0, 0), 1);

  return { geometry, oceanRadius };
}
