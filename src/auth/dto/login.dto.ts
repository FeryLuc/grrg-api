import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
export class LoginDto {
  @IsEmail({}, { message: 'Eamil invalide.' })
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
