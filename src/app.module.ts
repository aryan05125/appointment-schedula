import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentModule } from './appointment/appointment.module';
import { Appointment } from './appointment/appointment.entity';
import { DoctorModule } from './doctor/doctor.module';
import { PatientModule } from './patient/patient.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'aryan512',
      database: 'appointment',
      autoLoadEntities: true,
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Appointment]),
    DoctorModule,
    PatientModule,
    AppointmentModule,
  ],
})
export class AppModule {}