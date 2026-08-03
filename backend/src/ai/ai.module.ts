import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  controllers: [AiController, ChatController],
  providers: [AiService, ChatService],
  exports: [AiService, ChatService],
})
export class AiModule {}
