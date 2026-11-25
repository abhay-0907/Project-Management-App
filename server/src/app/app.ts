import express from "express";
import type {Request, Response} from "express";
import routes from "../routes/index.js";

const app = express();

const configuredClientOrigins =
  process.env.CLIENT_ORIGIN ??
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000");
const clientOrigins = new Set(
  configuredClientOrigins
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean),
);

if (process.env.NODE_ENV === "production" && clientOrigins.size === 0) {
  throw new Error("CLIENT_ORIGIN must be configured in production");
}

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  const isAllowedOrigin =
    typeof requestOrigin === "string" &&
    clientOrigins.has(requestOrigin.replace(/\/+$/, ""));

  if (isAllowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", requestOrigin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.vary("Origin");
  }

  if (req.method === "OPTIONS") {
    if (!isAllowedOrigin) {
      res.status(403).end();
      return;
    }

    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).end();
    return;
  }
  next();
});

app.use(express.json());
app.use(routes);

app.get('/health',(req:Request,res:Response)=>{
    res.status(200).json(
        {
            status:"OK"
        }
    )
})

export default app

