import React, { Component } from 'react';
import '@fortawesome/fontawesome-free/js/all';
import {Device} from 'twilio-client';

class App extends Component {
  SERVER = "https://cerner-twilio.herokuapp.com/token";
  state={
    status:'Not ready',
    action:'disabled'
  }
  constructor(props){
    super(props);
    this.updatePhoneNumber=this.updatePhoneNumber.bind(this);
    this.callPhone=this.callPhone.bind(this);
    this.init=this.init.bind(this);
  }
  componentDidMount(){
    this.init();
  }
  async init(){
    const response = await fetch(this.SERVER);
    const json = await response.json();
    const token = json.token;
    Device.setup(token,{region:"us1"});
    Device.on('ready',(device)=> {
      this.setState({status:'Ready'})
    });
    Device.on('error',(error)=> {
      this.setState({status:'Error Occured',action:'call',endTime:Date.now()},()=>{
        console.log((this.state.endTime-this.state.startTime)/1000);
      })
      console.log(error)
    });
    Device.on('connect',()=> {
      this.setState({status:'Connected',startTime:Date.now()})
    });
    Device.on('disconnect',()=> {
      this.setState({status:'Disconnected',action:'call',endTime:Date.now()},()=>{
        console.log((this.state.endTime-this.state.startTime)/1000);
      })
      
    });

    
  }
  updatePhoneNumber(event){
    let action = event.target.value.length>4?"call":"disabled";
    this.setState({phoneNumber:'+'+[event.target.value],action});
  }
  async callPhone(){
    if(this.state.action==="disabled"){
      this.setState({status:"Enter valid phone number."})
      return;
    }
    if(this.state.action==='call')
      Device.connect({phoneNumber:this.state.phoneNumber});
    else
      Device.disconnectAll();
    this.setState({action:this.state.action==='call'?'cut':'call'})
    
  }
  render() {
    return (
      <div className="app">
        <div className="input">
          <span className="plus">+</span>
          <input type="number" onChange={this.updatePhoneNumber} placeholder="Enter phone number" />
        </div>
        <button onClick={this.callPhone} title={this.state.action==='call'?'Click to call':'Click to cut the call'} className={`button ${this.state.action}`}><i className="fas fa-phone-alt" /></button>
    <div>Status: {this.state.status}</div>
      </div>
    );
  }

}

export default App;
