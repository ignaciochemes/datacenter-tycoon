import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtSecurityService } from 'src/Services/Security/JwtSecurityService';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private readonly jwtSecurityService: JwtSecurityService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        
        if (!token) {
            throw new UnauthorizedException('Access token is required');
        }

        try {
            const payload = await this.jwtSecurityService.verifyToken(token);
            if (!payload) {
                throw new UnauthorizedException('Invalid or expired token');
            }
            request.user = payload;
            return true;
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }

    private extractTokenFromHeader(request: any): string | undefined {
        const authHeader = request.headers['access-token'];
        if (!authHeader) {
            return undefined;
        }
        return authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    }
}