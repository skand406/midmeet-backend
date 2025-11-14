import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from './otp.service';
import { PrismaService } from '../prisma/prisma.service';
import { HttpModule } from '@nestjs/axios';
import { ParticipantService } from '../party/services/participant.service';
import { JwtService } from '@nestjs/jwt';
import { MapService } from '../party/services/map.service';
import * as fs from 'fs';
import * as path from 'path';
import * as turf from '@turf/turf';

/**
 * 여러 좌표에 대해 Isochrone(등시선) 생성 후 지도 시각화 테스트
 */
describe('OtpService Isochrone', () => {
  let service: OtpService;
  jest.setTimeout(350000);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        OtpService,
        PrismaService,
        ParticipantService,
        { provide: JwtService, useValue: {} },
        { provide: MapService, useValue: {} },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
  });

  const OUTPUT_DIR = path.join(__dirname, '../../output');
  const ensureOutputDir = () => {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  };

  // ✅ 타임아웃 30초
  it('should create multi-location isochrones and visualize on map', async () => {

    // ✅ 여러 출발 좌표 설정
    const centers = [
      { name: 'a', lat: 37.504322, lon: 126.76354, color: '#2E86DE' },
      { name: 'b', lat: 37.4564, lon: 126.7052, color: '#10AC84' },
      { name: 'c', lat: 37.3188, lon: 126.8384, color: '#F39C12' },
      { name: 'd', lat: 37.2665, lon: 127.0008, color: '#e91e63' },
    ];

    // ✅ 중간 시간 기반 cutoff 계산
    const cutoff = service.formatToCutoff(
      await service.getMiddleTime('cmgtgcvde0000vprgzmvixr3m')
    );
    //console.log(cutoff);
    const layers: Array<{ name: string; color: string; geojson: any }> = [];

    // ✅ 각 좌표에 대해 isochrone 요청
    // for (const c of centers) {
    //   try {
    //     const gj = await service.getCrossMid('cmgtgcvde0000vprgzmvixr3m');//await service.test(c.lat,c.lon, cutoff);
    //     layers.push({ name: c.name, color: c.color, geojson: gj });
    //   } catch (e) {
    //     console.warn(`Isochrone failed for ${c.name}:`, (e as Error).message);
    //   }
    // }
    const test = await service.getCrossMid('cmgtgcvde0000vprgzmvixr3m');
    if(!test) {
      console.log("테스트 실패");
      return "";
    }
    
    //const gj = await service.test(c.lat,c.lon, cutoff);
    layers.push({ name: 'name', color: '#e91e63', geojson: turf.featureCollection([test]) });
    ensureOutputDir();

    // ✅ 결과 저장
    layers.forEach((l) => {
      const jsonFilePath = path.join(OUTPUT_DIR, `isochrone-${l.name}.json`);
      fs.writeFileSync(jsonFilePath, JSON.stringify(l.geojson, null, 2), 'utf8');
    });

    // ✅ HTML 시각화 생성
    const html = `
      <!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Isochrone Visualization</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>#map{height:640px} body{margin:16px;font-family:Arial}</style>
</head>
<body>
  <h2>Isochrone Visualization (Multiple Centers)</h2>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map').setView([37.45, 126.8], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);

    const layers = ${JSON.stringify(layers)};
    const centers = ${JSON.stringify(centers)};

    let bounds;
    layers.forEach((l, i) => {
      const c = centers[i];
      const layer = L.geoJSON(l.geojson, {
        style: { color: l.color, weight: 2, fillColor: l.color, fillOpacity: 0.25 }
      }).addTo(map);

      if (!bounds) bounds = layer.getBounds();
      else bounds = bounds.extend(layer.getBounds());

      // ✅ 여기서 c.lat, c.lon 정상 접근됨
      L.marker([c.lat, c.lon])
        .bindPopup(c.name + " 출발지")
        .addTo(map);
    });

    if (bounds) map.fitBounds(bounds);
  </script>
</body>
</html>`;

    const htmlPath = path.join(OUTPUT_DIR, 'isochrone.html');
    fs.writeFileSync(htmlPath, html, 'utf8');

    console.log(`✅ Isochrone map HTML generated: ${htmlPath}`);
    expect(layers.length).toBeGreaterThan(0);
  }, 30000);
});
