import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from './services/otp.service';
import { PrismaService } from '../prisma/prisma.service';
import { HttpModule } from '@nestjs/axios';
import { ParticipantService } from '../party/services/participant.service';
import { JwtService } from '@nestjs/jwt';
import { MapService } from '../party/services/map.service';
import { RouteVisualizerService } from './route-visualizer.service';

jest.mock('kdbush', () => {
  return jest.fn().mockImplementation(() => ({}));
});

jest.mock('geokdbush', () => ({
  around: jest.fn().mockReturnValue([0])
}));

describe('OtpService', () => {
  let service: OtpService;
  jest.setTimeout(300000);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule], // ✅ HttpService 의존성 해결
      providers: [OtpService, PrismaService, ParticipantService,RouteVisualizerService,
        { provide: JwtService, useValue: {} },
        { provide: MapService, useValue: {} }, ], // ✅ PrismaService 주입
    }).compile();

    service = module.get<OtpService>(OtpService);
  });

  it('should be defined', async () => {

    //const result = await service.test(37.504322,126.76354,'PT30M');
    const result = await service.getCrossMid('cmgtgcvde0000vprgzmvixr3m');
    //const result = await service.loadSubwayStops();
    //const result = await service.getIsochrone('PT30M','37.504322,126.76354','CAR','');
    //const result = await service.getRoute('37.504322,126.76354','37.4564,126.7052','CAR','2025-11-14');
    
    console.log(result); // ✅ 콘솔 확인

    expect(result).toBeDefined();
  });
});

// src/otp/otp.service.spec.ts

// import { Test, TestingModule } from '@nestjs/testing';
// import { OtpService } from './otp.service';
// import { PrismaService } from '../prisma/prisma.service';
// import { HttpModule } from '@nestjs/axios';
// import { ParticipantService } from '../party/services/participant.service';
// import { JwtService } from '@nestjs/jwt';
// import { MapService } from '../party/services/map.service';
// import { RouteVisualizerService } from './route-visualizer.service';
// import * as fs from 'fs';
// import * as path from 'path';
// import * as http from 'http'; // 로컬 서버를 위해 http 모듈 추가
// jest.mock('open', () => jest.fn());
// const open = require('open');
// // 🚨 Node.js 환경에서 'open' 모듈을 사용하려면 먼저 설치해야 합니다:
// // npm install open

// describe('OtpService', () => {
//   let service: OtpService;
//   const VISUALIZER_PORT = 8080;
//   const GEOJSON_FILENAME = 'intersection_result.geojson';
//   const HTML_FILENAME = 'visualize_map.html';

//   beforeEach(async () => {
//     // ... (기존 beforeEach 로직 유지)
//     const module: TestingModule = await Test.createTestingModule({
//       imports: [HttpModule],
//       providers: [OtpService, PrismaService, ParticipantService, RouteVisualizerService,
//         { provide: JwtService, useValue: {} },
//         { provide: MapService, useValue: {} }, ],
//     }).compile();

//     service = module.get<OtpService>(OtpService);
//   });

//   // 지도 시각화를 위한 HTML 파일 생성 함수
//   const createVisualizerHTML = () => {
//     const htmlContent = `
//     <!DOCTYPE html>
//     <html>
//     <head>
//         <title>Intersection Viewer</title>
//         <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
//         <style>
//             #map { height: 90vh; width: 100%; }
//         </style>
//         <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
//     </head>
//     <body>
//         <h1>Intersection Result</h1>
//         <div id="map"></div>
//         <script>
//             const GEOJSON_FILE = '/${GEOJSON_FILENAME}'; // 로컬 서버 경로

//             // 지도 초기화
//             const map = L.map('map').setView([0, 0], 2); // 전역 뷰로 시작

//             L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//                 attribution: '© OpenStreetMap contributors'
//             }).addTo(map);

//             async function loadGeoJson() {
//                 try {
//                     const response = await fetch(GEOJSON_FILE);
//                     if (!response.ok) {
//                         console.error("GeoJSON 파일을 로드할 수 없습니다.");
//                         return;
//                     }
//                     const geoJsonData = await response.json();

