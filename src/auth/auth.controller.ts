import {
    Controller,
    Post,
    Body,
    BadRequestException,
  } from '@nestjs/common';
  import { AuthService } from './auth.service';
  
  @Controller('auth')
  export class AuthController {
    constructor(private service: AuthService) {}
  
    // 🔐 REGISTER
    @Post('register')
    register(
      @Body() body: { phone: string; password: string; name: string },
    ) {
      if (!body.phone || !body.password || !body.name) {
        throw new BadRequestException(
          'phone, password and name are required',
        );
      }
  
      return this.service.register(
        body.phone,
        body.password,
        body.name, // 🔥 FIXED
      );
    }
  
    // 🔐 LOGIN
    @Post('login')
    login(@Body() body: { phone: string; password: string }) {
      if (!body.phone || !body.password) {
        throw new BadRequestException(
          'phone and password are required',
        );
      }
  
      return this.service.login(body.phone, body.password);
    }
  }