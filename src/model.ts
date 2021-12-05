import dayjs from 'dayjs'
import mongoose from 'mongoose'

type Bank = 'DKB' | 'PSD'
type TransactionSource = 'import' | 'manual'

export interface ITransaction {
    bank: Bank,
    account?: string,
    date: Date,
    amount: number,
    transactionMessage?: string,
    receiverOrSender?: string,
    imported: Date,
    source: TransactionSource
}

export function toDisplayDate(d: Date): string {
    return dayjs(d).format('DD.MM.YYYY HH:mm')
}

export function toPrintableTransaction(t: ITransaction): { [field in keyof ITransaction]: string } & { [key: string]: any } {
    console.log({...t})
    return {
        ...t,
        date: toDisplayDate(t.date),
        amount: t.amount.toFixed(2) + '€',
        isPositive: t.amount >= 0,
        imported: toDisplayDate(t.imported)
    };
}

export const TransactionSchema = new mongoose.Schema<ITransaction>({
    bank: String,
    account: { type: String, required: false },
    date: Date,
    amount: Number,
    transactionMessage: {type: String, required: false},
    receiverOrSender: {type: String, required: false},
    imported: Date,
    source: String
})

export const TransactionModel = mongoose.model('transaction', TransactionSchema)