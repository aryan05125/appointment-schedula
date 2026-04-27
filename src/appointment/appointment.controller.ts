import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AppointmentService } from './appointment.service';

@Controller('appointments')
export class AppointmentController {
  constructor(private service: AppointmentService) {}

  // ✅ BOOK APPOINTMENT (IVR STYLE - NO TIME INPUT)
  @Post()
  book(@Body() dto: { doctorId: number; patientId: number }) {
    return this.service.book(dto);
  }

  // ✅ OPTIONAL: GET SLOT SUMMARY (for debugging / testing)
  @Get('slots')
  getSlots(
    @Query('doctorId') doctorId: number,
    @Query('date') date: string,
  ) {
    return this.service.getAvailableSlots(Number(doctorId), date);
  }
}