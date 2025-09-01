import { IsNotEmpty, IsString, Matches, MinLength } from "class-validator";
import EmailConstants from "src/Constants/EmailConstants";
import ModelMessagesConstants from "src/Constants/ModelMessagesConstants";

export default class RegisterRequest {
    @IsNotEmpty()
    @IsString()
    @Matches(EmailConstants.REGEX_VALID_EMAIL, { message: ModelMessagesConstants.IS_EMAIL })
    email: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    password: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6, { message: 'Password confirmation must be at least 6 characters long' })
    confirmPassword: string;
}