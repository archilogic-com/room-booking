import React, { useEffect, useState } from 'react';
import { Col, Row } from 'antd';
import moment, { Moment } from 'moment';
import { connect, ConnectedProps } from 'react-redux';
import { Button, DatePicker } from "antd";
import { RootState } from "App";
import { selectDate } from 'reducers/bookings';

export const DATE_FORMAT = 'MM/DD/YYYY';

type PropsFromRedux = ConnectedProps<typeof connector>

const DaySelect = (props: PropsFromRedux) => {
    const [date, setDate] = useState<Moment | null>(props.initialDate)

    useEffect(() => {
        props.selectDate(date)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date])

    return (
        <Row justify="center" gutter={[10,10]}>
            <Col >
                <Button onClick={() => setDate(moment())} >Today</Button>
            </Col>
            <Col >
                <Button onClick={() => setDate(moment().add(1, "days"))}  >Tomorow</Button>
            </Col>
            <Col >
                <DatePicker onChange={value => setDate(value)} value={date} format={DATE_FORMAT} />
            </Col>
        </Row>
    )
}

const mapState = (state: RootState) => ({
    initialDate: state.bookings.selectedDate
})

const mapDispatch = {
    selectDate
}

const connector = connect(mapState, mapDispatch)
export default connector(DaySelect);
