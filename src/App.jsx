import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Homepage from './pages/Homepage'
const App = () => {
  return (
    <>
      <Routes>
          <Route index element={<Homepage/>}/>

          {/* wild card routing */}
          {/* <Route path='*' element={<Notfound/>}/> */}
      </Routes>

    </>
  )
}

export default App
