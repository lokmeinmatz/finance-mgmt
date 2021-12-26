import mongoose from 'mongoose'
import dotenv from 'dotenv'
import express from 'express'
import { create, engine } from 'express-handlebars'
import filePostMiddleware from 'express-fileupload'
import { startDKBImport } from './import-dkb'
import { Bank, IAccountSnapshot, ITransaction, toPrintableTransaction, TransactionModel } from './model'
import { startPSDImport } from './import-psd'
import ApiRouter from './api'

console.log('finance-mgmt server')

dotenv.config()

if (!process.env.MONGODB_URL) {
    console.error('provide env var MONGODB_URL')
    process.exit(-1)
}

export interface CsvStagedImport {
    // contains bank and id
    snapshot: IAccountSnapshot,
    newTransactions: ITransaction[]
    duplicateTransactions: ITransaction[]
    importDate: Date
}

export interface CsvImportResponse {
    newTransactions: ITransaction[]
    duplicateTransactions: ITransaction[]
    importDate: Date
}

const stagedImports: Map<string, CsvStagedImport> = new Map();

const BANKS: { [key: string]: { csvImportStage?: (csv: string) => Promise<CsvStagedImport> } } = {
    dkb: {
        csvImportStage: startDKBImport
    },
    psd: {
        csvImportStage: startPSDImport // TODO use psd
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
   
    app.get('/import', (req, res) => {
        res.render('import/index.hbs', {
            csvBanks: Object.entries(BANKS).filter(([k, b]) => !!b.csvImportStage).map(a => a[0])
        })
    })
    

    app.get('/import/csv/:bank', (req, res) => {
        if (!BANKS[req.params.bank]) {
            return res.send('Unknown bank :(')
        }
        res.render(`import/csv_upload.hbs`, { bank: req.params.bank })
    })

    app.get('/import/staged', (req, res) => {
        res.send(`<ul>${
            [...stagedImports.entries()].map(([id, data]) => {
                return `<li><a href="/import/staged/${id}">${data.importDate} - ${data.snapshot.bank} / ${data.snapshot.account}</a></li>`
            })
        }</ul>`)
    })

    app.get('/import/staged/:id', (req, res) => {
        if (!stagedImports.has(req.params.id)) {
            res.status(404)
            return res.send(`<h1>Unknown import ${req.params.id}</h1>`)
        }

        const stagedData = stagedImports.get(req.params.id)!

        res.render('import/staged.hbs', {
            ...stagedData
        })
    })
    
    app.post('/import/csv/:bank', filePostMiddleware(), async (req, res) => {
        const bankController = BANKS[req.params.bank]
        if (!BANKS[req.params.bank]) {
            return res.send('Unknown bank ' + req.params.bank)
        }

        if (!bankController.csvImportStage) {
            return res.send(`Bank ${req.params.bank} has no csv import support`)
        }
        
        const csvRaw = req.files?.csv?.data.toString();
        if (!csvRaw) {return res.send('No csv file received')}
        try {
            const stageResult = await bankController.csvImportStage(csvRaw)

            stagedImports.set(stageResult.snapshot.importId, stageResult)

            res.redirect(`/import/staged/${stageResult.snapshot.importId}`)
            /*
            res.render('import/csv_finished.hbs', { 
                ...state, 
                bank: req.params.bank, 
                newTransactions: state.newTransactions.map(toPrintableTransaction),
                duplicateTransactions: state.duplicateTransactions.map(toPrintableTransaction)
            })
            */
            
        } catch (error: any) {
            console.error(error)
            res.send(error.toString())
        }
    })

    app.use('/api', ApiRouter)

    app.listen(8000, () => {
        console.log('running on port 8000')
    })
}


main()