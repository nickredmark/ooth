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
  oothMeta: (where?: OothMetaWhereInput) => Promise<boolean>;
  user: (where?: UserWhereInput) => Promise<boolean>;
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

  oothMeta: (where: OothMetaWhereUniqueInput) => OothMetaPromise;
  oothMetas: (
    args?: {
      where?: OothMetaWhereInput;
      orderBy?: OothMetaOrderByInput;
      skip?: Int;
      after?: String;
      before?: String;
      first?: Int;
      last?: Int;
    }
  ) => FragmentableArray<OothMeta>;
  oothMetasConnection: (
    args?: {
      where?: OothMetaWhereInput;
      orderBy?: OothMetaOrderByInput;
      skip?: Int;
      after?: String;
      before?: String;
      first?: Int;
      last?: Int;
    }
  ) => OothMetaConnectionPromise;
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
  node: (args: { id: ID_Output }) => Node;

  /**
   * Mutations
   */

  createOothMeta: (data: OothMetaCreateInput) => OothMetaPromise;
  updateOothMeta: (
    args: { data: OothMetaUpdateInput; where: OothMetaWhereUniqueInput }
  ) => OothMetaPromise;
  updateManyOothMetas: (
    args: { data: OothMetaUpdateManyMutationInput; where?: OothMetaWhereInput }
  ) => BatchPayloadPromise;
  upsertOothMeta: (
    args: {
      where: OothMetaWhereUniqueInput;
      create: OothMetaCreateInput;
      update: OothMetaUpdateInput;
    }
  ) => OothMetaPromise;
  deleteOothMeta: (where: OothMetaWhereUniqueInput) => OothMetaPromise;
  deleteManyOothMetas: (where?: OothMetaWhereInput) => BatchPayloadPromise;
  createUser: (data: UserCreateInput) => UserPromise;
  updateUser: (
    args: { data: UserUpdateInput; where: UserWhereUniqueInput }
  ) => UserPromise;
  upsertUser: (
    args: {
      where: UserWhereUniqueInput;
      create: UserCreateInput;
      update: UserUpdateInput;
    }
  ) => UserPromise;
  deleteUser: (where: UserWhereUniqueInput) => UserPromise;
  deleteManyUsers: (where?: UserWhereInput) => BatchPayloadPromise;

  /**
   * Subscriptions
   */

  $subscribe: Subscription;
}

export interface Subscription {
  oothMeta: (
    where?: OothMetaSubscriptionWhereInput
  ) => OothMetaSubscriptionPayloadSubscription;
  user: (
    where?: UserSubscriptionWhereInput
  ) => UserSubscriptionPayloadSubscription;
}

export interface ClientConstructor<T> {
  new (options?: BaseClientOptions): T;
}

/**
 * Types
 */

export type OothMetaOrderByInput =
  | "id_ASC"
  | "id_DESC"
  | "key_ASC"
  | "key_DESC"
  | "data_ASC"
  | "data_DESC"
  | "dataString_ASC"
  | "dataString_DESC"
  | "value_ASC"
  | "value_DESC"
  | "createdAt_ASC"
  | "createdAt_DESC"
  | "updatedAt_ASC"
  | "updatedAt_DESC";

export type UserOrderByInput =
  | "id_ASC"
  | "id_DESC"
  | "createdAt_ASC"
  | "createdAt_DESC"
  | "updatedAt_ASC"
  | "updatedAt_DESC";

export type MutationType = "CREATED" | "UPDATED" | "DELETED";

export interface OothMetaUpdateInput {
  key?: String;
  data?: Json;
  dataString?: String;
  value?: String;
  user?: UserUpdateOneWithoutOothMetaInput;
}

export type OothMetaWhereUniqueInput = AtLeastOne<{
  id: ID_Input;
}>;

export interface OothMetaUpdateWithWhereUniqueWithoutUserInput {
  where: OothMetaWhereUniqueInput;
  data: OothMetaUpdateWithoutUserDataInput;
}

export interface UserCreateInput {
  oothMeta?: OothMetaCreateManyWithoutUserInput;
}

