// import { Collection, Db, ObjectId } from 'mongodb';

// type StrategyValues = {
//   [key: string]: any;
// };

// type User = {
//   _id: string;
//   [key: string]: string | StrategyValues;
// };

// function prepare(o: any): User {
function prepare(o) {
  if (o && o._id) {
    o._id = o._id.toString();
  }
  return o;
}

export class OothPrisma {
  // private users: Collection;
  private users;

  // constructor(private db: Db) {
  constructor(private db) {
    if (!db) {
      throw new Error('DB is required.');
    }

    this.db = db;
    this.users = this.db.collection('users');
  }

  // public getUserById = async (id: string) => {
  public getUserById = async (id) => {
    const user = await this.users.findOne(id);
    return prepare(user);
  };

  // public getUser = async (fields: { [key: string]: any }) => {
  public getUser = async (fields) => {
    return await prepare(await this.users.findOne(fields));
  };

  // public getUserByValue = async (fields: string[], value: any) => {
  public getUserByValue = async (fields) => {
    return prepare(
      await this.users.findOne({
        $or: fields.map(field => ({
          [field]: value
        }))
      })
    );
  };

  // public updateUser = async (id: string, fields: { [key: string]: any }) => {
  public updateUser = async (id, fields) => {
    return await this.users.update(
      {
        // _id: new ObjectId(id)
        _id: id
      },
      {
        $set: fields
      }
    );
  };

  // public insertUser = async (fields: { [key: string]: StrategyValues }) => {
  public insertUser = async (fields) => {
    const { insertedId } = await this.users.insertOne(fields);
    return insertedId.toString();
  };
}
