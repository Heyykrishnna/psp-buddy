import { Injectable } from '@nestjs/common';
import { db } from '../database';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ChatService {
  constructor(private readonly aiService: AiService) {}

  // ── Helper: Resolve User ───────────────────────────────────────────────────
  private async resolveUser(rawUserId?: string): Promise<string> {
    if (rawUserId) {
      const u = await db.user.findUnique({ where: { id: rawUserId } });
      if (u) return u.id;
    }
    const student = await db.student.findFirst({ include: { user: true } });
    if (student?.user) return student.user.id;
    const firstUser = await db.user.findFirst();
    if (firstUser) return firstUser.id;

    // Create fallback student user if none exists
    const newUser = await db.user.create({
      data: {
        email: 'student@lumora.edu',
        firstName: 'Alex',
        lastName: 'Rivera',
        role: 'STUDENT',
      },
    });
    return newUser.id;
  }

  // ── Sessions ───────────────────────────────────────────────────────────────

  async getSessions(rawUserId?: string) {
    const userId = await this.resolveUser(rawUserId);
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

  async createSession(rawUserId?: string, topic?: string) {
    const userId = await this.resolveUser(rawUserId);
    const session = await db.chatSession.create({
      data: { userId, topic: topic || null, title: 'New Chat' },
    });
    return session;
  }

  async deleteSession(rawUserId?: string, sessionId?: string) {
    const userId = await this.resolveUser(rawUserId);
    if (sessionId) {
      await db.chatSession.deleteMany({ where: { id: sessionId, userId } });
    }
    return { deleted: true };
  }

  // ── Messages ───────────────────────────────────────────────────────────────

  async getMessages(rawUserId?: string, sessionId?: string) {
    const userId = await this.resolveUser(rawUserId);
    if (!sessionId) return [];
    const session = await db.chatSession.findFirst({ where: { id: sessionId, userId } });
    if (!session) return [];
    return db.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(
    rawUserId?: string,
    sessionIdInput?: string,
    userMessage?: string,
    topic?: string,
  ) {
    const userId = await this.resolveUser(rawUserId);
    if (!userMessage || !userMessage.trim()) {
      return { reply: 'Please provide a message.', message: 'Please provide a message.' };
    }

    let sessionId = sessionIdInput;

    // Auto-create or resolve active session if sessionId is missing, invalid, or 'active'
    let session = sessionId && sessionId !== 'active' && sessionId !== 'new'
      ? await db.chatSession.findFirst({ where: { id: sessionId, userId } })
      : null;

    if (!session) {
      // Find latest session or create a new one
      session = await db.chatSession.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });

      if (!session) {
        session = await db.chatSession.create({
          data: { userId, topic: topic || 'General CS', title: userMessage.slice(0, 40) },
        });
      }
    }

    sessionId = session.id;

    // 1. Fetch full history for context
    const history = await db.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    // 2. Persist user message in DB
    await db.chatMessage.create({
      data: { sessionId, role: 'user', content: userMessage.trim() },
    });

    // 3. Build conversation array for Groq AI
    const conversationHistory = history.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // 4. Query AI Service
    const aiResult = await this.aiService.chatTutor({
      message: userMessage,
      conversationHistory,
      topic: topic || session.topic || 'General CS',
    });

    const aiReply = aiResult?.reply || 'I am ready to help you with your code!';

    // 5. Persist AI response in DB
    const aiMsg = await db.chatMessage.create({
      data: { sessionId, role: 'assistant', content: aiReply },
    });

    // 6. Update session title from first user message & update timestamp
    if (history.length === 0) {
      const title = userMessage.length > 50 ? userMessage.slice(0, 47) + '...' : userMessage;
      await db.chatSession.update({
        where: { id: sessionId },
        data: { title, updatedAt: new Date() },
      });
    } else {
      await db.chatSession.update({ where: { id: sessionId }, data: { updatedAt: new Date() } });
    }

    return {
      sessionId,
      reply: aiReply,
      message: aiReply,
      aiMessage: aiMsg,
      userMessage,
    };
  }
}
