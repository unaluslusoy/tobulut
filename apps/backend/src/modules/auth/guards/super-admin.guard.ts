
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
        return false;
    }

    if (user.role === 'superuser' || user.isSuperAdmin === true) {
        return true;
    }

    if (user.tenant && user.tenant.tag === 'system') {
        return true;
    }

    throw new ForbiddenException('Bu alana sadece sistem yöneticileri erişebilir.');
  }
}
