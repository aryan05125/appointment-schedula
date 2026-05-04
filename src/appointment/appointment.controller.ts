import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Delete,
  Param,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';

@Controller('appointments')
export class AppointmentController {
  constructor(private service: AppointmentService) {}

  // 🔥 BOOK APPOINTMENT (AUTO SLOT SUPPORT)
  @Post()
  book(
    @Body()
    dto: {
      doctorId: number;
      patientId: number;
      date: string;
      timeSlot?: string; // 🔥 optional now
    },
  ) {
    if (!dto.doctorId || !dto.patientId || !dto.date) {
      throw new BadRequestException(
        'doctorId, patientId, and date are required',
      );
    }

    return this.service.book(dto);
  }

  // 🔥 GET AVAILABLE SLOTS
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

  // 🔥 NEXT AVAILABLE DAY
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

  // 🔥 CANCEL APPOINTMENT
  @Delete(':id')
  cancel(
    @Param('id') id: number,
    @Body() body: { reason?: string },
  ) {
    return this.service.cancel(Number(id), body?.reason);
  }

  // 🔥 RESCHEDULE APPOINTMENT (NEW API)
  @Patch(':id/reschedule')
  reschedule(
    @Param('id') id: number,
    @Body()
    body: {
      newDate: string;
      newTimeSlot?: string;
    },
  ) {
    if (!body.newDate) {
      throw new BadRequestException('newDate is required');
    }

    return this.service.reschedule(Number(id), body);
  }
}