import { Ooth } from 'ooth';

type Options = {
  name?: string;
  ooth: Ooth;
};

export default function({ name = 'user', ooth }: Options): void {
  ooth.registerAfterware(async (result, userId) => {
    if (userId) {
      result.user = ooth.getProfile(await ooth.getUserById(userId));
    }

    return result;
  });

  ooth.registerMethod(name, 'user', [], async () => ({}));
}
