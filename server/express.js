import express from 'express'
import path from 'path'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import compress from 'compression'
import cors from 'cors'
import helmet from 'helmet'
import Template from './../template'
import userRoutes from './routes/user.routes'
import authRoutes from './routes/auth.routes'
import postRoutes from './routes/post.routes'
import rateLimit from 'express-rate-limit'

// modules for server side rendering
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import MainRouter from './../client/MainRouter'
import { StaticRouter } from 'react-router-dom'

import { ServerStyleSheets, ThemeProvider } from '@material-ui/styles'
import theme from './../client/theme'
//end

//comment out before building for production
//import devBundle from './devBundle'

const CURRENT_WORKING_DIR = process.cwd()
const app = express()

//comment out before building for production
//devBundle.compile(app)

// parse body params and attache them to req.body
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(compress())
// secure apps by setting various HTTP headers
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"], // Prevent clickjacking
      formAction: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"], // No Flash/plugins
      reportUri: '/api/csp-violation'
    },
    reportOnly: false
  })
);
// enable CORS - Cross Origin Resource Sharing
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}))
// rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // limit each IP to 100 requests per 15 min
  standardHeaders: 'draft-8', // draft-8: combined RateLimit header
  legacyHeaders: false, // disable X-RateLimit-* headers
  ipv6Subnet: 56, // less aggressive: 60-64, more aggressive: 48-52
  message: "Too many requests from this IP"
});
app.use(limiter)

app.use('/dist', express.static(path.join(CURRENT_WORKING_DIR, 'dist')))

// mount routes
app.use('/', userRoutes)
app.use('/', authRoutes)
app.use('/', postRoutes)

app.get('*', (req, res) => {
  const sheets = new ServerStyleSheets()

  const context = {}
  const markup = ReactDOMServer.renderToString(
      sheets.collect(
        <StaticRouter location={req.url} context={context}>
          <ThemeProvider theme={theme}>
            <MainRouter />
          </ThemeProvider>
        </StaticRouter>
      )
    )
    if (context.url) {
      return res.redirect(303, context.url)
    }
    const css = sheets.toString()
    res.status(200).send(Template({
      markup: markup,
      css: css
    }))
})

// Catch unauthorised errors
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({"error" : err.name + ": " + err.message})
  }else if (err) {
    res.status(400).json({"error" : err.name + ": " + err.message})
    console.log(err)
  }
})

export default app
