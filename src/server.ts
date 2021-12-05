import mongoose from 'mongoose'
import dotenv from 'dotenv'
import express from 'express'
import { engine } from 'express-handlebars'
import filePostMiddleware from 'express-fileupload'
import { startDKBImport } from './import-dkb'
import { toPrintableTransaction, TransactionModel } from './model'
import { startPSDImport } from './import-psd'

console.log('finance-mgmt server')

dotenv.config()

if (!process.env.MONGODB_URL) {
    console.error('provide env var MONGODB_URL')
    process.exit(-1)
}

const BANKS: { [key: string]: { csvImport?: (csv: string) => Promise<any> } } = {
    dkb: {
        csvImport: startDKBImport
    },
    psd: {
        csvImport: startPSDImport // TODO use psd
    }
}

async function main() {
    console.log('connecting...')
    await mongoose.connect(process.env.MONGODB_URL!)
    console.log(`Connected to db ${process.env.MONGODB_URL}`)
    const app = express()

    // hbs
    app.engine('hbs', engine({
        defaultLayout: 'base.hbs',
        extname: 'hbs'
    }))
    app.set('view engine', 'handlebars')
    app.set('views', './views')

    app.get('/', async (req, res) => {

        const transactions = await (await TransactionModel.find({}).exec()).map(d => d.toObject())

        res.render('home.hbs', {
            transactions: transactions.map(toPrintableTransaction)
        })
    })
   
    app.get('/import', (req, res) => {
        res.render('import/index.hbs', {
            csvBanks: Object.entries(BANKS).filter(([k, b]) => !!b.csvImport).map(a => a[0])
        })
    })
    

    app.get('/import/csv/:bank', (req, res) => {
        if (!BANKS[req.params.bank]) {
            return res.send('Unknown bank :(')
        }
        res.render(`import/csv_upload.hbs`, { bank: req.params.bank })
    })
    
    app.post('/import/csv/:bank', filePostMiddleware(), async (req, res) => {
        const bankController = BANKS[req.params.bank]
        if (!BANKS[req.params.bank]) {
            return res.send('Unknown bank ' + req.params.bank)
        }

        if (!bankController.csvImport) {
            return res.send(`Bank ${req.params.bank} has no csv import support`)
        }
        
        const csvRaw = req.files?.csv?.data.toString();
        if (!csvRaw) {return res.send('No csv file received')}
        try {
            const state = await bankController.csvImport(csvRaw)
            res.render('import/csv_finished.hbs', { ...state, bank: req.params.bank, newTransactions: state.newTransactions.map(toPrintableTransaction)})
            
        } catch (error: any) {
            console.error(error)
            res.send(error.toString())
        }
    })


    app.listen(8000, () => {
        console.log('running on port 8000')
    })
}


main()