export interface ChartDataResponse<T> {
    type: string;
    from: string | number;
    to: string | number;
    data: T[];
}
export declare type RelativeChartDataResponse = ChartDataResponse<{
    label: string;
    income: number;
    expenses: number;
    profit: number;
}>;
export declare type AccumulatedChartDataResponse = ChartDataResponse<{
    label: string;
    balances: Record<string, number>;
}> & {
    colors: Record<string, string>;
};
