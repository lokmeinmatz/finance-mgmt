import dayjs from 'dayjs'
import mongoose, { Schema, Types } from 'mongoose'
import { IAccount, IAccountSnapshot, ITransaction, PrintableITransaction } from 'shared'

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


export const AccountSnapshotSchema = new mongoose.Schema<IAccountSnapshot>({
    account: String,
    date: Date,
    balance: Number,
    imported: Date,
    source: String,
    importId: String,
    rawImportData: { type: Schema.Types.Mixed, required: false }
})

export const AccountSnapshotModel = mongoose.model('account-snapshot', AccountSnapshotSchema)


export const AccountSchema = new mongoose.Schema<IAccount>({
    _id: String,
    bank: String,
    name: String,
    type: { type: String, required: false },
    lastSnapshot: { type: mongoose.Types.ObjectId, required: false },
    metadata: {
        color: String,
        required: false
    }
})

export const AccountModel = mongoose.model('account', AccountSchema);
