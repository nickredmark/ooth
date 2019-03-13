type StrategyValues = {
  [key: string]: any;
};

type User = {
  _id: string;
  [key: string]: string | StrategyValues;
};

// Prisma is for relational data. So when defining the prisma datamodel
// we must decide what fields to have in the user table
// and any others will be added to an additional 'user meta' table.
// See: datamodel.prisma
const PrismaUserFields = ['id', 'email', 'username', 'password', 'verificationToken', 'verificationTokenExpiresAt'];

// TODO - check the fields, if any are not in PrismaUserFields then build them into the userMeta table query

// TODO - on the user queries, request userMeta { key value }

function prepare(o: any): User {
  if (o && !o._id && o.id) {
    o._id = o.id;
  }
  if (o && o._id) {
    o._id = o._id.toString();
  }
  return o;
}

export class OothPrisma {

  constructor(private prisma: any) {
    if (!prisma) {
      throw new Error('DB is required.');
    }

    this.prisma = prisma;
  }

  public getUserById = async (id: string) => {
    try {
      const user = await this.prisma.user({ id });
      return prepare(user);
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  public getUser = async (fields: { [key: string]: any }) => {
    try {
      const users = await this.prisma.users({ where: fields });
      if (users.length > 1) {
        console.log('The getUser query found ' + users.length + ' users. users[0] returned');
      }
      return await prepare(users[0]);
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  public getUserByValue = async (fields: string[], value: any) => {
    try {
      const users = await this.prisma.users({
        where: {
          OR: fields.map((field) => ({
            [field]: value,
          })),
        },
      });
      if ( users.length > 1 ) {
        console.log('The getUserByValue query found ' + users.length + ' users. users[0] returned');
      }
      return prepare(users[0]);
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  public updateUser = async (id: string, fields: { [key: string]: any }) => {
    try {
      const user = await await this.prisma.updateUser({
        data: {
          ...fields,
        },
        where: {
          id,
        },
      });
      return user;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  public insertUser = async (fields: { [key: string]: StrategyValues }) => {
    try {
      const { id } = await this.prisma.createUser(fields);
      return id;
    } catch (err) {
      console.error(err);
      return null; 
    }
  };
}
