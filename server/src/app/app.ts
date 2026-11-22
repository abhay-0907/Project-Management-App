import express from "express";
import type {Request, Response} from "express";
import routes from "../routes/index.js";

const app = express();

const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:3000";
app.use((req, res, next) => {
  if (req.headers.origin === clientOrigin) {
    res.setHeader("Access-Control-Allow-Origin", clientOrigin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") {
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

