import generateTileset from "./tileGen.mjs"

const tileNum = 2           //tile to be displayed when there is only one tile being displayed
let tileSet                 //tile set
const pixelSize = 2         //number of pixels that should be displayed on screen per pixel in the tile
const canvasDimensions = 1000 //px dimensions of the canvas
const tileSize = 16         //number of pixels in the tile
const adjustedTileSize = tileSize*pixelSize     //tile size adjusted using the pixel size property
const tilePos = 1000 / 2 - adjustedTileSize / 2 //positioning of the tile when I want it to be in the middle of the canvas
const tileSpacing = 2       //distance between each tile

new p5(function (p5) {
  p5.setup = async function () {
    p5.createCanvas(canvasDimensions, canvasDimensions) //initialises canvas with specified grid size
    tileSet = await generateTileset("./complex-forest.png", { "width": 272, "height": 256 }, 16) //create tileset
  }

  //turns direction into a position vector
  function getDirectionTile(direction){
    switch (direction){
      case "up": return [0, -1];
      case "down": return [0, 1];
      case "left": return [-1, 0];
      case "right": return [1, 0]
    }
  }

  //draws the adjacency rule for a specified tile
  function drawAdjacent(tile) {
    //loop through each adjacency rule
    Object.entries(tile.adjacencyRules).forEach((rule) => {
      let [key, val] = rule //assign the key value pair to individual variables
      val.forEach((k, i) => {
        const startX = tilePos + getDirectionTile(key)[0] * (i + 1) * (adjustedTileSize + tileSpacing)  //what x position on the canvas to start drawing the tile from
        const startY = tilePos + getDirectionTile(key)[1] * (i + 1) * (adjustedTileSize + tileSpacing)  //what y position on the canvas to start drawing the tile from
        drawTile(startX, startY, tileSet[k].grid, 1)
      })
    })
  }

  //draws the tile from the grid
  function drawTile(startX, startY, grid, spaceMultiplier) {
    //loops through each pixel colour in the grid
    grid.forEach((row, y) => {
      row.forEach((colour, x) => {
        p5.fill(colour) //set fill colour
        p5.noStroke()   //remove square outline
        p5.square(startX + (x*spaceMultiplier)*pixelSize, startY + (y * spaceMultiplier)*pixelSize, pixelSize)  //draws the pixel at corresponding x and y coords on the grid (adjusted pixel size)
      })
    })
  }

  //draws every tile in the tileset
  function drawAllTiles() {
    Object.values(tileSet).forEach((t, i) => {
      drawTile((i%7)*(adjustedTileSize + tileSpacing) + 50, Math.floor(i/7)*(adjustedTileSize + tileSpacing) + tilePos, t.grid, 1)
    })
  }

  p5.draw = function () {
    p5.background(255)
    if (tileSet) {
      //drawTile(tilePos, tilePos, tileSet[tileNum].grid, 1)
      //drawAdjacent(tileSet[tileNum])
      drawAllTiles()
      // drawTile(tilePos, tilePos - adjustedTileSize - 10, tileSet[tileNum].grid, 1)
      // drawTile(tilePos, tilePos, tileSet[tileNum].grid, 1.5)
    }
  }
})

