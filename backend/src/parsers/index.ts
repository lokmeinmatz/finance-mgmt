import { ParseFunc } from "shared";
import { startDKBImport } from "./import-dkb.js";
import { parsePSD } from "./import-psd.js";

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