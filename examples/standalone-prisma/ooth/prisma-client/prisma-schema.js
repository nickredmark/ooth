module.exports = {
        typeDefs: // Code generated by Prisma (prisma@1.28.3). DO NOT EDIT.
  // Please don't change this file manually but run `prisma generate` to update it.
  // For more information, please read the docs: https://www.prisma.io/docs/prisma-client/

/* GraphQL */ `type AggregateOothMeta {
  count: Int!
}

type AggregateUser {
  count: Int!
}

type BatchPayload {
  count: Long!
}

scalar Json

scalar Long

type Mutation {
  createOothMeta(data: OothMetaCreateInput!): OothMeta!
  updateOothMeta(data: OothMetaUpdateInput!, where: OothMetaWhereUniqueInput!): OothMeta
  updateManyOothMetas(data: OothMetaUpdateManyMutationInput!, where: OothMetaWhereInput): BatchPayload!
  upsertOothMeta(where: OothMetaWhereUniqueInput!, create: OothMetaCreateInput!, update: OothMetaUpdateInput!): OothMeta!
  deleteOothMeta(where: OothMetaWhereUniqueInput!): OothMeta
  deleteManyOothMetas(where: OothMetaWhereInput): BatchPayload!
  createUser(data: UserCreateInput!): User!
  updateUser(data: UserUpdateInput!, where: UserWhereUniqueInput!): User
  upsertUser(where: UserWhereUniqueInput!, create: UserCreateInput!, update: UserUpdateInput!): User!
  deleteUser(where: UserWhereUniqueInput!): User
  deleteManyUsers(where: UserWhereInput): BatchPayload!
}

enum MutationType {
  CREATED
  UPDATED
  DELETED
}

interface Node {
  id: ID!
}

type OothMeta {
  id: ID!
  key: String!
  data: Json
  dataString: String
  value: String
  user: User
}

type OothMetaConnection {
  pageInfo: PageInfo!
  edges: [OothMetaEdge]!
  aggregate: AggregateOothMeta!
}

input OothMetaCreateInput {
  key: String!
  data: Json
  dataString: String
  value: String
  user: UserCreateOneWithoutOothMetaInput
}

input OothMetaCreateManyWithoutUserInput {
  create: [OothMetaCreateWithoutUserInput!]
  connect: [OothMetaWhereUniqueInput!]
}

input OothMetaCreateWithoutUserInput {
  key: String!
  data: Json
  dataString: String
  value: String
}

type OothMetaEdge {
  node: OothMeta!
  cursor: String!
}

enum OothMetaOrderByInput {
  id_ASC
  id_DESC
  key_ASC
  key_DESC
  data_ASC
  data_DESC
  dataString_ASC
  dataString_DESC
  value_ASC
  value_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type OothMetaPreviousValues {
  id: ID!
  key: String!
  data: Json
  dataString: String
  value: String
}

input OothMetaScalarWhereInput {
  id: ID
  id_not: ID
  id_in: [ID!]
  id_not_in: [ID!]
  id_lt: ID
  id_lte: ID
  id_gt: ID
  id_gte: ID
  id_contains: ID
  id_not_contains: ID
  id_starts_with: ID
  id_not_starts_with: ID
  id_ends_with: ID
  id_not_ends_with: ID
  key: String
  key_not: String
  key_in: [String!]
  key_not_in: [String!]
  key_lt: String
  key_lte: String
  key_gt: String
  key_gte: String
  key_contains: String
  key_not_contains: String
  key_starts_with: String
  key_not_starts_with: String
  key_ends_with: String
  key_not_ends_with: String
  dataString: String
  dataString_not: String
  dataString_in: [String!]
  dataString_not_in: [String!]
  dataString_lt: String
  dataString_lte: String
  dataString_gt: String
  dataString_gte: String
  dataString_contains: String
  dataString_not_contains: String
  dataString_starts_with: String
  dataString_not_starts_with: String
  dataString_ends_with: String
  dataString_not_ends_with: String
  value: String
  value_not: String
  value_in: [String!]
  value_not_in: [String!]
  value_lt: String
  value_lte: String
  value_gt: String
  value_gte: String
  value_contains: String
  value_not_contains: String
  value_starts_with: String
  value_not_starts_with: String
  value_ends_with: String
  value_not_ends_with: String
  AND: [OothMetaScalarWhereInput!]
  OR: [OothMetaScalarWhereInput!]
  NOT: [OothMetaScalarWhereInput!]
}

type OothMetaSubscriptionPayload {
  mutation: MutationType!
  node: OothMeta
  updatedFields: [String!]
  previousValues: OothMetaPreviousValues
}

input OothMetaSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: OothMetaWhereInput
  AND: [OothMetaSubscriptionWhereInput!]
  OR: [OothMetaSubscriptionWhereInput!]
  NOT: [OothMetaSubscriptionWhereInput!]
}

input OothMetaUpdateInput {
  key: String
  data: Json
  dataString: String
  value: String
  user: UserUpdateOneWithoutOothMetaInput
}

input OothMetaUpdateManyDataInput {
  key: String
  data: Json
  dataString: String
  value: String
}

input OothMetaUpdateManyMutationInput {
  key: String
  data: Json
  dataString: String
  value: String
}

input OothMetaUpdateManyWithoutUserInput {
  create: [OothMetaCreateWithoutUserInput!]
  delete: [OothMetaWhereUniqueInput!]
  connect: [OothMetaWhereUniqueInput!]
  set: [OothMetaWhereUniqueInput!]
  disconnect: [OothMetaWhereUniqueInput!]
  update: [OothMetaUpdateWithWhereUniqueWithoutUserInput!]
  upsert: [OothMetaUpsertWithWhereUniqueWithoutUserInput!]
  deleteMany: [OothMetaScalarWhereInput!]
  updateMany: [OothMetaUpdateManyWithWhereNestedInput!]
}

input OothMetaUpdateManyWithWhereNestedInput {
  where: OothMetaScalarWhereInput!
  data: OothMetaUpdateManyDataInput!
}

input OothMetaUpdateWithoutUserDataInput {
  key: String
  data: Json
  dataString: String
  value: String
}

input OothMetaUpdateWithWhereUniqueWithoutUserInput {
  where: OothMetaWhereUniqueInput!
  data: OothMetaUpdateWithoutUserDataInput!
}

input OothMetaUpsertWithWhereUniqueWithoutUserInput {
  where: OothMetaWhereUniqueInput!
  update: OothMetaUpdateWithoutUserDataInput!
  create: OothMetaCreateWithoutUserInput!
}

input OothMetaWhereInput {
  id: ID
  id_not: ID
  id_in: [ID!]
  id_not_in: [ID!]
  id_lt: ID
  id_lte: ID
  id_gt: ID
  id_gte: ID
  id_contains: ID
  id_not_contains: ID
  id_starts_with: ID
  id_not_starts_with: ID
  id_ends_with: ID
  id_not_ends_with: ID
  key: String
  key_not: String
  key_in: [String!]
  key_not_in: [String!]
  key_lt: String
  key_lte: String
  key_gt: String
  key_gte: String
  key_contains: String
  key_not_contains: String
  key_starts_with: String
  key_not_starts_with: String
  key_ends_with: String
  key_not_ends_with: String
  dataString: String
  dataString_not: String
  dataString_in: [String!]
  dataString_not_in: [String!]
  dataString_lt: String
  dataString_lte: String
  dataString_gt: String
  dataString_gte: String
  dataString_contains: String
  dataString_not_contains: String
  dataString_starts_with: String
  dataString_not_starts_with: String
  dataString_ends_with: String
  dataString_not_ends_with: String
  value: String
  value_not: String
  value_in: [String!]
  value_not_in: [String!]
  value_lt: String
  value_lte: String
  value_gt: String
  value_gte: String
  value_contains: String
  value_not_contains: String
  value_starts_with: String
  value_not_starts_with: String
  value_ends_with: String
  value_not_ends_with: String
  user: UserWhereInput
  AND: [OothMetaWhereInput!]
  OR: [OothMetaWhereInput!]
  NOT: [OothMetaWhereInput!]
}

input OothMetaWhereUniqueInput {
  id: ID
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type Query {
  oothMeta(where: OothMetaWhereUniqueInput!): OothMeta
  oothMetas(where: OothMetaWhereInput, orderBy: OothMetaOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [OothMeta]!
  oothMetasConnection(where: OothMetaWhereInput, orderBy: OothMetaOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): OothMetaConnection!
  user(where: UserWhereUniqueInput!): User
  users(where: UserWhereInput, orderBy: UserOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [User]!
  usersConnection(where: UserWhereInput, orderBy: UserOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): UserConnection!
  node(id: ID!): Node
}

type Subscription {
  oothMeta(where: OothMetaSubscriptionWhereInput): OothMetaSubscriptionPayload
  user(where: UserSubscriptionWhereInput): UserSubscriptionPayload
}

type User {
  id: ID!
  oothMeta(where: OothMetaWhereInput, orderBy: OothMetaOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [OothMeta!]
}

type UserConnection {
  pageInfo: PageInfo!
  edges: [UserEdge]!
  aggregate: AggregateUser!
}

input UserCreateInput {
  oothMeta: OothMetaCreateManyWithoutUserInput
}

input UserCreateOneWithoutOothMetaInput {
  connect: UserWhereUniqueInput
}

type UserEdge {
  node: User!
  cursor: String!
}

enum UserOrderByInput {
  id_ASC
  id_DESC
  createdAt_ASC
  createdAt_DESC
  updatedAt_ASC
  updatedAt_DESC
}

type UserPreviousValues {
  id: ID!
}

type UserSubscriptionPayload {
  mutation: MutationType!
  node: User
  updatedFields: [String!]
  previousValues: UserPreviousValues
}

input UserSubscriptionWhereInput {
  mutation_in: [MutationType!]
  updatedFields_contains: String
  updatedFields_contains_every: [String!]
  updatedFields_contains_some: [String!]
  node: UserWhereInput
  AND: [UserSubscriptionWhereInput!]
  OR: [UserSubscriptionWhereInput!]
  NOT: [UserSubscriptionWhereInput!]
}

input UserUpdateInput {
  oothMeta: OothMetaUpdateManyWithoutUserInput
}

input UserUpdateOneWithoutOothMetaInput {
  delete: Boolean
  disconnect: Boolean
  connect: UserWhereUniqueInput
}

input UserWhereInput {
  id: ID
  id_not: ID
  id_in: [ID!]
  id_not_in: [ID!]
  id_lt: ID
  id_lte: ID
  id_gt: ID
  id_gte: ID
  id_contains: ID
  id_not_contains: ID
  id_starts_with: ID
  id_not_starts_with: ID
  id_ends_with: ID
  id_not_ends_with: ID
  oothMeta_every: OothMetaWhereInput
  oothMeta_some: OothMetaWhereInput
  oothMeta_none: OothMetaWhereInput
  AND: [UserWhereInput!]
  OR: [UserWhereInput!]
  NOT: [UserWhereInput!]
}

input UserWhereUniqueInput {
  id: ID
}
`
      }
    