import { AccountSnapshotModel, IAccountSnapshot, ITransaction, TransactionModel } from "./model";
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { genImportId, removeExistingTransactions } from "./util";
dayjs.extend(customParseFormat)

function log<T>(a: T): T {
    console.log(a)
    return a
}

/*
CSV line schema 05.12.2021

0 Buchungstag;
1 Valuta;
2 Textschl�ssel;
3 Primanota;
4 Zahlungsempf�nger;
5 Zahlungsempf�ngerKto;
6 Zahlungsempf�ngerIBAN;
7 Zahlungsempf�ngerBLZ;
8 Zahlungsempf�ngerBIC;
9 Vorgang/Verwendungszweck;
10 Kundenreferenz;
11 W�hrung;
12 Umsatz;
13 Soll/Haben


*/

export async function startPSDImport(csv: string) {


    const importId = genImportId('psd')

    const parsedRows: string[][] = csv.split('\n').map(row => {
        if (!row.length || row === ';;;;;;;;;;;;;;;;') return undefined

        return row.split(';')
    }).filter(r => !!r) as string[][]
    
    const accNr = parsedRows.find(r => r.indexOf('Konto:') >= 0)?.[1]
    const balanceRow = parsedRows.find(r => r[10]?.startsWith('Kontostand vom'))
    if (!balanceRow) {
        throw new Error('missing line in csv: "Endsaldo"')
    }
    const balanceDate = dayjs(balanceRow[0], 'DD.MM.YYYY').toDate()
    const currentBalanceStr = balanceRow[12].replace('.', '').replace(',', '.')
    let currentBalance = parseFloat(currentBalanceStr)
    if (balanceRow[13] === 'S') currentBalance *= -1
    console.log(`PSD import for acc ${accNr} balance ${currentBalance}`)
    
    const importDate = new Date()
    
    let oldest = new Date()
    let newest = new Date('1.1.2000')

    const possibleTransactions = parsedRows.filter(r => !!(r[0]?.match(/^\d+.\d+.\d+/) && r[1]?.match(/^\d+.\d+.\d+/))).map(r => {
        const date = dayjs(r[0], 'DD.MM.YYYY').toDate()
        const transactionSource = r.slice(4, 9).filter(e => e?.length).join('/')
        const verwendung = r[9]
        let amount = parseFloat(r[12].replace('.', '').replace(',', '.'))

        if (r[13] === 'S') amount = -amount

        if (date > newest) newest = date
        if (date < oldest) oldest = date

        const transaction: ITransaction = {
            amount,
            bank: 'PSD',
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
    const exsitingTransactions: ITransaction[] = await TransactionModel.find({ bank: 'PSD', date: { $gte: oldest, $lte: newest } }).exec()
    const newTransactions = removeExistingTransactions(possibleTransactions, exsitingTransactions)

    // store snapshot
    const snapshot = new AccountSnapshotModel({
        account: accNr,
        balance: currentBalance,
        bank: 'PSD',
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