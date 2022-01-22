import dayjs from 'dayjs'
import mongoose, { Types } from 'mongoose'

export type Bank = 'DKB' | 'PSD'
export type TransactionSource = 'import' | 'manual'

export function toDisplayDate(d: Date): string {
    return dayjs(d).format('DD.MM.YYYY HH:mm')
}

export function toPrintableTransaction(t: ITransaction): PrintableITransaction {
    return {
        ...t,
        date: toDisplayDate(t.date),
        amount: t.amount.toFixed(2) + '€',
        isPositive: t.amount >= 0,
        imported: toDisplayDate(t.imported)
    };
}

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


export const TransactionSchema = new mongoose.Schema<ITransaction>({
    account: String,
    date: Date,
    amount: Number,
    transactionMessage: {type: String, required: false},
    receiverOrSender: {type: String, required: false},
    imported: Date,
    source: String,
    // unique identifier per import process
    importId: String,
    tags: { type: Array, required: false }
})

export const TransactionModel = mongoose.model('transaction', TransactionSchema)

/* AccountSnapshot */

export interface IAccountSnapshot {
    _id: Types.ObjectId,
    account: string,
    date: Date,
    balance: number,
    imported: Date,
    source: TransactionSource,
    importId: string
}


export const AccountSnapshotSchema = new mongoose.Schema<IAccountSnapshot>({
    account: String,
    date: Date,
    balance: Number,
    imported: Date,
    source: String,
    importId: String
})

export const AccountSnapshotModel = mongoose.model('account-snapshot', AccountSnapshotSchema)

export interface IAccount {
    _id: string,
    bank: Bank,
    name: string,
    type?: string,
    currentBalance?: number
}

export const AccountSchema = new mongoose.Schema<IAccount>({
    _id: String,
    bank: String,
    name: String,
    type: { type: String, required: false },
    currentBalance: { type: Number, required: false }
})

export const AccountModel = mongoose.model('account', AccountSchema);
