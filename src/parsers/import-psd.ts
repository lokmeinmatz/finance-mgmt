import { IAccountSnapshot, ITransaction, ParseFunc, StagedImport } from "@shared/model";
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { splitExistingTransactions } from "../util";
import { Types } from "mongoose";
import { TransactionModel } from "../model";
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

export const parsePSD: ParseFunc = async (csv: string, importId: string) => {

    
    const parsedRows: string[][] = csv.split('\n').map(row => {
        if (!row.length || row === ';;;;;;;;;;;;;;;;') return undefined

        return row.split(';')
    }).filter(r => !!r) as string[][]
    
    const accNr = parsedRows.find(r => r.indexOf('Konto:') >= 0)?.[1]
    if (!accNr) {
        throw new Error('Failed to get Account id: Line "Konto:" missing from csv')
    }
    const balanceRow = parsedRows.at(-1)!
    if (balanceRow[10] !== 'Endsaldo') {
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
            _id: new Types.ObjectId(),
            amount,
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
    const { newTAs, duplicateTAs } = splitExistingTransactions(possibleTransactions, exsitingTransactions)

    const snapshot: IAccountSnapshot = {
        _id: new Types.ObjectId(),
        account: accNr,
        balance: currentBalance,
        date: balanceDate,
        source: 'import',
        imported: new Date(),
        importId
    }

    let stagedImport: StagedImport = {
        snapshot,
        newTransactions: newTAs,
        duplicateTransactions: duplicateTAs,
        importDate,
        rawImportData: csv
    };

    return stagedImport
}