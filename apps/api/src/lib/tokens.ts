import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AccessTokenPayload {
  sub:               string;  // admin _id
  email:             string;
  name:              string;
  role:              string;
  customPermissions: string[];
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.jwtAccessSecret, {
    expiresIn: config.jwtAccessExpires as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.jwtAccessSecret) as AccessTokenPayload;
}

export function signRefreshToken(adminId: string): string {
  return jwt.sign({ sub: adminId }, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpires as jwt.SignOptions['expiresIn'],
  });
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, config.jwtRefreshSecret) as { sub: string };
}
