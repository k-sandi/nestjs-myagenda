import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "./strategy";
import { MailModule } from "src/mail/mail.module";
import { MailService } from "src/mail/mail.service";

@Module({
    imports: [
        JwtModule.register({})
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, MailService]
})
export class AuthModule { }