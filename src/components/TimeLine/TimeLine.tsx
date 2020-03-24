import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { RootState } from 'App';
import { selectTimeSlot } from 'reducers/bookings';

import './TimeLine.css';

interface TimeLineProps {
    bookingSlots: number
}

type PropsFromRedux = TimeLineProps & ConnectedProps<typeof connector>

const TimeLine = (props: PropsFromRedux) => {
    return (
        <>
            <div className="busyTimeline">
                {props.usedSlots.map((isBusy, index) => {
                    const selectedSlotClass = (Number(props.selectedTimeSlot) + Number(props.bookingSlots)) > index && props.selectedTimeSlot <= index  ? 'selectedSlot': '';
                    const busyClass = isBusy? 'busy' : 'notBusy';
                    return <div key={index} className={`slot ${selectedSlotClass} ${busyClass} `}>&nbsp;</div>;
                })
                }
            </div>
            <div className="busyTimelineLabel">
                {['8a.m.', '9a.m.', '10a.m.', '11a.m.', '12a.m.', '1p.m.', '2p.m.', '3p.m.', '4p.m.', '5p.m.', '6p.m.'].map((time, index) =>  <div className="time" key={index}>&nbsp;{time}</div>)
                }
            </div>
        </>
    )
}

const mapState = (state: RootState) => ({
    selectedTimeSlot: state.bookings.selectedTimeSlot,
    usedSlots: state.bookings.usedSlots
})

const mapDispatch = {
    selectTimeSlot
}

const connector = connect(mapState, mapDispatch)
export default connector(TimeLine);
