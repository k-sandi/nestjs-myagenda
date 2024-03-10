import { Body, Controller, Post } from '@nestjs/common';
import { MailService } from './mail.service';

@Controller('mail')
export class MailController {
    constructor(private readonly emailService: MailService) { }

    @Post('send')
    async sendEmail(@Body('to') to: string, @Body('subject') subject: string, @Body('text') text: string) {
        await this.emailService.sendEmail(to, subject, text);
        return { message: 'Email sent' };
    }
}
