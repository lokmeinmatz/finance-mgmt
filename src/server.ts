import mongoose from 'mongoose'
import dotenv from 'dotenv'
import express from 'express'
import { toPrintableTransaction, TransactionModel } from './model'
import ApiRouter from './api'


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