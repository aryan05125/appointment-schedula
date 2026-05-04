import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from './doctor.entity';
import { Appointment } from '../appointment/appointment.entity'; // 🔥 REQUIRED
import { DoctorService } from './doctor.service';
import { DoctorController } from './doctor.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Doctor,
      Appointment, // 🔥 IMPORTANT (for repository injection)
    ]),
  ],
  providers: [DoctorService],
  controllers: [DoctorController],
})
export class DoctorModule {}