import { StagedImport, genImportId } from "shared";
import { BehaviorSubject, Observable } from "rxjs";
import { InjectionKey, ref, Ref } from "vue";
import { fetchParse200JSON } from "./util";

export type ImportState = {
    state: 'loading'
} | {
    state: 'staged',
    stagedImport: StagedImport
} | {
    state: 'saving'
} | {
    state: 'finished',
    import: StagedImport
}

export class ImportService {

    private imports: Map<string, BehaviorSubject<ImportState>> = new Map()


    startParsing(bank: string, fileType: string, content: string | File): { id: string, state: Observable<ImportState> } {

        const id = genImportId(bank)
        const stateSubject = new BehaviorSubject(<ImportState>{ state: 'loading' })
        ;
        (async () => {

            const stagedImport = await fetch(`/api/parse/csv/${bank}?importId=${id}`, {
                method: 'POST',
                body: content
            }).then(fetchParse200JSON) as StagedImport

            stateSubject.next({ state: 'staged', stagedImport })
        })()
        this.imports.set(id, stateSubject)

        return { id, state: stateSubject }
    }

    getImportState(id: string): Observable<ImportState> | undefined {
        return this.imports.get(id)?.asObservable()
    }

    cancelImport(id: string): boolean {
        const currImport = this.imports.get(id)
        if (currImport) {
            currImport.complete();
            this.imports.delete(id)
        }
        return !!currImport
    }

    finishImport(id: string) {
        // throw if import doesn't exist
        const currImport = this.imports.get(id)
        if (!currImport) throw new Error(`Import ${id} not found`)
        const val = currImport.getValue()
        const stagedImport = val.state === 'staged' && val.stagedImport

        if (!stagedImport) throw new Error(`Import ${id} was not staged`)

        currImport.next({ state: 'saving' })
        const inner = async () => {
            const res = await fetch(`/api/import/${id}`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(stagedImport)
            })

            if (res.status === 200) {
                currImport.next({ state: 'finished', import: await res.json() })
            } else {
                currImport.error({ status: res.status, body: await res.text() })
            }
        }

        inner()
    }

    private supportedBanks?: Ref<string[]>

    getSupportedBanks(): Ref<string[]> {
        if (!this.supportedBanks) {
            this.supportedBanks = ref([])
            fetch('/api/parse/csv').then(fetchParse200JSON).then(banks => this.supportedBanks!.value = banks as string[])
        }

        return this.supportedBanks
    }
    
}

export const ImportServiceKey: InjectionKey<ImportService> = Symbol('ImportService')