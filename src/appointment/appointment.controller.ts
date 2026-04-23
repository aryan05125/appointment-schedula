import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AppointmentService } from './appointment.service';

@Controller('appointments')
export class AppointmentController {
  constructor(private service: AppointmentService) {}

  @Post()
  book(@Body() dto: any) {
    return this.service.book(dto);
  }

  // 🔥 NEW API
  @Get('slots')
  getSlots(@Query('doctorId') doctorId: number, @Query('date') date: string) {
    return this.service.getAvailableSlots(Number(doctorId), date);
  }
} 