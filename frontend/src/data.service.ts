import { BehaviorSubject, Observable } from "rxjs";
import { IAccount, IAccountSnapshot, ITransaction } from "../../src/model";
import { genImportId } from '../../src/util'
import { CsvParseResponse } from '../../src/server'



class DataServiceClass {
    async getAccounts(): Promise<IAccount[]> {
        return fetch('/api/accounts').then(r => { if (r.status == 200) return r.json(); else throw new Error(r.statusText)})
    }
}

export const DataService = new DataServiceClass();
(window as any).DataService = DataService