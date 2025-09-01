import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TickService, TickData } from '../Services/TickService';
import { NPCTickIntegrationService } from '../Services/NPCTickIntegrationService';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('GameGateway');
  private connectedClients: Map<string, Socket> = new Map();

  constructor(
    private tickService: TickService,
    @Inject(forwardRef(() => NPCTickIntegrationService))
    private npcTickIntegration: NPCTickIntegrationService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    this.tickService.on('tick', (tickData: TickData) => {
      this.broadcastToAll('tick', tickData);
    });
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.room);
    this.logger.log(`Client ${client.id} joined room: ${data.room}`);
    client.emit('joinedRoom', { room: data.room });
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(data.room);
    this.logger.log(`Client ${client.id} left room: ${data.room}`);
    client.emit('leftRoom', { room: data.room });
  }

  broadcastToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }

  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  @SubscribeMessage('getNPCStatus')
  async handleGetNPCStatus(@ConnectedSocket() client: Socket) {
    try {
      const status = await this.npcTickIntegration.getIntegrationStatus();
      client.emit('npcStatus', status);
    } catch (error) {
      client.emit('error', { message: 'Failed to get NPC status' });
    }
  }

  @SubscribeMessage('updateNPCIntervals')
  async handleUpdateNPCIntervals(
    @MessageBody() data: {
      demandGeneration?: number;
      contractEvaluation?: number;
      contractRenewal?: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.npcTickIntegration.updateIntervals(data);
      client.emit('npcIntervalsUpdated', { success: true });
    } catch (error) {
      client.emit('error', { message: 'Failed to update NPC intervals' });
    }
  }

  @OnEvent('npc-revenue-processed')
  handleNPCRevenueProcessed(data: any) {
    this.broadcastToAll('npc-revenue-processed', data);
  }
}