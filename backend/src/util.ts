import { ITransaction } from "shared"
import { createHash } from "crypto"

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

export function strToColor(input: string): `#${string}` {
    const hashed = createHash('md5').update(input).digest('hex')
    return `#${hashed.substring(0, 6).padEnd(6, '0')}`
}