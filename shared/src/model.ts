import { Types } from "mongoose";

export type TransactionSource = 'import' | 'manual'


export interface ITransaction {
    _id: Types.ObjectId,
    account?: string,
    date: Date,
    amount: number,
    transactionMessage?: string,
    receiverOrSender?: string,
    imported: Date,
    source: TransactionSource,
    importId: string,
    tags?: string[]
}


export type PrintableITransaction = Omit<ITransaction, 'date' | 'imported' | 'amount'> 
    & { date: string, imported: string, amount: string, isPositive: boolean }


/* AccountSnapshot */

export interface IAccountSnapshot {
    _id: Types.ObjectId,
    account: string,
    date: Date,
    balance: number,
    imported: Date,
    source: TransactionSource,
    importId: string,
    rawImportData?: string | Buffer
}


export interface IAccount {
    _id: string,
    bank: string,
    name: string,
    type?: string,
    lastSnapshot?: Types.ObjectId,
    metadata?: { color: string } & Record<string, any>
}


export type ParseFunc = (rawCsv: string, importId: string) => Promise<StagedImport>

export interface StagedImport {
    // contains bank and id
    snapshot: IAccountSnapshot,
    newTransactions: ITransaction[]
    duplicateTransactions: ITransaction[]
}

export type FinishedImport = Omit<StagedImport, 'duplicateTransactions'>