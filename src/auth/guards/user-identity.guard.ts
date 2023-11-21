import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';
import { AuthService } from '../service/auth.service';
import { WsException } from '@nestjs/websockets';
@Injectable()
export class LegitSenderGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const data = context.switchToWs().getData();
    const jwt = client.handshake.headers.authorization.split(' ')[1];
    const decodedJwt = await this.authService.verifyJwt(jwt);

    if (data.authorId === decodedJwt.user.id) {
      return true;
    } else {
      throw new WsException('Authorization error (WS)');
    }
  }
}
