import React from "react";
import s from "./FormWrapper.module.css"
function FormWrapper(props) {
    return(
        <div className={s.wrapper}>
            <text className={s.form_name}>{props.name}</text>
            {props.children}
        </div>
    )
}

export default FormWrapper