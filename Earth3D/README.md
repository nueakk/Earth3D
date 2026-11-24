
# Earth 3D

## 1. 프로젝트 개요

Earth 3D는 WebGL을 기반으로 실제 지구의 고도 정보를
활용하여 3차원 지형을 시각화하는 프로그램이다.

NOAA의 ETOPO 2022 공개 고도 데이터를 활용하였으며,
위도와 경도에 따른 고도값을 3차원 구체의 정점 위치에
반영하여 육지, 산맥, 해저 지형을 표현하였다.

## 2. 주요 기능

- 위도 및 경도 기반 3D 지구 모델링
- 실제 고도 데이터를 활용한 지형 표현
- 고도에 따른 지형 색상 보간
- 지구 자동 회전 및 일시 정지
- 회전 속도 조절
- 고도 강조 배율 조절
- 조명 강도 및 광원 방향 조절
- 마우스 드래그를 통한 지구 회전
- 마우스 휠 및 슬라이더를 통한 확대·축소
- 설정 초기화
- 반응형 사용자 인터페이스

## 3. 개발 환경

- HTML5
- CSS3
- JavaScript
- WebGL
- GLSL
- Visual Studio Code
- Live Server

외부 3D 그래픽 라이브러리를 사용하지 않고
순수 WebGL을 기반으로 구현하였다.

## 4. 프로젝트 구조

    Earth3D/
    ├── index.html
    ├── style.css
    ├── main.js
    ├── earth.js
    ├── shaders.js
    ├── README.md
    └── data/
        └── elevation.csv

- index.html: 프로그램 화면 및 제어 인터페이스
- style.css: UI 디자인 및 반응형 레이아웃
- main.js: WebGL 초기화, 렌더링 및 사용자 입력 처리
- earth.js: 고도 데이터 처리, 정점 생성 및 법선 계산
- shaders.js: 회전 변환, 색상 및 조명 계산
- elevation.csv: 위도·경도 기반 실제 고도 데이터

## 5. 모델 정보

| 항목 | 내용 |
|---|---|
| 고도 데이터 | NOAA ETOPO 2022 |
| 고도 데이터 수 | 64,800개 |
| 데이터 간격 | 1° × 1° |
| 정점 수 | 65,341개 |
| 삼각형 인덱스 구성 수 | 129,600개 |
| 기본 고도 강조 배율 | 35배 |

## 6. 적용 기술

- Spherical Coordinate System
- Vertex and Fragment Shader
- Rotation Matrix
- Bilinear Interpolation
- Terrain Exaggeration
- Normal Vector Calculation
- Ambient and Diffuse Lighting
- Depth Testing
- Frame-based Animation


## 7. 데이터 출처

NOAA National Centers for Environmental Information

ETOPO 2022 Global Relief Model

https://www.ncei.noaa.gov/products/etopo-global-relief-model
