import { BadRequestException, ForbiddenException, HttpCode, HttpStatus, Injectable, Req } from "@nestjs/common";
import { PrismaService } from "./../prisma/prisma.service";
import { AuthDto, SigninDto } from "./dto";
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService
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
                    user
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

        // find the user by email
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            },
        });

        // if user does not exist throw exception
        if (!user) {
            throw new ForbiddenException('Credential incorrect')
        }

        // compare password
        const passMatches = await argon.verify(user.hash, dto.password)

        // if password incorrect theow exception
        if (!passMatches) {
            throw new ForbiddenException('Credential incorrect')
        }

        // send back the user
        // delete user.hash // remove hash (password hashed) object from the respond
        return this.signToken(user.id, user.email);
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

// const service = new AuthService()