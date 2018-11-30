import { FullRequest, Ooth, StrategyValues } from 'ooth';
import { callbackify } from 'util';

const fetch = require('node-fetch');

const { Strategy } = require('passport-custom');

type Config = {
  name?: string;
  ooth: Ooth;
  apiKey: string;
};

export default function({ name = 'authy', ooth, apiKey }: Config): void {
  ooth.registerUniqueField(name, 'email', 'email');
  ooth.registerProfileFields(name, 'email');
  ooth.registerStrategyUniqueField(name, 'id');

  ooth.registerMethod(name, 'register', [ooth.requireNotLogged], async ({ email, cellphone, country_code }) => {
    if (!email || typeof email !== 'string') {
      throw new Error('Email is required.');
    }
    if (!cellphone || typeof cellphone !== 'string') {
      throw new Error('Invalid phone number.');
    }
    if (!country_code || typeof country_code !== 'string') {
      throw new Error('Invalid coutnry code.');
    }

    const existingUser = await ooth.getUserByUniqueField('email', email);

    if (existingUser) {
      throw new Error('This email is already registered');
    }

    const res = await fetch(`https://api.authy.com/protected/json/users/new`, {
      method: 'POST',
      body: `user[email]=${email}&user[cellphone]=${cellphone}&user[country_code]=${country_code}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Authy-API-Key': apiKey,
      },
    });
    const data = await res.json();
    if (data.errors) {
      console.error(data);
      const key = Object.keys(data.errors)[0];
      throw new Error(`${key} ${data.errors[key]}`);
    }

    await ooth.insertUser(name, {
      email,
      cellphone,
      country_code,
      id: data.user.id,
    });

    return {
      message: 'Registered successfully',
    };
  });

  ooth.registerMethod(name, 'otp', [ooth.requireNotLogged], async ({ email }) => {
    const user = await ooth.getUserByUniqueField('email', email);
    if (!user || !user[name]) {
      throw new Error('This email is not registered with this authentication strategy.');
    }
    const values = user[name] as StrategyValues;
    const res = await fetch(`https://api.authy.com/protected/json/sms/${values.id}`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Authy-API-Key': apiKey,
      },
    });
    const data = await res.json();
    if (data.errors) {
      throw new Error(data.errors[Object.keys(data.errors)[0]]);
    }

    return {
      message: 'A one-time password has been send to you via SMS.',
    };
  });

  ooth.registerPrimaryAuth(
    name,
    'login',
    [ooth.requireNotLogged],
    new Strategy(
      callbackify(async (req: FullRequest) => {
        const { email, token } = req.body;
        if (!email || typeof email !== 'string') {
          throw new Error('Invalid email.');
        }

        if (!token || (typeof token !== 'string' && typeof token !== 'number')) {
          throw new Error('Invalid token.');
        }

        const user = await ooth.getUserByUniqueField('email', email);

        if (!user || !user[name]) {
          throw new Error('This email is not registered with this authentication strategy.');
        }
        const values = user[name] as StrategyValues;

        console.log(`https://api.authy.com/protected/json/verify/${token}/${values.id}`);

        const res = await fetch(`https://api.authy.com/protected/json/verify/${token}/${values.id}`, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Authy-API-Key': apiKey,
          },
        });
        const data = await res.json();
        if (data.errors) {
          throw new Error(data.errors[Object.keys(data.errors)[0]]);
        }

        return user._id;
      }),
    ),
  );
}
