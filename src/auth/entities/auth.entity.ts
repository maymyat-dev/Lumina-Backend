export class JwtPayloadUser {
  user_id: string;
}

export class JwtResponseUser {
  data: {
    user_id: string;
  };
}

export interface UserAuthRequest extends Request {
  user: { user_id: string };
}

export enum OTP_TYPE {
  REGISTER = 'REGISTER',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
}