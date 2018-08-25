import { Collection, Db, ObjectId } from 'mongodb';

type StrategyValues = {
  [key: string]: any;
};

type User = {
  _id: string;
  [key: string]: string | StrategyValues;
};

function prepare(o: any): User {
  if (o && o._id) {
    o._id = o._id.toString();
  }
  return o;
}

export class OothMongo {
  private users: Collection;

  constructor(private db: Db) {
    if (!db) {
      throw new Error('DB is required.');
    }

    this.db = db;
    this.users = this.db.collection('users');
  }

  public getUserById = async (id: string) => {
    const user = await this.users.findOne(new ObjectId(id));
    return prepare(user);
  };

  public getUser = async (fields: { [key: string]: any }) => {
    return await prepare(await this.users.findOne(fields));
  };

  public getUserByValue = async (fields: string[], value: any) => {
    return prepare(
      await this.users.findOne({
        $or: fields.map((field) => ({
          [field]: value,
        })),
      }),
    );
  };

  public updateUser = async (id: string, fields: { [key: string]: any }) => {
    return await this.users.update(
      {
        _id: new ObjectId(id),
      },
      {
        $set: fields,
      },
    );
  };

  public insertUser = async (fields: { [key: string]: StrategyValues }) => {
    const { insertedId } = await this.users.insertOne(fields);
    return insertedId.toString();
  };
}
