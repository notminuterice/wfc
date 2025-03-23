import express from "express"
import multer from "multer"
import cors from "cors"
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import sizeOf from "image-size"
import wfc from "./wfc.mjs"
import fs from "fs"

const __dirname = dirname(fileURLToPath(import.meta.url)) //used for directory navigation
const outputPath = "./output"                             //output directory


//initialisation of express and the port
const app = express()
const port = 8000

app.use(cors({origin: ["http://localhost:3000"]}))                //enables server to be accessed from localhost
app.use('/images', express.static(`${__dirname}/output/images`))  //lets the client access images using link routing
app.use('/videos', express.static(`${__dirname}/output/videos`))  //lets the client access videos using link routing

//sets up image link routing
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `${__dirname}/input`)
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  }
})

const upload = multer({ storage: storage })

//creates empty directories if they dont exist
function buildOutputDir() {
  //creates the entire output directory if it doesnt exist
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath)
    fs.mkdirSync(`${outputPath}/images`)
    fs.mkdirSync(`${outputPath}/videos`)
  }
  //create the images directory if it is not found in the output dir
  if (!fs.existsSync(`${outputPath}/images`)) {
    fs.mkdirSync(`${outputPath}/images`)
  }
  //create the videos directory if it is not found in the output dir
  if (!fs.existsSync(`${outputPath}/videos`)){
    fs.mkdirSync(`${outputPath}/videos`)
  }
}

//handles file uploads (POST)
app.post("/upload", upload.single("image"), async (req, res) => {
  const data = req.body //retrieves the data from the request
  //sends an error if no file was sent
  if (!req.file) {
    return res.status(500).send("No file uploaded")
  }

  buildOutputDir()

  console.log("File uploaded successfully")
  const dimensions = sizeOf(`./input/${req.file.filename}`) //finds the pixel dimensions of the image
  let imageOutP //image output path
  let videoOutp //video output path
  try {
    const outputs = await wfc(`./input/${req.file.filename}`, dimensions, data.tileSize, data.gridSize);  //runs the WFC algorithm
    imageOutP = outputs.outP;       //name of the image file
    videoOutp = outputs.videoOutp   //name of the video file
  } catch (err) {
    console.log(`Error during processing: ${err}`)
    res.status(500).send(`PROCESSING ERROR ${err}`)
    return
  }
  //returns the links
  let vidUrl = null
  //appends the video file name to the url if it exists
  if (videoOutp != null) {
    vidUrl = `http://localhost:8000/videos/${videoOutp}.mp4`
  }
  //sends back a success response containing required URLs
  res.status(200).json({
    message: "Image generation complete",
    imgUrl: `http://localhost:8000/images/${imageOutP}.png`,
    vidUrl: vidUrl
  })
})

//starts listening to the port
app.listen(port, () => {
  console.log(`test on http://localhost:${port}/`)
})