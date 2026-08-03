import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('sessions')
  async getSessions(@Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.chatService.getSessions(userId);
  }

  @Post('sessions')
  async createSession(@Req() req: any, @Body() body: { topic?: string }) {
    const userId = req.user?.sub || req.user?.id;
    return this.chatService.createSession(userId, body.topic);
  }

  @Delete('sessions/:id')
  async deleteSession(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.sub || req.user?.id;
    return this.chatService.deleteSession(userId, id);
  }

  @Get('sessions/:id/messages')
  async getMessages(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.sub || req.user?.id;
    return this.chatService.getMessages(userId, id);
  }

  @Post('sessions/:id/messages')
  async sendMessage(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { message: string; topic?: string },
  ) {
    const userId = req.user?.sub || req.user?.id;
    return this.chatService.sendMessage(userId, id, body.message, body.topic);
  }
}
