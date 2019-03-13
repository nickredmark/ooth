// Code generated by Prisma (prisma@1.28.3). DO NOT EDIT.
// Please don't change this file manually but run `prisma generate` to update it.
// For more information, please read the docs: https://www.prisma.io/docs/prisma-client/

import { DocumentNode } from "graphql";
import {
  makePrismaClientClass,
  BaseClientOptions,
  Model
} from "prisma-client-lib";
import { typeDefs } from "./prisma-schema";

export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> &
  U[keyof U];

export interface Exists {
  user: (where?: UserWhereInput) => Promise<boolean>;
  userMeta: (where?: UserMetaWhereInput) => Promise<boolean>;
}

export interface Node {}

export type FragmentableArray<T> = Promise<Array<T>> & Fragmentable;

export interface Fragmentable {
  $fragment<T>(fragment: string | DocumentNode): Promise<T>;
}

export interface Prisma {
  $exists: Exists;
  $graphql: <T = any>(
    query: string,
    variables?: { [key: string]: any }
  ) => Promise<T>;

  /**
   * Queries
   */

  user: (where: UserWhereUniqueInput) => UserPromise;
  users: (
    args?: {
      where?: UserWhereInput;
      orderBy?: UserOrderByInput;
      skip?: Int;
      after?: String;
      before?: String;
      first?: Int;
      last?: Int;
    }
  ) => FragmentableArray<User>;
  usersConnection: (
    args?: {
      where?: UserWhereInput;
      orderBy?: UserOrderByInput;
      skip?: Int;
      after?: String;
      before?: String;
      first?: Int;
      last?: Int;
    }
  ) => UserConnectionPromise;
  userMeta: (where: UserMetaWhereUniqueInput) => UserMetaPromise;
  userMetas: (
    args?: {
      where?: UserMetaWhereInput;
      orderBy?: UserMetaOrderByInput;
      skip?: Int;
      after?: String;
      before?: String;
      first?: Int;
      last?: Int;
    }
  ) => FragmentableArray<UserMeta>;
  userMetasConnection: (
    args?: {
      where?: UserMetaWhereInput;
      orderBy?: UserMetaOrderByInput;
      skip?: Int;
      after?: String;
      before?: String;
      first?: Int;
      last?: Int;
    }
  ) => UserMetaConnectionPromise;
  node: (args: { id: ID_Output }) => Node;

  /**
   * Mutations
   */

  createUser: (data: UserCreateInput) => UserPromise;
  updateUser: (
    args: { data: UserUpdateInput; where: UserWhereUniqueInput }
  ) => UserPromise;
  updateManyUsers: (
    args: { data: UserUpdateManyMutationInput; where?: UserWhereInput }
  ) => BatchPayloadPromise;
  upsertUser: (
    args: {
      where: UserWhereUniqueInput;
      create: UserCreateInput;
      update: UserUpdateInput;
    }
  ) => UserPromise;
  deleteUser: (where: UserWhereUniqueInput) => UserPromise;
  deleteManyUsers: (where?: UserWhereInput) => BatchPayloadPromise;
  createUserMeta: (data: UserMetaCreateInput) => UserMetaPromise;
  updateUserMeta: (
    args: { data: UserMetaUpdateInput; where: UserMetaWhereUniqueInput }
  ) => UserMetaPromise;
  updateManyUserMetas: (
    args: { data: UserMetaUpdateManyMutationInput; where?: UserMetaWhereInput }
  ) => BatchPayloadPromise;
  upsertUserMeta: (
    args: {
      where: UserMetaWhereUniqueInput;
      create: UserMetaCreateInput;
      update: UserMetaUpdateInput;
    }
  ) => UserMetaPromise;
  deleteUserMeta: (where: UserMetaWhereUniqueInput) => UserMetaPromise;
  deleteManyUserMetas: (where?: UserMetaWhereInput) => BatchPayloadPromise;

  /**
   * Subscriptions
   */

  $subscribe: Subscription;
}

export interface Subscription {
  user: (
    where?: UserSubscriptionWhereInput
  ) => UserSubscriptionPayloadSubscription;
  userMeta: (
    where?: UserMetaSubscriptionWhereInput
  ) => UserMetaSubscriptionPayloadSubscription;
}

