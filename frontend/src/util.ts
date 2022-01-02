import { Types } from 'mongoose';
import { Bank, ITransaction, TransactionSource } from '../../src/model'
import dayjs from 'dayjs'


export function formatDate(d: Date, mode: 'SHORT-DATE' | 'LONG' = 'SHORT-DATE' ): string {
    const format = {
        'LONG': 'YY-MM-DD HH:mm',
        'SHORT-DATE': 'YY-MM-DD'
    }[mode]
    return dayjs(d).format(format)
}