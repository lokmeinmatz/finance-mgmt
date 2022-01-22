import { CsvParseResponse } from "../server";

export type CsvParseFunc = (rawCsv: string, importId: string) => Promise<CsvParseResponse>