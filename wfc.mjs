import getPixels from "get-pixels"
import { createCanvas } from "canvas"
import fs from "fs"
import { spawn } from "child_process"
import path from "path"
import ffmpegPath from "ffmpeg-static"
import fsExtra from "fs-extra"

class MinHeap{
  constructor(initialArr) {
    this.arr = initialArr //array that holds the heap elements
  }

  //returns the index of parent index of the node inputted
  getParentIndex(i) {
    return Math.floor((i - 1) / 2)
  }

  //returns the index of left child of the parent inputted
  getLeftChildIndex(i) {
    return i * 2 + 1
  }

  //returns the index of right child of the parent inputted
  getRightChildIndex(i) {
    return i * 2 + 2
  }

  //runs through the heap from the bottom and swaps an element with its parent if its entropy is lower (only for inserting)
  heapifyUp() {
    let i = this.arr.length - 1
    while (i > 0) {
      const parentIndex = this.getParentIndex(i)
      if (this.arr[i].entropy >= this.arr[parentIndex].entropy) break //breaks if the parent is smaller or equal to the current element
      [this.arr[i], this.arr[parentIndex]] = [this.arr[parentIndex], this.arr[i]]
      i = parentIndex
    }
  }

  /*runs through the heap from the top and swaps the parent with the smallest child
  if there is one smaller than the parent (only for removing)*/
  heapifyDown() {
    let i = 0
    while (true) {
      const left = this.getLeftChildIndex(i)
      const right = this.getRightChildIndex(i)
      let smallest = i

      if (left < this.arr.length && this.arr[left].entropy < this.arr[smallest].entropy) smallest = left
      if (right < this.arr.length && this.arr[right].entropy < this.arr[smallest].entropy) smallest = right
      if (smallest === i) break //breaks if there are no children smaller than the current element

      [this.arr[i], this.arr[smallest]] = [this.arr[smallest], this.arr[i]]
      i = smallest
    }
  }

  //runs heapifyDown until its fully sorted
  heapify() {
    for (let i = Math.floor(this.arr.length / 2) - 1; i >= 0; i--){
      this.heapifyDown(i)
    }
  }

  //adds a value to the end and heapifies
  insert(element) {
    this.arr.push(element)
    this.heapifyUp()

    //removes any elements with entropy 0 - already collapsed
    if (this.arr[0].entropy == 0){
      this.arr.shift()
    }
  }

  //removes the smallest value from the start of the heap
  removeElement() {
    if (this.arr.length == 0) return

    //removes any elements with entropy 0 - already collapsed
    while (this.arr[0].entropy == 0){
      this.arr.pop()
    }

    const min = this.arr[0]         //grabs root node from heap
    this.arr[0] = this.arr.at(-1) //sets the root to the last node
    this.arr.pop()                //removes the last node
    this.heapify()                //heapifies
    return min
  }
}

/*a tile representing an nxn grid of pixel values in the ORIGINAL image.
the top left pixel of a tile goes in each cell within the grid*/
class Tile{
  constructor(grid, k, tileSize, imgSize){
    this.grid = grid         //2D array containing the grid
    this.k = k               //tile key (integer identifying the tile)
    this.tileSize = tileSize //number of pixels in the width/height of the tile (in an nxn grid, n is the tile size)
    this.frequencyHint = 1   //how frequently this tile appears in the original image
    this.imgSize = imgSize   //object containing the height and width of the original image

    //object where each direction has an array of tiles that can be put next to this tile (in that direction)
    this.adjacencyRules = {
      "up": [],   //all of the tiles that can be above this tile
      "down": [], //all of the tiles that can be below this tile
      "left": [], //all of the tiles that can be to the left of this tile
      "right": [] //all of the tiles that can be to the right of this tile
    }

  }

