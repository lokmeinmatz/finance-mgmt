
export interface ChartDataResponse<T> {
    type: string,
    from: string | number,
    to: string | number,
    data: T[]
}

export type RelativeChartDataResponse = ChartDataResponse<{ label: string, income: number, expenses: number, profit: number }>;
export type AccumulatedChartDataResponse = ChartDataResponse<{ label: string, balances: { [acc: string]: number } }>;