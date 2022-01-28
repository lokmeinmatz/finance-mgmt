import { StagedImport } from "@shared/model";
import { BehaviorSubject, Observable } from "rxjs";
import { InjectionKey, ref, Ref } from "vue";
import { genImportId } from "../../src/util";
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