  //constructs the adjacencyRules object based on information gathered in the image
  generateAdjacencyRules(otherTiles, position, columns){
    const i = position - 1  //the index of the tile in the image
    const row = Math.floor(i / columns)
    const col = i % columns
    const totalRows = Math.floor(otherTiles.length / columns)
    if (row > 0){               // check if not on first row
      this.adjacencyRules.up.push(otherTiles[i - columns].k.toString())
    }
    if (row < totalRows - 1){   //check if not on last row
      this.adjacencyRules.down.push(otherTiles[i + columns].k.toString())
    }
    if (col > 0){               // check if not in first column
      this.adjacencyRules.left.push(otherTiles[i - 1].k.toString())
    }
    if (col < columns - 1){     //check if not in last column
      this.adjacencyRules.right.push(otherTiles[i + 1].k.toString())
    }
  }
}

//class for each individual cell within the OUTPUT grid
class Cell{
  constructor(x, y, tiles, gridSize, tileSet){
    this.x = x                  //x position within the output grid
    this.y = y                  //y position within the output grid
    this.possibleTiles = tiles  //the possible tiles that this cell could represent
    this.chosenTile = null      //k value of the tile that has been selected
    this.neighbours = []        //the cells around the tile (if it is on the top row, it will not have an "up" neighbour)
    this.gridSize = gridSize    //width/height of the grid
    this.setNeighbours()        //adds values to the neighbours array
    this.entropy = -1           //entropy of the tile
    this.tileSet = tileSet      //the tileset containing all the tiles
  }

  //adds values to the neighbours array
  setNeighbours(){
    if(this.y > 0) this.neighbours.push("up")                   //adds an "up" neighbour if it is not on the top row
    if (this.y < this.gridSize-1) this.neighbours.push("down")  //adds a "down" neighbour if it is not on the bottom row
    if (this.x > 0) this.neighbours.push("left")                //adds a "left" neighbour if it is not at the start of a row
    if (this.x < this.gridSize-1) this.neighbours.push("right") //adds a "right" neighbour if it is not at the end of a row
  }

  //selects a tile to assign to the cell out of the possible tiles (collapsing)
  collapse(){
    if (this.possibleTiles.length == 0){
      throw RangeError("OUT OF POSSIBILITIES")
    }

    let weightedTiles = []
    //adds a tile multiple times to the weightedTiles array depending on its frequency hint
    for (const tile of this.possibleTiles) {
      const addValue = (new Array(this.tileSet[tile].frequencyHint)).fill(tile) //array containing the tile [frequencyhint] number of times
      weightedTiles.push(...addValue) //flattens the array and pushes all of the values to the weightedTiles array
    }
    this.chosenTile = weightedTiles[Math.floor(Math.random()*weightedTiles.length)] //chooses a random tile in the array to be the chosen tile for this cell
    this.possibleTiles = [] //empties possible tiles (tile already selected)
    this.entropy = -1 //set entropy to -1 (takes out of the heap)
  }
}

class Grid{
  constructor(gridSize, tileKeys, tileSet, pixelSize, outputPath, tileSize, maxFrames){
    this.gridSize = gridSize                  //the size of the grid (same as the width and height)
    this.priorityQueue = new MinHeap([])      //priority queue (minimum heap) containing the cells/indexes in the grid
    this.complete = false                     //whether the collapse has finished
    this.tileKeys = tileKeys                  //all of the tile keys
    this.iterationCount = 0                   //current iteration
    this.collapsedCells = []                  //list of cells that have already been collapsed
    this.tileSet = tileSet                    //the tileset object
    this.failed = false                       //whether the collapse has failed (no more possible cell options)
    this.pixelSize = pixelSize                //the amount each pixel should be scaled up by
    this.tileSize = tileSize                  //number of pixels in the width/height of each tile
    this.prevCollapses = []                   //coordinates for the tiles that have been collapsed (in order)
    this.maxFrames = maxFrames                //maximum frames in the GIF
    this.gridMatrix = this.initialiseGrid()   //2D array containing one cell in each element (the output grid)
  }

  //returns a grid full of default cells
  initialiseGrid() {
    let newGrid = []
    for (let y = 0; y < this.gridSize; y++){
      let row = []
      for (let x = 0; x < this.gridSize; x++){
        row.push(new Cell(x, y, this.tileKeys, this.gridSize, this.tileSet))
      }
      newGrid.push(row)
    }
    return newGrid
  }

