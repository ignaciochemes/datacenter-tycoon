import { Module } from "@nestjs/common";
import { ApplicationModule } from "./Modules/ApplicationModule";
import { GameModule } from "./Modules/GameModule";
import { DatacenterManagementModule } from "./Modules/DatacenterManagementModule";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { envFilePathConfiguration } from "./Configs/EnvFilePathConfig";
import { nestEnvConfiguration } from "./Configs/NestEnvConfig";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventEmitterModule } from "@nestjs/event-emitter";

import { APP_FILTER } from "@nestjs/core";
import { QueryFailedErrorFilter } from "./Helpers/Middlewares/QueryFailedErrorFilter";
import { DBConfigInterface } from "./Configs/DbConfigInterface";

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: [envFilePathConfiguration()],
            load: [nestEnvConfiguration],
            isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) =>
                Object.assign(configService.get<DBConfigInterface>('DATABASE')),
        }),
        EventEmitterModule.forRoot(),

        ApplicationModule,
        GameModule,
        DatacenterManagementModule
    ],
    providers: [{ provide: APP_FILTER, useClass: QueryFailedErrorFilter }],
})
export class AppModule { }