import {
    IsString,
    IsNotEmpty,
    IsArray,
    IsNumber,
    IsOptional,
  } from 'class-validator';
  
  export class CreateDoctorDto {
    @IsString()
    @IsNotEmpty()
    name: string;
  
    @IsString()
    @IsOptional()
    specialization?: string;
  
    @IsNumber()
    @IsOptional()
    hospitalId?: number;
  
    @IsArray()
    workingDays: string[];
  
    @IsString()
    startTime: string;
  
    @IsString()
    endTime: string;
  
    @IsNumber()
    slotDuration: number;
  
    // 🔥 Address fields
    @IsString()
    @IsOptional()
    clinicName?: string;
  
    @IsString()
    @IsOptional()
    addressLine?: string;
  
    @IsString()
    @IsOptional()
    city?: string;
  
    @IsString()
    @IsOptional()
    state?: string;
  
    @IsString()
    @IsOptional()
    pincode?: string;
  }