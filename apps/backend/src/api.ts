
import express from 'express'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek.js'
import { genImportId } from 'shared'
dayjs.extend(isoWeek)

import { AccountModel, AccountSnapshotModel, TransactionModel } from './model.js'
import { chartRouter } from './api-charts.js'
import PARSER_BANKS from './parsers/index.js'
import { FinishedImport, IAccountSnapshot, StagedImport } from 'shared'

const router = express.Router()



router.use((req, res, next) => {
    const start = Date.now()
    const logReq = () => {
        console.log(`HTTP ${req.method} ${req.url} => ${res.statusCode} [${Date.now() - start}ms]`)
    }

    res.on('error', logReq)
    res.on('finish', logReq)

    next()
})

router.get('/status', (req, res) => {
    res.json({
        status: 'online'
    })
})

/**
 * /api/import/:importId body: `StagedImport`
 */
router.post('/import/:importId', express.json(), async (req, res) => {
    const importId = req.params.importId
    const importData: Partial<StagedImport> = req.body
    
    

    if (!(importData.snapshot
        && importData.newTransactions
        && importData.duplicateTransactions))
    {
        return res.status(400).send('missing field in StagedImport')    
    }

    // check that account exists
    const account = await AccountModel.findById(importData.snapshot.account).exec()

    if (!account) {
        return res.status(400).send(`Could not find account ${importData.snapshot.account}`)
    }

    const lastSnapshot = account.lastSnapshot && await AccountSnapshotModel.findById(account.lastSnapshot).exec()

    const snapshot = new AccountSnapshotModel(importData.snapshot)
    snapshot.save()

    if (!lastSnapshot || lastSnapshot.date < snapshot.date) {
        account.lastSnapshot = snapshot._id
        await account.save()
    }

    // save new transactions
    if (importData.newTransactions) {
        console.log('saving new transactions')
        await TransactionModel.insertMany(importData.newTransactions)
    }

    res.json({
        snapshot,
        newTransactions: importData.newTransactions
    } as FinishedImport)
})


router.use('/charts', chartRouter)

router.post('/transactions', express.json(), (req, res) => {
    console.log('/api/transactions', req.body)

    let order = 1
    if (['desc', '-1'].includes(req.query.order as any)) {
        order = -1
    }

    TransactionModel.find(req.body ?? {}).sort({ date: order }).exec().then(transactions => {
        res.json(transactions)
    }).catch(e => {
        res.status(400)
        res.json({
            error: e.toString()
        })
    })
})

router.get('/snapshots', (req, res) => {
    AccountSnapshotModel.find({}).sort({ date: 'desc' }).exec().then(snapshots => {
        res.json(snapshots)
    }).catch(e => {
        res.status(400)
        res.json({
            error: e.toString()
        })
    })
})

// save new manual snapshot
router.post('/snapshots', express.json(), async (req, res) => {
    const snapshot: Partial<IAccountSnapshot> = req.body

    if (!snapshot.account || !snapshot.balance || !snapshot.date) {
        console.warn('POST /api/snapshots request with missing fields in body')
        return res.status(400).send(`missing one of the fields account / balance / data in ${JSON.stringify(snapshot)}`)
    }

    const account = await AccountModel.findById(snapshot.account).exec()
    if (!account) return res.status(400).send(`faield to find account ${snapshot.account}`)

    // save actual snapshot
    const dbSnapshot = await (new AccountSnapshotModel(snapshot)).save()
    
    const lastSnapshot = account.lastSnapshot && await AccountSnapshotModel.findById(account.lastSnapshot).exec()

    if (!lastSnapshot || lastSnapshot.date < snapshot.date) {
        // need to save as new lastSnapshot
        account.lastSnapshot = dbSnapshot._id
        await account.save()
    }

    console.log('new snapshot stored: ' + dbSnapshot.importId)

    res.status(200).json(dbSnapshot)

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