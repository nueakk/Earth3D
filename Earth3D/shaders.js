
const vertexShaderSource = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec3 aColor;

    uniform float uRotationX;
    uniform float uRotationY;
    uniform float uAspect;
    uniform float uZoom;

    varying vec3 vNormal;
    varying vec3 vColor;

    void main() {
        float cx = cos(uRotationX);
        float sx = sin(uRotationX);

        float cy = cos(uRotationY);
        float sy = sin(uRotationY);

        mat3 rotationX = mat3(
            1.0, 0.0, 0.0,
            0.0,  cx,  sx,
            0.0, -sx,  cx
        );

        mat3 rotationY = mat3(
             cy, 0.0, -sy,
            0.0, 1.0, 0.0,
             sy, 0.0,  cy
        );

        mat3 rotation = rotationX * rotationY;

        vec3 position = rotation * aPosition;

        vNormal = rotation * aNormal;
        vColor = aColor;

        gl_Position = vec4(
            position.x / uAspect * 0.8 * uZoom,
            position.y * 0.8 * uZoom,
            position.z * 0.4,
            1.0
        );
    }
`;

const fragmentShaderSource = `
    precision mediump float;

    varying vec3 vNormal;
    varying vec3 vColor;

    uniform float uLightIntensity;
    uniform float uLightDirection;

    void main() {
        vec3 normal = normalize(vNormal);

        vec3 lightDirection = normalize(
            vec3(
                cos(uLightDirection),
                0.5,
                sin(uLightDirection)
            )
        );

        float diffuse = max(
            dot(normal, lightDirection),
            0.0
        );

        float ambient = 0.25;

        float lighting =
            ambient + diffuse * uLightIntensity;

        vec3 finalColor = vColor * lighting;

        gl_FragColor = vec4(finalColor, 1.0);
    }
`;