  //maps the directions to the coordinate translations
  getDirectionTile(direction){
    switch (direction){
      case "up": return [0, -1];
      case "down": return [0, 1];
      case "left": return [-1, 0];
      case "right": return [1, 0]
    }
  }

  //starts the collapse from coordinate 0,0 on the grid
  beginCollapse() {
    this.prevCollapses.push([0,0])
    this.collapse(0, 0)
    if (this.failed == true){
      return false
    }
    return true //return the true if successful, otherwise return false
  }

  //collapses and propagates a given cell
  collapse(x, y) {
    this.gridMatrix[y][x].collapse() //runs the collapse function in the cell object at the coordinates
    if (this.iterationCount != this.collapsedCells.length) {
      this.prevCollapses.push([x, y]) //records the collapse if a new cell has been collapsed
    }
    this.iterationCount = this.collapsedCells.length //updates the collapse iteration
    this.propagate(x, y)
    //cancels if the collapsing or propagating fails
    if (this.failed){
      console.error("collapse failed")
      return
    }

    this.chooseNextCell()
  }

  //selects the next cell to collapse
  chooseNextCell(){

    if (this.collapsedCells.length >= this.gridSize**2) return  //ends if the number of collapsed cells has reached the number of positions in the grid
    if (this.priorityQueue.arr.length == 0) return              //ends if there are no cells left to collapse

    let lowestCell = this.priorityQueue.removeElement() //pops the cell with the lowest entropy

    //runs until the lowest cell in the priority queue hasnt been collapsed
    while (this.collapsedCells.includes(`${lowestCell.x},${lowestCell.y}`) || this.gridMatrix[lowestCell.y][lowestCell.x].possibleTiles.length == 0){
      lowestCell = this.priorityQueue.removeElement() //pops the cell with the lowest entropy again
      if (lowestCell == null){
        return
      }
    }

    this.collapsedCells.push(`${lowestCell.x.toString()},${lowestCell.y.toString()}`) //adds the cell about to be collapsed to the collapsed cell list
    this.collapsedCells = [...new Set(this.collapsedCells)] //removes any duplicates in the collapsed cell array
    if (lowestCell == null) return                          //ends if the lowest entropy cell does not exist
    this.collapse(lowestCell.x, lowestCell.y)               //collapses the lowest entropy cell
  }

