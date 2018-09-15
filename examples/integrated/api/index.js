require('dotenv').config();
const { MongoClient, ObjectId } = require("mongodb");
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const { graphqlExpress, graphiqlExpress } = require("graphql-server-express");
const { makeExecutableSchema } = require("graphql-tools");
const morgan = require("morgan");
const cors = require("cors");
const nodeify = require("nodeify");
const ooth = require("./ooth");

const prepare = o => {
  if (o) {
    o._id = o._id.toString();
  }
  return o;
};

function nodeifyAsync(asyncFunction) {
  return function(...args) {
    return nodeify(asyncFunction(...args.slice(0, -1)), args[args.length - 1]);
  };
}

const start = async () => {
  try {
    const db = await MongoClient.connect(process.env.MONGO_URL);

    const Posts = db.collection("posts");
    const Comments = db.collection("comments");

    const typeDefs = [
      `
            type Query {
                me: User
                post(_id: ID!): Post
                posts: [Post]
                comment(_id: ID!): Comment
            }
            type User {
                _id: ID!
            }
            type Post {
                _id: ID!
                authorId: ID!
                title: String
                content: String

                author: User
                comments: [Comment]!
            }
            type Comment {
                _id: ID!
                postId: ID!
                authorId: ID
                content: String

                author: User
                post: Post
            }
            type Mutation {
                createPost(title: String, content: String): Post
                createComment(postId: ID!, content: String): Comment
            }
            schema {
                query: Query
                mutation: Mutation
            }
        `
    ];

    const resolvers = {
      Query: {
        me: async (root, args, { userId }) => {
          if (!userId) {
            return null;
          }
          return {
            _id: userId
          };
        },
        post: async (root, { _id }) => {
          return prepare(await Posts.findOne(ObjectId(_id)));
        },
        posts: async (root, args, context) => {
          return (await Posts.find({}).toArray()).map(prepare);
        },
        comment: async (root, { _id }) => {
          return prepare(await Comments.findOne(ObjectId(_id)));
        }
      },
      Post: {
        comments: async ({ _id }) => {
          return (await Comments.find({ postId: _id }).toArray()).map(prepare);
        }
      },
      Comment: {
        post: async ({ postId }) => {
          return prepare(await Posts.findOne(ObjectId(postId)));
        }
      },
      Mutation: {
        createPost: async (root, args, { userId }, info) => {
          if (!userId) {
            throw new Error("User not logged in.");
          }
          args.authorId = userId;
          const { insertedId } = await Posts.insertOne(args);
          return prepare(await Posts.findOne(ObjectId(insertedId)));
        },
        createComment: async (root, args, { userId }) => {
          if (!userId) {
            throw new Error("User not logged in.");
          }
          args.authorId = userId;
          const { insertedId } = await Comments.insertOne(args);
          return prepare(await Comments.findOne(ObjectId(insertedId)));
        }
      }
    };

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers
    });

    const app = express();
    app.use(morgan("dev"));

    const corsMiddleware = cors({
      origin: process.env.ORIGIN_URL,
      credentials: true,
      preflightContinue: false
    });
    app.use(corsMiddleware);
    app.options(corsMiddleware);

    await ooth(app);

    app.use(
      "/graphql",
      bodyParser.json(),
      graphqlExpress((req, res) => {
        return {
          schema,
          context: { userId: req.user }
        };
      })
    );

    app.use(
      "/graphiql",
      graphiqlExpress({
        endpointURL: "/graphql"
      })
    );

    app.listen(process.env.PORT, () => {
      console.info(`Online at ${process.env.URL}:${process.env.PORT}`);
    });
  } catch (e) {
    console.error(e);
  }
};

start();
