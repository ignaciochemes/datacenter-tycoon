import { IsNotEmpty, IsString, Matches } from "class-validator";
import EmailConstants from "src/Constants/EmailConstants";
import ModelMessagesConstants from "src/Constants/ModelMessagesConstants";

export default class LoginRequest {
    @IsNotEmpty()
    @IsString()
    @Matches(EmailConstants.REGEX_VALID_EMAIL, { message: ModelMessagesConstants.IS_EMAIL })
    email: string;

    @IsNotEmpty()
    @IsString()
    password: string;
}