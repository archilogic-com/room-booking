import React, { useEffect, useLayoutEffect, useState } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import FloorPlan from 'components/FloorPlan/FloorPlan'
import './App.css'
import { Modal } from 'antd'

import TimeLine from 'components/TimeSlider/TimeSlider'
import DaySelect from 'components/DaySelect/DaySelect'
import { BookingsState, initBookings, selectSpace, unSelectSpace } from 'reducers/bookings'
import axios from 'axios'

import BookForm from 'components/BookForm/BookForm'
import { FloorState, fetchFloor } from 'reducers/floor'

type PropsFromRedux = ConnectedProps<typeof connector>

const App = (props: PropsFromRedux) => {
  const [isBookRoomModalVisible, setIsBookRoomModalVisible] = useState<boolean>(false)
  const [sceneId, setSceneId] = useState<any>()
  const [token, setToken] = useState<string>()

  useLayoutEffect(() => {
    // get temporary token
    let tempToken: null | string = null
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/temp-token`).then(response => {
      tempToken = response?.data?.authorization
      if (!tempToken) return

      setToken(tempToken)

      axios.interceptors.request.use(
        config => {
          config.params = config.params || {}

          if (tempToken) {
            config.headers.common['Authorization'] = tempToken
          }
          return config
        },
        error => {
          console.error(error)
          return Promise.reject(error)
        }
      )
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!token) return
    const urlParams = new URLSearchParams(window.location.search)
    const scene = urlParams.get('sceneId')
    const demoSceneId = scene || 'b6aa6096-bb77-4872-be25-4886a9e5bf06'
    setSceneId(demoSceneId)
  }, [token])

  useEffect(() => {
    if (!sceneId) return
    props.fetchFloor(sceneId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId])

  useEffect(() => {
    if (!props.selectedSpace) return
    setIsBookRoomModalVisible(true)
  }, [props.selectedSpace])

  useEffect(() => {
    if (isBookRoomModalVisible === false) props.unSelectSpace()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBookRoomModalVisible])

  return (
    <div className="app">
      <div className="header">Room Booking - {props.floorName}</div>
      <div className="content">
        <DaySelect />
        <TimeLine />
        <div style={{ flex: 1 }}>{sceneId && <FloorPlan sceneId={sceneId} />}</div>
      </div>
      <Modal
        title="Book Room"
        visible={isBookRoomModalVisible}
        footer={null}
        onCancel={() => setIsBookRoomModalVisible(false)}>
        {isBookRoomModalVisible && (
          <BookForm onFinishCallback={() => setIsBookRoomModalVisible(false)} />
        )}
      </Modal>
    </div>
  )
}
export interface RootState {
  bookings: BookingsState
  floor: FloorState
}

const mapState = (state: RootState) => ({
  bookings: state.bookings,
  selectedSpace: state.bookings.selectedSpace,
  floorName: state.floor.name,
  usedSpaces: state.bookings.usedSpaces
})

const mapDispatch = {
  initBookings,
  selectSpace,
  fetchFloor,
  unSelectSpace
}

const connector = connect(mapState, mapDispatch)
export default connector(App)
