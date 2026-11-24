
async function init() {
    await loadElevationData();

    const canvas = document.getElementById("glCanvas");
    const gl = canvas.getContext("webgl", {
        antialias: true
    });

    if (!gl) {
        throw new Error("WebGL을 지원하지 않는 브라우저입니다.");
    }

    // 초기 설정값
    const settings = {
        speed: 1,
        terrain: 35,
        light: 75,
        direction: 225,
        zoom: 1,
        rotating: true,
        rotationX: 0.15,
        rotationY: 0
    };

    // 셰이더 생성
    function createShader(type, source) {
        const shader = gl.createShader(type);

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(
            shader, gl.COMPILE_STATUS
        )) {
            throw new Error(gl.getShaderInfoLog(shader));
        }

        return shader;
    }

    const vertexShader = createShader(
        gl.VERTEX_SHADER,
        vertexShaderSource
    );

    const fragmentShader = createShader(
        gl.FRAGMENT_SHADER,
        fragmentShaderSource
    );

    // 셰이더 프로그램 연결
    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(
        program, gl.LINK_STATUS
    )) {
        throw new Error(gl.getProgramInfoLog(program));
    }

    gl.useProgram(program);

    // 지구 모델 및 버퍼
    let earth;

    const positionBuffer = gl.createBuffer();
    const normalBuffer = gl.createBuffer();
    const colorBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();

    function uploadAttribute(buffer, data, name) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

        gl.bufferData(
            gl.ARRAY_BUFFER,
            data,
            gl.STATIC_DRAW
        );

        const location =
            gl.getAttribLocation(program, name);

        gl.vertexAttribPointer(
            location, 3, gl.FLOAT, false, 0, 0
        );

        gl.enableVertexAttribArray(location);
    }

    // 고도 강조 배율에 따라 모델 재생성
    function updateEarth() {
        earth = createEarth(
            180,
            360,
            settings.terrain
        );

        uploadAttribute(
            positionBuffer,
            earth.positions,
            "aPosition"
        );

        uploadAttribute(
            normalBuffer,
            earth.normals,
            "aNormal"
        );

        uploadAttribute(
            colorBuffer,
            earth.colors,
            "aColor"
        );

        gl.bindBuffer(
            gl.ELEMENT_ARRAY_BUFFER,
            indexBuffer
        );

        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            earth.indices,
            gl.STATIC_DRAW
        );

        document.getElementById("dataCount").textContent =
            elevationCount.toLocaleString();

        document.getElementById("vertexCount").textContent =
            (earth.positions.length / 3).toLocaleString();

        document.getElementById("triangleCount").textContent =
            (earth.indices.length / 3).toLocaleString();
    }

    updateEarth();

    // Uniform 변수 연결
    const uniforms = {
        rotationX: gl.getUniformLocation(
            program, "uRotationX"
        ),
        rotationY: gl.getUniformLocation(
            program, "uRotationY"
        ),
        aspect: gl.getUniformLocation(
            program, "uAspect"
        ),
        zoom: gl.getUniformLocation(
            program, "uZoom"
        ),
        light: gl.getUniformLocation(
            program, "uLightIntensity"
        ),
        direction: gl.getUniformLocation(
            program, "uLightDirection"
        )
    };

    gl.enable(gl.DEPTH_TEST);

    gl.clearColor(
        0.012, 0.027, 0.063, 1.0
    );

    // 사용자 인터페이스 연결
    const speedInput =
        document.getElementById("speed");

    const terrainInput =
        document.getElementById("terrain");

    const lightInput =
        document.getElementById("light");

    const directionInput =
        document.getElementById("direction");

    const zoomInput =
        document.getElementById("zoom");

    const toggleButton =
        document.getElementById("toggleRotation");

    const resetButton =
        document.getElementById("reset");

    const status =
        document.getElementById("status");

    // 설정값 표시
    function updateLabels() {
        document.getElementById("speedValue").textContent =
            settings.speed.toFixed(1) + "×";

        document.getElementById("terrainValue").textContent =
            settings.terrain + "×";

        document.getElementById("lightValue").textContent =
            settings.light + "%";

        document.getElementById("directionValue").textContent =
            settings.direction + "°";

        document.getElementById("zoomValue").textContent =
            settings.zoom.toFixed(2) + "×";

        toggleButton.textContent = settings.rotating
            ? "Pause Rotation"
            : "Start Rotation";

        status.textContent = settings.rotating
            ? "AUTO ROTATION"
            : "ROTATION PAUSED";
    }

    // 회전 속도
    speedInput.addEventListener("input", () => {
        settings.speed = Number(speedInput.value);
        updateLabels();
    });

    // 고도 강조 배율
    let terrainUpdatePending = false;

    terrainInput.addEventListener("input", () => {
        settings.terrain = Number(terrainInput.value);
        terrainUpdatePending = true;
        updateLabels();
    });

    // 조명 강도
    lightInput.addEventListener("input", () => {
        settings.light = Number(lightInput.value);
        updateLabels();
    });

    // 광원 방향
    directionInput.addEventListener("input", () => {
        settings.direction = Number(directionInput.value);
        updateLabels();
    });

    // 확대 및 축소
    zoomInput.addEventListener("input", () => {
        settings.zoom = Number(zoomInput.value);
        updateLabels();
    });

    // 회전 시작 및 정지
    toggleButton.addEventListener("click", () => {
        settings.rotating = !settings.rotating;
        updateLabels();
    });

    // 초기화
    resetButton.addEventListener("click", () => {
        settings.speed = 1;
        settings.terrain = 35;
        settings.light = 75;
        settings.direction = 225;
        settings.zoom = 1;
        settings.rotating = true;
        settings.rotationX = 0.15;
        settings.rotationY = 0;

        speedInput.value = 1;
        terrainInput.value = 35;
        lightInput.value = 75;
        directionInput.value = 225;
        zoomInput.value = 1;

        terrainUpdatePending = true;
        updateLabels();
    });

    // 마우스 드래그 회전
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    canvas.addEventListener("pointerdown", event => {
        if (event.button !== 0) return;

        dragging = true;

        lastX = event.clientX;
        lastY = event.clientY;

        canvas.setPointerCapture(event.pointerId);
    });

    canvas.addEventListener("pointermove", event => {
        if (!dragging) return;

        const dx = event.clientX - lastX;
        const dy = event.clientY - lastY;

        settings.rotationY += dx * 0.008;
        settings.rotationX += dy * 0.008;

        settings.rotationX = Math.max(
            -Math.PI / 2,
            Math.min(
                Math.PI / 2,
                settings.rotationX
            )
        );

        lastX = event.clientX;
        lastY = event.clientY;
    });

    canvas.addEventListener("pointerup", () => {
        dragging = false;
    });

    canvas.addEventListener("pointercancel", () => {
        dragging = false;
    });

    canvas.addEventListener("lostpointercapture", () => {
        dragging = false;
    });

    // 마우스 휠 확대 및 축소
    canvas.addEventListener("wheel", event => {
        event.preventDefault();

        settings.zoom += event.deltaY < 0
            ? 0.05
            : -0.05;

        settings.zoom = Math.max(
            0.5,
            Math.min(2, settings.zoom)
        );

        settings.zoom =
            Math.round(settings.zoom * 20) / 20;

        zoomInput.value = settings.zoom;

        updateLabels();
    }, { passive: false });

    // 시간 기반 애니메이션
    let lastTime = null;

    function render(time) {
        const deltaTime = lastTime === null
            ? 0
            : Math.min((time - lastTime) / 1000, 0.1);

        lastTime = time;

        if (settings.rotating && !dragging) {
            settings.rotationY +=
                deltaTime * settings.speed * 0.5;
        }

        if (terrainUpdatePending) {
            updateEarth();
            terrainUpdatePending = false;
        }

        gl.viewport(
            0, 0, canvas.width, canvas.height
        );

        gl.clear(
            gl.COLOR_BUFFER_BIT |
            gl.DEPTH_BUFFER_BIT
        );

        gl.uniform1f(
            uniforms.rotationX,
            settings.rotationX
        );

        gl.uniform1f(
            uniforms.rotationY,
            settings.rotationY
        );

        gl.uniform1f(
            uniforms.aspect,
            canvas.width / canvas.height
        );

        gl.uniform1f(
            uniforms.zoom,
            settings.zoom
        );

        gl.uniform1f(
            uniforms.light,
            settings.light / 100
        );

        gl.uniform1f(
            uniforms.direction,
            settings.direction * Math.PI / 180
        );

        gl.drawElements(
            gl.TRIANGLES,
            earth.indices.length,
            gl.UNSIGNED_SHORT,
            0
        );

        requestAnimationFrame(render);
    }

    updateLabels();

    requestAnimationFrame(render);
}

// 프로그램 실행 및 오류 처리
init().catch(error => {
    console.error(error);

    const status = document.getElementById("status");

    if (status) {
        status.textContent = "LOADING ERROR";
        status.style.color = "#ff7777";
    }

    alert(error.message);
});
