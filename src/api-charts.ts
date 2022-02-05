import express, { Request, Response } from 'express'
import dayjs from 'dayjs'
import { AccountModel, AccountSnapshotModel, TransactionModel } from './model'
import { AccumulatedChartDataResponse, RelativeChartDataResponse } from '@shared/chart-data'
import { strToColor } from './util'

export const chartRouter = express.Router()

/**
 * /api/charts/relative?count=[number]&unit=['d' | 'w' | 'M']
 */
chartRouter.get('/relative', async (req, res) => {
    try {
        const countQP = req.query.count
        if (typeof countQP !== 'string') throw new Error('Expected count=<number of unit steps> as query param')
        const count = parseInt(countQP)
        
        const unit: 'd' | 'w' | 'M' = req.query.unit as any
        if (typeof unit !== 'string' || !['d', 'w', 'M'].includes(unit)) throw new Error('Expected unit=d|w|M as query param')
     
        const from = dayjs().subtract(count, unit).startOf(unit as any)
        const to = dayjs()
        console.log(`Gettin chart data for ${count} ${unit} (${from} to ${to})`)
    
        let groupIdConcat
        switch (unit) {
            case 'd':
                groupIdConcat = [
                    { $toString: {$year: '$date'} },
                    '-',
                    { $toString: {$month: '$date'} }, 
                    '-',
                    { $toString: {$dayOfMonth: '$date'} }, 
                    '-',
                    { $toString: {$gte: ['$amount', 0]} }
                ]
                break;
            case 'w':
                groupIdConcat = [
                    { $toString: {$year: '$date'} },
                    '-',
                    { $toString: {$isoWeek: '$date'} },
                    '-',
                    { $toString: {$gte: ['$amount', 0]} }
                ]
                break;
            case 'M':
                groupIdConcat = [
                    { $toString: {$year: '$date'} },
                    '-',
                    { $toString: {$month: '$date'} },
                    '-',
                    { $toString: {$gte: ['$amount', 0]} }
                ]
                break;
        }

        const aggr = await TransactionModel.aggregate([
            {
                $match: {
                    date: {
                        $gte: from.toDate()
                    }
                }
            },
            {
                $group: {
                    _id: { 
                        $concat: groupIdConcat
                    },
                    amount: { $sum: '$amount' }
                }
            }
        ]).exec()
    
        const aggrMap = aggr.reduce((acc, curr) => { acc[curr._id] = curr; return acc }, {})
        let currentSection = dayjs(from)
        const data: { label: string, income: number, expenses: number, profit: number }[] = []

        while (currentSection.isBefore(to)) {
            let identifierStart = currentSection.year().toString() + '-'
            
            switch (unit) {
                case 'd':
                    identifierStart += (currentSection.month() + 1) + '-' + currentSection.date()
                    break;
                case 'w':
                    identifierStart += currentSection.isoWeek()
                    break;
                case 'M':
                    identifierStart += (currentSection.month() + 1)
                    break;
            }

            const income = aggrMap[`${identifierStart}-true`]?.amount ?? 0
            const expenses = aggrMap[`${identifierStart}-false`]?.amount ?? 0
            const profit = income + expenses

            data.push({
                label: identifierStart,
                income,
                expenses,
                profit
            })

            currentSection = currentSection.add(1, unit)
        }

        const resPayload: RelativeChartDataResponse = {
            type: 'relative',
            from: from.toISOString(),
            to: to.toISOString(),
            data
        }
        res.json(resPayload)
    } catch (e) {

        return res.status(500).json((e as Error)?.message ?? JSON.stringify(e))
    }
})

/**
 * /api/charts/accumulated?from=[string]&to=[string]&account=[string[]]
 * multiple account params are allowed
 */
async function getChartAccumulated(req: Request, res: Response<AccumulatedChartDataResponse | string>) {

    let accountIds: string[] = req.query.account as any
    let accounts
    if (!accountIds) {
        accounts = await AccountModel.find({})
        accountIds = accounts.map(m => m._id)
    } else {
        if (typeof accountIds === 'string') accountIds = [accountIds]
        accounts = await AccountModel.find({ _id: { $in: accountIds } })
    }

    if (!req.query.from || !req.query.to) {
        return res.status(400).send('required query params: from=[isoDate]&to=[isoDate]')
    }

    const from = dayjs(req.query.from as string)
    const to = dayjs(req.query.to as string)

    console.log(`absolute chart from ${from} to ${to} accounts=${accountIds}`)


    const dailyData: {date: Date, balances: Record<string, number> }[] = []

    let dd = from.clone()
    while(!dd.isAfter(to)) {
        dailyData.push({
            date: dd.toDate(),
            balances: {}
        })
        dd = dd.add(1, 'day')
    }

    for (const acc of accountIds) {
        // for every account populate dailyData[x].balances
        dd = from.clone()
        // the closest older nsapshot
        let oldestSnapshot = (await AccountSnapshotModel.find({ account: acc, date: { $lte: dd.toDate() } }).sort({ date: -1 }).limit(1).exec())[0]

        let snapshots = await AccountSnapshotModel.find({ account: acc, date: { $gte: oldestSnapshot?.date ?? from.toDate() } }).sort({ date: 1 }).exec()
        
        if (!snapshots.length) continue
        let sIdx = 0
        const lastSnapshot = () => snapshots[sIdx]

        let currentBalance = lastSnapshot().balance
        let tIdx = 0
        let transactions = await TransactionModel.find({ account: acc, date: { $gte: lastSnapshot().date, $lte: snapshots.at(-1)!.date } }).sort({ date: 1 }).exec()

        
        for (let i = 0; i < dailyData.length; i++) {
            const date = dailyData[i].date
            while (tIdx < transactions.length) {
                if (snapshots[sIdx + 1] && transactions[tIdx].date >= snapshots[sIdx + 1].date ) {
                    // use next snapshot as reference
                    sIdx += 1
                    currentBalance = snapshots[sIdx].balance
                }

                if (tIdx >= transactions.length || transactions[tIdx].date > date) {
                    break
                }

                currentBalance += transactions[tIdx].amount
                tIdx++
            }

            dailyData[i].balances[acc] = currentBalance
        }
    }

    res.json({
        type: 'accumulated',
        from: from.toISOString(),
        to: to.toISOString(),
        data: dailyData.map(d => ({ label: d.date.toISOString(), balances: d.balances })),
        colors: accounts.reduce((accumulator, acc) => {
            accumulator[acc._id] = acc.metadata?.color ?? strToColor(acc._id)
            return accumulator
        }, {} as Record<string, string>)
    })
}

chartRouter.get('/accumulated', getChartAccumulated)