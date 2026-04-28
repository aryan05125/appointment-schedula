import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { AppointmentService } from '../appointment/appointment.service';

@Controller('doctor')
export class DoctorController {
  constructor(
    private service: DoctorService,
    private appointmentService: AppointmentService, // 🔥 ADD THIS
  ) {}

  // ✅ Create Doctor
  @Post()
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  // ✅ Get All Doctors
  @Get()
  findAll() {
    return this.service.findAll();
  }

  // 🔥 FIXED: Doctor Leave + Reschedule Call
  @Post(':id/leave')
  markLeave(
    @Param('id') id: number,
    @Body() body: { date: string },
  ) {
    return this.appointmentService.handleDoctorLeave(
      Number(id),
      body.date,
    );
  }
}