import getPixels from "get-pixels"
import { createCanvas } from "canvas"
import fs from "fs"


//element that can be added to and removed from the heap
class HeapElement{
  constructor(self, x, y, e){
    this.x = x //x coordinate within the grid
    this.y = y //y coordinate within the grid
    this.entropy = e //entropy of the tile
  }
}

class MinHeap{
  constructor(initialArr) {
    this.arr = [] //array that holds the heap elements
  }

  peek() {
    return this.arr[0] //returns the root value of the heap
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

  heapifyUp() {
    let i = this.arr.length - 1

    while (i > 0) {
        let parentIndex = this.getParentIndex(i)
        if (this.arr[i].entropy >= this.arr[parentIndex].entropy) break
        [i, parentIndex] = [parentIndex, i]
    }
  }

  heapifyDown() {
      let i = 0

      while (true) {
          let leftChildIndex = this.getLeftChildIndex(i)
          let rightChildIndex = this.getRightChildIndex(i)
          let smallest = i

          if (leftChildIndex < this.arr.length && this.arr[leftChildIndex].entropy < this.arr[smallest].entropy) {
              smallest = leftChildIndex
          }
          if (rightChildIndex < this.arr.length && this.arr[rightChildIndex].entropy < this.arr[smallest].entropy) {
              smallest = rightChildIndex
          }
          if (smallest === i) break

          [i, smallest] = [smallest, i]
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

  removeElement() {
    if (this.arr.length == 0) return
    //removes any elements with entropy 0 - already collapsed
    while (this.arr[0].entropy == 0){
      this.arr.pop()
    }


    let min = this.arr[0] //grabs root node from heap
    this.arr[0] = this.arr.at(-1) //sets the root to the last node
    this.arr.pop() //removes the last node
    this.heapify() //heapifies
    return min
  }
}

//a tile representing an nxn grid of pixel values. the top left pixel of a tile goes in each cell within the grid
class Tile{
  constructor(grid, k, tileSize, imgSize){
    this.grid = grid //pixel matrix
    this.k = k; //tile key
    this.tileSize = tileSize
    this.frequencyHint = 1
    this.imgSize = imgSize

    this.adjacencyRules = {
      "up": [], //up
      "down": [],//down
      "left": [], //right
      "right": [] //left
    }

  }

  generateAdjacencyRules(otherTiles, position){
    let i = position - 1
    let h = this.imgSize.h/this.tileSize
    let w = this.imgSize.w/this.tileSize
    let aboveIndex = i - h
    let belowIndex = i + h
    let leftIndex = i - 1
    let rightIndex = i + 1
    if (Math.floor((leftIndex)/w) == Math.floor((i) / w) && i != 0){
      this.adjacencyRules.left.push(otherTiles[leftIndex].k.toString())
    } else {
      this.adjacencyRules.left.push(otherTiles[i + (w- 1)].k.toString())
    }
    if (Math.floor((rightIndex)/w) == Math.floor((i) / w) && i != otherTiles.length-1){
      this.adjacencyRules.right.push(otherTiles[rightIndex].k.toString())
    } else {  
      this.adjacencyRules.right.push(otherTiles[i - (w - 1)].k.toString())
    }
    if (aboveIndex >= 0){
      this.adjacencyRules.up.push(otherTiles[aboveIndex].k.toString())
    } else {
      this.adjacencyRules.up.push(otherTiles[i + (h - 1)*(h)].k.toString())
    }
    if (belowIndex < otherTiles.length){
      this.adjacencyRules.down.push(otherTiles[belowIndex].k.toString())
    } else {
      this.adjacencyRules.down.push(otherTiles[i - ((h - 1) * (h))].k.toString())
    }

  }
}

class Cell{
  constructor(x, y, tiles, gridSize, tileSet){
    this.x = x
    this.y = y
    this.possibleTiles = tiles
    this.chosenTile = null
    this.neighbours = []
    this.gridSize = gridSize
    this.setNeighbours()
    this.entropy = -1
    this.tileSet = tileSet
  }

  setNeighbours(){
    if(this.y > 0) this.neighbours.push("up") //x and y coords of neighbour above cell
    if (this.y < this.gridSize-1) this.neighbours.push("down") //x and y coords of neighbour below cell
    if (this.x > 0) this.neighbours.push("left") //x and y coords of neighbour left of cell
    if (this.x < this.gridSize-1) this.neighbours.push("right") //x and y coords of neighbour right of cell
  }

  collapse(){
    if (this.possibleTiles.length == 0){
      console.log("OUT OF POSSIBILITIES")
      return
    }

    let weightedTiles = []
    for (const tile of this.possibleTiles) {
      let addValue = (new Array(this.tileSet[tile].frequencyHint)).fill(tile)
      weightedTiles.push(...addValue)
    }
    this.chosenTile = weightedTiles[Math.floor(Math.random()*weightedTiles.length)]
    this.possibleTiles = []
    this.entropy = -1
  }
}

class Grid{
  constructor(gridSize, tiles, tileSet){
    //this.gridMatrix = (new Array(gridSize)).fill((new Array(gridSize).fill("")));
    this.gridMatrix = []
    this.gridSize = gridSize
    this.priorityQueue = new MinHeap([])
    this.complete = false
    this.tiles = tiles
    this.iterationCount = 0
    this.collapsedCells = []
    this.tileSet = tileSet
    this.initialiseGrid()
  }

  initialiseGrid() {
    for (let y = 0; y < this.gridSize; y++){
      let row = []
      for (let x = 0; x < this.gridSize; x++){
        row.push(new Cell(x, y, this.tiles, this.gridSize, this.tileSet))
      }
      this.gridMatrix.push(row)
    }
  }

  getDirectionTile(direction){
    switch (direction){
      case "up": return [0, -1];
      case "down": return [0, 1];
      case "left": return [-1, 0];
      case "right": return [1, 0]
    }
  }

  beginCollapse(){
    let outp = this.collapse(0, 0)
    return outp
  }

  collapse(x, y){
    this.gridMatrix[y][x].collapse()
    this.propagate(x, y)
    let outp = this.chooseNextCell()
    if (outp == false){
      return false
    }
  }

  chooseNextCell(){
    this.iterationCount++
    if (this.collapsedCells.length >= this.gridSize**2){
      return
    }

    if (this.priorityQueue.arr.length == 0) return

    let lowestCell = this.priorityQueue.removeElement()
    while (this.collapsedCells.includes(`${lowestCell.x},${lowestCell.y}`) || this.gridMatrix[lowestCell.y][lowestCell.x].possibleTiles.length == 0){
      lowestCell = this.priorityQueue.removeElement()
      if (lowestCell == null){
        return
      }
      if (this.gridMatrix[lowestCell.y][lowestCell.x].possibleTiles.length == 0){
        console.log('out of possibilities')
        return false
      }
    }
    this.collapsedCells.push(`${lowestCell.x.toString()},${lowestCell.y.toString()}`)
    this.collapsedCells = [...new Set(this.collapsedCells)]
    if (lowestCell == null) return
    this.collapse(lowestCell.x, lowestCell.y)
  }

  addToHeap(cell){
    this.priorityQueue.insert(cell)
  }

  propagate(x, y){
    if (this.gridMatrix[y][x].chosenTile != null){
      this.gridMatrix[y][x].neighbours.forEach(n => {

        let dir = this.getDirectionTile(n)
        if (this.gridMatrix[y + dir[1]][x + dir[0]].chosenTile != null) return

        let prevTileValues = this.gridMatrix[y + dir[1]][x + dir[0]].possibleTiles
        let thisPossibleTiles = this.tileSet[this.gridMatrix[y][x].chosenTile.toString()].adjacencyRules[n]

        this.gridMatrix[y + dir[1]][x + dir[0]].possibleTiles = this.gridMatrix[y + dir[1]][x + dir[0]].possibleTiles.filter(t => thisPossibleTiles.includes(t))
        this.gridMatrix[y + dir[1]][x + dir[0]].entropy = this.gridMatrix[y + dir[1]][x + dir[0]].possibleTiles.length

        let e = {x:x + dir[0], y:y + dir[1], e:this.gridMatrix[y + dir[1]][x + dir[0]].possibleTiles.length}
        this.priorityQueue.insert(e)
        if (this.gridMatrix[y + dir[1]][x + dir[0]].possibleTiles.length != prevTileValues.length){
          this.propagate(x + dir[0], y + dir[1])
        }
      })
    } else {
      this.gridMatrix[y][x].neighbours.forEach(n => {
        let dir = this.getDirectionTile(n)
        if (this.gridMatrix[y + dir[1]][x + dir[0]].chosenTile != null) return
        let prevTileValues = this.gridMatrix[y + dir[1]][x + dir[0]].possibleTiles
        let thisPossibleTiles = this.gridMatrix[y][x].possibleTiles.map(t => this.tileSet[t].adjacencyRules[n]).flat()

        this.gridMatrix[y + dir[1]][x + dir[0]].possibleTiles = this.gridMatrix[y + dir[1]][x + dir[0]].possibleTiles.filter(t => thisPossibleTiles.includes(t))
        this.gridMatrix[y + dir[1]][x + dir[0]].entropy = this.gridMatrix[y + dir[1]][x + dir[0]].possibleTiles.length

        let e = {x:x + dir[0], y:y + dir[1], e:this.gridMatrix[y + dir[1]][x + dir[0]].possibleTiles.length}
        this.priorityQueue.insert(e)
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
    let hexVal = pixel.toString(16) //converts value using base 16
    outputStr += hexVal.length > 1 ? hexVal : "0" + hexVal //adds to the output - if only one digit adds a 0 before it
  }

  return outputStr
}

function hexToRGB(h) {
  h = h.split("")
  h.shift()
  let r = parseInt(h.slice(0, 2).join(""), 16)
  let g = parseInt(h.slice(2, 4).join(""), 16)
  let b = parseInt(h.slice(4, 6).join(""), 16)
  return([r, g, b, 255])
}

//converts the pixel output from the get() function into coordinates
function pixelsToMatrix(pxs, tileSize){
  let output = [...Array(tileSize)].map(a => Array(tileSize));
  for (let i = 0; i < pxs.length; i+=4){
    output[Math.floor(i/(4*tileSize))][(i/4)%tileSize] = rgbToHex(pxs.slice(i, i+3)) //matches pixel colour value with its x and y coordinates
  }
  return output
}

//grabs all of the pixels within the given range and flattens into an array
function getPixelsT(startX, startY, size, pixelArr, imgSize){
  let pixelVals = []
  for (let y = 0; y < size; y++){
    for (let x = 0; x < size; x++){
      let pixelPosition = startX*4 + startY*imgSize.w*4+ x*4 + y*imgSize.h*4 //position of the R value in the RGBA of that pixel
      pixelVals.push(...pixelArr.slice(pixelPosition, pixelPosition+4)) //pushes the RGBA value to the array
    }
  }

  return pixelVals
}

//gets all pixel colour values from the img and creates tiles from them
async function getPixelValues(path, tileSize, tileSet, imgSize){
  return new Promise((resolve, reject) => {
    getPixels(path, function(err, pixels) {
      if(err) {
        console.log("Bad image path")
        return
      }
      let pixelVals = Array.from(pixels.data)
      for(let x = 0; x < imgSize.w; x+=tileSize){
        for(let y = 0; y < imgSize.h; y+=tileSize){
          let tileKey = (Object.keys(tileSet).length+1).toString()
          tileSet[tileKey] = new Tile(pixelsToMatrix(getPixelsT(y, x, tileSize, pixelVals, imgSize), tileSize), tileKey, tileSize, imgSize)
          //image(c, x*5+10, y*5+10) //displays the tile
        }
      }
      
      for (let i = 1; i <= Object.keys(tileSet).length; i++){
        tileSet[i].generateAdjacencyRules(Object.values(tileSet), i)
      }

      let flattenedTileset = {}
      let newMapping = {}
      for (const tile of Object.values(tileSet)){
        let dupeFound = false
        for (let [nK, val] of Object.entries(flattenedTileset)){
          if (JSON.stringify(val.grid) == JSON.stringify(tile.grid)){
            flattenedTileset[nK].adjacencyRules.up.push(...tile.adjacencyRules.up)
            flattenedTileset[nK].adjacencyRules.down.push(...tile.adjacencyRules.down)
            flattenedTileset[nK].adjacencyRules.left.push(...tile.adjacencyRules.left)
            flattenedTileset[nK].adjacencyRules.right.push(...tile.adjacencyRules.right)
            dupeFound = true
            newMapping[tile.k.toString()] = nK.toString()
            flattenedTileset[nK].frequencyHint += 1
          }
        }
        if (!dupeFound){
          let newTile = JSON.parse(JSON.stringify(tile))
          newTile.k = Object.values(flattenedTileset).length+1
          flattenedTileset[newTile.k.toString()] = newTile
          newMapping[tile.k.toString()] = newTile.k.toString()
        }

      }
    
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

function arrToImg(imgData, output, pixelSize) {
  const canvas = createCanvas(imgData[0].length * pixelSize, imgData.length * pixelSize)
  const ctx = canvas.getContext("2d")

  imgData.forEach((row, y) => {
    row.forEach((colour, x) => {
      ctx.fillStyle = colour
      ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize)
    })
  })

  const out = fs.createWriteStream(`./output/${output}.png`);
  const stream = canvas.createPNGStream()
  stream.pipe(out)
}

function gridToArray(g, tileSize, tileSet) {
  let default2dArray = []
  g.forEach((row, y) => {
    for (let i = 0; i < tileSize; i++) {
      default2dArray.push([])
    }
    let tileRow = []
    row.forEach((cell, x) => {
      let rowTile = tileSet[cell.chosenTile]
      if (x == 0){
        for (let i = 0; i < rowTile.grid.length; i++){
          tileRow.push([])
        }
      }
      rowTile.grid.forEach((tileRow, tileY) => {
        tileRow.forEach((colour, tileX) => {
          default2dArray[y * rowTile.grid.length + tileY].push(colour)
        })
      })
    })
  })

  return default2dArray
}

async function main(input, output, dimensions, tile) {
  console.log(input, output, dimensions, tile)
  const imgSize = {
    w: dimensions.width,
    h: dimensions.height
  } //dimensions of the image
  let img //loaded image
  let tileSet = {} //key: tile key, value: tile object
  const tileSize = parseInt(tile) //size of each tile (e.g. 3x3)
  const pixelSize = 2
  let mainGrid //holds the grid object
  const gridSize = 8

  tileSet = await getPixelValues(input, tileSize, tileSet, imgSize); // Ensure this completes before moving on
  console.log(Object.values(tileSet).map(t => t.grid))
  mainGrid = new Grid(gridSize, Object.keys(tileSet), tileSet)
  let success = mainGrid.beginCollapse()
  if (success == false){
    console.log("failed")
    return
  }
  arrToImg(gridToArray(mainGrid.gridMatrix, tileSize, tileSet), output, pixelSize)
  console.log("Image generation complete!")
}



//main('./input/frfargfszfvsdfv.png', "jiejiijef", {width:35, height:25}, 5)

export default main