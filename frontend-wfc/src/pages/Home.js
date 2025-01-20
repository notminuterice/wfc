import React, {useState} from "react";
import s from "./Home.module.css"
import axios from "axios"
import Grid from "../components/Grid";
function Home() {
  const [imgFile, setImgFile] = useState()
  const [imgPreview, setImgPreview] = useState()
  const [outUrl, setOutUrl] = useState()
  const [outName, setOutName] = useState()
  const [tileSize, setTileSize] = useState()

  function fileChange(event) {
    let inputFile = event.target.files[0]
    setImgFile(inputFile)
    setImgPreview(URL.createObjectURL(inputFile))
    //addFile()
  }

  function tileSizeChange(event) {
    setTileSize(event.target.value) 
  }

  async function addFile() {
    if (!imgFile) {
      alert("No file selected")
      return
    }

    const formData = new FormData()
    formData.append("image", imgFile)
    formData.append("outPath", outName)
    formData.append("tileSize", tileSize)
    try {
      const res = await axios.post("http://localhost:8000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      console.log(res.data.imgUrl)
      setOutUrl(res.data.imgUrl)

    } catch (error) {
      console.error("Error uploading image:", error);
      alert("An error occurred while uploading the image.");
    }
  }

  function nameChange(event) {
    setOutName(event.target.value)
  }

  return (
    <div className={s.main}>
      <div className={s.title}>
        <img src="https://kopawz.neocities.org/indexgraphics/notfoundfolder/spinningfrog.gif" />
        <h1 className={s.titleText}>WFC Image generator</h1>
        <img src="https://kopawz.neocities.org/indexgraphics/notfoundfolder/spinningfrog.gif" />
      </div>

      <div className={s.contentWrapper}>
        <div className={s.input}>
          <h2>Input</h2>
          <div className={s.imgWrapper}>
            {/* <div className={s.grid}>
              <Grid inputGridSize={inputGridSize}/>
            </div> */}
            <img src={imgPreview} alt="forest" className={s.input} />
          </div>
          <input type="file" accept="image/*" onChange={fileChange} />
          <button onClick={addFile}>
            Begin WFC
          </button>
          <input type="text" onChange={nameChange} />
          <input type="number" onChange={tileSizeChange} />
        </div>

        <div className={s.output}>
          <h2>Output</h2>
          <div className={s.imgWrapper}>
            <img src={outUrl} alt="forest" className={s.output} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home