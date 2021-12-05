import mongoose from 'mongoose'
import dotenv from 'dotenv'
import express from 'express'
import { engine } from 'express-handlebars'
import filePostMiddleware from 'express-fileupload'
import { startDKBImport } from './import-dkb'
import { toPrintableTransaction, TransactionModel } from './model'

console.log('finance-mgmt server')

dotenv.config()

if (!process.env.MONGODB_URL) {
    console.error('provide env var MONGODB_URL')
    process.exit(-1)
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
        res.render('import/index.hbs')
    })
    

    app.get('/import/dkb', (req, res) => {
        res.render('import/dkb.hbs')
    })

    app.post('/import/dkb', filePostMiddleware(), async (req, res) => {
        const csvRaw = req.files?.dkb_csv?.data.toString();
        if (!csvRaw) {res.send('No csv file received'); return}
        try {
            const state = await startDKBImport(csvRaw)
            res.render('import/dkb_finished.hbs', { ...state, newTransactions: state.newTransactions.map(toPrintableTransaction)})
            
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