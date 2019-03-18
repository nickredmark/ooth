const _ = require('lodash');

type StrategyValues = {
  [key: string]: any;
};

type User = {
  id: string;
  [key: string]: string | StrategyValues;
};

function oothMetaToObject(oothMeta: any) {
  let f = {};

  for (var i = 0, len = oothMeta.length; i < len; i++) {
    let key = oothMeta[i].key;

    if (oothMeta[i].data) {
      for (var key2 in oothMeta[i].data) {
        if( key2 == 'refreshTokenExpiresAt' ) {
          oothMeta[i].data[key2] = new Date(oothMeta[i].data[key2]);
        }
      }
      _.set(f, key, oothMeta[i].data);
    } else if (oothMeta[i].date) {
      _.set(f, key, new Date(oothMeta[i].date));
    } else if (oothMeta[i].value) {
      _.set(f, key, oothMeta[i].value);
    } else {
      _.set(f, key, {});
    }
  }
  // console.log({f});
  return f;
}

function makePrismaCreateArray(fields: any) {
  let createArray: any[] = [];
  for (var key in fields) {
    // console.log('key', key);
    // console.log('fields[key]', setFields[key]);
    let createPart: any;
    // console.log(setFields[key], ' is a : ', typeof setFields[key]);
    if (typeof fields[key] == 'string') {
      // is a string
      createPart = { key, value: fields[key] };
    } else if (typeof fields[key] == 'object' && Object.keys(fields[key]).length) {
      // is object
      createPart = { key, data: fields[key], dataString: JSON.stringify(fields[key]) };
    } else if (fields[key] instanceof Date) {
      createPart = { key, date: fields[key] };
    } else if (typeof fields[key] == 'object') {
      createPart = { key, data: fields[key] };
    } else {
      createPart = { key };
    }
    createArray.push(createPart);
  }
  return createArray;
}

function whereForGetUser(fields: any) {
  // we want to build something like
  // AND: [
  //   {
  //     oothMeta_some: { key: 'foo', dataString_contains: 'baz' },
  //   },
  //   {
  //     oothMeta_some: { key: 'foo2', dataString_contains: 'baz2' },
  //   },
  // ];
  let where: { AND: any[] } = { AND: [] };
  for (var key in fields) {
    where.AND.push({ oothMeta_some: { key: key.split('.')[0], dataString_contains: fields[key] } });
  }
  console.log(where);
  return where;
}

function filterForGetUser(users: any, fields: any) {
  if (users.length <= 1) {
    return users;
  }
  let filteredUsers: any[] = [];
  // we have many users and we need to do some js filtering because
  // Prisma cannot yet filter json data
  // loop over the returned users
  for (var i = 0, len = users.length; i < len; i++) {
    // console.log('user: ', users[i].oothMeta);
    // loop over the oothMeta for this user
    for (var j = 0, lenj = users[i].oothMeta.length; j < lenj; j++) {
      // loop over the fields that we're looking in
      let thisMeta = users[i].oothMeta[j];
      // console.log('thisMeta: ', thisMeta);
      // info we're interested in is 
      // thisMeta.key and thisMeta.data
      let matchedFields = 0;
      // loop over the fields
      for (var key in fields) {
        if (key.split('.')[0] != thisMeta.key) {
          continue;
        }
        let innerKey = key.split('.')[1];
        if (thisMeta.data[innerKey] !== fields[key]) {
          continue;
        }
        matchedFields++;
      }
      // if we have a FULL match then return this user
      if(matchedFields == fields.length){
        filteredUsers.push(users[i]);
        // console.log('filteredUsers:', filteredUsers);
        // return the array with only the first one that matches
        return filteredUsers;
      }
    }
  }
  return users;
}

function whereForgetUserByValue(fields: any, value: string) {
  // we want to build something like
  // OR: [
  //   {
  //     oothMeta_some: { key: 'foo', dataString_contains: 'baz2' },
  //   },
  //   {
  //     oothMeta_some: { key: 'foo2', dataString_contains: 'baz2' },
  //   },
  // ];
  let where: { OR: any[] } = { OR: [] };
  for (var i = 0, len = fields.length; i < len; i++) {
    where.OR.push({ oothMeta_some: { key: fields[i].split('.')[0], dataString_contains: value } });
  }
  // console.log(where);
  return where;
}


function filterForGetUserByValue(users: any, fields: any, value: string) {
  if( users.length <= 1 ) {
    return users
  }
  let filteredUsers: any[] = [];
  // we have many users and we need to do some js filtering because 
  // Prisma cannot yet filter json data
  // loop over the returned users
  for (var i = 0, len = users.length; i < len; i++) {
    // console.log('user: ', users[i].oothMeta);
    // loop over the oothMeta for this user
    for (var j = 0, lenj = users[i].oothMeta.length; j < lenj; j++) {
      // loop over the fields that we're looking in
      let thisMeta = users[i].oothMeta[j];
      // continue to next if the string isn't present
      if ( thisMeta.dataString.indexOf(value) == -1 ) {
        // console.log('continue');
        continue;
      }
      for (var k = 0, lenk = fields.length; k < lenk; k++) {
        if(fields[k].split('.')[0] !== thisMeta.key ) {
          // console.log('continue2');
          continue;
        }
        let innerKey = fields[k].split('.')[1];
        if (thisMeta.data[innerKey] !== value) {
          continue;
        }
        // getting close
        filteredUsers.push(users[i]);
        // console.log('filteredUsers:', filteredUsers);
        // return the array with only the first one that matches
        return filteredUsers;
      }
    }
    
  }
  return users;
}

function dataForUpdateUser(oothMeta: any, fields: any) {

  let oothMetaDeleteIds:any[] = [];
  for (var i = 0, len = oothMeta.length; i < len; i++) {
    oothMetaDeleteIds.push(oothMeta[i].id);
  }

  // oothMeta to JSON
  let setFields: any = oothMetaToObject(oothMeta);

  for (var key in fields) {
    _.set(setFields, key, fields[key]); 
  } 

  let data: { oothMeta: { create: any[] } } = { oothMeta: { create: makePrismaCreateArray(setFields) } };

  return { data, oothMetaDeleteIds };
} 

function dataForInsertUser(fields: any) {
  // console.log('dataForInsertUser'); 
  
  let setFields:any = {};
  
  for (var key in fields) {
    _.set(setFields, key, fields[key]);
  }

  let data: { oothMeta: { create: any[] } } = { oothMeta: { create: makePrismaCreateArray(setFields) } };

  // console.log(JSON.stringify(data)); 
  return data;
}


function prepare(o: any): User {
  console.log('prepare', o);  
  if (o && o.oothMeta.length > 0) {
    Object.assign(o, oothMetaToObject(o.oothMeta));
  }
  if (o && o.oothMeta) {
    delete o.oothMeta;
  }
  if (o && o.id) {
    o._id = o.id
  }
  console.log('prepare', o);
  return o;
}

module.exports = {
  oothMetaToObject,
  whereForGetUser,
  filterForGetUser,
  whereForgetUserByValue,
  filterForGetUserByValue,
  dataForUpdateUser,
  dataForInsertUser,
  prepare
};