import { Module } from '@nestjs/common';
import { MapController } from './map.controller';
import { MapService } from './map.service';
import { HttpModule } from '@nestjs/axios';

@Module({    
    imports: [
        HttpModule.register({ // ✅ 이렇게 초기화
            timeout: 5000,
            maxRedirects: 5,
        }),
    ],
    controllers: [MapController],
    providers: [MapService],
})

export class MapModule {}