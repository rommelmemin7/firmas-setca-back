// utils/dateUtils.ts


import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import * as crypto from 'crypto';

export class Utils {
  static formatResponseFail(errorMsg: any): any {
    return {
      ok: false,
      msgOk: null,
      error: errorMsg,
      data: {},
    };
  }

  static formatResponseSuccess(msg: String, data: any = {}): any {
    return {
      ok: true,
      msgOk: msg,
      error: null,
      data: data,
    };
  }

  static async hashPassword(password) {
    const hash = await bcrypt.hash(password, 10);
    return hash;
  }

  static async comparePassword(enteredPassword, dbPassword) {
    const match = await bcrypt.compare(enteredPassword, dbPassword);
    return match;
  }


  static generateNumericCode(length: number = 6): string {
    const max = Math.pow(10, length) - 1;
    const min = Math.pow(10, length - 1);
    const randomBuffer = randomBytes(4);
    const randomInt = randomBuffer.readUInt32BE(0);
    const randomNumber = min + (randomInt % (max - min + 1));
    return randomNumber.toString().padStart(length, '0');
  }

  static generateAlphanumericString(length: number): string {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }

    return result;
  }

  static sumarMinutos(date: Date, minutes: number): Date {
    const newDate = new Date(date.getTime());
    newDate.setMinutes(newDate.getMinutes() + minutes);
    return newDate;
  }

  static generateRandomString() {
    const result = Math.random().toString(36).substring(2, 8);
    return result;
  }

  /**
   * Resta la fecha1 menos la fecha2 y da el resultado en segundos
   */
  static restarFechas(fecha1: Date, fecha2: Date): number {
    const milisegundosFecha1 = fecha1.getTime();
    const milisegundosFecha2 = fecha2.getTime();
    const diferenciaMilisegundos = Math.abs(
      milisegundosFecha1 - milisegundosFecha2,
    );
    return Math.floor(diferenciaMilisegundos / 1000);
  }

  static decryptPassword(
    encryptedPassword: string,
    key: string,
    ivString: string,
  ): string {
    const iv = Buffer.from(ivString, 'utf8');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(key),
      iv,
    );
    let decrypted = "";
    try{
      decrypted = decipher.update(encryptedPassword, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
    }catch(e){}
    return decrypted;
  }

  static encryptPassword(
    password: string,
    key: string,
    ivString: string,
  ): string {
    const iv = Buffer.from(ivString, 'utf8');
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let encrypted = cipher.update(password, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  }

  static rellenarConCeros(str:string, longitud:number) {
    return str.padStart(longitud, '0');
  }

   static formatDates<T extends { createdAt: Date; updatedAt: Date; approvedAt?: Date | null }
>(data: T | T[]): any {
  const formatItem = (item: T) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    ...(item.approvedAt
      ? { approvedAt: item.approvedAt.toISOString() }
      : { approvedAt: null }),
  });

  if (Array.isArray(data)) {
    return data.map(formatItem);
  } else {
    return formatItem(data);
  }
}


 
}


