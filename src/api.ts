
import express from 'express'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'

dayjs.extend(isoWeek)

import { AccountModel, AccountSnapshotModel, TransactionModel } from './model'
import { genImportId } from './util'
import { BANKS } from './server'
import { chartRouter } from './api-charts'

const router = express.Router()

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
    console.log('/api/snapshots', req.body)
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
    res.json(Object.entries(BANKS).filter(([_key, val]) => val.parseCsv).map(e => e[0]))
})

router.post('/parse/csv/:bank', express.text({ type: 'text/csv' }), async (req, res) => {
    const bank: string | undefined = req.params.bank as any
    console.log(`parse csv for bank ${bank} triggered`)
    if (!bank || !(bank in BANKS) || !BANKS[bank].parseCsv) {
        throw new Error('unknown bank')
    }
    try {
        const parsed = await BANKS[bank].parseCsv!(req.body, req.query.importId as string ?? genImportId(bank))
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