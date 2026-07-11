import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Homepage from './pages/Homepage'
const App = () => {
  return (
    <>
      <Routes>
        <Route index element={<Homepage />} />
        <Route path="/auth" element={<Auth />}>
          <Route path="login" element={<LoginForm />} />
          <Route path="register" element={<RegisterForm />} />
        </Route>


        {/* wild card routing */}
        {/* <Route path='*' element={<Notfound/>}/> */}
      </Routes>

    </>
  )
}

export default App