  //updates all of the surrounding cells after a cell has been collapsed
  propagate(x, y){
    //if the current cell being propagated has not been collapsed
    if (this.gridMatrix[y][x].chosenTile != null){
      //loops through all the neighbours of the current cell
      this.gridMatrix[y][x].neighbours.forEach(n => {
        const dir = this.getDirectionTile(n)                                      //converts the direction to a coordinate translation
        if (this.gridMatrix[y + dir[1]][x + dir[0]].chosenTile != null) return  //skips the neighbour if it has been collapsed

        const prevTileValues = this.gridMatrix[y + dir[1]][x + dir[0]].possibleTiles                          //stores the previous possible tiles of the neighbour
        const thisPossibleTiles = this.tileSet[this.gridMatrix[y][x].chosenTile.toString()].adjacencyRules[n] //stores the tile rules of the cell being propagated

        //filters out the possible tiles for the neighbour that are not in the adjacency tile rules for the current cell
        this.gridMatrix[y + dir[1]][x + dir[0]].possibleTiles = this.gridMatrix[y + dir[1]][x + dir[0]].possibleTiles.filter(t => thisPossibleTiles.includes(t))
        //updates the cell entropy
        this.gridMatrix[y + dir[1]][x + dir[0]].entropy = this.gridMatrix[y + dir[1]][x + dir[0]].possibleTiles.length

        const e = {x:x + dir[0], y:y + dir[1], e:this.gridMatrix[y + dir[1]][x + dir[0]].possibleTiles.length}  //element to be put in the priority queue
        this.priorityQueue.insert(e)
        //propagates again if the number of possible tiles was updated
        if (this.gridMatrix[y + dir[1]][x + dir[0]].possibleTiles.length != prevTileValues.length){
          this.propagate(x + dir[0], y + dir[1])
        }
      })
    } else {  //if the cell has been collapsed
      this.gridMatrix[y][x].neighbours.forEach(n => {
        const dir = this.getDirectionTile(n)                                      //converts the direction to a coordinate translation
        if (this.gridMatrix[y + dir[1]][x + dir[0]].chosenTile != null) return  //skips the neighbour if it has been collapsed

        const prevTileValues = this.gridMatrix[y + dir[1]][x + dir[0]].possibleTiles                                     //stores the previous possible tiles of the neighbour
        const thisPossibleTiles = this.gridMatrix[y][x].possibleTiles.map(t => this.tileSet[t].adjacencyRules[n]).flat() //stores the tile rules of the cell being propagated

        //filters out the possible tiles for the neighbour that are not in the adjacency tile rules for the current cell
        this.gridMatrix[y + dir[1]][x + dir[0]].possibleTiles = this.gridMatrix[y + dir[1]][x + dir[0]].possibleTiles.filter(t => thisPossibleTiles.includes(t))
        //updates the cell entropy
        this.gridMatrix[y + dir[1]][x + dir[0]].entropy = this.gridMatrix[y + dir[1]][x + dir[0]].possibleTiles.length

        //fails if there are no more possible tiles in the neighbour and it hasn't already been collapsed
        if (this.gridMatrix[y + dir[1]][x + dir[0]].possibleTiles.length == 0 && this.gridMatrix[y + dir[1]][x + dir[0]].chosenTile == null){
          this.failed = true
          return
        }
        const e = {x:x + dir[0], y:y + dir[1], e:this.gridMatrix[y + dir[1]][x + dir[0]].possibleTiles.length} //element to be put in the priority queue
        this.priorityQueue.insert(e)
        //propagates again if the number of possible tiles was updated
        if (this.gridMatrix[y + dir[1]][x + dir[0]].possibleTiles.length != prevTileValues.length){
          this.propagate(x + dir[0], y + dir[1])
        }
      })
    }
  }
}

//converts the input rgb val in an array to hex value
function rgbToHex(pixelVals){
  let outputStr = "#"

  for (const pixel of pixelVals){
    const hexVal = pixel.toString(16) //converts value using base 16
    outputStr += hexVal.length > 1 ? hexVal : "0" + hexVal //adds to the output and adds a 0 before if there is only 1 digit
  }

  return outputStr
}

//converts the pixels from the image into a 2d array representing one tile
function pixelsToMatrix(pxs, tileSize){
  let output = [...Array(tileSize)].map(a => Array(tileSize)) //initialises an empty 2d array with width and length tileSize
  for (let i = 0; i < pxs.length; i+=4){
    output[Math.floor(i/(4*tileSize))][(i/4)%tileSize] = rgbToHex(pxs.slice(i, i+3)) //matches pixel colour value with its x and y coordinates
  }
  return output
}

//gets the pixels in the range of the tile being processed
function getPixelsT(startX, startY, size, pixelArr, imgSize) {
  const block = []
  //loops through the x and y coordinates within the tile, starting at the top left pixel of the tile
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const row = startY + y
      const col = startX + x
      const i = (row * imgSize.w + col) * 4 //finds the corresponding index of the pixel in the pixel array
      block.push(
        pixelArr[i],      //R
        pixelArr[i + 1],  //G
        pixelArr[i + 2],  //B
        pixelArr[i + 3]   //A
      )
    }
  }
  return block
}

