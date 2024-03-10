import { IsNotEmpty, IsNumber, IsString } from "class-validator"

export class VerifyOtpDto {
    @IsString()
    @IsNotEmpty()
    otp: string

    @IsNumber()
    @IsNotEmpty()
    user: number

}