import React, { useState } from 'react'
import { Row, Col, Button, Form, Radio, Input, Divider, Modal } from 'antd'
import { DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import moment from 'moment'
import TimeLine from 'components/TimeLine/TimeLine'
import { connect, ConnectedProps } from 'react-redux'
import { saveBooking, updateBooking, deleteBooking } from 'reducers/bookings'
import { RootState } from 'App'
import { Booking, FormInitialValues, BookableRoom, AssetsById } from 'shared/interfaces'
import { v4 as uuidv4 } from 'uuid'

interface BookFormProps {
  onFinishCallback: Function
}

type PropsFromRedux = BookFormProps & ConnectedProps<typeof connector>

const RoomDetails = ({ room, assetsById }: { room: BookableRoom; assetsById: AssetsById }) => {
  const displayAssets = Object.entries(room.details.assetMap)

  return (
    <>
      <Row style={{ display: 'flex', flexDirection: 'column' }}>
        <h4 style={{ marginBottom: '0' }}>Room details</h4>
        {room.usageName && <div>{room.usageName}</div>}
        {room.customId && <div>{room.customId}</div>}
      </Row>
      <Row>
        <ul
          style={{
            paddingInlineStart: '1rem'
          }}
        >
          {displayAssets &&
            displayAssets.map(([key, assets]) => (
              <li key={key}>
                {(assets as any).length}x {(assets as any)[0].name}
              </li>
            ))}
        </ul>
      </Row>
    </>
  )
}

const BookForm = (props: PropsFromRedux) => {
  let existingBooking: Booking | null = null

  // calculate max available time
  let maxBookingSize = 1
  if (props.usedSlots[props.selectedSlot + 1] === false) {
    maxBookingSize = 2
    if (props.usedSlots[props.selectedSlot + 2] === false) maxBookingSize = 3
  }

  // show only buttons for the available time
  let bookingOptionElements = []
  for (let bookingOpts = 1; bookingOpts <= maxBookingSize; bookingOpts++) {
    bookingOptionElements.push(
      <Radio.Button
        key={bookingOpts}
        onClick={() => setBookingSlotsNumber(bookingOpts)}
        value={bookingOpts}
      >
        {bookingOpts * 30} Minutes
      </Radio.Button>
    )
  }

  // on save or update
  const handleSubmit = (values: any) => {
    const itemId = props.selectedItem?.id
    const date = moment(props.selectedDate)
    const selectedTimeSlotStart = props.selectedSlot

    if (existingBooking) {
      const key = existingBooking.key
      props.updateBooking({ ...values, itemId, key, date, selectedTimeSlotStart }, props.bookings)
    } else {
      const key = uuidv4()
      props.saveBooking({ ...values, itemId, key, date, selectedTimeSlotStart }, props.bookings)
    }
    props.onFinishCallback()
  }

  function showConfirm() {
    const { confirm } = Modal
    confirm({
      title: 'Do you want to delete this item?',
      icon: <ExclamationCircleOutlined />,
      content: 'The operation cannot be undone',
      onOk() {
        handleDeleteConfirmed()
      },
      onCancel() {}
    })
  }

  // on delete confirm
  const handleDeleteConfirmed = () => {
    props.deleteBooking(existingBooking!, props.bookings)
    props.onFinishCallback()
  }

  // Update or a Create form initial values
  let formValues: FormInitialValues = {
    duration: 1,
    firstName: '',
    lastName: '',
    email: ''
  }

  if (props.selectedItem && props.usedItems.includes(props.selectedItem)) {
    const selectedItemId = props.selectedItem.id
    const booking = props.bookings.find(
      booking =>
        booking.itemId === selectedItemId &&
        booking.date.isSame(props.selectedDate, 'day') &&
        booking.selectedTimeSlotStart <= props.selectedSlot &&
        booking.selectedTimeSlotStart + booking.duration > props.selectedSlot
    )
    if (booking !== undefined) {
      existingBooking = booking
      const { duration, firstName, lastName, email } = booking
      formValues = { duration: duration, firstName, lastName, email }
    }
  } else {
    formValues = {
      duration: maxBookingSize,
      firstName: '',
      lastName: '',
      email: ''
    }
  }

  // select by default the maximum bookable time
  const [bookingSlotsNumber, setBookingSlotsNumber] = useState<number>(
    existingBooking ? existingBooking.duration : maxBookingSize
  )

  return (
    <>
      {props.selectedItem?.type === 'room' && (
        <RoomDetails room={props.selectedItem} assetsById={props.assetsById} />
      )}
      <Row justify="space-between" align="bottom">
        <Col span={24}>
          <TimeLine bookingSlots={bookingSlotsNumber} />
        </Col>
      </Row>
      <Row justify="space-between" align="bottom">
        <Col>
          <Divider />
        </Col>
      </Row>
      <Row>
        <Col>
          <Form
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 14 }}
            layout="horizontal"
            initialValues={formValues as any}
            onFinish={handleSubmit}
          >
            <Form.Item
              label="First Name"
              name="firstName"
              rules={[{ required: true, message: 'Please input the First Name' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Last Name"
              name="lastName"
              rules={[{ required: true, message: 'Please input the Last Name' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, message: 'Please input Email Address' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item label="Booking Time" name="duration">
              <Radio.Group>{bookingOptionElements}</Radio.Group>
            </Form.Item>
            <Form.Item label="" wrapperCol={{ offset: 8, span: 20 }}>
              {existingBooking == null ? (
                <Button type="primary" htmlType="submit">
                  Save
                </Button>
              ) : (
                <>
                  <Button type="primary" htmlType="submit">
                    Update
                  </Button>
                  &nbsp;
                  <Button onClick={showConfirm} icon={<DeleteOutlined />}>
                    Delete
                  </Button>
                </>
              )}
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </>
  )
}

const mapState = (state: RootState) => ({
  assetsById: state.bookings.assetsById,
  bookings: state.bookings.bookings,
  selectedDate: state.bookings.selectedDate,
  selectedSlot: state.bookings.selectedTimeSlot,
  usedItems: state.bookings.usedItems,
  selectedItem: state.bookings.selectedItem,
  usedSlots: state.bookings.usedSlots
})

const mapDispatch = {
  saveBooking,
  updateBooking,
  deleteBooking
}

const connector = connect(mapState, mapDispatch)
export default connector(BookForm)
