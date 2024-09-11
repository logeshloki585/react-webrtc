import React from 'react';
import {Button, Typography, Input} from 'antd';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Conf from './conf';
import NewConf from './newConf';


const {Title, Paragraph} = Typography;
const {TextArea} = Input;
function App() {

    return (
        <Router>
            <div className="App">
                <Routes>
                <Route path="/conf" element={<NewConf />} />
                </Routes>
            </div>
        </Router>
    );
}
export default App;