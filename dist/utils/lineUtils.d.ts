import { NextApiRequest } from 'next';
export declare function verifyLineSignature(req: NextApiRequest): boolean;
export declare const validateVerificationCode: (code: string) => boolean;
