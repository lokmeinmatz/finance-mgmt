import { ParseFunc } from "@shared/model";
import { startDKBImport } from "./import-dkb";
import { parsePSD } from "./import-psd";

export default {
    'PSD-Giro': {
        csv: parsePSD
    },
    'DKB-Giro': {
        csv: startDKBImport
    },
    'DKB-Kredit': {
        csv: startDKBImport
    }
} as {
    [bankName: string]: { csv?: ParseFunc }
}