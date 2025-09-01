import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { WalletService } from '../Services/WalletService';
import { JwtAuthGuard } from '../Guards/JwtAuthGuard';
import { TransactionType, TransactionCategory } from '../Enums/SystemEnum';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
    constructor(private readonly walletService: WalletService) {}

    @Get('balance')
    async getBalance(@Request() req: any) {
        const userId = req.user.id;
        const balance = await this.walletService.getUserBalance(userId);
        return { balance };
    }

    @Get('transactions')
    async getTransactions(
        @Request() req: any,
        @Query('limit') limit: number = 50,
        @Query('offset') offset: number = 0,
        @Query('type') type?: TransactionType,
        @Query('category') category?: TransactionCategory
    ) {
        const userId = req.user.id;
        return await this.walletService.getUserTransactions(userId, limit, offset, type, category);
    }

    @Get('transaction/:id')
    async getTransaction(@Param('id') id: number) {
        return await this.walletService.getTransactionById(id);
    }

    @Get('revenue/:year/:month')
    async getMonthlyRevenue(
        @Request() req: any,
        @Param('year') year: number,
        @Param('month') month: number
    ) {
        const userId = req.user.id;
        const revenue = await this.walletService.getMonthlyRevenue(userId, year, month);
        return { revenue };
    }

    @Get('expenses/:year/:month')
    async getMonthlyExpenses(
        @Request() req: any,
        @Param('year') year: number,
        @Param('month') month: number
    ) {
        const userId = req.user.id;
        const expenses = await this.walletService.getMonthlyExpenses(userId, year, month);
        return { expenses };
    }

    @Get('summary')
    async getFinancialSummary(@Request() req: any) {
        const userId = req.user.id;
        return await this.walletService.getFinancialSummary(userId);
    }

    @Post('contract-payment')
    async createContractPayment(
        @Request() req: any,
        @Body() body: {
            contractId: number;
            amount: number;
            billingPeriodStart: string;
            billingPeriodEnd: string;
            penalties?: number;
            discounts?: number;
        }
    ) {
        const userId = req.user.id;
        const transactionId = await this.walletService.createContractPayment(
            userId,
            body.contractId,
            body.amount,
            new Date(body.billingPeriodStart),
            new Date(body.billingPeriodEnd),
            body.penalties || 0,
            body.discounts || 0
        );
        return { transactionId };
    }

    @Post('sla-penalty')
    async createSLAPenalty(
        @Request() req: any,
        @Body() body: {
            contractId: number;
            amount: number;
            penaltyType: string;
            originalAmount: number;
            penaltyRate: number;
        }
    ) {
        const userId = req.user.id;
        const transactionId = await this.walletService.createSLAPenalty(
            userId,
            body.contractId,
            body.amount,
            body.penaltyType,
            body.originalAmount,
            body.penaltyRate
        );
        return { transactionId };
    }

    @Post('hardware-purchase')
    async createHardwarePurchase(
        @Request() req: any,
        @Body() body: {
            amount: number;
            deviceIds: number[];
            supplierId?: number;
            warrantyMonths?: number;
        }
    ) {
        const userId = req.user.id;
        const transactionId = await this.walletService.createHardwarePurchase(
            userId,
            body.amount,
            body.deviceIds,
            body.supplierId,
            body.warrantyMonths
        );
        return { transactionId };
    }

    @Post('operational-expense')
    async createOperationalExpense(
        @Request() req: any,
        @Body() body: {
            amount: number;
            expenseType: string;
            period: string;
            unitCost?: number;
            quantity?: number;
            unit?: string;
        }
    ) {
        const userId = req.user.id;
        const transactionId = await this.walletService.createOperationalExpense(
            userId,
            body.amount,
            body.expenseType,
            body.period,
            body.unitCost,
            body.quantity,
            body.unit
        );
        return { transactionId };
    }
}