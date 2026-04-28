import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './appointment.entity';
import { Doctor } from '../doctor/doctor.entity';
import { Patient } from '../patient/patient.entity';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      Doctor,
      Patient,
    ]),
  ],
  providers: [AppointmentService],
  controllers: [AppointmentController],

  // 🔥 IMPORTANT (this was missing)
  exports: [AppointmentService],
})
export class AppointmentModule {}