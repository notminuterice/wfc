import express from "express"
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = express()
const port = 3000;


app.use('/images', express.static(`${__dirname}/output`))

app.listen(port, () => {
  console.log(`test on http://localhost:${port}/`)
})