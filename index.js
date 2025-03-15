import express from "express"
import multer from "multer"
import cors from "cors"
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import sizeOf from "image-size"
import wfc from "./wfc.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url)) //used for directory navigation

//initialisation of express and the port
const app = express()
const port = 8000;

app.use(cors({origin: ["http://localhost:3000"]}))                //enables server to be accessed from localhost
app.use('/images', express.static(`${__dirname}/output/images`))  //lets the client access images using link routing
app.use('/gifs', express.static(`${__dirname}/output/gifs`))      //lets the client access gifs using link routing

//sets up image link routing
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `${__dirname}/input`)
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  }
})

const upload = multer({storage: storage})

//handles file uploads (POST)
app.post("/upload", upload.single("image"), async (req, res) => {
  const data = req.body //retrieves the data from the request
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  console.log("File uploaded successfully");
  const dimensions = sizeOf(`./input/${req.file.filename}`) //finds the pixel dimensions of the image
  let outP
  let gifOutp
  try {
    let outputs = await wfc(`./input/${req.file.filename}`, data.outPath, dimensions, data.tileSize, data.gridSize);  //runs the WFC algorithm
    outP = outputs.outP       //name of the image file
    gifOutp = outputs.gifOutp //name of the gif file
  } catch (err) {
    console.log(`Error during processing: ${err}`)
    res.status(500).send(`PROCESSING ERROR ${err}`)
    return
  }
  //returns the links after a delay to ensure they are fully piped into the respective files
  setTimeout(() => {
    //sends back a success response containing required URLs
    res.status(200).json({
      message: "Image generation complete",
      imgUrl: `http://localhost:8000/images/${outP}.png`,
      gifUrl: `http://localhost:8000/gifs/${gifOutp}.gif`
    })
  }, 500)
})

//starts listening to the port
app.listen(port, () => {
  console.log(`test on http://localhost:${port}/`)
})