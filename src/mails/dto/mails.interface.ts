export interface Receiver {
  email: string;
}
export interface Sender {
  name: string;
  email: string;
}

export interface MailParams {
  email: string;
  otp_code: string;
  expire_time: string;
  verify_link: string;
}

export interface MailData {
  receivers: Receiver[];
  subject: string;
  params: MailParams;
  sender: Sender;
}

export interface SendMailByNodemailerData {
  mailData: MailData;
  template: string;
}
