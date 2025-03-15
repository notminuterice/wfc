import React, {useState} from "react";
import s from "./CSSWave.module.css"

function CSSWave() {
    return (
        <div class={s.water_round_container}>
            <div class={s.water_wave1}></div>
            <div class={s.water_wave2}></div>
            <div class={s.water_wave3}></div>
        </div>
    )
}

export default CSSWave