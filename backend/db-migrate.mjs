import mongoose from 'mongoose'

await mongoose.connect('mongodb://localhost:27017/finance')

async function migrateAcocuntIds() {
    const TModel = mongoose.model('transactions', new mongoose.Schema({ account: String }))

    const tas = await TModel.find({ account: { $regex: /Girokonto$/ }}).exec()
    
    for (const ta of tas) {
        let a = ta.account.replace(' / Girokonto', '')
        ta.account = a
        console.log(a)
        await ta.save()
    }
} 

migrateAcocuntIds()