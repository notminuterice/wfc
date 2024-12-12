import React from "react"
import { Routes ,Route } from 'react-router-dom';

import Home from './pages/Home';

function App() {
    return (
      <Routes> {/* The Switch decides which component to show based on the current URL.*/}
        <Route path='/' element={<Home/>}></Route>
      </Routes>
    );
}

export default App