//                     if (geoJsonData && geoJsonData.geometry) {
//                         const intersectionLayer = L.geoJSON(geoJsonData, {
//                             style: {
//                                 color: '#0000ff',
//                                 weight: 4,
//                                 fillColor: '#00cc00',
//                                 fillOpacity: 0.4
//                             },
//                             onEachFeature: (feature, layer) => {
//                                 layer.bindPopup("Calculated Intersection");
//                             }
//                         }).addTo(map);

//                         // 맵 뷰를 폴리곤 영역에 맞춥니다.
//                         if (intersectionLayer.getLayers().length > 0) {
//                             map.fitBounds(intersectionLayer.getBounds());
//                         }
//                     } else {
//                         console.log("교차 영역이 없어 맵에 표시할 데이터가 없습니다.");
//                     }
//                 } catch (error) {
//                     console.error("GeoJSON 로드 또는 렌더링 오류:", error);
//                 }
//             }
//             loadGeoJson();
//         </script>
//     </body>
//     </html>
//     `;
//     fs.writeFileSync(path.join(__dirname, HTML_FILENAME), htmlContent, 'utf8');
//   };
  
//   // 로컬 서버를 띄우는 함수
//   const startVisualizerServer = (htmlPath: string, geojsonPath: string): Promise<http.Server> => {
//     return new Promise((resolve) => {
//       const server = http.createServer((req, res) => {
//         const requestUrl = req.url ?? '/'; // undefined일 경우 '/'로 대체
//         const filePath = path.join(__dirname, requestUrl === '/' ? HTML_FILENAME : requestUrl);        
//         // 정적 파일 서빙
//         fs.readFile(filePath, (err, data) => {
//           if (err) {
//             res.writeHead(404, {'Content-Type': 'text/plain'});
//             res.end('404 Not Found');
//             return;
//           }

//           let contentType = 'text/html';
//           if (requestUrl.endsWith('.geojson')) { // ⬅️ requestUrl 사용 확인
//             contentType = 'application/json';
//           }
                    
//           res.writeHead(200, {'Content-Type': contentType});
//           res.end(data);
//         });
//       });

//       server.listen(VISUALIZER_PORT, () => {
//         console.log(`\n\n🌐 시각화 서버 실행: http://localhost:${VISUALIZER_PORT}`);
//         open(`http://localhost:${VISUALIZER_PORT}`);
//         resolve(server);
//       });
//     });
//   };

//   it('should calculate intersection and display on map', async () => {
//     const partyId = 'cmgtgcvde0000vprgzmvixr3m';
//     const result = await service.getCrossMid(partyId);
    
//     // GeoJSON과 HTML 파일을 저장할 경로 (테스트 파일 옆)
//     const geoJsonPath = path.join(__dirname, GEOJSON_FILENAME);
//     const htmlPath = path.join(__dirname, HTML_FILENAME);

//     // 1. HTML 시각화 파일 생성
//     createVisualizerHTML();
    
//     if (result) {
//       // 2. 결과 GeoJSON 파일 저장
//       fs.writeFileSync(geoJsonPath, JSON.stringify(result, null, 2), 'utf8');
//       console.log(`✅ 교차 영역 GeoJSON 파일 저장 완료: ${geoJsonPath}`);
      
//       // 3. 로컬 서버 시작 및 브라우저 열기
//       const server = await startVisualizerServer(htmlPath, geoJsonPath);
      
//       // 4. (선택 사항) 잠시 기다린 후 서버 종료 (실제 사용 시에는 개발자가 수동으로 닫도록 설정하는 것이 좋습니다.)
//       await new Promise(resolve => setTimeout(resolve, 10000)); // 10초 대기
//       server.close();

//     } else {
//       console.log('❌ 교차 영역이 존재하지 않아 시각화할 데이터가 없습니다.');
//     }

//     expect(result).toBeDefined();
//   }, 15000); // 테스트 시간 제한을 넉넉하게 설정 (서버 시작/종료 시간 포함)
// });