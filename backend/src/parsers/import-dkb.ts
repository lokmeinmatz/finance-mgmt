import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
import { splitExistingTransactions } from "../util.js"
import mongoose from 'mongoose'
import { IAccountSnapshot, ITransaction, ParseFunc, StagedImport } from 'shared'
import { TransactionModel } from '../model.js'

dayjs.extend(customParseFormat)

function log<T>(a: T): T {
    console.log(a)
    return a
}

export const startDKBImport: ParseFunc = async (csv: string, importId: string) => {

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
    //debugger

    let accNr: string | undefined
    if (accountType === 'debit') {
        accNr = parsedRows.find(r => r.includes('Kontonummer:'))?.[1]?.replace(' / Girokonto', '')
    } else {
        accNr = parsedRows.find(r => r.includes('Kreditkarte:'))?.[1]
    }

    if (!accNr) {
        throw new Error('Failed to find account id from csv')
    }

    // TODO: check if accNr exists

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

    let currentBalance: number
    if (accountType === 'debit') {
        const currentBalanceStr = balanceRow[1].replace('.', '').replace(',', '.')
        currentBalance = parseFloat(currentBalanceStr)
    } else {
        if (balanceRow[1].includes(',')) {
            throw new Error('balance format changed (contains ,), check import code')
        }
        const currentBalanceStr = balanceRow[1].replace(' EUR', '')
        currentBalance = parseFloat(currentBalanceStr)
    }
    if (!Number.isFinite(currentBalance)) {
        throw new Error('Failed to parse current balance ' + currentBalance)
    }
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
            _id: new mongoose.Types.ObjectId(),
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
    const exsitingTransactions: ITransaction[] = await TransactionModel.find({ bank: 'DKB', date: { $gte: oldest, $lte: newest } }).exec()
    const { newTAs, duplicateTAs } = splitExistingTransactions(possibleTransactions, exsitingTransactions)

    // create snapshot
    const snapshot: IAccountSnapshot ={
        _id: new mongoose.Types.ObjectId(),
        account: accNr,
        balance: currentBalance,
        date: balanceDate,
        source: 'import',
        imported: new Date(),
        importId,
        rawImportData: csv
    }

    const stagedImport: StagedImport = {
        snapshot,
        newTransactions: newTAs,
        duplicateTransactions: duplicateTAs
    };

    return stagedImport
}