import dayjs from 'dayjs'


export function formatDate(d: Date, mode: 'SHORT-DATE' | 'LONG' = 'SHORT-DATE' ): string {
    const format = {
        'LONG': 'YY-MM-DD HH:mm',
        'SHORT-DATE': 'YY-MM-DD'
    }[mode]
    return dayjs(d).format(format)
}

export function fetchParse200JSON<T>(res: Response): Promise<T> {
    if (res.status !== 200) return Promise.reject({ status: res.status })
    return res.json()
}


