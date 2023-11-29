import { Body, Controller, Get, Param, Query } from '@nestjs/common';
import { UserService } from './service/user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getUsers(@Query('substring') param: string) {
    return this.userService.searchManyByName(param);
  }
}
