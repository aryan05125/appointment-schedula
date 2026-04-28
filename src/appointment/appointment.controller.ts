import { Controller, Post, Body, Get, Query, BadRequestException } from '@nestjs/common';
import { AppointmentService } from './appointment.service';

@Controller('appointments')
export class AppointmentController {
  constructor(private service: AppointmentService) {}

  // ✅ BOOK APPOINTMENT (IVR STYLE - WITH OPTIONAL PREFERRED DATE)
  @Post()
  book(
    @Body()
    dto: {
      doctorId: number;
      patientId: number;
      preferredDate?: string; // 🔥 NEW (optional input)
    },
  ) {
    if (!dto.doctorId || !dto.patientId) {
      throw new BadRequestException('doctorId and patientId are required');
    }

    return this.service.book(dto);
  }

  // ✅ GET AVAILABLE SLOTS (SUMMARY)
  @Get('slots')
  getSlots(
    @Query('doctorId') doctorId: number,
    @Query('date') date: string,
  ) {
    if (!doctorId || !date) {
      throw new BadRequestException('doctorId and date are required');
    }

    return this.service.getAvailableSlots(Number(doctorId), date);
  }

  // 🔥 NEW: GET NEXT AVAILABLE DAY (as per requirement)
  @Get('next-available')
  getNextAvailable(
    @Query('doctorId') doctorId: number,
    @Query('from') from: string,
  ) {
    if (!doctorId) {
      throw new BadRequestException('doctorId is required');
    }

    return this.service.getNextAvailableDay(
      Number(doctorId),
      from || new Date().toISOString().split('T')[0],
    );
  }
}