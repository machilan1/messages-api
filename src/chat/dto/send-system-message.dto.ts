import { Equals } from 'class-validator';
import { SendMessageDto } from './send-message.dto';
export class SendSystemMessageDto extends SendMessageDto {
  @Equals('system')
  type: 'system';
}
