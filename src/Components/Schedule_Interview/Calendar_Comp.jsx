import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-datepicker/dist/react-datepicker.css';
import { useParams } from 'react-router-dom';
import showToast from '../../Utils/showToast';
import { useDispatch, useSelector } from 'react-redux';
import { getSearchUserStart, getSearchUserSuccess } from '../../Redux/searchUser/searchUser';
import { getUserDataById } from '../../APIs/User_API';
import axios from 'axios';
import RenderRazorpay from './RenderRazorpay';
import { Spinner } from '@material-tailwind/react';
import { getAllMeetings } from '../../APIs/Meeting_API';
import { EncryptRequestData } from '../../Utils/Encryption/EncryptRequestData';
import { DecryptResponseData } from '../../Utils/Encryption/DecryptResponseData';

const localizer = momentLocalizer(moment);

const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const shouldDisableDate = (date) => {
    const today = new Date();

    // compare date not whole time



    if (date.getFullYear() === today.getFullYear()) {

        if (date.getMonth() === today.getMonth()) {
            if (date.getDate() < today.getDate()) {
                return true;
            }
            else {
                return false;
            }
        }

        if (date.getMonth() < today.getMonth()) {
            return true;
        }

        return false;
    }

    if (date.getFullYear() < today.getFullYear()) {
        return true;
    }

    return false;


};

// Custom date cell wrapper to style disabled dates
const CustomDateCellWrapper = ({ children, value }) => {
    const dateIsDisabled = shouldDisableDate(value);
    const className = dateIsDisabled ? 'rbc-off-range-bg' : '';
    return React.cloneElement(React.Children.only(children), {
        className: `${children.props.className} ${className}`
    });
};




function convert(str) {
    var date = new Date(str),
        mnth = ("0" + (date.getMonth() + 1)).slice(-2),
        day = ("0" + date.getDate()).slice(-2);
    return [date.getFullYear(), mnth, day].join("-");
}

