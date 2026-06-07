declare module "nodemailer" {
  type SendMailOptions = {
    from?: string;
    to?: string;
    subject?: string;
    text?: string;
    html?: string;
  };

  type SendMailResult = {
    messageId?: string;
    response?: string;
    message?: unknown;
  };

  type Transporter = {
    sendMail(options: SendMailOptions): Promise<SendMailResult>;
  };

  const nodemailer: {
    createTransport(options: Record<string, unknown>): Transporter;
  };

  export default nodemailer;
}
