import { AccountSnapshotModel, IAccountSnapshot, ITransaction, TransactionModel } from "./model";
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { genImportId, removeExistingTransactions } from "./util";
dayjs.extend(customParseFormat)

function log<T>(a: T): T {
    console.log(a)
    return a
}

export async function startDKBImport(csv: string) {

    const importId = genImportId('dkb')

    const parsedRows: string[][] = csv.split('\n').map(row => {
        if (!row.length) return undefined
        row = row.replace(/";"/g, '\u0017');
        if (row.startsWith('"')) row = row.substr(1)
        if (row.endsWith('";')) row = row.substr(0, row.length - 2)
        return row.split('\u0017')
    }).filter(r => !!r) as string[][]

    let accountType: 'credit' | 'debit' | undefined = undefined
    if (parsedRows[0][0] === 'Kreditkarte:') accountType = 'credit'
    else if (parsedRows[0][0] === 'Kontonummer:') accountType = 'debit'
    if (!accountType) {
        throw new Error(`Unknown type ${parsedRows[0][0]}`)
    }

    console.log('DKB account type: ' + accountType)

    let accNr: string | undefined
    if (accountType === 'debit') {
        accNr = parsedRows.find(r => r.includes('Kontonummer:'))?.[1]
    } else {
        accNr = parsedRows.find(r => r.includes('Kreditkarte:'))?.[1]
    }
    const balanceRow = parsedRows.find(r => r[0].startsWith(( accountType === 'debit' ) ? 'Kontostand vom' : 'Saldo:'))
    if (!balanceRow) {
        throw new Error('missing line in csv: "Kontostand vom ..."')
    }
    let balanceDate: Date | undefined

    if (accountType === 'debit') {
        balanceDate = dayjs(/Kontostand vom (?<date>\d\d.\d\d.\d{4}):/.exec(balanceRow[0])?.groups!.date, 'DD.MM.YYYY').toDate()
    } else {
        balanceDate = dayjs(parsedRows.find(r => r[0] === 'Datum:')![1], 'DD.MM.YYYY').toDate()
    }
    const currentBalanceStr = balanceRow[1].replace('.', '').replace(',', '.')
    const currentBalance = parseFloat(currentBalanceStr)
    console.log(`DKB import for acc ${accNr} (${accountType}) balance ${currentBalance}`)
    const importDate = new Date()
    
    let oldest = new Date()
    let newest = new Date('1.1.2000')
    
    const possibleTransactions = parsedRows.filter(r => !!(r[0]?.match(/^\d+.\d+.\d+/))).map(r => {
        const date = dayjs(r[0], 'DD.MM.YYYY').toDate()
        const transactionSource = `${r[3]}/${r[5]}`
        const verwendung = r[4]
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
            transactionMessage: verwendung,
            importId
        }
        return transaction
    });

    newest = new Date(newest.getTime() + 1000 * 3600 * 24)
    oldest = new Date(oldest.getTime() - 1000 * 3600 * 24)

    console.log(`Checking against exisiting transactions from DKB in range ${oldest} - ${newest}`)

    // fetch exisitng transactions in this period from DKB to exclude duplicate transactions
    const exsitingTransactions: ITransaction[] = await TransactionModel.find({ bank: 'DKB', date: { $gte: oldest, $lte: newest } }).exec()
    const newTransactions = removeExistingTransactions(possibleTransactions, exsitingTransactions)

    // store snapshot
    const snapshot = new AccountSnapshotModel({
        account: accNr,
        balance: currentBalance,
        bank: 'DKB',
        date: balanceDate,
        source: 'import',
        imported: new Date(),
        importId
    } as IAccountSnapshot)

    await snapshot.save()

    console.log(`Saved snapshot. Found ${newTransactions.length} new transactions`)
    newTransactions.forEach(t => console.log(`\t${t.amount} by ${t.receiverOrSender}`))

    await TransactionModel.insertMany(newTransactions)

    return {
        newTransactions,
        importDate
    };
}