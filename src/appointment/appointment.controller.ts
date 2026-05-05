import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Delete,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('appointments')
export class AppointmentController {
  constructor(private service: AppointmentService) {}

  // 🔐 BOOK APPOINTMENT (PROTECTED)
  @UseGuards(AuthGuard('jwt'))
  @Post()
  book(@Body() dto: CreateAppointmentDto) {
    return this.service.book(dto);
  }

  // 🌐 GET AVAILABLE SLOTS (PUBLIC)
  @Get('slots')
  getSlots(
    @Query('doctorId') doctorId: string,
    @Query('date') date: string,
  ) {
    return this.service.getAvailableSlots(Number(doctorId), date);
  }

  // 🌐 NEXT AVAILABLE DAY (PUBLIC)
  @Get('next-available')
  getNextAvailable(
    @Query('doctorId') doctorId: string,
    @Query('from') from: string,
  ) {
    return this.service.getNextAvailableDay(
      Number(doctorId),
      from || new Date().toISOString().split('T')[0],
    );
  }

  // 🔐 CANCEL APPOINTMENT (PROTECTED)
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  cancel(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.service.cancel(Number(id), body?.reason);
  }

  // 🔐 RESCHEDULE APPOINTMENT (PROTECTED)
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/reschedule')
  reschedule(
    @Param('id') id: string,
    @Body()
    body: {
      newDate: string;
      newTimeSlot?: string;
    },
  ) {
    return this.service.reschedule(Number(id), body);
  }
}