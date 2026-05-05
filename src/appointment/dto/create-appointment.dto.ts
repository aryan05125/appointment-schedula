import {
    IsNumber,
    IsString,
    IsNotEmpty,
    IsOptional,
  } from 'class-validator';
  
  export class CreateAppointmentDto {
    @IsNumber()
    doctorId: number;
  
    @IsNumber()
    patientId: number;
  
    @IsString()
    @IsNotEmpty()
    date: string;
  
    @IsString()
    @IsOptional()
    timeSlot?: string;
  }