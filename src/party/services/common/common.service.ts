import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import puppeteer from 'puppeteer';

@Injectable()
export class CommonService {
  formatLegs(legs: any[]) {
    return legs.map((leg, idx) => {
      const n = idx + 1;
      const from = leg.from.name;
      const to = leg.to.name;
      const dist = Math.round(leg.distance);
      const min = Math.round(leg.duration / 60);

      // ---- 교통수단 이름 매핑 ----
      const routeType = leg.routeType;
      const routeShortName = leg.routeShortName || leg.route || '';

      const modeName = !leg.transitLeg
        ? '걷기'
        : routeType === 3
          ? '시외버스'
          : routeType === 1
            ? '지하철'
            : routeType === 0
              ? '마을버스'
              : routeType === 2
                ? '기차'
                : 'TRANSIT';

      if (n === 1) {
        return `${n}단계: ${modeName}, 거리 ${dist}m, 약 ${min}분\n${routeShortName} 출발 → ${to}`;
      } else if (n === legs.length) {
        return `${n}단계: ${modeName}, ${routeShortName}\n${from} → 도착\n거리 ${dist}m\n, 약 ${min}분`;
      } else {
        return `${n}단계: ${modeName}, ${routeShortName}\n${from} → ${to}\n거리 ${dist}m\n, 약 ${min}분`;
      }

      // ---- WALK ----
      // if (!leg.transitLeg) {
      // return `Leg ${n}: ${modeName} (${from} → ${to})\n거리 ${dist}m\n약 ${min}분`;
      // }

      // ---- TRANSIT ----
    });
  }

  async getPlaceImageUrl(place_url: string): Promise<string> {
    const targetSelector = 'a.link_photo img'; // 찾고자 하는 요소 (a.link_photo 내부의 img 태그)

    let browser;

    try {
      // 1. Puppeteer 시작 (헤드리스 모드)
      browser = await puppeteer.launch({
        headless: true,
        // Docker 등 환경에 따라 args 옵션 필요할 수 있음
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();

      // 2. URL 접속 및 로딩 대기
      await page.goto(place_url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // 3. 원하는 요소가 나타날 때까지 기다림
      await page.waitForSelector(targetSelector, { timeout: 10000 });

      // 4. 추출 로직 실행 (페이지 컨텍스트 내에서 실행)
      const imageUrl = await page.evaluate((selector) => {
        const imgElement = document.querySelector(selector);
        if (imgElement) {
          let src = imgElement.getAttribute('src');
          // 프로토콜 상대 경로일 경우 'https:' 추가
          if (src && src.startsWith('//')) {
            src = 'https:' + src;
          }
          return src;
        }
        return null;
      }, targetSelector);

      if (!imageUrl) {
        throw new NotFoundException(
          '요청한 장소의 이미지 요소를 찾을 수 없습니다.',
        );
      }

      return imageUrl;
    } catch (error) {
      console.error('카카오 스크래핑 오류:');
      // Puppeteer 타임아웃, 셀렉터 찾기 실패 등 다양한 에러 처리
      return ''; // ← 어떤 에러든 빈 문자열만 반환
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
