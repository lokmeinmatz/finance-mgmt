import mongoose from 'mongoose'
import dotenv from 'dotenv'
import express from 'express'
import { toPrintableTransaction, TransactionModel } from './model.js'
import ApiRouter from './api.js'


console.log('finance-mgmt server')
console.log('cwd: ' + process.cwd())
console.log('dontenv: ', dotenv.config())



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
        res.send('<h1>no spa served</h1><p>This server serves the api only!</p>')
    })

    app.use('/api', ApiRouter)

    app.listen(8000, () => {
        console.log('running on port 8000')
    })
}


main()