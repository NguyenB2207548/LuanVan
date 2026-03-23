import { Module } from '@nestjs/common';
import { AiDesignController } from './ai-design.controller';
import { AiDesignService } from './ai-design.service';
// import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [
    ],
    controllers: [AiDesignController],
    providers: [AiDesignService],
})
export class AiDesignModule { }
