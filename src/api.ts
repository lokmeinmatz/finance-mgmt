
import express from 'express'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'

dayjs.extend(isoWeek)

import { AccountModel, AccountSnapshotModel, TransactionModel } from './model'
import { genImportId } from './util'
import { chartRouter } from './api-charts'
import PARSER_BANKS from './parsers'

const router = express.Router()


router.use((req, res, next) => {
    const start = Date.now()
    const logReq = () => {
        console.log(`HTTP ${req.url} => ${res.statusCode} [${Date.now() - start}ms]`)
    }

    res.on('error', logReq)
    res.on('finish', logReq)

    next()
})


router.use('/charts', chartRouter)

router.post('/transactions', express.json(), (req, res) => {
    console.log('/api/transactions', req.body)
    TransactionModel.find(req.body ?? {}).exec().then(transactions => {
        res.json(transactions)
    }).catch(e => {
        res.status(400)
        res.json({
            error: e.toString()
        })
    })
})

router.post('/snapshots', express.json(), (req, res) => {
    AccountSnapshotModel.find(req.body ?? {}).sort({ date: 'desc' }).exec().then(snapshots => {
        res.json(snapshots)
    }).catch(e => {
        res.status(400)
        res.json({
            error: e.toString()
        })
    })
})

router.get('/parse/csv', (req, res) => {
    res.json(Object.entries(PARSER_BANKS).filter(([_key, val]) => val.csv).map(e => e[0]))
})

router.post('/parse/csv/:bank', express.text({ type: 'text/csv' }), async (req, res) => {
    debugger
    const bank: string | undefined = req.params.bank as any
    console.log(`parse csv for bank ${bank} triggered`)
    if (!bank || !(bank in PARSER_BANKS) || !PARSER_BANKS[bank].csv) {
        throw new Error('unknown bank')
    }
    try {
        const parsed = await PARSER_BANKS[bank].csv!(req.body, req.query.importId as string ?? genImportId(bank))
        res.json(parsed)
    } catch (error) {
        res.status(400)
        res.json({ error: (error as any).toString() })
    }
})

router.get('/accounts', async (req, res) => {
    const accounts = await AccountModel.find({})
    res.json(accounts)
})

export default router