export interface ClientConstructor<T> {
  new (options?: BaseClientOptions): T;
}

/**
 * Types
 */

export type UserMetaOrderByInput =
  | "id_ASC"
  | "id_DESC"
  | "key_ASC"
  | "key_DESC"
  | "value_ASC"
  | "value_DESC"
  | "createdAt_ASC"
  | "createdAt_DESC"
  | "updatedAt_ASC"
  | "updatedAt_DESC";

export type UserOrderByInput =
  | "id_ASC"
  | "id_DESC"
  | "email_ASC"
  | "email_DESC"
  | "username_ASC"
  | "username_DESC"
  | "password_ASC"
  | "password_DESC"
  | "verificationToken_ASC"
  | "verificationToken_DESC"
  | "verificationTokenExpiresAt_ASC"
  | "verificationTokenExpiresAt_DESC"
  | "createdAt_ASC"
  | "createdAt_DESC"
  | "updatedAt_ASC"
  | "updatedAt_DESC";

export type MutationType = "CREATED" | "UPDATED" | "DELETED";

export interface UserMetaUpdateManyWithoutUserInput {
  create?: UserMetaCreateWithoutUserInput[] | UserMetaCreateWithoutUserInput;
  delete?: UserMetaWhereUniqueInput[] | UserMetaWhereUniqueInput;
  connect?: UserMetaWhereUniqueInput[] | UserMetaWhereUniqueInput;
  set?: UserMetaWhereUniqueInput[] | UserMetaWhereUniqueInput;
  disconnect?: UserMetaWhereUniqueInput[] | UserMetaWhereUniqueInput;
  update?:
    | UserMetaUpdateWithWhereUniqueWithoutUserInput[]
    | UserMetaUpdateWithWhereUniqueWithoutUserInput;
  upsert?:
    | UserMetaUpsertWithWhereUniqueWithoutUserInput[]
    | UserMetaUpsertWithWhereUniqueWithoutUserInput;
  deleteMany?: UserMetaScalarWhereInput[] | UserMetaScalarWhereInput;
  updateMany?:
    | UserMetaUpdateManyWithWhereNestedInput[]
    | UserMetaUpdateManyWithWhereNestedInput;
}

export type UserWhereUniqueInput = AtLeastOne<{
  id: ID_Input;
  email?: String;
  username?: String;
}>;

export interface UserMetaUpdateWithoutUserDataInput {
  key?: String;
  value?: String;
}

export interface UserMetaWhereInput {
  id?: ID_Input;
  id_not?: ID_Input;
  id_in?: ID_Input[] | ID_Input;
  id_not_in?: ID_Input[] | ID_Input;
  id_lt?: ID_Input;
  id_lte?: ID_Input;
  id_gt?: ID_Input;
  id_gte?: ID_Input;
  id_contains?: ID_Input;
  id_not_contains?: ID_Input;
  id_starts_with?: ID_Input;
  id_not_starts_with?: ID_Input;
  id_ends_with?: ID_Input;
  id_not_ends_with?: ID_Input;
  key?: String;
  key_not?: String;
  key_in?: String[] | String;
  key_not_in?: String[] | String;
  key_lt?: String;
  key_lte?: String;
  key_gt?: String;
  key_gte?: String;
  key_contains?: String;
  key_not_contains?: String;
  key_starts_with?: String;
  key_not_starts_with?: String;
  key_ends_with?: String;
  key_not_ends_with?: String;
  value?: String;
  value_not?: String;
  value_in?: String[] | String;
  value_not_in?: String[] | String;
  value_lt?: String;
  value_lte?: String;
  value_gt?: String;
  value_gte?: String;
  value_contains?: String;
  value_not_contains?: String;
  value_starts_with?: String;
  value_not_starts_with?: String;
  value_ends_with?: String;
  value_not_ends_with?: String;
  user?: UserWhereInput;
  AND?: UserMetaWhereInput[] | UserMetaWhereInput;
  OR?: UserMetaWhereInput[] | UserMetaWhereInput;
  NOT?: UserMetaWhereInput[] | UserMetaWhereInput;
}

