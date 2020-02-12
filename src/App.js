import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPhone, faCircleNotch } from '@fortawesome/fontawesome-free-solid'
import { Device } from 'twilio-client';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';

import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import Select from 'react-select'

//dummy data
const workflowItems=[
  {
    workIssueName: 'Insurance',
    workIssueStatus: 'Pending',
    type: 'Claim',
    contact: '+918123928667'
  },
  {
    workIssueName: 'RandomWorkIssue2',
    workIssueStatus: 'Pending',
    type: 'Encounter',
    contact: '+918884026263'
  },
  {
    workIssueName: 'RandomWorkIssue3',
    workIssueStatus: 'Pending',
    type: 'Claim',
    contact: '+919886515308'
  },
]

class App extends Component {
  SERVER = "https://cerner-twilio.herokuapp.com/token";

  state = {
    twilioDeviceIsReady: false,
    twilioTokenIsSetup: false,
    callConnected: false,
    callNumber: null,
    fetchingToken: false,
    callingToastId: null
  };
  componentDidMount() {
    console.log("componentDidMount->init");
    this.init();
  }
  async init() {
    try {
      if (this.state.fetchingToken)
        return;
      await this.setState({ fetchingToken: true });
      console.log("fetchingToken: true");
      const response = await fetch(this.SERVER);
      const json = await response.json();
      const token = json.token;
      Device.setup(token);
      await this.setState({ fetchingToken: false, twilioTokenIsSetup: true });
      console.log("fetchingToken: false");
      Device.on('ready', (device) => {
        console.log(device);
        this.setState({ twilioDeviceIsReady: true })
      });
      Device.on('error', (error) => {
        
        if (error.code === 31204) {
          this.setState({ twilioTokenIsSetup: false, callConnected: false });
          Device.destroy();
          console.log("31204->init");
          this.init();
          return;
        }
        if (error.code === 31000) {
          this.setState({ twilioTokenIsSetup: false, callConnected: false });
          toast("You are either offline or your internet connection is two slow.", { type: "error", toastId: 31000 })
          Device.destroy();
          console.log("31000->init");
          this.init();
          return;
        }
        if (error.code === 31003) {
          this.setState({ callConnected: false });
          Device.disconnectAll();
          toast(error.twilioError.causes.join(" "), { type: "error", toastId: 31003 })
          return;
        }
      });
      Device.on('connect', () => {


      });
      Device.on('disconnect', () => {
        this.setState({ callConnected: false })
        toast.dismiss(this.state.callingToastId);
      });
    } catch (err) {
      await this.setState({ fetchingToken: false });
      console.log("fetchingToken: false");
      setTimeout(() => {
        console.log("setTimeout->init");
        this.init()
      }, 3000);
    }
  }
  async callPhone(number) {
    if (!this.state.twilioDeviceIsReady || !this.state.twilioTokenIsSetup)
      return toast("Please wait until twilio is ready. Make sure you have an active internet connection.", { type: "error", toastId: 1 });
    if (this.state.callConnected) {
      if (this.state.callNumber === number) {
        Device.disconnectAll();
      }
    }
    else {
      await this.setState({
        callConnected: true,
        callNumber:number,
        callingToastId: toast(`Calling ${number}...`, { type: "success" }, { toastId: 2 })
      })
      Device.connect({ phoneNumber: number });

    }
  }
  getCallTitle() {
    if (!this.state.callConnected)
      return "Click on the call button to call the user";
    else
      return "Click on the button to cancel the call";
  }
  getClass(number) {
    if (!this.state.callConnected)
      return 'call';
    else if (this.state.callNumber === number)
      return 'cut';
    else
      return '';
  }
  search(){

  }
  clear(){

  }
  render() {
    //console.log(this.state.twilioStatus)
    return (<div className="app">
      <div className="container">
        <div className="row center">
          <h1>Pending workflow items</h1>
        </div>
        <div className="row">
          <div>
            <label>Entity Type:</label>
           
            <Select classNamePrefix="react-select" className="inline" options={[
              {value:"account",label:"Account"},
              {value:"encounter",label:"Encounter"},
              {value:"claim",label:"Claim"},
              {value:"insurance",label:"Insurance"},
              {value:"tenant",label:"Tenant"},
              {value:"person",label:"Person"},
              ]} />

         </div>
          <div>
            <label>Begining Date:</label>
            <DayPickerInput />
          </div>
        </div>
        <div className="row alignContentRight">
          <div>
            <label>Ending Date:</label>
            <DayPickerInput />
          </div>
        </div>
        <div className="row actions">
          <button onClick={this.search}>
            <FontAwesomeIcon icon="search"></FontAwesomeIcon> Search
            </button>
          <button onClick={this.clear}>
            <FontAwesomeIcon icon="eraser"></FontAwesomeIcon> Clear
            </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Sl.</th>
              <th>Work Issue Name</th>
              <th>Status</th>
              <th>Type</th>
              <th>Contact Details</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {
              workflowItems.map((data, index) => <tr key={index}>
                <td>{index + 1}</td>
                <td>{data.workIssueName}</td>
                <td>{data.workIssueStatus}</td>
                <td>{data.type}</td>
                <td>{data.contact}</td>
                <td>
                  {/* <button className={`call-button ${this.getClass(data.contact)}`}> */}
                  <FontAwesomeIcon
                    flip="horizontal"
                    className={`call-button ${this.getClass(data.contact)}`}
                    title={this.getCallTitle()}
                    onClick={() => this.callPhone(data.contact)}
                    spin={!this.state.twilioDeviceIsReady || !this.state.twilioTokenIsSetup}
                    icon={!this.state.twilioDeviceIsReady || !this.state.twilioTokenIsSetup ? faCircleNotch : faPhone} />
                  {/* </button> */}
                </td>
              </tr>)
            }
          </tbody>
        </table>
      </div>
      <ToastContainer />
    </div>)
  }

}

export default App;
