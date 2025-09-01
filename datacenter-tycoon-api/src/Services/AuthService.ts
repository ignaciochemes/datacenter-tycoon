import { BadRequestException, Injectable } from "@nestjs/common";
import { v4 as uuidv4 } from 'uuid';
import { RolDao } from "src/Daos/RolDao";
import { UserDao } from "src/Daos/UserDao";
import { HttpCustomException } from "src/Exceptions/HttpCustomException";
import { User } from "src/Models/Entities/UserEntity";
import LoginRequest from "src/Models/Request/AuthController/LoginRequest";
import RegisterRequest from "src/Models/Request/AuthController/RegisterRequest";
import AuthResponse from "src/Models/Response/AuthController/AuthResponse";
import UtilityFunctions from "src/Helpers/Utilities/UtilityFunctions";
import { StatusCodeEnums } from "src/Enums/StatusCodeEnums";
import { JwtSecurityService } from "./Security/JwtSecurityService";
import RoleConstants from "src/Constants/RoleConstants";

@Injectable()
export class AuthService {
    constructor(
        private readonly userDao: UserDao,
        private readonly rolDao: RolDao,
        private readonly jwtSecurityService: JwtSecurityService
    ) {}

    async login(loginRequest: LoginRequest): Promise<AuthResponse> {
        const user = await this.userDao.getUserByEmail(loginRequest.email);
        if (!user) {
            throw new HttpCustomException('Invalid credentials', StatusCodeEnums.INVALID_CREDENTIALS);
        }

        const isValidPassword = await UtilityFunctions.getEncryptCompare(
            loginRequest.password,
            user.getPassword()
        );
        
        if (!isValidPassword) {
            throw new HttpCustomException('Invalid credentials', StatusCodeEnums.INVALID_CREDENTIALS);
        }

        const accessToken = await this.jwtSecurityService.generateAccessToken(
            user.getId(),
            user.getRol().getId(),
            user.getUuid()
        );

        return new AuthResponse(accessToken, user);
    }

    async register(registerRequest: RegisterRequest): Promise<AuthResponse> {
        if (registerRequest.password !== registerRequest.confirmPassword) {
            throw new BadRequestException('Passwords do not match');
        }

        const existingUser = await this.userDao.getUserByEmail(registerRequest.email);
        if (existingUser) {
            throw new HttpCustomException('Email already registered', StatusCodeEnums.EMAIL_DUPLICATED);
        }

        const userRole = await this.rolDao.getRolById(RoleConstants.ROL_USER);
        if (!userRole) {
            throw new BadRequestException('Default user role not found');
        }

        const newUser = new User();
        newUser.setEmail(registerRequest.email);
        newUser.setPassword(await UtilityFunctions.getEncryptData(registerRequest.password));
        newUser.setRol(userRole);
        newUser.setUuid(uuidv4());

        await this.userDao.save(newUser);

        const accessToken = await this.jwtSecurityService.generateAccessToken(
            newUser.getId(),
            newUser.getRol().getId(),
            newUser.getUuid()
        );

        return new AuthResponse(accessToken, newUser);
    }

    async getCurrentUser(userId: number): Promise<User> {
        const user = await this.userDao.findById(userId);
        if (!user) {
            throw new HttpCustomException('User not found', StatusCodeEnums.USER_NOT_FOUND);
        }
        return user;
    }
}