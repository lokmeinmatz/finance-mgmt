import mongoose from 'mongoose'
import dotenv from 'dotenv'
import express from 'express'
import { create, engine } from 'express-handlebars'
import filePostMiddleware from 'express-fileupload'
import { startDKBImport } from './parsers/import-dkb'
import { IAccountSnapshot, ITransaction, toPrintableTransaction, TransactionModel } from './model'
import { parsePSD } from './parsers/import-psd'
import ApiRouter from './api'
import { CsvParseFunc } from './parsers'


console.log('finance-mgmt server')

dotenv.config()

if (!process.env.MONGODB_URL) {
    console.error('provide env var MONGODB_URL')
    process.exit(-1)
}

export interface CsvParseResponse {
    // contains bank and id
    snapshot: IAccountSnapshot,
    newTransactions: ITransaction[]
    duplicateTransactions: ITransaction[]
    importDate: Date
}


export const BANKS: { [key: string]: { parseCsv?: CsvParseFunc } } = {
    'DKB-Credit': {
        parseCsv: startDKBImport
    },
    'DKB-Giro': {
        parseCsv: startDKBImport
    },
    'PSD-Giro': {
        parseCsv: parsePSD // TODO use psd
    }
}

const handlebars = create({
    helpers: {
        json: (ctx: any) => {
            return JSON.stringify(ctx)
        }
    },
    defaultLayout: 'base.hbs',
    extname: 'hbs'
})

async function main() {
    console.log('connecting...')
    await mongoose.connect(process.env.MONGODB_URL!)
    console.log(`Connected to db ${process.env.MONGODB_URL}`)
    const app = express()

    // hbs
    app.engine('hbs', handlebars.engine)
    app.set('view engine', 'handlebars')
    app.set('views', './views')

    app.get('/', async (req, res) => {

        const transactions = await (await TransactionModel.find({}).exec()).map(d => d.toObject())

        res.render('home.hbs', {
            transactions: transactions.map(toPrintableTransaction)
        })
    })

    app.use('/api', ApiRouter)

    app.listen(8000, () => {
        console.log('running on port 8000')
    })
}


main()