const Calendar_Comp = () => {
    const [selectedDate, setSelectedDate] = useState(moment().toDate());
    const [selectedTime, setSelectedTime] = useState(null);
    const [events, setEvents] = useState([]);
    const [ievents, setIEvents] = useState([]);
    const [fetchingEvents, setFetchingEvents] = useState(true);
    const [showCalendar, setShowCalendar] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState(null);

    const [fetchedMeeting, setFetchedMeeting] = useState([]);

    const convertToEvent = () => {
        var arr = [];

        const length = fetchedMeeting.length;

        for (var i = 0; i < length; i++) {
            var newEvent = fetchedMeeting[i].calendarEvent
            const start = moment(newEvent.start).toDate();
            const end = moment(newEvent.end).toDate();

            newEvent = { ...newEvent, start: start, end: end, meeting_link: fetchedMeeting[i].meeting_link };
            // newEvent = { ...newEvent,  };
            arr.push(newEvent);
        }

        setEvents(arr);
    }



    // convert the selectedDate and selectedTime to ISO string

    const convertToISO = () => {
        if (selectedDate && selectedTime) {
            return convert(selectedDate) + 'T' + selectedTime + ":00Z";
        }

        return null;
    }

    const [bookLoading, setBookLoading] = useState(false);

    const [displayRazorpay, setDisplayRazorpay] = useState(false);

    const [orderDetails, setOrderDetails] = useState(null);

    const [generatingLink, setGeneratingLink] = useState(false);

    const params = useParams();

    const [meetingDetails, setMeetingDetails] = useState(null);


    const BASE_URL = process.env.REACT_APP_BASE_URL;

    const tileDisabled = ({ activeStartDate, date, view }) => {
        return date < new Date()
    }

    const userRedux = useSelector(state => state.user);



    const instructorId = params.user;

    const handleCreateOrder = async (amount, currency) => {



        if (selectedTime === null) {
            showToast({
                type: 'error',
                msg: 'Please select a time slot',
                duration: 4000
            });
            return
        }

        setBookLoading(true);
        const DATA = EncryptRequestData(
            {
                amount: amount * 100,
                currency: currency,
                instructorId: instructorId,
                studentId: userRedux.data._id,
                topic: `Mock Interview with ${searchUserRedux.data.firstName + " " + searchUserRedux.data.lastName}`,
                service: "Meeting"
            }
        );
        let response = await axios.post(BASE_URL + '/transactions/generate-order-id',DATA,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'security-key': process.env.REACT_APP_SECURITY_KEY,
                    'auth-token': localStorage.getItem('token')
                }
            }
        );

        setBookLoading(false);

        response = response.data;

        response = DecryptResponseData(response);


        if (response.success && response.data.id) {
            setOrderDetails(response.data);
            setDisplayRazorpay(true);

            console.log({ displayRazorpay });
        };
    };



    // const params = useParams();


    const searchUserRedux = useSelector((state) => state.searchUser);

    const fetchAllMeetings = async () => {

        if (!userRedux.data || !searchUserRedux.data) {
            return;
        }

        const allMeeting = await getAllMeetings(userRedux.data.meetingScheduled);
        const instructorMeetings = await getAllMeetings(searchUserRedux.data.meetingScheduled);

        setFetchingEvents(false);

        if (allMeeting.success) {
            // console.log({ meetings: allMeeting.data });
            setFetchedMeeting(allMeeting.data);
            setIEvents(instructorMeetings.data);
            return;
        }

        else {
            showToast({
                msg: allMeeting.msg,
                type: 'error',
                duration: 3000
            });
        }
    }



    const dispatch = useDispatch();


    const getTheUserData = async () => {

        const token = localStorage.getItem("token");

        const role = 'instructor';
        const id = params.user;

        dispatch(getSearchUserStart());

        const userData = await getUserDataById(role, id);

        if (userData.success === false) {

            showToast({
                msg: userData.msg,
                type: 'error',
                duration: 3000,
            });

        } else {
            dispatch(getSearchUserSuccess(userData.data));
        }
    }

    // fetch user data on loading page


    useEffect(() => {
        getTheUserData();
    }, []);

    useEffect(() => {
        fetchAllMeetings();
    }, [searchUserRedux.data, userRedux.data]);

    useEffect(() => {
        convertToEvent();
    }, [fetchedMeeting]);

    // console.log({ events });

    const timeSlots = useMemo(() => {

        if(!searchUserRedux.data){
            return;
        }

        const day = new Date(selectedDate).getDay();

        const weekDay = weekDays[day];


        const defaultTimeSlots = searchUserRedux.data.availableTimeslots[weekDay];

        // remove the time slot on current day is current time pass the hours 

        const todayAvailableTimeSlot = defaultTimeSlots.filter((slot) => {

            const [hour, minute] = slot.split(':');
            const [currentHour, currentMinute] = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' }).split(':');

            if (parseInt(hour) < parseInt(currentHour)) {
                return false;
            }

            if (parseInt(hour) === parseInt(currentHour) && parseInt(minute) < parseInt(currentMinute)) {
                return false;
            }

            return true;
        })

        // if () {
        //     return todayAvailableTimeSlot;
        // }


        if (selectedDate) {
            let selectedDateSlots = (ievents)
                .filter((event) => moment(event.start).isSame(selectedDate, 'day'))
                .map((event) => moment(event.start).format('HH:mm'));

            // check in events as well

            selectedDateSlots = (events)
                .filter((event) => moment(event.start).isSame(selectedDate, 'day'))
                .map((event) => moment(event.start).format('HH:mm'));

            if(moment(selectedDate).isSame(new Date(), 'day')){
                return todayAvailableTimeSlot.filter((slot) => !selectedDateSlots.includes(slot));
            }
            else{

                return defaultTimeSlots.filter((slot) => !selectedDateSlots.includes(slot));
            }
        }

        return defaultTimeSlots;
    }, [selectedDate, ievents]);

    const handleDateClick = ({ start }) => {
        if (shouldDisableDate(start)) {
            showToast({
                type: 'error',
                msg: 'Past dates are not allowed',
                duration: 4000
            });

            return;
        }
        setSelectedDate(start);
        setSelectedTime(null);
    };

    const handleTimeClick = (time) => {
        setSelectedTime(time);
    };

    const handleEventClick = (event) => {
        setSelectedEvent(event);
        setShowModal(true);
        document.body.style.overflow = 'hidden';
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setSelectedTime(null);
    };


    const eventGenerate = () => {
        const startHour = parseInt(selectedTime.split(':')[0], 10);
        const startMinute = parseInt(selectedTime.split(':')[1], 10);

        const startDate = new Date(selectedDate);
        startDate.setHours(startHour);
        startDate.setMinutes(startMinute);

        const endDate = new Date(startDate);
        endDate.setHours(startHour + 1);

        const newEvent = {
            title: `Mock Interview between ${searchUserRedux.data.firstName + " " + searchUserRedux.data.lastName} and ${userRedux.data.firstName + " " + userRedux.data.lastName}`,
            start: moment(startDate).toDate(),
            end: moment(endDate).toDate(),

        };

        return newEvent
    }

    const handleAddMeeting = (meeting_url) => {
        if (selectedDate && selectedTime && meeting_url) {
            const isSlotAlreadyScheduled = events.some((event) => {
                const eventStartTime = moment(event.start);
                const selectedStartTime = moment(selectedDate).set({
                    hour: parseInt(selectedTime.split(':')[0], 10),
                    minute: parseInt(selectedTime.split(':')[1], 10),
                });

                return eventStartTime.isSame(selectedStartTime);
            });

            if (isSlotAlreadyScheduled) {
                showToast({
                    type: 'error',
                    msg: 'Slot already scheduled',
                    duration: 4000
                });
            } else {


                // console.log({ meetingDetails });

                var newEvent = eventGenerate();
                newEvent = { ...newEvent, meeting_link: meeting_url };
                setEvents([...events, newEvent]);
                setError(null);
                showToast({
                    type: 'success',
                    msg: 'Slot added successfully. Please check your calendar.',
                    duration: 3000
                });

                setSelectedTime(null);
                handleEventClick(newEvent);
            }
        } else {
            showToast({
                type: 'error',
                msg: 'Please select Date and Time.',
                duration: 3000
            });
        }
    };

    const handleClosePopup = () => {
        setSelectedEvent(null);
        setShowModal(false);
        document.body.style.overflow = 'auto'; // Enable scrolling when the modal is closed
    };

    return (

        fetchingEvents ?

            <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-40">
                <div className="bg-white p-4 md:p-6 rounded-2xl w-10/12 md:w-1/2 lg:w-1/3 max-h-full max-w-sm space-y-2  border-2 border-y-gray-500">
                    <div className='flex justify-center  font-inter text-base md:text-2xl space-x-3'>
                        <Spinner color='blue' size='large' className='' />
                        <div>
                            <div className='font-handwritten2 text-base  ml-2'>Loading Calendar....</div>
                        </div>
                    </div>
                </div>
            </div>

            :

            displayRazorpay ?
                <RenderRazorpay
                    order={orderDetails}
                    keyId={process.env.REACT_APP_RAZORPAY_KEY_ID}
                    keySecret={process.env.REACT_APP_RAZORPAY_KEY_SECRET}
                    setDisplayRazorpay={setDisplayRazorpay}
                    handleAddMeeting={handleAddMeeting}
                    instructorId={instructorId}
                    studentId={userRedux.data._id}
                    setGeneratingLink={setGeneratingLink}
                    setMeetingDetails={setMeetingDetails}
                    topic={`Mock Interview with ${searchUserRedux.data.firstName + " " + searchUserRedux.data.lastName}`}
                    startTime={convertToISO()}
                    eventGenerate={eventGenerate}

                />
                :

                generatingLink ?
                    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-40">
                        <div className="bg-white p-4 md:p-6 rounded-2xl w-10/12 md:w-1/2 lg:w-1/3 max-h-full max-w-sm space-y-2  border-2 border-y-gray-500">
                            <div className='flex justify-center  font-inter text-base md:text-2xl space-x-3'>
                                <Spinner color='blue' size='large' className='mt-1' />
                                <div>
                                    <div className='font-handwritten2 text-base  ml-2 mt-[1px] md:-mt-1'>Generating Meet Link.</div>
                                    <div className='font-handwritten2 text-base  ml-2 mt-[1px] md:-mt-1'>Please don't refresh the page.
                                    </div></div>
                            </div>
                        </div>
                    </div>
                    :


                    searchUserRedux.data ? <div className='mt-3'>
                        <div className='md:ml-[290px]'>
                            <div className="w-full md:w-3/4 pt-2 text-center">
                                <h1 className="text-base md:text-xl font-inter font-bold">
                                    Select time slot for interview with {searchUserRedux.data.firstName + " " + searchUserRedux.data.lastName+" ("+searchUserRedux.data.email+")"}
                                </h1>
                            </div>
                        </div>
                        <div className=" lg:flex flex-wrap-reverse md:justify-between md:ml-60 xl:ml-[290px]">
                            {showCalendar && (
                                <div className=" lg:w-3/4 p-2 overflow-y-hidden ">
                                    <div>
                                        {/* tags that display your calendar */}
                                        <div className="text-center font-inter font-semibold text-base md:text-lg my-2">Your calendar</div>
                                    </div>
                                    <Calendar
                                        localizer={localizer}
                                        events={events}
                                        startAccessor="start"
                                        endAccessor="end"
                                        style={{ height: `550px` }}
                                        selectable
                                        onSelectSlot={handleDateClick}
                                        onSelectEvent={handleEventClick}
                                        className='bg-white rounded-lg shadow-md font-inter font-semibold text-xs md:text-sm '
                                        components={{
                                            dateCellWrapper: CustomDateCellWrapper,
                                        }}
                                        
                                    />
                                </div>
                            )}

                            <div className="w-full lg:w-[25%] p-4 rounded">
                                <h2 className="text-base md:text-lg font-inter font-semibold mb-4">Select Time Slot</h2>

                                <div className="date ">
                                    <div className='text-sm font-inter font-semibold my-1 mx-1'> Selected Date</div>
                                    <DatePicker
                                        selected={selectedDate}
                                        onChange={handleDateChange}
                                        dateFormat="dd/MM/yyyy"
                                        minDate={moment().toDate()}
                                        className="mb-2 p-2 font-inter font-semibold border border-gray-300 rounded-xl w-3/4"
                                    />
                                </div>
                                {timeSlots.length === 0 ? <div className="text-sm font-inter font-semibold my-1 mx-2">No time slots available for selected date</div> : null}
                                <div className="grid grid-cols-2 gap-2">
                                    {timeSlots.map((time) => (
                                        <button
                                            key={time}
                                            onClick={() => handleTimeClick(time)}
                                            className={`p-2   border-[1.5px] border-blue-gray-100 rounded-xl text-sm md:text-base font-inter font-semibold hover:text-white hover:bg-blue-700 focus:outline-none cursor-pointer transition-colors duration-300 ease-in-out ${selectedTime === time ? 'bg-blue-800 text-white' : 'border-blue-400 text-blue-400'
                                                }`}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => handleCreateOrder(1000, 'INR')}
                                    className="bg-blue-500 text-white px-4 py-2 rounded-xl mt-4 hover:bg-blue-600 focus:outline-none transition-colors duration-300 ease-in-out font-inter font-semibold text-sm md:text-base"
                                >
                                    {bookLoading ?
                                        <div className="flex items-center justify-center text-sm md:text-base">
                                            <div className="w-4 h-4 border-2 border-t-white rounded-full animate-spin"></div>
                                            <span className="ml-2">Booking...
                                            </span>
                                        </div>
                                        :
                                        "Book Schedule"}
                                </button>
                            </div>

                            {selectedEvent && showModal && (
                                <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-40">


                                    <div className="bg-white p-4 md:p-6 rounded-2xl w-10/12 md:w-1/2 lg:w-1/3 max-h-full max-w-sm space-y-2  border-2 border-y-gray-500">
                                        <h2 className="text-xl md:text-2xl font-inter font-bold mb-4">Interview Details</h2>

                                        <p className='text-sm md:text-base font-inter font-semibold text-gray-700'>Title: {selectedEvent.title}</p>
                                        <p className='text-sm md:text-base font-inter font-semibold text-gray-700'>Starts At: {moment(selectedEvent.start).format('DD-MM-YYYY HH:mm')}</p>
                                        <p className='text-sm md:text-base font-inter font-semibold text-gray-700'>Ends At: {moment(selectedEvent.end).format('DD-MM-YYYY HH:mm')}</p>

                                        <p className='text-sm md:text-base font-inter mb-4 font-semibold text-gray-700'>Interview Link: <a className='underline underline-offset-1 text-blue-800' href={selectedEvent.meeting_link} target="_blank" rel="noopener noreferrer">Meet Link</a></p>

                                        <div className="flex justify-end">
                                            <button onClick={handleClosePopup} className="mt-2 text-sm md:text-base bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 focus:outline-none transition-colors duration-300 ease-in-out font-inter font-semibold">
                                                Close
                                            </button>
                                        </div>

                                    </div>
                                </div>
                            )}
                        </div>
                    </div> : null
    );
};

export default Calendar_Comp;
