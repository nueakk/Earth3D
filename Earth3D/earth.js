
const elevationGrid = new Float32Array(180 * 360);
let elevationCount = 0;

// CSV 고도 데이터 불러오기
async function loadElevationData() {
    const response = await fetch("data/elevation.csv");

    if (!response.ok) {
        throw new Error("고도 데이터를 불러올 수 없습니다.");
    }

    const text = await response.text();
    const lines = text.trim().split(/\r?\n/);

    elevationCount = 0;

    for (let i = 2; i < lines.length; i++) {
        const [lat, lon, elevation] =
            lines[i].split(",").map(Number);

        if (![lat, lon, elevation].every(Number.isFinite)) {
            continue;
        }

        const row = Math.round(lat + 90);
        const col = ((Math.round(lon) % 360) + 360) % 360;

        if (row >= 0 && row < 180) {
            elevationGrid[row * 360 + col] = elevation;
            elevationCount++;
        }
    }

    console.log("고도 데이터 로드 완료:", elevationCount);
}

// 위도 및 경도 기반 고도 보간
function getElevation(lat, lon) {
    const y = Math.max(
        0, Math.min(179, lat + 90 - 1 / 120)
    );

    const x = ((lon - 1 / 120) % 360 + 360) % 360;

    const y0 = Math.floor(y);
    const y1 = Math.min(y0 + 1, 179);

    const x0 = Math.floor(x);
    const x1 = (x0 + 1) % 360;

    const tx = x - x0;
    const ty = y - y0;

    const a = elevationGrid[y0 * 360 + x0];
    const b = elevationGrid[y0 * 360 + x1];
    const c = elevationGrid[y1 * 360 + x0];
    const d = elevationGrid[y1 * 360 + x1];

    const top = a + (b - a) * tx;
    const bottom = c + (d - c) * tx;

    return top + (bottom - top) * ty;
}

// 색상 보간
function mixColor(a, b, t) {
    t = Math.max(0, Math.min(1, t));

    return a.map((value, i) =>
        value + (b[i] - value) * t
    );
}

// 고도별 지형 색상
function getTerrainColor(h, lat) {
    if (h < 0) {
        return mixColor(
            [0.025, 0.08, 0.25],
            [0.12, 0.55, 0.78],
            (h + 6500) / 6500
        );
    }

    if (Math.abs(lat) > 70) {
        return [0.88, 0.93, 0.97];
    }

    if (h < 500) {
        return mixColor(
            [0.12, 0.38, 0.16],
            [0.36, 0.55, 0.23],
            h / 500
        );
    }

    if (h < 1500) {
        return mixColor(
            [0.36, 0.55, 0.23],
            [0.65, 0.56, 0.35],
            (h - 500) / 1000
        );
    }

    if (h < 3500) {
        return mixColor(
            [0.65, 0.56, 0.35],
            [0.48, 0.32, 0.21],
            (h - 1500) / 2000
        );
    }

    return mixColor(
        [0.48, 0.32, 0.21],
        [0.98, 0.98, 0.98],
        (h - 3500) / 2000
    );
}

// 삼각형 표면의 법선 계산
function calculateNormals(positions, indices) {
    const normals = new Float32Array(positions.length);

    for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i] * 3;
        const b = indices[i + 1] * 3;
        const c = indices[i + 2] * 3;

        const ux = positions[b] - positions[a];
        const uy = positions[b + 1] - positions[a + 1];
        const uz = positions[b + 2] - positions[a + 2];

        const vx = positions[c] - positions[a];
        const vy = positions[c + 1] - positions[a + 1];
        const vz = positions[c + 2] - positions[a + 2];

        const nx = uy * vz - uz * vy;
        const ny = uz * vx - ux * vz;
        const nz = ux * vy - uy * vx;

        for (const index of [a, b, c]) {
            normals[index] += nx;
            normals[index + 1] += ny;
            normals[index + 2] += nz;
        }
    }

    return normals;
}

// 고도 정보가 적용된 지구 모델 생성
function createEarth(
    latitudeBands = 180,
    longitudeBands = 360,
    exaggeration = 35
) {
    const positions = [];
    const colors = [];
    const indices = [];

    const earthRadius = 6371000;

    for (let lat = 0; lat <= latitudeBands; lat++) {
        const theta = lat * Math.PI / latitudeBands;
        const latitude = 90 - lat * 180 / latitudeBands;

        for (let lon = 0; lon <= longitudeBands; lon++) {
            const phi = lon * 2 * Math.PI / longitudeBands;
            const longitude = lon * 360 / longitudeBands;

            const x = Math.sin(theta) * Math.cos(phi);
            const y = Math.cos(theta);
            const z = Math.sin(theta) * Math.sin(phi);

            const elevation = getElevation(
                latitude,
                (lat === 0 || lat === latitudeBands)
                    ? 0 : longitude
            );

            const radius = 1.0 +
                elevation / earthRadius * exaggeration;

            positions.push(
                radius * x,
                radius * y,
                radius * z
            );

            colors.push(
                ...getTerrainColor(elevation, latitude)
            );
        }
    }

    // 바깥쪽을 향하도록 삼각형 구성
    for (let lat = 0; lat < latitudeBands; lat++) {
        for (let lon = 0; lon < longitudeBands; lon++) {
            const first =
                lat * (longitudeBands + 1) + lon;

            const second =
                first + longitudeBands + 1;

            indices.push(
                first, first + 1, second
            );

            indices.push(
                second, first + 1, second + 1
            );
        }
    }

    const positionArray = new Float32Array(positions);
    const indexArray = new Uint16Array(indices);

    const normals = calculateNormals(
        positionArray, indexArray
    );

    // 경도 0도와 360도 경계의 법선 연결
    for (let lat = 0; lat <= latitudeBands; lat++) {
        const a = lat * (longitudeBands + 1) * 3;
        const b = a + longitudeBands * 3;

        for (let k = 0; k < 3; k++) {
            const sum = normals[a + k] + normals[b + k];

            normals[a + k] = sum;
            normals[b + k] = sum;
        }
    }

    // 법선 벡터 정규화
    for (let i = 0; i < normals.length; i += 3) {
        const length = Math.hypot(
            normals[i],
            normals[i + 1],
            normals[i + 2]
        );

        if (length > 0.00000001) {
            normals[i] /= length;
            normals[i + 1] /= length;
            normals[i + 2] /= length;
        } else {
            const r = Math.hypot(
                positionArray[i],
                positionArray[i + 1],
                positionArray[i + 2]
            );

            normals[i] = positionArray[i] / r;
            normals[i + 1] = positionArray[i + 1] / r;
            normals[i + 2] = positionArray[i + 2] / r;
        }
    }

    // 극점 법선 통일
    for (let lon = 0; lon <= longitudeBands; lon++) {
        const north = lon * 3;
        const south =
            (latitudeBands * (longitudeBands + 1) + lon) * 3;

        normals.set([0, 1, 0], north);
        normals.set([0, -1, 0], south);
    }

    return {
        positions: positionArray,
        normals: normals,
        colors: new Float32Array(colors),
        indices: indexArray
    };
}
