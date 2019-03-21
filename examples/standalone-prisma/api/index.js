require("dotenv").config();
// const { MongoClient, ObjectId } = require("mongodb");
const { Prisma, forwardTo } = require("prisma-binding");
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const { graphqlExpress, graphiqlExpress } = require("graphql-server-express");
const { makeExecutableSchema } = require("graphql-tools");
const morgan = require("morgan");
const cors = require("cors");
const passport = require("passport");
const nodeify = require("nodeify");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const prismaSchema = require("./generated/prisma-schema");

const prepare = o => {
  // if (o) {
  //   o.id = o.id.toString();
  // }
  return o;
};

function nodeifyAsync(asyncFunction) {
  return function(...args) {
    return nodeify(asyncFunction(...args.slice(0, -1)), args[args.length - 1]);
  };
}

function setupAuthEndpoints(app) {
  app.use(cookieParser());
  app.use(
    session({
      name: "api-session-id",
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: true
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());
  passport.serializeUser((userId, done) => {
    done(null, userId);
  });
  passport.deserializeUser((userId, done) => {
    done(null, userId);
  });
  passport.use(
    "jwt",
    new JwtStrategy(
      {
        secretOrKey: process.env.SHARED_SECRET,
        jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("jwt")
      },
      nodeifyAsync(async payload => {
        return payload.id;
      })
    )
  );
  // app.post("/login", (req, res) => {
  app.post("/login", passport.authenticate("jwt"), (req, res) => {
    console.log("/login hit");
    res.send({
      user: {
        _id: req.user,
        id: req.user
      },
      message: "Logged in successfully."
    });
  });
  app.post("/logout", (req, res) => {
    req.logout();
    res.send({
      message: "Logged out successfully."
    });
  });
}

const start = async () => {
  try {
    const typeDefs = [
      `
            type Query {
                me: User
                post(id: ID!): Post
                posts: [Post]
                comment(id: ID!): Comment
            }
            type User {
                id: ID!
            }
            type Post {
                id: ID!
                title: String
                content: String
                author: User
                comments: [Comment]!
            }
            type Comment {
                id: ID!
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

    const db = new Prisma({
      typeDefs: prismaSchema.typeDefs,
      endpoint: process.env.PRISMA_ENDPOINT,
      secret: process.env.PRISMA_SECRET,
      debug: false
    });

    const resolvers = {
      Query: {
        me: async (root, args, { userId }) => {
          if (!userId) {
            return null;
          }
          return {
            id: userId
          };
        },
        post: async (root, { id }) => {
          const post = await db.query.post({ where: { id: id } });
          return post;
        },
        posts: async (root, args, context) => {
          const posts = await db.query.posts();
          return posts;
        },
        comment: async (root, { id }) => {
          const comment = await db.query.comment({
            where: { id: id }
          });
          return comment;
        }
      },
      Post: {
        comments: async ({ id }) => {
          return await db.query.comments({
            where: { postId: id }
          });
        }
      },
      Comment: {
        post: async ({ postId }) => {
          return await db.query.post({
            where: { id: postId }
          });
        }
      },
      Mutation: {
        createPost: async (root, args, { userId }, info) => {
          if (!userId) {
            throw new Error("User not logged in.");
          }
          args.author = {
            connect: {
              id: userId
            }
          };
          args.post = {
            connect: {
              id: postId
            }
          };
          delete args.postId;
          console.log("createPost with args: ", args);
          const { id } = await db.mutation.createPost(args);
          return prepare(await db.query.post({ where: { id } }));
        },
        createComment: async (root, args, { userId }) => {
          if (!userId) {
            throw new Error("User not logged in.");
          }
          args.author = {
            connect: {
              id: args.userId
            }
          };
          console.log("createComment with args: ", args);
          const { id } = await db.mutation.createComment(args);
          return prepare(await db.query.comment({ where: { id } }));
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

    setupAuthEndpoints(app);

    app.use(
      "/graphql",
      bodyParser.json(),
      graphqlExpress((req, res) => ({
        schema,
        context: { userId: req.user }
      }))
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
