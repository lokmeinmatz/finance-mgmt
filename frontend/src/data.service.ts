import { IAccount } from "@shared/model";



class DataServiceClass {
    async getAccounts(): Promise<IAccount[]> {
        return fetch('/api/accounts').then(r => { if (r.status == 200) return r.json(); else throw new Error(r.statusText)})
    }
}

export const DataService = new DataServiceClass();
(window as any).DataService = DataService