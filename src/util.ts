import { ITransaction } from "./model"

export function genImportId(bank: string): string {
    const random = Math.floor(1000 + Math.random()*1000).toString(16)
    return `${bank}-${random}-${Date.now().toString(16)}`
}

export function removeExistingTransactions(newT: ITransaction[], existing: ITransaction[]): ITransaction[] {
    return newT.filter(nT => {
        return !existing.find(eT => {
            const m = eT.transactionMessage === nT.transactionMessage
            const d = Math.abs(nT.date.getTime() - eT.date.getTime()) < 1000 * 3600 * 24 // 1 day range
            const a = eT.amount === nT.amount
            const rs = eT.receiverOrSender === nT.receiverOrSender
            return m && d && a && rs
        })
    })
}