export interface UserMetaCreateInput {
  key: String;
  value: String;
  user: UserCreateOneWithoutUserMetaInput;
}

export interface UserMetaUpdateManyWithWhereNestedInput {
  where: UserMetaScalarWhereInput;
  data: UserMetaUpdateManyDataInput;
}

export interface UserMetaUpsertWithWhereUniqueWithoutUserInput {
  where: UserMetaWhereUniqueInput;
  update: UserMetaUpdateWithoutUserDataInput;
  create: UserMetaCreateWithoutUserInput;
}

export interface UserSubscriptionWhereInput {
  mutation_in?: MutationType[] | MutationType;
  updatedFields_contains?: String;
  updatedFields_contains_every?: String[] | String;
  updatedFields_contains_some?: String[] | String;
  node?: UserWhereInput;
  AND?: UserSubscriptionWhereInput[] | UserSubscriptionWhereInput;
  OR?: UserSubscriptionWhereInput[] | UserSubscriptionWhereInput;
  NOT?: UserSubscriptionWhereInput[] | UserSubscriptionWhereInput;
}

export interface UserCreateInput {
  email?: String;
  username?: String;
  password?: String;
  verificationToken?: String;
  verificationTokenExpiresAt?: DateTimeInput;
  userMeta?: UserMetaCreateManyWithoutUserInput;
}

export interface UserUpsertWithoutUserMetaInput {
  update: UserUpdateWithoutUserMetaDataInput;
  create: UserCreateWithoutUserMetaInput;
}

export interface UserMetaCreateManyWithoutUserInput {
  create?: UserMetaCreateWithoutUserInput[] | UserMetaCreateWithoutUserInput;
  connect?: UserMetaWhereUniqueInput[] | UserMetaWhereUniqueInput;
}

export interface UserUpdateOneRequiredWithoutUserMetaInput {
  create?: UserCreateWithoutUserMetaInput;
  update?: UserUpdateWithoutUserMetaDataInput;
  upsert?: UserUpsertWithoutUserMetaInput;
  connect?: UserWhereUniqueInput;
}

export interface UserMetaCreateWithoutUserInput {
  key: String;
  value: String;
}

export type UserMetaWhereUniqueInput = AtLeastOne<{
  id: ID_Input;
}>;

export interface UserUpdateInput {
  email?: String;
  username?: String;
  password?: String;
  verificationToken?: String;
  verificationTokenExpiresAt?: DateTimeInput;
  userMeta?: UserMetaUpdateManyWithoutUserInput;
}

export interface UserCreateOneWithoutUserMetaInput {
  create?: UserCreateWithoutUserMetaInput;
  connect?: UserWhereUniqueInput;
}

export interface UserUpdateManyMutationInput {
  email?: String;
  username?: String;
  password?: String;
  verificationToken?: String;
  verificationTokenExpiresAt?: DateTimeInput;
}

export interface UserMetaUpdateManyMutationInput {
  key?: String;
  value?: String;
}

export interface UserMetaScalarWhereInput {
  id?: ID_Input;
  id_not?: ID_Input;
  id_in?: ID_Input[] | ID_Input;
  id_not_in?: ID_Input[] | ID_Input;
  id_lt?: ID_Input;
  id_lte?: ID_Input;
  id_gt?: ID_Input;
  id_gte?: ID_Input;
  id_contains?: ID_Input;
  id_not_contains?: ID_Input;
  id_starts_with?: ID_Input;
  id_not_starts_with?: ID_Input;
  id_ends_with?: ID_Input;
  id_not_ends_with?: ID_Input;
  key?: String;
  key_not?: String;
  key_in?: String[] | String;
  key_not_in?: String[] | String;
  key_lt?: String;
  key_lte?: String;
  key_gt?: String;
  key_gte?: String;
  key_contains?: String;
  key_not_contains?: String;
  key_starts_with?: String;
  key_not_starts_with?: String;
  key_ends_with?: String;
  key_not_ends_with?: String;
  value?: String;
  value_not?: String;
  value_in?: String[] | String;
  value_not_in?: String[] | String;
  value_lt?: String;
  value_lte?: String;
  value_gt?: String;
  value_gte?: String;
  value_contains?: String;
  value_not_contains?: String;
  value_starts_with?: String;
  value_not_starts_with?: String;
  value_ends_with?: String;
  value_not_ends_with?: String;
  AND?: UserMetaScalarWhereInput[] | UserMetaScalarWhereInput;
  OR?: UserMetaScalarWhereInput[] | UserMetaScalarWhereInput;
  NOT?: UserMetaScalarWhereInput[] | UserMetaScalarWhereInput;
}

