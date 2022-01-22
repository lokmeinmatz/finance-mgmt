import { BehaviorSubject, Observable } from "rxjs";
import { IAccountSnapshot, ITransaction } from "../../src/model";
import { genImportId } from '../../src/util'
import { CsvParseResponse } from '../../src/server'

export interface CsvStagedImport {
    // contains bank and id
    snapshot: IAccountSnapshot,
    newTransactions: ITransaction[]
    duplicateTransactions: ITransaction[]
    importDate: Date
}

const stagedImports: Map<string, CsvStagedImport> = new Map();


export type ImportState = {
    type: 'error',
    error: string
} | {
    type: 'parsing' | 'fetching'
} | {
    type: 'finished',
    staged: CsvStagedImport
}


class ImportServiceClass {

    private _csvBanks?: string[]
    async getCsvBankIds(): Promise<string[]> {
        if (this._csvBanks) return this._csvBanks
        return fetch('/api/parse/csv').then(r => r.json())
    }

    private importStates = new Map<string, BehaviorSubject<ImportState>>()

    getImportState(importId: string): BehaviorSubject<ImportState> | undefined {
        return this.importStates.get(importId)
    }

    /**
     * @returns the import id
     */
    startImport(csvFile: File, bank: string): string {
        const importId = genImportId(bank)

        const obs = new Observable<ImportState>(subscriber => {
            (async function() {
                const apiRes = await fetch(`/api/parse/csv/${bank}?importId=${importId}`, {
                    method: 'POST',
                    body: csvFile
                })
                if (apiRes.status !== 200) {
                    subscriber.error({ type: 'error', error: await apiRes.text() })
                    return
                }
                const data: CsvParseResponse = await apiRes.json()
                if (data && data.snapshot && data.importDate) {
                    subscriber.next({ type: 'finished', staged: data })
                    subscriber.complete()
                }
                subscriber.error('unknown data')
            })()
        })

        const subject = new BehaviorSubject<ImportState>({ type: 'fetching' })

        obs.subscribe(subject)

        this.importStates.set(importId, subject)

        return importId
    }
}

export const ImportService = new ImportServiceClass();
(window as any).ImportService = ImportService