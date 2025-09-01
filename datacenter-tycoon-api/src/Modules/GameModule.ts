import { Module } from '@nestjs/common';
import { GameGateway } from '../Gateways/GameGateway';
import { TickService } from '../Services/TickService';
import { TickController } from '../Controllers/TickController';
import { SecurityMetricsController } from '../Controllers/SecurityMetricsController';
import { NPCTickIntegrationService } from '../Services/NPCTickIntegrationService';
import { NPCDemandGeneratorService } from '../Services/NPCDemandGeneratorService';
import { NPCContractEvaluatorService } from '../Services/NPCContractEvaluatorService';
import { ContractRevenueService } from '../Services/ContractRevenueService';
import { NPCSeedingService } from '../Services/NPCSeedingService';
import { NPCSeedingController } from '../Controllers/NPCSeedingController';
import { SecurityTickIntegrationService } from '../Services/SecurityTickIntegrationService';
import { SecuritySLAIntegrationService } from '../Services/SecuritySLAIntegrationService';
import { ApplicationModule } from './ApplicationModule';

@Module({
  imports: [ApplicationModule],
  controllers: [TickController, NPCSeedingController, SecurityMetricsController],
  providers: [
    GameGateway,
    TickService,
    NPCTickIntegrationService,
    NPCDemandGeneratorService,
    NPCContractEvaluatorService,
    ContractRevenueService,
    NPCSeedingService,
    SecurityTickIntegrationService,
    SecuritySLAIntegrationService,
  ],
  exports: [
    GameGateway,
    TickService,
    NPCTickIntegrationService,
    NPCDemandGeneratorService,
    NPCContractEvaluatorService,
    ContractRevenueService,
    NPCSeedingService,
    SecurityTickIntegrationService,
    SecuritySLAIntegrationService,
  ],
})
export class GameModule {}