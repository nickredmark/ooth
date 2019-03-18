const helpers = require('./helpers');

type StrategyValues = {
  [key: string]: any;
};

const prismaUserFragment = `
fragment UserWithMeta on User {
  id
  oothMeta {
    id
    key
    data
    dataString
    value
    date
  }
}
`;

export class OothPrisma {

  constructor(private prisma: any) {
    if (!prisma) {
      throw new Error('DB is required.');
    }

    this.prisma = prisma;
  }

  public getUserById = async (id: string) => {
    console.log('getUserById: ', id);
    try {
      const user = await this.prisma.user({ id }).$fragment(prismaUserFragment);
      return helpers.prepare(user);
    } catch (err) {
      console.error(err);
      return null;  
    }
  };

  public getUser =  async (fields: { [key: string]: any }) => {
    console.log('getUser fields: ', fields);    
    const where = await helpers.whereForGetUser(fields);
    try {
      let users = await this.prisma
        .users({
          where
        })
        .$fragment(prismaUserFragment);
      if ( users.length > 1 ) {
        // we need to filter out which user based on what our broad prisma search returned
        users = helpers.filterForGetUser(users, fields);
      }
      return helpers.prepare(users[0]); 
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  public getUserByValue = async (fields: string[], value: any) => {
    console.log('getUserByValue fields: ', fields, value);
    const where = await helpers.whereForgetUserByValue(fields, value);
    try {
      let users = await this.prisma
        .users({
          where
        })
        .$fragment(prismaUserFragment);
      if ( users.length > 1 ) {
        // we need to filter out which user based on what our broad prisma search returned
        users = helpers.filterForGetUserByValue(users, fields, value);
      }
      return helpers.prepare(users[0]);
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  public updateUser = async (id: string, fields: { [key: string]: any }) => {
    // console.log('id: ', id);
    console.log('updateUser fields: ', fields); 
    try {
      const user = await this.prisma.user({ id }).$fragment(prismaUserFragment);
      const processed = await helpers.dataForUpdateUser(user.oothMeta, fields);
      // console.log('processed.data:', processed.data.oothMeta.create);
      const updatedUser = await this.prisma
        .updateUser({
          data: processed.data,
          where: {
            id,
          }, 
        })
        .$fragment(prismaUserFragment);
      // Tidy up - remove overwritten metas
      this.prisma.deleteManyOothMetas(
        { id_in: processed.oothMetaIds } 
      );  
      return helpers.prepare(updatedUser);
    } catch (err) {
      console.error(err);
      return null;
    }
  };  

  public insertUser = async (fields: { [key: string]: StrategyValues }) => {
    console.log('insertUser fields: ', fields);
    const data = await helpers.dataForInsertUser(fields); 
    // console.log('data:', data);    
    try {
      const { id } = await this.prisma.createUser(data); 
      // console.log({id})
      return id;
    } catch (err) { 
      console.error(err);
      return null; 
    }
  };

}
