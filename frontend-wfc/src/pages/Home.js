import React, {useState} from "react";
import s from "./Home.module.css"
import axios from "axios"
import Grid from "../components/Grid";
import Card from "../components/Card";
import FormWrapper from "../components/FormWrapper";
import ImagePlaceholder from "../components/ImagePlaceholder";
import { saveAs } from "file-saver";
function Home() {
  const [imgFile, setImgFile] = useState()
  const [imgPreview, setImgPreview] = useState()
  const [outUrl, setOutUrl] = useState()
  const [outName, setOutName] = useState()
  const [gifUrl, setGifUrl] = useState()
  const [tileSize, setTileSize] = useState()
  const [gridSize, setGridSize] = useState()

  function fileChange(event) {
    if (event.target.files.length > 0) {
      let inputFile = event.target.files[0]
      setImgFile(inputFile)
      setImgPreview(URL.createObjectURL(inputFile))
    }
  }

  function tileSizeChange(event) {
    setTileSize(event.target.value)
  }
  function gridSizeChange(event) {
    setGridSize(event.target.value)
  }

  async function addFile() {
    if (!imgFile) {
      alert("No file selected")
      return
    }
    setGifUrl(null)

    const formData = new FormData()
    formData.append("image", imgFile)
    formData.append("outPath", outName)
    formData.append("tileSize", tileSize)
    formData.append("gridSize", gridSize)
    axios.post("http://localhost:8000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((res) => {
        console.log(res.data.imgUrl)
        setOutUrl(res.data.imgUrl)
        setGifUrl(res.data.gifUrl)
        console.log(gifUrl)
      }).catch((err) => {
        if (err.response){
          console.error("Error uploading image:", err.response.data);
          alert(`Res status 500: An error occurred while uploading the image\n ${err.response.data}`);
        } else {
          alert(`Res status 500: An error occurred while uploading the image\n ${err}`)
        }
      })
  }

  function downloadFile() {
    saveAs(outUrl, outName)
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
        <Card>
          <h2 className={s.secondaryTitle}>Input</h2>
          <div className={s.imgWrapper}>
            {imgPreview ? (
              <img src={imgPreview} alt="forest" className={s.input} />
            ) : (
              <ImagePlaceholder/>
            )}
          </div>
          <input type="file" accept="image/*" onChange={fileChange} className={s.inputFile} />
          <div className={s.input_vals}>
            <FormWrapper name="Output Filename">
              <input type="text" onChange={nameChange} className={s.inputForm} placeholder="filename"/>
            </FormWrapper>
            <FormWrapper  name="Tile Size">
              <input type="number" onChange={tileSizeChange} className={s.inputForm} placeholder="0"/>
            </FormWrapper>
            <FormWrapper  name="Output Grid Size">
              <input type="number" onChange={gridSizeChange} className={s.inputForm} placeholder="0"/>
            </FormWrapper>
            <button onClick={addFile} className={s.begin_button}>
              BEGIN WFC
            </button>
          </div>
        </Card>

        <Card>
          <h2 className={s.secondaryTitle}>Output</h2>
          <div className={s.imgWrapper}>
            {gifUrl ? (
              <img src={gifUrl} alt="forest" className={s.output} />
            ) : (
              <ImagePlaceholder/>
            )}
          </div>
          <button onClick={downloadFile} className={s.download_button}>
              DOWNLOAD
          </button>
        </Card>
      </div>
    </div>
  );
}

export default Home