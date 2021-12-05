import { ITransaction, TransactionModel } from "./model";
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(customParseFormat)

function log<T>(a: T): T {
    console.log(a)
    return a
}

export async function startDKBImport(csv: string) {
    const parsedRows: string[][] = csv.split('\n').map(row => {
        if (!row.length) return undefined
        row = row.replace(/";"/g, '\u0017');
        if (row.startsWith('"')) row = row.substr(1)
        if (row.endsWith('";')) row = row.substr(0, row.length - 2)
        return row.split('\u0017')
    }).filter(r => !!r) as string[][]
    
    const accNr = parsedRows.find(r => r.indexOf('Kontonummer:') >= 0)?.[1]
    const currentBalanceStr = parsedRows.find(r => r[0].startsWith('Kontostand vom'))?.[1].replace('.', '').replace(',', '.')
    if (!currentBalanceStr) {
        throw new Error('missing line in csv: "Kontostand vom ..."')
    }
    const currentBalance = parseFloat(currentBalanceStr)
    console.log(`DKB import for acc ${accNr} balance ${currentBalance}`)
    const importDate = new Date()
    
    let oldest = new Date()
    let newest = new Date('1.1.2000')
    debugger
    const possibleTransactions = parsedRows.filter(r => !!(r[0]?.match(/^\d+.\d+.\d+/))).map(r => {
        const date = dayjs(r[0], 'DD.MM.YYYY').toDate()
        const transactionSource = `${r[3]}/${r[5]}`
        const verwendung = r[4]
        console.log(r)
        const amount = parseFloat(r[7].replace('.', '').replace(',', '.'))

        if (date > newest) newest = date
        if (date < oldest) oldest = date

        const transaction: ITransaction = {
            amount,
            bank: 'DKB',
            date,
            imported: importDate,
            source: 'import',
            account: accNr,
            receiverOrSender: log(transactionSource),
            transactionMessage: verwendung
        }
        return transaction
    });

    newest = new Date(newest.getTime() + 1000 * 3600 * 24)
    oldest = new Date(oldest.getTime() - 1000 * 3600 * 24)

    console.log(`Checking against exisiting transactions from DKB in range ${oldest} - ${newest}`)

    // fetch exisitng transactions in this period from DKB to exclude duplicate transactions
    const exsitingTransactions: ITransaction[] = await TransactionModel.find({ bank: 'DKB', date: { $gte: oldest, $lte: newest } }).exec()
    const newTransactions = possibleTransactions.filter(pT => {
        return !exsitingTransactions.find(eT => eT.transactionMessage === pT.transactionMessage && pT.date === eT.date && eT.amount === pT.amount && eT.receiverOrSender === pT.receiverOrSender )
    })

    console.log(`Found ${newTransactions.length} new transactions`)
    newTransactions.forEach(t => console.log(`\t${t.amount} by ${t.receiverOrSender}`))

    await TransactionModel.insertMany(newTransactions)

    return {
        newTransactions,
        importDate
    };
}