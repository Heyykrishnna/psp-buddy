import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { SyncEventType, SyncEventPayload } from '@/types';
import { JwtService } from '@nestjs/jwt';
import { getAuthSecret } from '@/security/auth.config';
import { db } from '@/database';

@WebSocketGateway({ path: '/ws' })
export class SyncGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private connectedClients: Map<WebSocket, string> = new Map();

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: WebSocket, request?: { url?: string }) {
    const url = new URL(request?.url || '/ws', 'http://localhost');
    const token = url.searchParams.get('token');
    if (!token) {
      client.close(1008, 'Authentication required');
      return;
    }
    try {
      const payload = this.jwtService.verify<{ sub: string }>(token, { secret: getAuthSecret('JWT_ACCESS_SECRET') });
      const user = await db.user.findUnique({ where: { id: payload.sub }, select: { id: true, isActive: true } });
      if (!user?.isActive) throw new Error('Inactive user');
      // Never trust a userId supplied by the client; bind the socket to JWT.sub.
      this.connectedClients.set(client, user.id);
    } catch {
      client.close(1008, 'Invalid authentication');
      return;
    }
    console.log('Client connected to WebSocket Sync Gateway');
  }

  handleDisconnect(client: WebSocket) {
    this.connectedClients.delete(client);
    console.log('Client disconnected from WebSocket Sync Gateway');
  }

  @SubscribeMessage('register_client')
  handleRegister(client: WebSocket, payload: { userId: string }) {
    // Registration is intentionally ignored; connection authentication owns the identity.
    if (!this.connectedClients.has(client)) client.close(1008, 'Authentication required');
  }

  // Broadcast sync event to all active mobile & web clients of a specific user or globally
  broadcastSyncEvent<T>(event: SyncEventType, userId: string, data: T) {
    const payload: SyncEventPayload<T> = {
      event,
      userId,
      data,
      timestamp: Date.now(),
    };

    const messageString = JSON.stringify(payload);

    this.connectedClients.forEach((clientUserId, clientWs) => {
      if (clientWs.readyState === WebSocket.OPEN && (clientUserId === userId || userId === 'GLOBAL')) {
        clientWs.send(messageString);
      }
    });
  }
}