export interface UserMetaUpdateManyDataInput {
  key?: String;
  value?: String;
}

export interface UserWhereInput {
  id?: ID_Input;
  id_not?: ID_Input;
  id_in?: ID_Input[] | ID_Input;
  id_not_in?: ID_Input[] | ID_Input;
  id_lt?: ID_Input;
  id_lte?: ID_Input;
  id_gt?: ID_Input;
  id_gte?: ID_Input;
  id_contains?: ID_Input;
  id_not_contains?: ID_Input;
  id_starts_with?: ID_Input;
  id_not_starts_with?: ID_Input;
  id_ends_with?: ID_Input;
  id_not_ends_with?: ID_Input;
  email?: String;
  email_not?: String;
  email_in?: String[] | String;
  email_not_in?: String[] | String;
  email_lt?: String;
  email_lte?: String;
  email_gt?: String;
  email_gte?: String;
  email_contains?: String;
  email_not_contains?: String;
  email_starts_with?: String;
  email_not_starts_with?: String;
  email_ends_with?: String;
  email_not_ends_with?: String;
  username?: String;
  username_not?: String;
  username_in?: String[] | String;
  username_not_in?: String[] | String;
  username_lt?: String;
  username_lte?: String;
  username_gt?: String;
  username_gte?: String;
  username_contains?: String;
  username_not_contains?: String;
  username_starts_with?: String;
  username_not_starts_with?: String;
  username_ends_with?: String;
  username_not_ends_with?: String;
  password?: String;
  password_not?: String;
  password_in?: String[] | String;
  password_not_in?: String[] | String;
  password_lt?: String;
  password_lte?: String;
  password_gt?: String;
  password_gte?: String;
  password_contains?: String;
  password_not_contains?: String;
  password_starts_with?: String;
  password_not_starts_with?: String;
  password_ends_with?: String;
  password_not_ends_with?: String;
  verificationToken?: String;
  verificationToken_not?: String;
  verificationToken_in?: String[] | String;
  verificationToken_not_in?: String[] | String;
  verificationToken_lt?: String;
  verificationToken_lte?: String;
  verificationToken_gt?: String;
  verificationToken_gte?: String;
  verificationToken_contains?: String;
  verificationToken_not_contains?: String;
  verificationToken_starts_with?: String;
  verificationToken_not_starts_with?: String;
  verificationToken_ends_with?: String;
  verificationToken_not_ends_with?: String;
  verificationTokenExpiresAt?: DateTimeInput;
  verificationTokenExpiresAt_not?: DateTimeInput;
  verificationTokenExpiresAt_in?: DateTimeInput[] | DateTimeInput;
  verificationTokenExpiresAt_not_in?: DateTimeInput[] | DateTimeInput;
  verificationTokenExpiresAt_lt?: DateTimeInput;
  verificationTokenExpiresAt_lte?: DateTimeInput;
  verificationTokenExpiresAt_gt?: DateTimeInput;
  verificationTokenExpiresAt_gte?: DateTimeInput;
  userMeta_every?: UserMetaWhereInput;
  userMeta_some?: UserMetaWhereInput;
  userMeta_none?: UserMetaWhereInput;
  AND?: UserWhereInput[] | UserWhereInput;
  OR?: UserWhereInput[] | UserWhereInput;
  NOT?: UserWhereInput[] | UserWhereInput;
}

export interface UserMetaUpdateWithWhereUniqueWithoutUserInput {
  where: UserMetaWhereUniqueInput;
  data: UserMetaUpdateWithoutUserDataInput;
}

export interface UserUpdateWithoutUserMetaDataInput {
  email?: String;
  username?: String;
  password?: String;
  verificationToken?: String;
  verificationTokenExpiresAt?: DateTimeInput;
}

