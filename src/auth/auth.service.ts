import { BadRequestException, ForbiddenException, HttpCode, HttpStatus, Injectable, Req, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "./../prisma/prisma.service";
import { AuthDto, SigninDto, VerifyOtpDto } from "./dto";
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { MailService } from "src/mail/mail.service";

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService,
        private mail: MailService,
    ) { }

    async signup(dto: AuthDto) {
        
        // Generate the password hash
        const hash = await argon.hash(dto.password)

        try {
            // Return the new user in the db
            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    hash,
                    name: dto.name,
                    group_id: 3,
                    createdBy: 1
                },
            })

            const otp_value = Math.floor(100000 + Math.random() * 900000)
            const otp = await this.prisma.userOtp.create({
                data: {
                    userId: user.id,
                    otp: otp_value.toString()
                }
            })

            this.mail.sendEmail(user.email, 'Your One Time Password', otp_value.toString())

            delete user.hash
            delete user.refresh_token
            delete user.remember_token
            delete user.jwt_token
            delete user.is_deleted
            
            const resp = {
                status: true,
                statusCode: HttpStatus.CREATED,
                message: 'User has been created',
                data: [
                    user,
                    otp
                ]
            }
            return resp
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') { // the code for unique field
                    const resp = {
                        status: false,
                        statusCode: HttpStatus.FORBIDDEN,
                        message: 'User has been taken',
                        data: []
                    }
                    // console.log("error.code: ", error.code);
                    throw new ForbiddenException(resp)
                    // throw new BadRequestException(resp)
                }
            }
        }
        
    }

    async signin(dto: SigninDto) {
        
        const resp = {
            status: false,
            statusCode: HttpStatus.OK,
            message: '',
            data: []
        }

        // find the user by email
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
                is_deleted: false
            },
        });

        // if user does not exist throw exception
        if (!user) {
            
            resp.statusCode = HttpStatus.FORBIDDEN
            resp.message = 'Credential incorrect'

            throw new ForbiddenException(resp)
        }

        // cek the use is active or not
        if (user.is_active !== true) {
            
            resp.statusCode = HttpStatus.FORBIDDEN
            resp.message = 'Inactive User'

            throw new ForbiddenException(resp)
        }

        // compare password
        const passMatches = await argon.verify(user.hash, dto.password)

        // if password incorrect theow exception
        if (!passMatches) {
            resp.statusCode = HttpStatus.FORBIDDEN
            resp.message = 'Credential incorrect'

            throw new ForbiddenException(resp)
        }

        // send back the user
        // delete user.hash // remove hash (password hashed) object from the respond
        return this.signToken(user.id, user.email);
    }

    async verifyOtp(dto: VerifyOtpDto){
        const resp = {
            status: true,
            statusCode: HttpStatus.OK,
            message: 'OTP matched',
            data: []
        }

        // find the otp by userid with last request
        const user_otp = await this.prisma.userOtp.findFirst({
            where: {
                otp: dto.otp,
                userId: dto.user
            }
        })

        if (!user_otp) {

            resp.status = false
            resp.statusCode = HttpStatus.FORBIDDEN
            resp.message = 'Incorrect OTP'

            throw new ForbiddenException(resp)
        }

        resp.data = [
            {
                user: dto.user,
                otp: dto.otp
            }
        ]
        return resp

        // const date_ob = new Date();
        // const date = ("0" + date_ob.getDate()).slice(-2);
        // const d = ("0" + date_ob.getDate()).slice(-2);
        // const m = ("0" + (date_ob.getMonth() + 1)).slice(-2);
        // const y = date_ob.getFullYear();
        // const h = date_ob.getHours();
        // const i = date_ob.getMinutes();
        // const s = date_ob.getSeconds();
        // console.log("obj: ", date_ob);
        // console.log("d: ", d);
        // console.log("m: ", m);
        // console.log("y: ", y);
        // console.log("h: ", h);
        // console.log("i: ", i);
        // console.log("s: ", s);
        // console.log(y + "-" + m + "-" + date);
        // console.log(h + ":" + m);
        
    }

    async signToken(
        userId: number,
        email: string
    ): Promise<{ access_token: string }> {
        const payload = {
            sub: userId, // sub is stanar for unique data
            email
        }

        const secret_key = this.config.get('JWT_SECRET')

        const token = await this.jwt.signAsync(
            payload, 
            {
                expiresIn: '1d',
                secret: secret_key
            }
        );

        const resp = {
            status: true,
            statusCode: HttpStatus.OK,
            message: 'Login Successfully. Your token available at bellow. Please, use the bearer authentication protokol before use that!',
            access_token: token,
        }

        return resp
    }
}