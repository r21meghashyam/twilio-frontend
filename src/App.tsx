import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPhone, faCircleNotch } from '@fortawesome/fontawesome-free-solid'
// @ts-ignore
import { Device } from 'twilio-client';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import Select from 'react-select'
import moment from 'moment';


//dummy data
const workflowItems = [ 
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
  SEARCH = "search";
  SEARCHING = "searching....";
  OPTIONS = [
    { value: "account", label: "Account" },
    { value: "encounter", label: "Encounter" },
    { value: "claim", label: "Claim" },
    { value: "insurance", label: "Insurance" },
    { value: "tenant", label: "Tenant" },
    { value: "person", label: "Person" },
  ]
  state = {
    twilioDeviceIsReady: false,
    twilioTokenIsSetup: false,
    callConnected: false,
    callNumber: null,
    fetchingToken: false,
    callingToastId: '',
    searchBtnText: this.SEARCH,
    beginingDate: '',
    endingDate: '',
    entityType: { value: '', label: '' }
  };
  constructor(props:any) {
    super(props);
    this.search = this.search.bind(this);
    this.clear = this.clear.bind(this);
    this.handleDayChange = this.handleDayChange.bind(this);
    this.handleSelectChange = this.handleSelectChange.bind(this);
  }
  componentDidMount() {
    this.init();
  }
  async init() {
    try {
      if (this.state.fetchingToken)
        return;
      await this.setState({ fetchingToken: true });
      const response = await fetch(this.SERVER);
      const json = await response.json();
      const token = json.token;
      Device.setup(token);
      await this.setState({ fetchingToken: false, twilioTokenIsSetup: true });
      Device.on('ready', (device:any) => {
        this.setState({ twilioDeviceIsReady: true })
      });
      Device.on('error', (error:any) => {
        console.log(error)
        if (error.code === 31208)
          return toast("Please ensure you have given permission for this application to use the microphone",{type:"error",toastId:"microphoneDisabled"});
        if (error.code === 31204) {
          this.setState({ twilioTokenIsSetup: false, callConnected: false });
          Device.destroy();
          this.init();
          return;
        }
        if (error.code === 31000) {
          this.setState({ twilioTokenIsSetup: false, callConnected: false });
          toast("You are either offline or your internet connection is two slow.", { type: "error", toastId: 31000 })
          Device.destroy();
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
      setTimeout(() => {
        this.init()
      }, 3000);
    }
  }
  async callPhone(number:string) {
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
        callNumber: number,
        callingToastId: toast(`Calling ${number}...`, { type: "success" , toastId: 2 })
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
  getClass(number:string) {
    if (!this.state.callConnected)
      return 'call';
    else if (this.state.callNumber === number)
      return 'cut';
    else
      return '';
  }
  search() {
    if (this.state.entityType.value === "")
      return toast("Please select entity type", { type: "warning", toastId: "entityValidation" })
    if (this.state.beginingDate === "")
      return toast("Please select begining date", { type: "warning", toastId: "beginingDateValidation" })
    if (this.state.endingDate === "")
      return toast("Please select ending date", { type: "warning", toastId: "endingDateValidation" })


    this.setState({ searchBtnText: this.SEARCHING },()=>{
      setTimeout(()=>{
        this.setState({searchBtnText:this.SEARCH})
      },5000)
    });
  }
  clear() {
    this.setState({
      beginingDate: moment().format('MM/DD/Y'),
      endingDate: moment().format('MM/DD/Y'),
      entityType: { value: '', label: '' }
    })
  }
  handleDayChange(name:string, date:Date) {
    this.setState({ [name]: moment(date).format('MM/DD/Y') })
  }
  handleSelectChange(e:any) {
    this.setState({ entityType: e });
  }
  doNothing() { }
  render() {
    return (<div className="app">
      <div className="container">
        <div className="row center">
          <h1>Pending workflow items</h1>
        </div>
        <div className="row">
          <div>
            <label>Entity Type:</label>

            <Select
              classNamePrefix="react-select"
              className="inline"
              value={this.state.entityType}
              onChange={this.handleSelectChange}
              options={this.OPTIONS} />

          </div>
          <div>
            <label>Begining Date:</label>
            <DayPickerInput
              value={this.state.beginingDate}
              onDayChange={(date) => this.handleDayChange('beginingDate', date)}
              placeholder={moment().format("MM/DD/Y")}
            />
          </div>
        </div>
        <div className="row alignContentRight">
          <div>
            <label>Ending Date:</label>
            <DayPickerInput
              value={this.state.endingDate}
              onDayChange={(date) => this.handleDayChange('endingDate', date)}
              placeholder={moment().format("MM/DD/Y")} />
          </div>
        </div>
        <div className="row actions">
          <button 
          onClick={this.search} 
          className={this.state.searchBtnText === this.SEARCHING ? 'active' : ''}
          disabled={this.state.searchBtnText === this.SEARCHING}
          >
            <FontAwesomeIcon icon="search"></FontAwesomeIcon> {this.state.searchBtnText}
          </button>
          <button onClick={this.clear}>
            <FontAwesomeIcon icon="eraser"></FontAwesomeIcon> Clear
            </button>
        </div>
        <table className={this.state.searchBtnText === this.SEARCHING ? 'fade' : ''}>
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
                    // @ts-ignore
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