export interface UserMetaSubscriptionWhereInput {
  mutation_in?: MutationType[] | MutationType;
  updatedFields_contains?: String;
  updatedFields_contains_every?: String[] | String;
  updatedFields_contains_some?: String[] | String;
  node?: UserMetaWhereInput;
  AND?: UserMetaSubscriptionWhereInput[] | UserMetaSubscriptionWhereInput;
  OR?: UserMetaSubscriptionWhereInput[] | UserMetaSubscriptionWhereInput;
  NOT?: UserMetaSubscriptionWhereInput[] | UserMetaSubscriptionWhereInput;
}

export interface UserCreateWithoutUserMetaInput {
  email?: String;
  username?: String;
  password?: String;
  verificationToken?: String;
  verificationTokenExpiresAt?: DateTimeInput;
}

export interface UserMetaUpdateInput {
  key?: String;
  value?: String;
  user?: UserUpdateOneRequiredWithoutUserMetaInput;
}

export interface NodeNode {
  id: ID_Output;
}

export interface UserMetaPreviousValues {
  id: ID_Output;
  key: String;
  value: String;
}

export interface UserMetaPreviousValuesPromise
  extends Promise<UserMetaPreviousValues>,
    Fragmentable {
  id: () => Promise<ID_Output>;
  key: () => Promise<String>;
  value: () => Promise<String>;
}

export interface UserMetaPreviousValuesSubscription
  extends Promise<AsyncIterator<UserMetaPreviousValues>>,
    Fragmentable {
  id: () => Promise<AsyncIterator<ID_Output>>;
  key: () => Promise<AsyncIterator<String>>;
  value: () => Promise<AsyncIterator<String>>;
}

export interface UserEdge {
  node: User;
  cursor: String;
}

export interface UserEdgePromise extends Promise<UserEdge>, Fragmentable {
  node: <T = UserPromise>() => T;
  cursor: () => Promise<String>;
}

export interface UserEdgeSubscription
  extends Promise<AsyncIterator<UserEdge>>,
    Fragmentable {
  node: <T = UserSubscription>() => T;
  cursor: () => Promise<AsyncIterator<String>>;
}

export interface UserSubscriptionPayload {
  mutation: MutationType;
  node: User;
  updatedFields: String[];
  previousValues: UserPreviousValues;
}

export interface UserSubscriptionPayloadPromise
  extends Promise<UserSubscriptionPayload>,
    Fragmentable {
  mutation: () => Promise<MutationType>;
  node: <T = UserPromise>() => T;
  updatedFields: () => Promise<String[]>;
  previousValues: <T = UserPreviousValuesPromise>() => T;
}

export interface UserSubscriptionPayloadSubscription
  extends Promise<AsyncIterator<UserSubscriptionPayload>>,
    Fragmentable {
  mutation: () => Promise<AsyncIterator<MutationType>>;
  node: <T = UserSubscription>() => T;
  updatedFields: () => Promise<AsyncIterator<String[]>>;
  previousValues: <T = UserPreviousValuesSubscription>() => T;
}

export interface UserMeta {
  id: ID_Output;
  key: String;
  value: String;
}

export interface UserMetaPromise extends Promise<UserMeta>, Fragmentable {
  id: () => Promise<ID_Output>;
  key: () => Promise<String>;
  value: () => Promise<String>;
  user: <T = UserPromise>() => T;
}

export interface UserMetaSubscription
  extends Promise<AsyncIterator<UserMeta>>,
    Fragmentable {
  id: () => Promise<AsyncIterator<ID_Output>>;
  key: () => Promise<AsyncIterator<String>>;
  value: () => Promise<AsyncIterator<String>>;
  user: <T = UserSubscription>() => T;
}

export interface UserMetaSubscriptionPayload {
  mutation: MutationType;
  node: UserMeta;
  updatedFields: String[];
  previousValues: UserMetaPreviousValues;
}

export interface UserMetaSubscriptionPayloadPromise
  extends Promise<UserMetaSubscriptionPayload>,
    Fragmentable {
  mutation: () => Promise<MutationType>;
  node: <T = UserMetaPromise>() => T;
  updatedFields: () => Promise<String[]>;
  previousValues: <T = UserMetaPreviousValuesPromise>() => T;
}

