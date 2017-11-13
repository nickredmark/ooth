function prepare(o) {
    if (o && o._id) {
        o._id = o._id.toString()
    }
    return o
}

class OothMongo {
    constructor(db, ObjectId) {
        if (!db) {
            throw new Error('DB is required.')
        }
        this.db = db
        if (!ObjectId) {
            throw new Error('ObjectId is required.')
        }
        this.ObjectId = ObjectId
        this.Users = this.db.collection('users')
    }

    getUserById = async (id) => {
        const user = await this.Users.findOne(this.ObjectId(id));
        return prepare(user)
    }

    getUser = async (fields) => {
        return await prepare(this.Users.findOne(fields))
    }

    getUserByValue = async (fields, value) => {
        return prepare(await this.Users.findOne({
            $or: fields.map(field => ({
                [field]: value,
            }))
        }))
    }

    updateUser = async (id, fields) => {
        return await this.Users.update({
            _id: this.ObjectId(id)
        }, {
            $set: fields
        })
    }

    insertUser = async (fields) => {
        const {insertedId} = await this.Users.insertOne(fields)
        return insertedId
    }
}

module.exports = OothMongo
