import { ForbiddenException, Injectable } from "@nestjs/common";
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
                // select: {
                //     id: true,
                //     email: true,
                //     createdAt: true,
                // }
            })

            // delete user.hash
            // delete user.hash // remove hash (password hashed) object from the respond

            // Return the saved user
            // return user;
            return this.signToken(user.id, user.email)
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') { // the code for unique field
                    throw new ForbiddenException('Crendential Taken')
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

        return {
            access_token: token,
        }
    }
}

// const service = new AuthService()