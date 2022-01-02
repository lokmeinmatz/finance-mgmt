
import express from 'express'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'

dayjs.extend(isoWeek)

import { TransactionModel } from './model'
import { BankIds } from './util'
import { BANKS } from './server'

const router = express.Router()


interface ChartDataResponse {
    from: string,
    to: string,
    data: { label: string, income: number, expenses: number, profit: number }[]
}

router.get('/chart-data', async (req, res) => {
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

        const resPayload: ChartDataResponse = {
            from: from.toISOString(),
            to: to.toISOString(),
            data
        }
        res.json(resPayload)
    } catch (e) {

        return res.status(500).json((e as Error)?.message ?? JSON.stringify(e))
    }
})

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

router.get('/parse/csv', (req, res) => {
    res.json(BankIds.filter(id => BANKS[id].parseCsv))
})

router.post('/parse/csv/:bank', express.text(), (req, res) => {
    const bank = req.params.bank
    console.log(`parse csv for bank ${bank} triggered`)
    if (!bank) {
        throw new Error('unknown bank')
    }

})

export default router