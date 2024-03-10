import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {

    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: {
                user: "7fb5d26018a06c",
                pass: "34e6b81d98edb9"
            }
        });
    }

    
    async sendEmail(to: string, subject: string, text: string) {
        const mailOptions = {
            from: 'notification@duniacoding.id',
            to,
            subject,
            text,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully');
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }

}

/*
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(email: string, subject: string, message: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: subject,
      text: message,
    });
  }
}
*/