export interface UserMetaSubscriptionPayloadSubscription
  extends Promise<AsyncIterator<UserMetaSubscriptionPayload>>,
    Fragmentable {
  mutation: () => Promise<AsyncIterator<MutationType>>;
  node: <T = UserMetaSubscription>() => T;
  updatedFields: () => Promise<AsyncIterator<String[]>>;
  previousValues: <T = UserMetaPreviousValuesSubscription>() => T;
}

export interface UserPreviousValues {
  id: ID_Output;
  email?: String;
  username?: String;
  password?: String;
  verificationToken?: String;
  verificationTokenExpiresAt?: DateTimeOutput;
}

export interface UserPreviousValuesPromise
  extends Promise<UserPreviousValues>,
    Fragmentable {
  id: () => Promise<ID_Output>;
  email: () => Promise<String>;
  username: () => Promise<String>;
  password: () => Promise<String>;
  verificationToken: () => Promise<String>;
  verificationTokenExpiresAt: () => Promise<DateTimeOutput>;
}

export interface UserPreviousValuesSubscription
  extends Promise<AsyncIterator<UserPreviousValues>>,
    Fragmentable {
  id: () => Promise<AsyncIterator<ID_Output>>;
  email: () => Promise<AsyncIterator<String>>;
  username: () => Promise<AsyncIterator<String>>;
  password: () => Promise<AsyncIterator<String>>;
  verificationToken: () => Promise<AsyncIterator<String>>;
  verificationTokenExpiresAt: () => Promise<AsyncIterator<DateTimeOutput>>;
}

export interface User {
  id: ID_Output;
  email?: String;
  username?: String;
  password?: String;
  verificationToken?: String;
  verificationTokenExpiresAt?: DateTimeOutput;
}

export interface UserPromise extends Promise<User>, Fragmentable {
  id: () => Promise<ID_Output>;
  email: () => Promise<String>;
  username: () => Promise<String>;
  password: () => Promise<String>;
  verificationToken: () => Promise<String>;
  verificationTokenExpiresAt: () => Promise<DateTimeOutput>;
  userMeta: <T = FragmentableArray<UserMeta>>(
    args?: {
      where?: UserMetaWhereInput;
      orderBy?: UserMetaOrderByInput;
      skip?: Int;
      after?: String;
      before?: String;
      first?: Int;
      last?: Int;
    }
  ) => T;
}

export interface UserSubscription
  extends Promise<AsyncIterator<User>>,
    Fragmentable {
  id: () => Promise<AsyncIterator<ID_Output>>;
  email: () => Promise<AsyncIterator<String>>;
  username: () => Promise<AsyncIterator<String>>;
  password: () => Promise<AsyncIterator<String>>;
  verificationToken: () => Promise<AsyncIterator<String>>;
  verificationTokenExpiresAt: () => Promise<AsyncIterator<DateTimeOutput>>;
  userMeta: <T = Promise<AsyncIterator<UserMetaSubscription>>>(
    args?: {
      where?: UserMetaWhereInput;
      orderBy?: UserMetaOrderByInput;
      skip?: Int;
      after?: String;
      before?: String;
      first?: Int;
      last?: Int;
    }
  ) => T;
}

export interface UserConnection {
  pageInfo: PageInfo;
  edges: UserEdge[];
}

export interface UserConnectionPromise
  extends Promise<UserConnection>,
    Fragmentable {
  pageInfo: <T = PageInfoPromise>() => T;
  edges: <T = FragmentableArray<UserEdge>>() => T;
  aggregate: <T = AggregateUserPromise>() => T;
}

export interface UserConnectionSubscription
  extends Promise<AsyncIterator<UserConnection>>,
    Fragmentable {
  pageInfo: <T = PageInfoSubscription>() => T;
  edges: <T = Promise<AsyncIterator<UserEdgeSubscription>>>() => T;
  aggregate: <T = AggregateUserSubscription>() => T;
}

export interface PageInfo {
  hasNextPage: Boolean;
  hasPreviousPage: Boolean;
  startCursor?: String;
  endCursor?: String;
}

