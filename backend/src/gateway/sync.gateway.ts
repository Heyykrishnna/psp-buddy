import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { SyncEventType, SyncEventPayload } from '@/types';

@WebSocketGateway({ path: '/ws' })
export class SyncGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private connectedClients: Map<WebSocket, string> = new Map();

  handleConnection(client: WebSocket, ...args: any[]) {
    // In production, extract user_id from query params/token verification
    console.log('Client connected to WebSocket Sync Gateway');
  }

  handleDisconnect(client: WebSocket) {
    this.connectedClients.delete(client);
    console.log('Client disconnected from WebSocket Sync Gateway');
  }

  @SubscribeMessage('register_client')
  handleRegister(client: WebSocket, payload: { userId: string }) {
    this.connectedClients.set(client, payload.userId);
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
