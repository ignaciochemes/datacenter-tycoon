import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/Helpers/Decorators/CurrentUserDecorator";
import Response from "src/Helpers/Formatter/Response";
import { JwtAuthGuard } from "src/Guards/JwtAuthGuard";
import LoginRequest from "src/Models/Request/AuthController/LoginRequest";
import RegisterRequest from "src/Models/Request/AuthController/RegisterRequest";
import AuthResponse from "src/Models/Response/AuthController/AuthResponse";
import { AuthService } from "src/Services/AuthService";

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginRequest: LoginRequest): Promise<Response<AuthResponse>> {
        const response = await this.authService.login(loginRequest);
        return Response.create<AuthResponse>(response);
    }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() registerRequest: RegisterRequest): Promise<Response<AuthResponse>> {
        const response = await this.authService.register(registerRequest);
        return Response.create<AuthResponse>(response);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async getCurrentUser(@CurrentUser('id') userId: number): Promise<Response<any>> {
        const user = await this.authService.getCurrentUser(userId);
        return Response.create<any>({
            id: user.getId(),
            email: user.getEmail(),
            uuid: user.getUuid(),
            rol: {
                id: user.getRol().getId(),
                name: user.getRol().getDescription()
            }
        });
    }
}