//gets all pixel colour values from the img and creates tiles from them. Excludes outer ring of tiles for continuity
async function getPixelValues(path, tileSize, tileSet, imgSize){
  return new Promise((resolve, reject) => {
    getPixels(path, function(err, pixels) {
      if(err) {
        console.error("Bad image path")
        throw Error("Bad image path")
      }
      const pixelVals = Array.from(pixels.data) //turns the rgba values of the pixels into an array

      //loops through the input image and creates tiles at regular intervals based on the tile size (will have duplicate tiles)
      for (let y = tileSize; y < imgSize.h - tileSize; y += tileSize) {
        for (let x = tileSize; x < imgSize.w - tileSize; x += tileSize) {
          const tileKey = (Object.keys(tileSet).length+1).toString() //k value of the tile
          //creates a new tile based on the pixels in the position of the tile
          tileSet[tileKey] = new Tile(
            pixelsToMatrix(
              getPixelsT(x, y, tileSize, pixelVals, imgSize),
              tileSize
            ),
            tileKey,
            tileSize,
            imgSize
          )
        }
       }

      const innerColumns = Math.floor(imgSize.w / tileSize) - 2 //excludes end tiles
      //loops through the tileset and creates adjacency rules for each one
      for (let i = 1; i <= Object.keys(tileSet).length; i++){
        tileSet[i].generateAdjacencyRules(Object.values(tileSet), i, innerColumns)
      }

      let flattenedTileset = {} //object which will hold the tileset with no repetitions
      let newMapping = {}       //object which maps the old tile keys to the new tile keys

      //loops through the tileSet and looks for dupes, combines their adjacency rules and puts them in the flattenedTileset
      for (const tile of Object.values(tileSet)){
        let dupeFound = false //determines if there are two tiles with the same pixel matrix (exact same tiles)

        //goes through the new flattened tileset and check if the current tile is equal to any of them
        for (let [nK, val] of Object.entries(flattenedTileset)){
          if (JSON.stringify(val.grid) == JSON.stringify(tile.grid)){ //if the current tile is a duplicate of another tile in the flat tileset
            //appends the adjecency rules of the current duplicate tile to the already existing tile in the flattened tileset
            flattenedTileset[nK].adjacencyRules.up.push(...tile.adjacencyRules.up)
            flattenedTileset[nK].adjacencyRules.down.push(...tile.adjacencyRules.down)
            flattenedTileset[nK].adjacencyRules.left.push(...tile.adjacencyRules.left)
            flattenedTileset[nK].adjacencyRules.right.push(...tile.adjacencyRules.right)
            dupeFound = true
            newMapping[tile.k.toString()] = nK.toString() //adds an entry to the map the links the old key with the new key
            flattenedTileset[nK].frequencyHint += 1       //increases the frequency hint of the tile
          }
        }
        if (!dupeFound){
          let newTile = JSON.parse(JSON.stringify(tile))        //creates a copy of the tile to prevent changes to the original object
          newTile.k = Object.values(flattenedTileset).length+1  //initialises a new key for the tile
          flattenedTileset[newTile.k.toString()] = newTile      //adds the key-value pair of k and the tile into the flattened tileset
          newMapping[tile.k.toString()] = newTile.k.toString()  //maps the old tile key to the new tile key
        }

      }

      //updates all of the keys (which identify the tiles) in the adjacency rules to the new keys in the flattened tileset
      for (let [t, tile] of Object.entries(flattenedTileset)){
        for (let [d, dir] of Object.entries(tile.adjacencyRules)){
          for (let [a, n] of Object.entries(dir)){
            flattenedTileset[t].adjacencyRules[d][a] = newMapping[n]
          }
        }
      }
      tileSet = flattenedTileset
      resolve(tileSet)
    })
  })
}

function createPath() {
  const files = fs.readdirSync("./output/images/").map(n => parseInt(n.split(".")[0]))
    .sort((a, b) => b - a)
  if (files.length == 0) return "1"
  return (files[0] + 1).toString()
}


//turns the output array back into an image and saves it
function arrToImg(imgData, pixelSize) {
  //creates a canvas to build the image
  const canvas = createCanvas(imgData[0].length * pixelSize, imgData.length * pixelSize)
  const ctx = canvas.getContext("2d")

  //creates a coloured rectangle for every pixel in the image data
  imgData.forEach((row, y) => {
    row.forEach((colour, x) => {
      ctx.fillStyle = colour
      ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize)
    })
  })

  return {"canvas":canvas, "ctx": ctx}
}

