/// <reference types="node" />
import { Types } from "mongoose";
export declare type TransactionSource = 'import' | 'manual';
export interface ITransaction {
    _id: Types.ObjectId;
    account?: string;
    date: Date;
    amount: number;
    transactionMessage?: string;
    receiverOrSender?: string;
    imported: Date;
    source: TransactionSource;
    importId: string;
    tags?: string[];
}
export declare type PrintableITransaction = Omit<ITransaction, 'date' | 'imported' | 'amount'> & {
    date: string;
    imported: string;
    amount: string;
    isPositive: boolean;
};
export interface IAccountSnapshot {
    _id: Types.ObjectId;
    account: string;
    date: Date;
    balance: number;
    imported: Date;
    source: TransactionSource;
    importId: string;
    rawImportData?: string | Buffer;
}
export interface IAccount {
    _id: string;
    bank: string;
    name: string;
    type?: string;
    lastSnapshot?: Types.ObjectId;
    metadata?: {
        color: string;
    } & Record<string, any>;
}
export declare type ParseFunc = (rawCsv: string, importId: string) => Promise<StagedImport>;
export interface StagedImport {
    snapshot: IAccountSnapshot;
    newTransactions: ITransaction[];
    duplicateTransactions: ITransaction[];
}
export declare type FinishedImport = Omit<StagedImport, 'duplicateTransactions'>;
