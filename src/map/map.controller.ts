import { Controller, Post, Body } from '@nestjs/common';
import { MapService } from './map.service';
import { GeocodeRequestDto } from './dto/geocode-request.dto';

@Controller('map') // 프론트엔드가 요청할 경로: /api/geocode
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Post('geocode')
  async geocodeAddress(@Body() geocodeRequestDto: GeocodeRequestDto) {
    const { lat, lng } = await this.mapService.getCoordinates(geocodeRequestDto.address);
    
    // ✅ 프론트엔드로 위도/경도 데이터 반환
    return { lat, lng };
  }
}

