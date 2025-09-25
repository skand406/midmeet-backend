import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';

@Global()
@Module({
    imports: [],
    controllers: [],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule {}