export interface OothMetaUpdateManyWithoutUserInput {
  create?: OothMetaCreateWithoutUserInput[] | OothMetaCreateWithoutUserInput;
  delete?: OothMetaWhereUniqueInput[] | OothMetaWhereUniqueInput;
  connect?: OothMetaWhereUniqueInput[] | OothMetaWhereUniqueInput;
  set?: OothMetaWhereUniqueInput[] | OothMetaWhereUniqueInput;
  disconnect?: OothMetaWhereUniqueInput[] | OothMetaWhereUniqueInput;
  update?:
    | OothMetaUpdateWithWhereUniqueWithoutUserInput[]
    | OothMetaUpdateWithWhereUniqueWithoutUserInput;
  upsert?:
    | OothMetaUpsertWithWhereUniqueWithoutUserInput[]
    | OothMetaUpsertWithWhereUniqueWithoutUserInput;
  deleteMany?: OothMetaScalarWhereInput[] | OothMetaScalarWhereInput;
  updateMany?:
    | OothMetaUpdateManyWithWhereNestedInput[]
    | OothMetaUpdateManyWithWhereNestedInput;
}

export interface OothMetaUpdateManyMutationInput {
  key?: String;
  data?: Json;
  dataString?: String;
  value?: String;
}

export interface UserUpdateInput {
  oothMeta?: OothMetaUpdateManyWithoutUserInput;
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

export interface OothMetaCreateWithoutUserInput {
  key: String;
  data?: Json;
  dataString?: String;
  value?: String;
}

export interface OothMetaUpdateManyDataInput {
  key?: String;
  data?: Json;
  dataString?: String;
  value?: String;
}

export interface OothMetaScalarWhereInput {
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
  dataString?: String;
  dataString_not?: String;
  dataString_in?: String[] | String;
  dataString_not_in?: String[] | String;
  dataString_lt?: String;
  dataString_lte?: String;
  dataString_gt?: String;
  dataString_gte?: String;
  dataString_contains?: String;
  dataString_not_contains?: String;
  dataString_starts_with?: String;
  dataString_not_starts_with?: String;
  dataString_ends_with?: String;
  dataString_not_ends_with?: String;
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
  AND?: OothMetaScalarWhereInput[] | OothMetaScalarWhereInput;
  OR?: OothMetaScalarWhereInput[] | OothMetaScalarWhereInput;
  NOT?: OothMetaScalarWhereInput[] | OothMetaScalarWhereInput;
}

export interface OothMetaUpdateWithoutUserDataInput {
  key?: String;
  data?: Json;
  dataString?: String;
  value?: String;
}

export interface OothMetaCreateInput {
  key: String;
  data?: Json;
  dataString?: String;
  value?: String;
  user?: UserCreateOneWithoutOothMetaInput;
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
  oothMeta_every?: OothMetaWhereInput;
  oothMeta_some?: OothMetaWhereInput;
  oothMeta_none?: OothMetaWhereInput;
  AND?: UserWhereInput[] | UserWhereInput;
  OR?: UserWhereInput[] | UserWhereInput;
  NOT?: UserWhereInput[] | UserWhereInput;
}

export interface OothMetaWhereInput {
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
  dataString?: String;
  dataString_not?: String;
  dataString_in?: String[] | String;
  dataString_not_in?: String[] | String;
  dataString_lt?: String;
  dataString_lte?: String;
  dataString_gt?: String;
  dataString_gte?: String;
  dataString_contains?: String;
  dataString_not_contains?: String;
  dataString_starts_with?: String;
  dataString_not_starts_with?: String;
  dataString_ends_with?: String;
  dataString_not_ends_with?: String;
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
  AND?: OothMetaWhereInput[] | OothMetaWhereInput;
  OR?: OothMetaWhereInput[] | OothMetaWhereInput;
  NOT?: OothMetaWhereInput[] | OothMetaWhereInput;
}

export interface UserUpdateOneWithoutOothMetaInput {
  delete?: Boolean;
  disconnect?: Boolean;
  connect?: UserWhereUniqueInput;
}

export interface OothMetaCreateManyWithoutUserInput {
  create?: OothMetaCreateWithoutUserInput[] | OothMetaCreateWithoutUserInput;
  connect?: OothMetaWhereUniqueInput[] | OothMetaWhereUniqueInput;
}

export interface UserCreateOneWithoutOothMetaInput {
  connect?: UserWhereUniqueInput;
}

export interface OothMetaSubscriptionWhereInput {
  mutation_in?: MutationType[] | MutationType;
  updatedFields_contains?: String;
  updatedFields_contains_every?: String[] | String;
  updatedFields_contains_some?: String[] | String;
  node?: OothMetaWhereInput;
  AND?: OothMetaSubscriptionWhereInput[] | OothMetaSubscriptionWhereInput;
  OR?: OothMetaSubscriptionWhereInput[] | OothMetaSubscriptionWhereInput;
  NOT?: OothMetaSubscriptionWhereInput[] | OothMetaSubscriptionWhereInput;
}

export type UserWhereUniqueInput = AtLeastOne<{
  id: ID_Input;
}>;

export interface OothMetaUpsertWithWhereUniqueWithoutUserInput {
  where: OothMetaWhereUniqueInput;
  update: OothMetaUpdateWithoutUserDataInput;
  create: OothMetaCreateWithoutUserInput;
}

export interface OothMetaUpdateManyWithWhereNestedInput {
  where: OothMetaScalarWhereInput;
  data: OothMetaUpdateManyDataInput;
}

export interface NodeNode {
  id: ID_Output;
}

export interface UserPreviousValues {
  id: ID_Output;
}

export interface UserPreviousValuesPromise
  extends Promise<UserPreviousValues>,
    Fragmentable {
  id: () => Promise<ID_Output>;
}

export interface UserPreviousValuesSubscription
  extends Promise<AsyncIterator<UserPreviousValues>>,
    Fragmentable {
  id: () => Promise<AsyncIterator<ID_Output>>;
}

export interface AggregateOothMeta {
  count: Int;
}

export interface AggregateOothMetaPromise
  extends Promise<AggregateOothMeta>,
    Fragmentable {
  count: () => Promise<Int>;
}

export interface AggregateOothMetaSubscription
  extends Promise<AsyncIterator<AggregateOothMeta>>,
    Fragmentable {
  count: () => Promise<AsyncIterator<Int>>;
}

export interface OothMeta {
  id: ID_Output;
  key: String;
  data?: Json;
  dataString?: String;
  value?: String;
}

export interface OothMetaPromise extends Promise<OothMeta>, Fragmentable {
  id: () => Promise<ID_Output>;
  key: () => Promise<String>;
  data: () => Promise<Json>;
  dataString: () => Promise<String>;
  value: () => Promise<String>;
  user: <T = UserPromise>() => T;
}

export interface OothMetaSubscription
  extends Promise<AsyncIterator<OothMeta>>,
    Fragmentable {
  id: () => Promise<AsyncIterator<ID_Output>>;
  key: () => Promise<AsyncIterator<String>>;
  data: () => Promise<AsyncIterator<Json>>;
  dataString: () => Promise<AsyncIterator<String>>;
  value: () => Promise<AsyncIterator<String>>;
  user: <T = UserSubscription>() => T;
}

export interface OothMetaEdge {
  node: OothMeta;
  cursor: String;
}

export interface OothMetaEdgePromise
  extends Promise<OothMetaEdge>,
    Fragmentable {
  node: <T = OothMetaPromise>() => T;
  cursor: () => Promise<String>;
}

export interface OothMetaEdgeSubscription
  extends Promise<AsyncIterator<OothMetaEdge>>,
    Fragmentable {
  node: <T = OothMetaSubscription>() => T;
  cursor: () => Promise<AsyncIterator<String>>;
}

export interface User {
  id: ID_Output;
}

export interface UserPromise extends Promise<User>, Fragmentable {
  id: () => Promise<ID_Output>;
  oothMeta: <T = FragmentableArray<OothMeta>>(
    args?: {
      where?: OothMetaWhereInput;
      orderBy?: OothMetaOrderByInput;
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
  oothMeta: <T = Promise<AsyncIterator<OothMetaSubscription>>>(
    args?: {
      where?: OothMetaWhereInput;
      orderBy?: OothMetaOrderByInput;
      skip?: Int;
      after?: String;
      before?: String;
      first?: Int;
      last?: Int;
    }
  ) => T;
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

export interface OothMetaSubscriptionPayload {
  mutation: MutationType;
  node: OothMeta;
  updatedFields: String[];
  previousValues: OothMetaPreviousValues;
}

export interface OothMetaSubscriptionPayloadPromise
  extends Promise<OothMetaSubscriptionPayload>,
    Fragmentable {
  mutation: () => Promise<MutationType>;
  node: <T = OothMetaPromise>() => T;
  updatedFields: () => Promise<String[]>;
  previousValues: <T = OothMetaPreviousValuesPromise>() => T;
}

export interface OothMetaSubscriptionPayloadSubscription
  extends Promise<AsyncIterator<OothMetaSubscriptionPayload>>,
    Fragmentable {
  mutation: () => Promise<AsyncIterator<MutationType>>;
  node: <T = OothMetaSubscription>() => T;
  updatedFields: () => Promise<AsyncIterator<String[]>>;
  previousValues: <T = OothMetaPreviousValuesSubscription>() => T;
}

export interface OothMetaConnection {
  pageInfo: PageInfo;
  edges: OothMetaEdge[];
}

export interface OothMetaConnectionPromise
  extends Promise<OothMetaConnection>,
    Fragmentable {
  pageInfo: <T = PageInfoPromise>() => T;
  edges: <T = FragmentableArray<OothMetaEdge>>() => T;
  aggregate: <T = AggregateOothMetaPromise>() => T;
}

export interface OothMetaConnectionSubscription
  extends Promise<AsyncIterator<OothMetaConnection>>,
    Fragmentable {
  pageInfo: <T = PageInfoSubscription>() => T;
  edges: <T = Promise<AsyncIterator<OothMetaEdgeSubscription>>>() => T;
  aggregate: <T = AggregateOothMetaSubscription>() => T;
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

export interface OothMetaPreviousValues {
  id: ID_Output;
  key: String;
  data?: Json;
  dataString?: String;
  value?: String;
}

export interface OothMetaPreviousValuesPromise
  extends Promise<OothMetaPreviousValues>,
    Fragmentable {
  id: () => Promise<ID_Output>;
  key: () => Promise<String>;
  data: () => Promise<Json>;
  dataString: () => Promise<String>;
  value: () => Promise<String>;
}

export interface OothMetaPreviousValuesSubscription
  extends Promise<AsyncIterator<OothMetaPreviousValues>>,
    Fragmentable {
  id: () => Promise<AsyncIterator<ID_Output>>;
  key: () => Promise<AsyncIterator<String>>;
  data: () => Promise<AsyncIterator<Json>>;
  dataString: () => Promise<AsyncIterator<String>>;
  value: () => Promise<AsyncIterator<String>>;
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

/*
The `Boolean` scalar type represents `true` or `false`.
*/
export type Boolean = boolean;

export type Long = string;

/*
The `ID` scalar type represents a unique identifier, often used to refetch an object or as key for a cache. The ID type appears in a JSON response as a String; however, it is not intended to be human-readable. When expected as an input type, any string (such as `"4"`) or integer (such as `4`) input value will be accepted as an ID.
*/
export type ID_Input = string | number;
export type ID_Output = string;

export type Json = any;

/*
The `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text.
*/
export type String = string;

/*
The `Int` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1. 
*/
export type Int = number;

/**
 * Model Metadata
 */

export const models: Model[] = [
  {
    name: "User",
    embedded: false
  },
  {
    name: "OothMeta",
    embedded: false
  }
];

/**
 * Type Defs
 */

export const prisma: Prisma;