import { Body, Controller, Post } from '@nestjs/common';
import { authUserDto } from './dto/authUserDto.dto';
import { LoginService } from './login.service';

@Controller('login')
export class LoginController {
  constructor(private loginService: LoginService) {}

  @Post()
  auth(@Body() authUser: authUserDto) {
    return this.loginService.auth(authUser);
  }
}
