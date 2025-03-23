// import main from "./wfc.mjs"

// const input = "./input/grass1.png"
// const dimensions = { "width": 64, "height": 64 }
// const tile = 8
// const gridSize = 13

// main(input, dimensions, tile, gridSize)

import axios from "axios"
import fs from "fs"
import FormData from "form-data";

//adds all of the required data to the POST request
const formData = new FormData()
const imgFile = fs.createReadStream("./input/dungeon.png")
formData.append("image", imgFile)
formData.append("tileSize", 16)
formData.append("gridSize", 100)

//call POST request to backend api
axios.post("http://localhost:8000/upload", formData, {
    headers: {
        ...formData.getHeaders(),
    }
}).catch(err => {
    console.log(err.response.data)
})