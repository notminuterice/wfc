import express from "express"
import multer from "multer"
import cors from "cors"
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import sizeOf from "image-size"
import wfc from "./wfc.mjs"
import fs from "fs"

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = express()
const port = 8000;

app.use(cors({origin: ["http://localhost:3000"]}))
app.use('/images', express.static(`${__dirname}/output/images`))
app.use('/gifs', express.static(`${__dirname}/output/gifs`))

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `${__dirname}/input`)
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  }
})

const upload = multer({storage: storage})

app.post("/upload", upload.single("image"), async (req, res) => {
  const data = req.body
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  console.log("File uploaded successfully");
  const dimensions = sizeOf(`./input/${req.file.filename}`)
  let outP
  let gifOutp
  try {
    let outputs = await wfc(`./input/${req.file.filename}`, data.outPath, dimensions, data.tileSize, data.gridSize);
    outP = outputs.outP
    gifOutp = outputs.gifOutp
  } catch (err) {
    console.log(`Error during processing: ${err}`)
    res.status(500).send(`PROCESSING ERROR ${err}`)
    return
  }
  setTimeout(() => {
    res.status(200).json({
      message: "Image generation complete",
      imgUrl: `http://localhost:8000/images/${outP}.png`,
      gifUrl: `http://localhost:8000/gifs/${gifOutp}.gif`
    })
  }, 500)
})

app.listen(port, () => {
  console.log(`test on http://localhost:${port}/`)
})