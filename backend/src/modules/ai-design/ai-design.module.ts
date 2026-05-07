import { Module } from '@nestjs/common';
import { AiDesignController } from './ai-design.controller';
import { AiDesignService } from './ai-design.service';
import { AiDesignComfyController } from './ai-design-comfy.controller';
import { AiDesignComfyService } from './ai-design-comfy.service';
// import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [],
  controllers: [AiDesignController, AiDesignComfyController],
  providers: [AiDesignService, AiDesignComfyService],
})
export class AiDesignModule {}