export interface PageInfoPromise extends Promise<PageInfo>, Fragmentable {
  hasNextPage: () => Promise<Boolean>;
  hasPreviousPage: () => Promise<Boolean>;
  startCursor: () => Promise<String>;
  endCursor: () => Promise<String>;
}

export interface PageInfoSubscription
  extends Promise<AsyncIterator<PageInfo>>,
    Fragmentable {
  hasNextPage: () => Promise<AsyncIterator<Boolean>>;
  hasPreviousPage: () => Promise<AsyncIterator<Boolean>>;
  startCursor: () => Promise<AsyncIterator<String>>;
  endCursor: () => Promise<AsyncIterator<String>>;
}

export interface AggregateUserMeta {
  count: Int;
}

export interface AggregateUserMetaPromise
  extends Promise<AggregateUserMeta>,
    Fragmentable {
  count: () => Promise<Int>;
}

export interface AggregateUserMetaSubscription
  extends Promise<AsyncIterator<AggregateUserMeta>>,
    Fragmentable {
  count: () => Promise<AsyncIterator<Int>>;
}

export interface BatchPayload {
  count: Long;
}

export interface BatchPayloadPromise
  extends Promise<BatchPayload>,
    Fragmentable {
  count: () => Promise<Long>;
}

export interface BatchPayloadSubscription
  extends Promise<AsyncIterator<BatchPayload>>,
    Fragmentable {
  count: () => Promise<AsyncIterator<Long>>;
}

export interface AggregateUser {
  count: Int;
}

export interface AggregateUserPromise
  extends Promise<AggregateUser>,
    Fragmentable {
  count: () => Promise<Int>;
}

export interface AggregateUserSubscription
  extends Promise<AsyncIterator<AggregateUser>>,
    Fragmentable {
  count: () => Promise<AsyncIterator<Int>>;
}

export interface UserMetaConnection {
  pageInfo: PageInfo;
  edges: UserMetaEdge[];
}

export interface UserMetaConnectionPromise
  extends Promise<UserMetaConnection>,
    Fragmentable {
  pageInfo: <T = PageInfoPromise>() => T;
  edges: <T = FragmentableArray<UserMetaEdge>>() => T;
  aggregate: <T = AggregateUserMetaPromise>() => T;
}

export interface UserMetaConnectionSubscription
  extends Promise<AsyncIterator<UserMetaConnection>>,
    Fragmentable {
  pageInfo: <T = PageInfoSubscription>() => T;
  edges: <T = Promise<AsyncIterator<UserMetaEdgeSubscription>>>() => T;
  aggregate: <T = AggregateUserMetaSubscription>() => T;
}

export interface UserMetaEdge {
  node: UserMeta;
  cursor: String;
}

export interface UserMetaEdgePromise
  extends Promise<UserMetaEdge>,
    Fragmentable {
  node: <T = UserMetaPromise>() => T;
  cursor: () => Promise<String>;
}

export interface UserMetaEdgeSubscription
  extends Promise<AsyncIterator<UserMetaEdge>>,
    Fragmentable {
  node: <T = UserMetaSubscription>() => T;
  cursor: () => Promise<AsyncIterator<String>>;
}

/*
The `Boolean` scalar type represents `true` or `false`.
*/
export type Boolean = boolean;

/*
DateTime scalar input type, allowing Date
*/
export type DateTimeInput = Date | string;

/*
DateTime scalar output type, which is always a string
*/
export type DateTimeOutput = string;

/*
The `Int` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1. 
*/
export type Int = number;

export type Long = string;

/*
The `ID` scalar type represents a unique identifier, often used to refetch an object or as key for a cache. The ID type appears in a JSON response as a String; however, it is not intended to be human-readable. When expected as an input type, any string (such as `"4"`) or integer (such as `4`) input value will be accepted as an ID.
*/
export type ID_Input = string | number;
export type ID_Output = string;

/*
The `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text.
*/
export type String = string;

/**
 * Model Metadata
 */

export const models: Model[] = [
  {
    name: "User",
    embedded: false
  },
  {
    name: "UserMeta",
    embedded: false
  }
];

/**
 * Type Defs
 */

export const prisma: Prisma;
