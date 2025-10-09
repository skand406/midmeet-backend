import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { MapService } from './map.service';
import { GeocodeRequestDto } from './dto/geocode-request.dto';

@Controller('map') // 프론트엔드가 요청할 경로: /api/geocode
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Post('geocode')
  @HttpCode(HttpStatus.OK)
  async geocodeAddress(@Body() geocodeRequestDto: GeocodeRequestDto) {
    const { EPSG_4326_X: lat, EPSG_4326_Y: lng } = await this.mapService.getCoordinates(geocodeRequestDto.address);
    
    // ✅ 프론트엔드로 위도/경도 데이터 반환
    return {lat, lng };
  }
}

