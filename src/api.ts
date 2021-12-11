
import express from 'express'
import dayjs from 'dayjs'
import { TransactionModel } from './model'

const router = express.Router()


interface ChartDataResponse {
    from: string,
    to: string,
    /**
     * ISO date strings
     */
    labels: string[],
    /**
     * in euro, positive numbers
     */
    income: number[],
    /**
     * in euro, negative numbers 
     */
    expenses: number[],
    /**
     * in euro, income + expenses
     */
    profit: number[]
}
router.get('/chart-data', async (req, res) => {
    try {
        const countQP = req.query.count
        if (typeof countQP !== 'string') throw new Error('Expected count=<number of unit steps> as query param')
        const count = parseInt(countQP)
        
        const unit = req.query.unit
        console.log(unit)
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
    
        console.log(aggr)
        
        const start = aggr[0]._id

        // TODO: aggr does not contain entries for days / weeks where no transactions happened.
        // "simulate" the _id loop from `from` to `to` and fill gaps + generate labels
        const expenses = aggr.filter(e => e._id.endsWith('false')).map(e => e.amount)
        const income = aggr.filter(e => e._id.endsWith('true')).map(e => e.amount)

        const profit = expenses.map((e, idx) => e + income[idx])
        const labels = []

        const resPayload: ChartDataResponse = {
            from: from.toISOString(),
            to: to.toISOString(),
            expenses,
            income,
            profit,
            labels
        }
        res.json(aggr)
    } catch (e) {

        return res.status(500).json((e as Error)?.message ?? JSON.stringify(e))
    }
})

export default router