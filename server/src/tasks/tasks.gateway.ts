import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Task } from './entities/task.entity';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class TasksGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    // console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    // console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinProject')
  handleJoinProject(@ConnectedSocket() client: Socket, @MessageBody() projectId: string) {
    const room = `project_${projectId}`;
    client.join(room);
    return { event: 'joined', data: room };
  }

  @SubscribeMessage('leaveProject')
  handleLeaveProject(@ConnectedSocket() client: Socket, @MessageBody() projectId: string) {
    const room = `project_${projectId}`;
    client.leave(room);
    return { event: 'left', data: room };
  }

  // Helper method to emit events from TasksService
  notifyTaskUpdated(projectId: string, task: Task) {
    this.server.to(`project_${projectId}`).emit('task:updated', task);
  }

  notifyTaskCreated(projectId: string, task: Task) {
    this.server.to(`project_${projectId}`).emit('task:created', task);
  }

  notifyTaskDeleted(projectId: string, taskId: string) {
    this.server.to(`project_${projectId}`).emit('task:deleted', { id: taskId, projectId });
  }
}
