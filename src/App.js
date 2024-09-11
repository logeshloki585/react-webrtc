import React from 'react';
import {Button, Typography, Input} from 'antd';
import './App.css';
import Conf from './conf';
import NewConf from './newConf';


const {Title, Paragraph} = Typography;
const {TextArea} = Input;
function App() {

    return (
        <div className="App">
            <NewConf/>
        </div>
    );
}
export default App;