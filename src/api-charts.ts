import express from 'express'
import dayjs from 'dayjs'
import { AccountModel, AccountSnapshotModel, IAccountSnapshot, TransactionModel } from './model'
import { BSTreeKV } from 'typescript-collections'

export const chartRouter = express.Router()


export interface MonthlyChartDataResponse {
    from: string,
    to: string,
    data: { label: string, income: number, expenses: number, profit: number }[]
}

/**
 * /api/charts/monthly?count=[number]&unit=['d' | 'w' | 'M']
 */
chartRouter.get('/monthly', async (req, res) => {
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

        const resPayload: MonthlyChartDataResponse = {
            from: from.toISOString(),
            to: to.toISOString(),
            data
        }
        res.json(resPayload)
    } catch (e) {

        return res.status(500).json((e as Error)?.message ?? JSON.stringify(e))
    }
})

interface RangeMinMax<R extends number | Date, U> {
    from: R
    to: R
    min: U
    max: U
}

export interface AbsoluteChartDataResponse {
    unit: 'd' | 'w' | 'M'
    count: number,
    data: {
        [key: string]: RangeMinMax<Date, number>[]
    }
}

interface DateSnapshots {
    date: Date,
    snapshots: {
        [accountId: string]: IAccountSnapshot | Promise<IAccountSnapshot>
    }
}
const cachedSnapshots: BSTreeKV<{ date: Date }, DateSnapshots> = new BSTreeKV((a, b) => a.date.getTime() - b.date.getTime())

async function getSnapshot(d: Date, account: string): Promise<IAccountSnapshot | undefined> {
    let snapshot = cachedSnapshots.search({ date: d })
    if (!snapshot?.snapshots[account]) {

        const snapshotPromise = Promise.resolve({} as IAccountSnapshot)

        if (!snapshot) {
            snapshot = { date: d, snapshots: {} }
            cachedSnapshots.add(snapshot)
        }
        snapshot.snapshots[account] = snapshotPromise
    }

    return snapshot.snapshots[account]
} 

/*
async function getRangeMinMax(from: Date, to: Date, bank?: BankId): RangeMinMax<Date, number> {
    const mostPrevSnapshot = await nearestSnapsot()
}
*/

/**
 * /api/charts/absolute?unit=['d' | 'w' | 'M']&count=[number]&account=[string | 'accumulated']
 * multiple account params are allowed
 */
chartRouter.get('/absolute', async (req, res) => {
    if (!req.query.count) {
        throw new Error('count query parameter required')
    }
    const count = parseInt(req.query.count as string)

    if (!req.query.unit) {
        throw new Error('unit query parameter required')
    }
    if (!(['d', 'w', 'M'].includes(req.query.unit as string))) {
        throw new Error('unit must be d | w |M')
    }

    const unit = req.query.unit

    let banks: 'accumulated' | string[] = req.query.bank as any
    if (!banks) {

        banks = (await AccountModel.find({})).map(m => m._id)
    }
    if (typeof banks === 'string' && banks !== 'accumulated') banks = [banks]


    console.log(`absolute chart unit=${unit} count=${count} bank=${banks}`)

    res.json({})
})