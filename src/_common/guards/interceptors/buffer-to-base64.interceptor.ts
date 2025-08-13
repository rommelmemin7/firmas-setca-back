import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class BufferToBase64Interceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => this.transformBuffers(data)));
  }

  private transformBuffers(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    // Prisma devuelve a veces Uint8Array en vez de Buffer
    if (obj instanceof Uint8Array) {
      return Buffer.from(obj).toString('base64');
    }

    if (Buffer.isBuffer(obj)) {
      return obj.toString('base64');
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.transformBuffers(item));
    }

    if (typeof obj === 'object') {
      const newObj: any = {};
      for (const key of Object.keys(obj)) {
        newObj[key] = this.transformBuffers(obj[key]);
      }
      return newObj;
    }

    return obj;
  }
}
