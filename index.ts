import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express, { Express } from "express";
import methodOveride from "method-override";
import morgan from "morgan";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { startDB } from "./db/index";
import { routes } from "./routes/index";
import errorHandler from "./utils/error";

// ENV
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const corsOptions = {
  origin: "http://localhost:5173",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

// Start app
const app: Express = express();
const port = process.env.PORT || 3000;
// cors
app.use(cookieParser());
app.use(cors(corsOptions));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  next();
});
// Connect database
startDB("mongodb://127.0.0.1:27017/course-typescript-poly");
// Static folder
app.use(express.static(path.join(__dirname, "public")));
// Middeware
app.use(methodOveride("_method"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("dev"));
app.use(errorHandler);
// Routes
routes(app);
// Server
app.listen(port, () => console.log(`Server is listening on port ${port}`));
