import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import session from  "express-session";
// import fs from "fs";
import { createServer } from "http";
import passport from "passport";
import path from "path";
import requestIp from "request-ip";
import { Server } from "socket.io";
import { fileURLToPath } from "url";

// import { DB_NAME } from "./constants.js";
// import { dbInstance } from "./db/index.js";
import morganMiddleware from "./logger/morgan.logger.js";
import { initializeSocketIO } from "./socket/index.js";
import { ApiError } from "./utils/ApiError.js";
// import { ApiResponse } from "./utils/ApiResponse.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// const file = fs.readFileSync(path.resolve(__dirname, "./swagger.yaml"), "utf8");

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  pingTimeout: 60000,
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST'],

  },
});

app.set("io", io); // using set method to mount the `io` instance on the app to avoid usage of `global`

// global middlewares
app.use(
  cors({
    origin:'http://localhost:3000',
      // process.env.CORS_ORIGIN === "*"
      //   ? "*" // This might give CORS error for some origins due to credentials set to true
      //   : process.env.CORS_ORIGIN?.split(","), // For multiple cors origin for production. Refer https://github.com/hiteshchoudhary/apihub/blob/a846abd7a0795054f48c7eb3e71f3af36478fa96/.env.sample#L12C1-L12C12
    credentials: true,
  })
);

app.use(requestIp.mw());

// Rate limiter to avoid misuse of the service and avoid cost spikes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Limit each IP to 500 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req, res) => {
    return req.clientIp; // IP address from requestIp.mw(), as opposed to req.ip
  },
  handler: (_, __, ___, options) => {
    throw new ApiError(
      options.statusCode || 500,
      `There are too many requests. You are only allowed ${
        options.max
      } requests per ${options.windowMs / 60000} minutes`
    );
  },
});

// Apply the rate limiting middleware to all requests
app.use(limiter);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public")); // configure static file to save images locally
app.use(cookieParser());

// required for passport
app.use(
  session({
    secret: 'vklnasuvn_sadvndsuvn000-sfvamvwrav*__cadsijv',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24*10, // 10 day
    },
  })
); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

app.use(morganMiddleware);

// api routes
import { errorHandler } from "./middlewares/error.middlewares.js";

// * App routes
import userRouter from "./routes/auth/user.routes.js";

import chatRouter from "./routes/chat.routes.js";
import messageRouter from "./routes/message.routes.js"; 

// * Kitchen sink routes
import cookieRouter from "./routes/kitchen-sink/cookie.routes.js";
import httpmethodRouter from "./routes/kitchen-sink/httpmethod.routes.js";
import imageRouter from "./routes/kitchen-sink/image.routes.js";
import redirectRouter from "./routes/kitchen-sink/redirect.routes.js";
import requestinspectionRouter from "./routes/kitchen-sink/requestinspection.routes.js";
import responseinspectionRouter from "./routes/kitchen-sink/responseinspection.routes.js";
import statuscodeRouter from "./routes/kitchen-sink/statuscode.routes.js";


// * App apis
app.use("/api/v1/users", userRouter);
 
app.use("/api/v1/chat-app/chats", chatRouter);
app.use("/api/v1/chat-app/messages", messageRouter);


// Kitchen sink apis
app.use("/api/v1/kitchen-sink/http-methods", httpmethodRouter);
app.use("/api/v1/kitchen-sink/status-codes", statuscodeRouter);
app.use("/api/v1/kitchen-sink/request", requestinspectionRouter);
app.use("/api/v1/kitchen-sink/response", responseinspectionRouter);
app.use("/api/v1/kitchen-sink/cookies", cookieRouter);
app.use("/api/v1/kitchen-sink/redirect", redirectRouter);
app.use("/api/v1/kitchen-sink/image", imageRouter);



/***************Only for Developemnt Purpose It will delete all database colllections when it's in production*******/

// * Seeding
// app.get(
//   "/api/v1/seed/generated-credentials",
//   avoidInProduction,
//   getGeneratedCredentials
// );
// app.post("/api/v1/seed/chat-app", avoidInProduction, seedUsers, seedChatApp);

initializeSocketIO(io);

/*************************************************Till here************************************************** */


// common error handling middleware
app.use(errorHandler);

export { httpServer };
