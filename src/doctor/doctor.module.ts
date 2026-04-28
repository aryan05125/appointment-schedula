import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from './doctor.entity';
import { DoctorService } from './doctor.service';
import { DoctorController } from './doctor.controller';
import { AppointmentModule } from '../appointment/appointment.module'; // 🔥 ADD

@Module({
  imports: [
    TypeOrmModule.forFeature([Doctor]),
    AppointmentModule, // 🔥 IMPORTANT
  ],
  providers: [DoctorService],
  controllers: [DoctorController],
})
export class DoctorModule {}