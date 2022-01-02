import { ITransaction } from "./model"

export function genImportId(bank: string): string {
    const random = Math.floor(1000 + Math.random()*1000).toString(16)
    return `${bank}-${random}-${Date.now().toString(16)}`
}

export function splitExistingTransactions(newT: ITransaction[], existing: ITransaction[]): { newTAs: ITransaction[], duplicateTAs: ITransaction[]} {
    
    const res = { newTAs: [] as ITransaction[], duplicateTAs: [] as ITransaction[] }
    
    for (const nT of newT) {
        if (existing.some(eT => {
            const m = eT.transactionMessage === nT.transactionMessage
            const d = Math.abs(nT.date.getTime() - eT.date.getTime()) < 1000 * 3600 * 24 // 1 day range
            const a = eT.amount === nT.amount
            const rs = eT.receiverOrSender === nT.receiverOrSender
            return (m && d && a && rs)
        })) {
            res.duplicateTAs.push(nT)
        } else {
            res.newTAs.push(nT)
        }
    }

    return res
}


export const BankIds = [
    'DKB-Credit',
    'DKB-Debit',
    'PSD'
] as const

export type BankId = (typeof BankIds)[number]
