import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config'; // 🔥 ADD THIS

import { AppointmentModule } from './appointment/appointment.module';
import { DoctorModule } from './doctor/doctor.module';
import { PatientModule } from './patient/patient.module';
import { AuthModule } from './auth/auth.module'; // 🔥 (if using auth)

@Module({
  imports: [
    // 🔥 LOAD .env (VERY IMPORTANT)
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',

      // 🔥 ENV VARIABLES (NOW WILL WORK)
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,

      autoLoadEntities: true,

      synchronize: false, // ✅ correct
    }),

    DoctorModule,
    PatientModule,
    AppointmentModule,
    AuthModule, // 🔥 include if using auth
  ],
})
export class AppModule {}