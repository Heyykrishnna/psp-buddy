import { Injectable } from '@nestjs/common';
import { db } from '../database';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ChatService {
  constructor(private readonly aiService: AiService) {}

  // -- Sessions --

  async getSessions(userId: string) {
    const sessions = await db.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        topic: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { content: true, role: true },
        },
      },
    });
    return sessions;
  }

  async createSession(userId: string, topic?: string) {
    const session = await db.chatSession.create({
      data: { userId, topic: topic || null, title: 'New Chat' },
    });
    return session;
  }

  async deleteSession(userId: string, sessionId: string) {
    await db.chatSession.deleteMany({ where: { id: sessionId, userId } });
    return { deleted: true };
  }

  // -- Messages --

  async getMessages(userId: string, sessionId: string) {
    const session = await db.chatSession.findFirst({ where: { id: sessionId, userId } });
    if (!session) return [];
    return db.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(
    userId: string,
    sessionId: string,
    userMessage: string,
    topic?: string,
  ) {
    // Fetch full history
    const history = await db.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    // Persist user message
    await db.chatMessage.create({
      data: { sessionId, role: 'user', content: userMessage },
    });

    // Build conversation array for Groq
    const conversationHistory = history.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Get AI reply
    const aiResult = await this.aiService.chatTutor({
      message: userMessage,
      conversationHistory,
      topic: topic || (await db.chatSession.findUnique({ where: { id: sessionId } }))?.topic || undefined,
    });

    const aiReply = aiResult?.reply || 'No response from AI.';

    // Persist AI reply
    const aiMsg = await db.chatMessage.create({
      data: { sessionId, role: 'assistant', content: aiReply },
    });

    // Update session title from first user message
    if (history.length === 0) {
      const title = userMessage.length > 50 ? userMessage.slice(0, 47) + '...' : userMessage;
      await db.chatSession.update({
        where: { id: sessionId },
        data: { title, updatedAt: new Date() },
      });
    } else {
      await db.chatSession.update({ where: { id: sessionId }, data: { updatedAt: new Date() } });
    }

    return { reply: aiReply, messageId: aiMsg.id };
  }
}
