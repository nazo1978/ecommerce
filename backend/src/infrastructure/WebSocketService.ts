import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { TokenService } from '../core/TokenService';
import { EventBus } from '../core/EventBus';
import { logger } from '../config/logger';

export class WebSocketService {
  private io: SocketIOServer;
  private auctionRooms: Map<string, Set<string>> = new Map(); // auctionId -> Set<socketId>

  constructor(
    httpServer: HTTPServer,
    private readonly tokenService: TokenService,
    private readonly eventBus: EventBus
  ) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*', // Production'da spesifik olmalı
        credentials: true,
      },
    });

    this.setupEventListeners();
    this.setupSocketHandlers();
  }

  private setupEventListeners() {
    // Domain event'lerini WebSocket'e yayınla
    this.eventBus.subscribe('BID_PLACED', (event) => {
      const { auctionId, ...data } = event.payload;
      this.broadcastToAuction(auctionId, 'bid:placed', data);
    });

    this.eventBus.subscribe('AUCTION_STARTED', (event) => {
      const { auctionId } = event.payload;
      this.broadcastToAuction(auctionId, 'auction:started', event.payload);
    });

    this.eventBus.subscribe('AUCTION_ENDED', (event) => {
      const { auctionId } = event.payload;
      this.broadcastToAuction(auctionId, 'auction:ended', event.payload);
    });

    this.eventBus.subscribe('AUCTION_EXTENDED', (event) => {
      const { auctionId } = event.payload;
      this.broadcastToAuction(auctionId, 'auction:extended', event.payload);
    });

    this.eventBus.subscribe('AUCTION_BUY_NOW', (event) => {
      const { auctionId } = event.payload;
      this.broadcastToAuction(auctionId, 'auction:buy_now', event.payload);
    });
  }

  private setupSocketHandlers() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const payload = await this.tokenService.verifyAccessToken(token);
        (socket as any).userId = payload.sub;
        (socket as any).roles = payload.roles;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      const userId = (socket as any).userId;
      logger.info(`WebSocket connected: ${socket.id}, userId: ${userId}`);

      // Join auction room
      socket.on('auction:join', (auctionId: string) => {
        socket.join(`auction:${auctionId}`);
        
        // Track room membership
        const room = this.auctionRooms.get(auctionId) || new Set();
        room.add(socket.id);
        this.auctionRooms.set(auctionId, room);

        logger.info(`User ${userId} joined auction ${auctionId}`);
        
        // Kullanıcıya onay gönder
        socket.emit('auction:joined', { auctionId, userId });

        // Odadaki diğer kullanıcılara bildir
        socket.to(`auction:${auctionId}`).emit('user:joined', { userId });
      });

      // Leave auction room
      socket.on('auction:leave', (auctionId: string) => {
        socket.leave(`auction:${auctionId}`);
        
        const room = this.auctionRooms.get(auctionId);
        if (room) {
          room.delete(socket.id);
          if (room.size === 0) {
            this.auctionRooms.delete(auctionId);
          }
        }

        logger.info(`User ${userId} left auction ${auctionId}`);
        socket.to(`auction:${auctionId}`).emit('user:left', { userId });
      });

      // Heartbeat
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      // Disconnect
      socket.on('disconnect', () => {
        logger.info(`WebSocket disconnected: ${socket.id}`);
        
        // Clean up room memberships
        this.auctionRooms.forEach((room, auctionId) => {
          if (room.has(socket.id)) {
            room.delete(socket.id);
            if (room.size === 0) {
              this.auctionRooms.delete(auctionId);
            }
          }
        });
      });
    });
  }

  broadcastToAuction(auctionId: string, event: string, data: any) {
    this.io.to(`auction:${auctionId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  getActiveUsers(auctionId: string): number {
    return this.auctionRooms.get(auctionId)?.size || 0;
  }

  getServer(): SocketIOServer {
    return this.io;
  }
}
