import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../Models/Entities/TransactionEntity';
import { TransactionType, TransactionCategory } from '../Enums/SystemEnum';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WalletService {
    constructor(
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>
    ) {}

    async getUserBalance(userId: number): Promise<number> {
        const transactions = await this.transactionRepository.find({
            where: { userId: { id: userId }, isPaid: true }
        });

        let balance = 0;
        for (const transaction of transactions) {
            if (transaction.type === TransactionType.INCOME || transaction.type === TransactionType.REFUND) {
                balance += Number(transaction.amount);
            } else if (transaction.type === TransactionType.EXPENSE || transaction.type === TransactionType.PENALTY) {
                balance -= Number(transaction.amount);
            }
        }

        return balance;
    }

    async createContractPayment(
        userId: number,
        contractId: number,
        amount: number,
        billingPeriodStart: Date,
        billingPeriodEnd: Date,
        penalties: number = 0,
        discounts: number = 0
    ): Promise<number> {
        const transaction = new Transaction();
        transaction.uuid = uuidv4();
        transaction.transactionNumber = await this.generateTransactionNumber('PAY');
        transaction.userId = { id: userId } as any;
        transaction.contractId = { id: contractId } as any;
        transaction.type = TransactionType.INCOME;
        transaction.category = TransactionCategory.CONTRACT_PAYMENT;
        transaction.amount = amount;
        transaction.currency = 'USD';
        transaction.description = `Contract payment for period ${billingPeriodStart.toISOString().split('T')[0]} to ${billingPeriodEnd.toISOString().split('T')[0]}`;
        transaction.transactionDate = new Date();
        transaction.isPaid = true;
        transaction.isPending = false;
        transaction.netAmount = amount - penalties + discounts;
        
        transaction.transactionDetails = {
            contractPayment: {
                billingPeriodStart,
                billingPeriodEnd,
                baseAmount: amount,
                penalties,
                discounts,
                taxes: 0
            }
        };

        const savedTransaction = await this.transactionRepository.save(transaction);
        return savedTransaction.id;
    }

    async createSLAPenalty(
        userId: number,
        contractId: number,
        amount: number,
        penaltyType: string,
        originalAmount: number,
        penaltyRate: number
    ): Promise<number> {
        const transaction = new Transaction();
        transaction.uuid = uuidv4();
        transaction.transactionNumber = await this.generateTransactionNumber('PEN');
        transaction.userId = { id: userId } as any;
        transaction.contractId = { id: contractId } as any;
        transaction.type = TransactionType.PENALTY;
        transaction.category = TransactionCategory.SLA_PENALTY;
        transaction.amount = amount;
        transaction.currency = 'USD';
        transaction.description = `SLA penalty for ${penaltyType}`;
        transaction.transactionDate = new Date();
        transaction.isPaid = true;
        transaction.isPending = false;
        
        transaction.transactionDetails = {
            penalty: {
                penaltyType,
                originalAmount,
                penaltyRate
            }
        };

        const savedTransaction = await this.transactionRepository.save(transaction);
        return savedTransaction.id;
    }

    async createHardwarePurchase(
        userId: number,
        amount: number,
        deviceIds: number[],
        supplierId?: number,
        warrantyMonths?: number
    ): Promise<number> {
        const transaction = new Transaction();
        transaction.uuid = uuidv4();
        transaction.transactionNumber = await this.generateTransactionNumber('HW');
        transaction.userId = { id: userId } as any;
        transaction.type = TransactionType.EXPENSE;
        transaction.category = TransactionCategory.HARDWARE_PURCHASE;
        transaction.amount = amount;
        transaction.currency = 'USD';
        transaction.description = `Hardware purchase - ${deviceIds.length} devices`;
        transaction.transactionDate = new Date();
        transaction.isPaid = true;
        transaction.isPending = false;
        
        transaction.transactionDetails = {
            hardwarePurchase: {
                deviceIds,
                supplierId,
                warrantyMonths,
                deliveryDate: new Date(),
                installationRequired: true
            }
        };

        const savedTransaction = await this.transactionRepository.save(transaction);
        return savedTransaction.id;
    }

    async createOperationalExpense(
        userId: number,
        amount: number,
        expenseType: string,
        period: string,
        unitCost?: number,
        quantity?: number,
        unit?: string
    ): Promise<number> {
        const transaction = new Transaction();
        transaction.uuid = uuidv4();
        transaction.transactionNumber = await this.generateTransactionNumber('OP');
        transaction.userId = { id: userId } as any;
        transaction.type = TransactionType.EXPENSE;
        
        let category: TransactionCategory;
        switch (expenseType) {
            case 'electricity':
                category = TransactionCategory.ELECTRICITY;
                break;
            case 'bandwidth':
                category = TransactionCategory.BANDWIDTH;
                break;
            case 'maintenance':
                category = TransactionCategory.MAINTENANCE;
                break;
            default:
                category = TransactionCategory.MAINTENANCE;
        }
        
        transaction.category = category;
        transaction.amount = amount;
        transaction.currency = 'USD';
        transaction.description = `${expenseType} expense for ${period}`;
        transaction.transactionDate = new Date();
        transaction.isPaid = true;
        transaction.isPending = false;
        
        transaction.transactionDetails = {
            operationalExpense: {
                expenseType,
                period,
                unitCost,
                quantity,
                unit
            }
        };

        const savedTransaction = await this.transactionRepository.save(transaction);
        return savedTransaction.id;
    }

    async getUserTransactions(
        userId: number,
        limit: number = 50,
        offset: number = 0,
        type?: TransactionType,
        category?: TransactionCategory
    ): Promise<{ transactions: Transaction[], total: number }> {
        const queryBuilder = this.transactionRepository.createQueryBuilder('transaction')
            .leftJoinAndSelect('transaction.userId', 'user')
            .leftJoinAndSelect('transaction.contractId', 'contract')
            .where('transaction.userId = :userId', { userId })
            .orderBy('transaction.transactionDate', 'DESC')
            .skip(offset)
            .take(limit);

        if (type) {
            queryBuilder.andWhere('transaction.type = :type', { type });
        }

        if (category) {
            queryBuilder.andWhere('transaction.category = :category', { category });
        }

        const [transactions, total] = await queryBuilder.getManyAndCount();
        return { transactions, total };
    }

    async getTransactionById(id: number): Promise<Transaction> {
        const transaction = await this.transactionRepository.findOne({
            where: { id },
            relations: ['userId', 'contractId']
        });

        if (!transaction) {
            throw new NotFoundException(`Transaction with ID ${id} not found`);
        }

        return transaction;
    }

    async getMonthlyRevenue(userId: number, year: number, month: number): Promise<number> {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const result = await this.transactionRepository
            .createQueryBuilder('transaction')
            .select('SUM(transaction.amount)', 'total')
            .where('transaction.userId = :userId', { userId })
            .andWhere('transaction.type = :type', { type: TransactionType.INCOME })
            .andWhere('transaction.transactionDate >= :startDate', { startDate })
            .andWhere('transaction.transactionDate <= :endDate', { endDate })
            .andWhere('transaction.isPaid = :isPaid', { isPaid: true })
            .getRawOne();

        return Number(result.total) || 0;
    }

    async getMonthlyExpenses(userId: number, year: number, month: number): Promise<number> {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const result = await this.transactionRepository
            .createQueryBuilder('transaction')
            .select('SUM(transaction.amount)', 'total')
            .where('transaction.userId = :userId', { userId })
            .andWhere('transaction.type IN (:...types)', { types: [TransactionType.EXPENSE, TransactionType.PENALTY] })
            .andWhere('transaction.transactionDate >= :startDate', { startDate })
            .andWhere('transaction.transactionDate <= :endDate', { endDate })
            .andWhere('transaction.isPaid = :isPaid', { isPaid: true })
            .getRawOne();

        return Number(result.total) || 0;
    }

    async getFinancialSummary(userId: number): Promise<any> {
        const balance = await this.getUserBalance(userId);
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        
        const monthlyRevenue = await this.getMonthlyRevenue(userId, currentYear, currentMonth);
        const monthlyExpenses = await this.getMonthlyExpenses(userId, currentYear, currentMonth);
        const monthlyProfit = monthlyRevenue - monthlyExpenses;

        const totalRevenue = await this.getTotalRevenue(userId);
        const totalExpenses = await this.getTotalExpenses(userId);
        const totalProfit = totalRevenue - totalExpenses;

        return {
            balance,
            monthly: {
                revenue: monthlyRevenue,
                expenses: monthlyExpenses,
                profit: monthlyProfit
            },
            total: {
                revenue: totalRevenue,
                expenses: totalExpenses,
                profit: totalProfit
            }
        };
    }

    private async getTotalRevenue(userId: number): Promise<number> {
        const result = await this.transactionRepository
            .createQueryBuilder('transaction')
            .select('SUM(transaction.amount)', 'total')
            .where('transaction.userId = :userId', { userId })
            .andWhere('transaction.type = :type', { type: TransactionType.INCOME })
            .andWhere('transaction.isPaid = :isPaid', { isPaid: true })
            .getRawOne();

        return Number(result.total) || 0;
    }

    private async getTotalExpenses(userId: number): Promise<number> {
        const result = await this.transactionRepository
            .createQueryBuilder('transaction')
            .select('SUM(transaction.amount)', 'total')
            .where('transaction.userId = :userId', { userId })
            .andWhere('transaction.type IN (:...types)', { types: [TransactionType.EXPENSE, TransactionType.PENALTY] })
            .andWhere('transaction.isPaid = :isPaid', { isPaid: true })
            .getRawOne();

        return Number(result.total) || 0;
    }

    async processNPCPayment(
        npcId: number,
        providerId: number,
        amount: number,
        contractId: number,
        description?: string
    ): Promise<number> {
        const transaction = new Transaction();
        transaction.uuid = uuidv4();
        transaction.transactionNumber = await this.generateTransactionNumber('NPC');
        transaction.userId = { id: providerId } as any;
        transaction.contractId = { id: contractId } as any;
        transaction.type = TransactionType.INCOME;
        transaction.category = TransactionCategory.CONTRACT_PAYMENT;
        transaction.amount = amount;
        transaction.currency = 'USD';
        transaction.description = description || `NPC payment from NPC ${npcId}`;
        transaction.transactionDate = new Date();
        transaction.isPaid = true;
        transaction.isPending = false;

        transaction.transactionDetails = {
            contractPayment: {
                billingPeriodStart: new Date(),
                billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                baseAmount: amount,
                penalties: 0,
                discounts: 0,
                taxes: 0
            }
        };

        try {
            const savedTransaction = await this.transactionRepository.save(transaction);
            return savedTransaction.id;
        } catch (error) {
            throw new Error(`Failed to process NPC payment: ${error.message}`);
        }
    }

    private async generateTransactionNumber(prefix: string): Promise<string> {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}-${timestamp}-${random}`;
    }
}