function saveImg(imgData, output, pixelSize) {
  const canvas = arrToImg(imgData, pixelSize).canvas  //converts the array to a canvas that can be exported as a png

  //saves the data to the file by piping it
  const out = fs.createWriteStream(`./output/images/${output}.png`)
  const stream = canvas.createPNGStream()
  stream.pipe(out)
  return output
}

//converts the 2d grid array to one that can be parsed by arrToImg()
function gridToArray(g, tileSize, tileSet) {
  let default2dArray = [] //empty array which will hold the new flattened data
  g.forEach((row, y) => {
    for (let i = 0; i < tileSize; i++) {
      default2dArray.push([]) //fills it with empty arrays
    }

    row.forEach((cell, x) => {
      //makes the cell completely black if no tile has been selected
      if (!cell.chosenTile){
        cell.chosenTile
        for (let tileY = 0; tileY < tileSize; tileY++){
          for (let x = 0; x < tileSize; x++){
            default2dArray[y * tileSize + tileY].push("#000000")
          }
        }
        return
      }

      const rowTile = tileSet[cell.chosenTile]
      //adds the colours from the tile to the array
      rowTile.grid.forEach((tileRow, tileY) => {
        tileRow.forEach((colour, tileX) => {
          default2dArray[y * rowTile.grid.length + tileY].push(colour)
        })
      })
    })
  })

  return default2dArray
}

function generateVideo(mainGrid, startTime, maxRuntime, outputPath) {
  const gridSize = mainGrid.gridSize
  const tileSize = mainGrid.tileSize
  const pixelSize = mainGrid.pixelSize
  const pixelWidth = gridSize * tileSize * pixelSize
  const pixelHeight = gridSize * tileSize * pixelSize
  const tempDir = "./tempFrames"

  //create temporary directory for frames if it doesn't exist
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir)
  } else {
    fsExtra.emptyDirSync(tempDir)
  }

  //creates the canvas
  const canvas = createCanvas(pixelWidth, pixelHeight)
  const ctx = canvas.getContext("2d")

  //fills canvas background
  ctx.fillStyle = "black"
  ctx.fillRect(0, 0, pixelWidth, pixelHeight)

  //information on frames
  const frames = mainGrid.prevCollapses
  const maxFrames = mainGrid.maxFrames
  const frameInterval = Math.ceil(frames.length / maxFrames)

  //loop over each previous collapse and draw the frame
  for (let i = 0; i < frames.length; i++) {
    //ends video generation if it takes too long
    if (Date.now() - startTime > maxRuntime) {
      console.error("Runtime exceeded during video generation")
      throw Error("Runtime exceeded during video generation")
    }
    const coords = frames[i]
    const cell = mainGrid.gridMatrix[coords[1]][coords[0]]
    const k = cell.chosenTile
    if (!k) continue // skip if no tile selected

    const tileGrid = mainGrid.tileSet[k].grid

    //draw the tile on the canvas at the correct position
    for (let y = 0; y < tileGrid.length; y++) {
      for (let x = 0; x < tileGrid[0].length; x++) {
        ctx.fillStyle = tileGrid[y][x];
        ctx.fillRect(
          coords[0] * tileSize * pixelSize + x * pixelSize,
          coords[1] * tileSize * pixelSize + y * pixelSize,
          pixelSize,
          pixelSize
        )
      }
    }

    //write a frame to a file every time frameInterval number of collapses have happened
    if (i % frameInterval === 0) {
      const frameIndex = Math.floor(i / frameInterval)
      const fileName = `${tempDir}/frame${frameIndex.toString()}.png`
      const buffer = canvas.toBuffer("image/png")
      fs.writeFileSync(fileName, buffer)
    }
  }

  //save final frame just in case it wasnt captured
  const finalFrameName =  `${tempDir}/frame${Math.ceil(frames.length / frameInterval).toString()}.png`
  const finalBuffer = canvas.toBuffer("image/png")
  fs.writeFileSync(finalFrameName, finalBuffer)

  const ffmpegArgs = [
    "-y",                                     //overrides output files
    "-loglevel", "quiet",                     //stops it from outputting excess logs
    "-framerate", "30",                       //sets framerate to 30
    "-i", path.join(tempDir, "frame%d.png"),  //files to be read
    "-c:v", "libx264",                        //encoding codec - H.264 format
    "-pix_fmt", "yuv420p",                    //pixel format - most common one
    `./output/videos/${outputPath}.mp4`       //output path
  ]

  const ffmpegProcess = spawn(ffmpegPath, ffmpegArgs)

  ffmpegProcess.on('error', (err) => {
    //catches execution error (bad file)
    console.log(`Error: ${err}`)
  })

  ffmpegProcess.stdout.on('data', (data) => {
      console.log(data.toString())
  })

  ffmpegProcess.stderr.on('data', (data) => {
      console.log(data.toString())
  })

  ffmpegProcess.on('close', (code) => {
      console.log(`Process exited with code: ${code}`)
      if (code === 0) {
          console.log(`FFmpeg finished successfully`)
      } else {
          console.log(`FFmpeg ran into an error`)
      }
  })
}

