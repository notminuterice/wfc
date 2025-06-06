# Markov-Chain WFC Tilemap Generator

---

## Introduction

This is the project I created for my Computer Science A-level NEA. The general concept of this program is to take in a sample tilemap that a developer has made to create a larger/different version of this tilemap to be used in a game. I used a version of the Wave Function Collapse algorithm (markov-chain) which creates adjacency rules from the tiles found in the input image, and collapsing the output grid using these rules. This minimises the amount of work the developer has to do when creating the input data, as for a regular Tiled WFC algorithm, the user would have to manually type in the adjacency rules for every tile. I learnt this concept of the Markov-Chain WFC from [Pronay Peddiraju's master's thesis](https://www.pronay.me/thesis-markov-chain-based-wave-function-collapse/)

## Setup and installation

Firstly, clone the repository locally using

```sh
git clone https://github.com/notminuterice/wfc.git
```

or by using SSH. Then, in the cd to the wfc directory:

```sh
cd wfc
```

and run the following command:

```sh
npm run fullinstall
```

## Running

To run both the backend and frontend at once with a single terminal instance, run:

```sh
npm run dev
```

This will start a concurrently command to run the backend and frontend at the same time
If you want to run them in seperate instances, follow these steps:

1. open a new terminal instance and run

```sh
node index.js
```

2. open another terminal instance and run

```sh
cd frontend-wfc
npm start
```

## How to use

- Select the sample tilemap image using the input button
- Specify the output filename
- Enter the tile size
- Enter the output grid size (how many tiles you want per row/column)
- Generate your new image!

## Additional notes

- The input image must be true to the pixel size (cannot be scaled up from the original pixel art image)
- The tile sizing must be consistent throughout the image, and entered correctly
- The image must be comprised of only tiles, as extra pixels around the edges of the image will cause the algorithm to break
- If the output grid is too large, it may take too long to run and fail
- Often times the algorithm fails as there are no possible tiles left to collapse, in which case it runs again to produce a valid output
- There is a generation time limit of 60 seconds, and it stop and will alert you if this is exceeded.
