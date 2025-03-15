import React, {useState} from "react";
import s from "./ImagePlaceholder.module.css"
import CSSWave from "./CSSWave"
function ImagePlaceholder() {
    return (
        <div className={s.container}>

            <CSSWave />
            <div className={s.glass}></div>
            <text className={s.info_text}>No Image Found</text>
        </div>
    )
}

export default ImagePlaceholder