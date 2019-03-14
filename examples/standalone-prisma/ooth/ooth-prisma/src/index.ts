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
const prismaUserFields = ['id', 'email', 'username', 'password', 'verificationToken', 'verificationTokenExpiresAt'];

// TODO - check the fields, if any are not in PrismaUserFields then build them into the userMeta table query

// TODO - on the user queries, request userMeta { key value }



const prismaUserFragment = `
fragment UserWithMeta on User {
  id
  email
  userMeta { 
    key
    value
    child {
      key
      value
      child {
        key
        value
      }
    }
  }
}
`;

async function massageFields(fields: any ) {
  let userMetaArray = [];
  for (var key in fields) {
    if( prismaUserFields.indexOf(key) == -1 ) {
      // this field does not have it's own column in the prisma user table
      let keyParts = key.split('.');
      let temp = {};
      for (var i = (keyParts.length - 1); i >= 0; i--) {
        if (i == keyParts.length - 1) {
          temp = { key: keyParts[i], value: fields[key] }
        } else {
          temp = { key: keyParts[i], child_some: temp };
        }
      }
      userMetaArray.push({ userMeta_some: temp });
      delete fields[key];
    }
  }
  fields.AND = userMetaArray;
  // console.log( JSON.stringify(fields));
  return fields;
}

async function massageFieldsAndValue(fields: any, value: string ) {
  let where = { OR : [] };
  for (var j = 0, lenf = fields.length; j < lenf; j++) {
    let key = fields[j];
    if (prismaUserFields.indexOf(key) == -1) {
      // this field does not have it's own column in the prisma user table
      let keyParts = fields[j].split('.');
      let temp = {};
      for (var i = keyParts.length - 1; i >= 0; i--) {
        if (i == keyParts.length - 1) {
          temp = { key: keyParts[i], value };
        } else {
          temp = { key: keyParts[i], child_some: temp };
        }
      }
      where.OR.push({ userMeta_some: temp });
      delete fields[j];
    } else {
      where.OR.push({ [key]: value });
    }
  }
  return where;
}

function userMetaToObject(userMeta: any) {
  let f = {};
  for (var i = 0, len = userMeta.length; i < len; i++) {
    let key = userMeta[i].key;
    if( userMeta[i].child.length > 0 ) {
      // recursively run this function
      f[key] = userMetaToObject(userMeta[i].child);
    } else {
      f[key] = userMeta[i].value;
    }
  }
  return f;
}

function prepare(o: any): User {
  if (o && !o._id && o.id) {
    o._id = o.id;
    delete o.id;
  }
  if (o && o.userMeta.length > 0) {
    Object.assign(o, userMetaToObject(o.userMeta));
  }
  if (o && o.userMeta) {
    delete o.userMeta;
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
      const user = await this.prisma.user({ id }).$fragment(prismaUserFragment);
      return prepare(user);
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  public getUser = async (fields: { [key: string]: any }) => {
    const where = await massageFields(fields);
    try {
      const users = await this.prisma.users({ where }).$fragment(prismaUserFragment);
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
    const where = await massageFieldsAndValue(fields, value );
    try {
      const users = await this.prisma
        .users({
          where
        })
        .$fragment(prismaUserFragment);
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
      const user = await await this.prisma
        .updateUser({
          data: {
            ...fields,
          },
          where: {
            id,
          },
        })
        .$fragment(prismaUserFragment);
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
