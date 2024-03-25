import { useEffect, useRef } from 'react';
import crypto from 'crypto-js';
import Axios from 'axios';
import showToast from '../../Utils/showToast';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Co2Sharp } from '@mui/icons-material';



// Function to load script and append in DOM tree.
const loadScript = src => new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
        console.log('razorpay loaded successfully');
        resolve(true);
    };
    script.onerror = () => {
        console.log('error in loading razorpay');
        resolve(false);
    };
    document.body.appendChild(script);
});


const RenderRazorpay = ({
    order,
    keyId,
    keySecret,
    setDisplayRazorpay,
    handleAddMeeting,
    instructorId,
    studentId,
    setGeneratingLink,
    setMeetingDetails,
    topic,
    startTime,
    eventGenerate
}) => {


    const paymentId = useRef(null);
    const paymentMethod = useRef(null);

    const params = useParams();

    const serverBaseUrl = process.env.REACT_APP_BASE_URL;

    // To load razorpay checkout modal script.
    const displayRazorpay = async (options) => {
        const res = await loadScript(
            'https://checkout.razorpay.com/v1/checkout.js',
        );

        if (!res) {
            console.log('Razorpay SDK failed to load. Are you online?');
            return;
        }
        // All information is loaded in options which we will discuss later.
        const rzp1 = new window.Razorpay(options);

        // If you want to retreive the chosen payment method.
        rzp1.on('payment.submit', (response) => {
            paymentMethod.current = response.method;
        });

        // To get payment id in case of failed transaction.
        rzp1.on('payment.failed', (response) => {
            paymentId.current = response.error.metadata.payment_id;
        });

        // to open razorpay checkout modal.
        rzp1.open();
    };


    // informing server about payment
    const handlePayment = async (status, orderDetails = {}) => {
        const response = await Axios.post(`${serverBaseUrl}/transactions/verify-payment`,
            {
                status,
                orderDetails,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'security-key': process.env.REACT_APP_SECURITY_KEY,
                    'auth-token': localStorage.getItem('token')
                }
            }
        );

        return response.data;
    };


    





    // we will be filling this object in next step.
    const options = {
        key: keyId, // key id from props
        amount: order.amount, // Amount in lowest denomination from props
        currency: order.currency, // Currency from props.
        name: "Interview Hub", // Title for your organization to display in checkout modal
        // image, // custom logo  url
        order_id: order.id, // order id from props
        // This handler menthod is always executed in case of succeeded payment
        handler: async (response) => {
            console.log('succeeded');
            console.log(response);
            paymentId.current = response.razorpay_payment_id;

            // Most important step to capture and authorize the payment. This can be done of Backend server.
            const generated_signature = crypto.HmacSHA256(`${order.id}|${paymentId.current}`, keySecret).toString();
            console.log({ generated_signature })
            const succeeded = generated_signature === response.razorpay_signature;
            
            setDisplayRazorpay(false);
            

            // If successfully authorized. Then we can consider the payment as successful.
            if (succeeded) {
                showToast({
                    type: 'success',
                    msg: 'Payment Successful',
                    duration: 4000,
                })

                setGeneratingLink(true);
                const newEvent = eventGenerate();

                console.log('new event', newEvent);

                const response2 = await handlePayment('succeeded', {
                    orderId: order.id,
                    paymentId:paymentId.current,
                    signature: response.razorpay_signature,
                    studentId: studentId,
                    instructorId: instructorId,
                    transactionId: order.transactionId,
                    topic: topic,
                    startTime: startTime,
                    duration: 60,
                    newEvent: newEvent
                });
                setGeneratingLink(false);
                
                setMeetingDetails(response2.meeting);

                handleAddMeeting();
            } else {
                handlePayment('failed', {
                    orderId: order.id,
                    paymentId: response.razorpay_payment_id,
                });
            }
        },
        modal: {
            confirm_close: true, // this is set to true, if we want confirmation when clicked on cross button.
            // This function is executed when checkout modal is closed
            // There can be 3 reasons when this modal is closed.
            ondismiss: async (reason) => {
                setDisplayRazorpay(false);
                const {
                    reason: paymentReason, field, step, code,
                } = reason && reason.error ? reason.error : {};
                // Reason 1 - when payment is cancelled. It can happend when we click cross icon or cancel any payment explicitly. 
                if (reason === undefined) {
                    showToast({
                        type: 'error',
                        msg: 'Payment Cancelled',
                        duration: 4000,
                    });
                    handlePayment('Cancelled');
                }
                // Reason 2 - When modal is auto closed because of time out
                else if (reason === 'timeout') {
                    showToast({
                        type: 'error',
                        msg: 'Payment Timed Out',
                        duration: 4000,
                    });
                    handlePayment('timedout');
                }
                // Reason 3 - When payment gets failed.
                else {
                    showToast({
                        type: 'error',
                        msg: 'Payment Failed',
                        duration: 4000,
                    });
                    handlePayment('failed', {
                        paymentReason, field, step, code,
                    });
                }
            },
        },
        // This property allows to enble/disable retries.
        // This is enabled true by default. 
        retry: {
            enabled: false,
        },
        timeout: 900, // Time limit in Seconds
        theme: {
            color: "", // Custom color for your checkout modal.
        },
    };

    useEffect(() => {
        console.log('in razorpay');
        displayRazorpay(options);
    }, []);

    return null;
};

export default RenderRazorpay;