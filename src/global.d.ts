declare module 'express-fileupload' {
    export default function(opts?: any);
}

declare namespace Express {
    export interface Request {
       files?: {[name: string]: {
           name: string,
           mimetype: string,
           data: Buffer,
           size: number
       }}
    }
 }