export default class AuthResponse {
    accessToken: string;
    user: {
        id: number;
        email: string;
        uuid: string;
        rol: {
            id: number;
            name: string;
        };
    };

    constructor(accessToken: string, user: any) {
        this.accessToken = accessToken;
        this.user = {
            id: user.getId(),
            email: user.getEmail(),
            uuid: user.getUuid(),
            rol: {
                id: user.getRol().getId(),
                name: user.getRol().getDescription()
            }
        };
    }
}