async function main(input, dimensions, tile, gridSize) {
  let tries = 0                           //number of times the collapse has been tried and has failed
  const imgSize = {                       //dimensions of the image
    w: dimensions.width,
    h: dimensions.height
  }
  const maxFrames = 100                   //maximum number of frames in the video
  const startTime = Date.now()            //time at start of collapse
  const maxRuntime = 60000                //maximum time in ms before failure
  let tileSet = {}                        //key: tile key, value: tile object
  const tileSize = parseInt(tile)         //size of the tile (integer value)
  const intGridSize = parseInt(gridSize)  //size of the grid (integer value)
  const pixelSize = 2                     //how much the pixels should be scaled
  let mainGrid                            //holds the grid object
  let success = false                     //checks whether the WFC suceeded or failed

  //error checks
  if(parseFloat(gridSize) != intGridSize) throw TypeError("Invalid grid size entered (must be a whole number)")
  if (parseFloat(tile) != parseInt(tile)) throw TypeError("Invalid tile size entered (must be a whole number)")
  if (tileSize != Math.floor(tileSize)) throw RangeError("Invalid tile size")
  if (imgSize.w % tileSize != 0 || imgSize.h % tileSize != 0) throw RangeError("Invalid tile size")

  const output = createPath()

  try {
    tileSet = await getPixelValues(input, tileSize, tileSet, imgSize, pixelSize, output, tileSize, maxFrames) //creates the tile set from the input image
  } catch (err) {
    throw Error("Tileset generation failed")
  }
  console.log("Tileset generated!")
  //keeps running the algorithm until a full successful collapse or 50 tries has been exceeded
  while (tries < 50 && success == false) {
    if (Date.now() - startTime > maxRuntime) {
      throw Error("Runtime exceeded during collapse")
    }
    tries++
    mainGrid = new Grid(intGridSize, Object.keys(tileSet), tileSet, pixelSize, output, tileSize, maxFrames) //resets the grid
    success = mainGrid.beginCollapse()  //starts the collapse algorithm
    if (success == false){
      console.log(`failed: iter ${tries}`)
    }
  }
  if (tries == 50) throw RangeError("Generation failed. Try again with a lower output grid size")

  console.log("Image generation complete!")

  try {
    generateVideo(mainGrid, startTime, maxRuntime, output)  //creates a video from the temporary tiles
    return { "outP": saveImg(gridToArray(mainGrid.gridMatrix, tileSize, tileSet), output, pixelSize), "videoOutp": output }
  } catch (err){
    console.error(`video generation error: ${err}`)
    return { "outP": saveImg(gridToArray(mainGrid.gridMatrix, tileSize, tileSet), output, pixelSize), "videoOutp": null }   //doesn't add the video path if not generated
  }

}

export default main