import React, { useState } from 'react'
import { Slider, Col, Row } from 'antd'
import { connect, ConnectedProps } from 'react-redux'
import { RootState } from 'App'
import { selectTimeSlot } from 'reducers/bookings'
import moment from 'moment'

type PropsFromRedux = ConnectedProps<typeof connector>

const TimeSlider = (props: PropsFromRedux) => {
  const [timeSlot, setTimeSlot] = useState(props.selectedTimeSlot)
  const formatter: any = (value: number) => {
    return moment('800', 'Hmm')
      .add(value * 30, 'minutes')
      .format('hh:mm a')
  }
  const handleTimeChange = (value: any) => {
    setTimeSlot(value)
    props.selectTimeSlot(value)
  }

  return (
    <Row justify="center" align="middle">
      <Col span={2}>
        <span style={{ whiteSpace: 'nowrap' }}>8 am</span>
      </Col>
      <Col span={12}>
        <Slider
          min={0}
          max={21}
          step={1}
          included={false}
          onChange={handleTimeChange}
          value={timeSlot}
          tipFormatter={formatter}
        />
      </Col>
      <Col span={2}>
        <span style={{ whiteSpace: 'nowrap' }}>6:30 pm</span>
      </Col>
    </Row>
  )
}

const mapState = (state: RootState) => ({
  selectedTimeSlot: state.bookings.selectedTimeSlot
})

const mapDispatch = {
  selectTimeSlot
}

const connector = connect(mapState, mapDispatch)
export default connector(TimeSlider)
