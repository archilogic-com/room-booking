import moment, { Moment } from 'moment'
import axios from 'axios'
import {
  INIT_BOOKINGS,
  SELECT_DATE,
  SELECT_TIME_SLOT,
  SELECT_ITEM,
  SET_ASSETS_BY_ID,
  SET_ITEMS,
  START_SAVE_BOOKING,
  END_SAVE_BOOKING,
  UNSELECT_ITEM
} from './actions'
import { Booking, Item, AssetsById } from 'shared/interfaces'
import { isBookableItem } from 'components/FloorPlan/FloorPlan'

export const SLOTS_COUNT = 22 // from 8 am to 7 pm

const getEndpoint = (roomOrDesk: 'room' | 'desk') => {
  return roomOrDesk === 'room' ? 'space' : 'asset'
}

interface Action {
  assetsById: AssetsById
  newBookingsList: Booking[]
  type: string
  items: Item[]
  bookings: Booking[]
  itemId: string
  booking: Booking
  newTimeSlot: number
  newDate: Moment
  item: Item
}

export interface BookingsState {
  assetsById: AssetsById
  items: Item[]
  bookings: Booking[]
  loading: boolean
  selectedDate: Moment
  selectedTimeSlot: number
  usedSlots: boolean[]
  selectedItem: Item | null
  usedItems: Item[]
}

const initialState: BookingsState = {
  assetsById: {},
  items: [],
  bookings: [],
  selectedDate: moment('1000', 'Hmm'),
  selectedTimeSlot: 3,
  loading: true,
  usedSlots: new Array(SLOTS_COUNT).fill(false),
  selectedItem: null,
  usedItems: []
}

const bookings = (state = initialState, action: Action) => {
  switch (action.type) {
    case SET_ASSETS_BY_ID:
      return {
        ...state,
        assetsById: action.assetsById
      }
    case SET_ITEMS:
      return {
        ...state,
        items: action.items
      }
    case INIT_BOOKINGS:
      return {
        ...state,
        bookings: action.bookings,
        usedItems: aggregateUsedItems(
          action.bookings,
          state.selectedDate,
          state.selectedTimeSlot,
          state.items
        ),
        loading: false
      }
    case SELECT_TIME_SLOT:
      return {
        ...state,
        selectedTimeSlot: action.newTimeSlot,
        selectedItem: null,
        usedItems: aggregateUsedItems(
          state.bookings,
          state.selectedDate,
          action.newTimeSlot,
          state.items
        )
      }
    case SELECT_DATE:
      if (action.newDate == null) return state

      return {
        ...state,
        selectedDate: action.newDate,
        selectedItem: null,
        usedItems: aggregateUsedItems(
          state.bookings,
          action.newDate,
          state.selectedTimeSlot,
          state.items
        )
      }
    case SELECT_ITEM:
      if (!isBookableItem(action.item)) return state
      return {
        ...state,
        selectedItem: action.item,
        usedSlots: aggregateUsedSlots(state.bookings, state.selectedDate, action.item)
      }
    case UNSELECT_ITEM:
      return {
        ...state,
        selectedItem: undefined,
        usedSlots: new Array(SLOTS_COUNT).fill(false)
      }
    case END_SAVE_BOOKING:
      return {
        ...state,
        bookings: action.newBookingsList,
        usedItems: aggregateUsedItems(
          action.newBookingsList,
          state.selectedDate,
          state.selectedTimeSlot,
          state.items
        ),
        selectedItem: null,
        loading: false
      }
    default:
      return state
  }
}

export const setAssetsById = (assetsById: AssetsById) => {
  return { type: SET_ASSETS_BY_ID, assetsById }
}

export const setItems = (items: Item[]) => {
  return { type: SET_ITEMS, items }
}

export const initBookings = (bookings: Booking[]) => {
  return { type: INIT_BOOKINGS, bookings }
}

// extract booking data from each item
export const fetchBookingFromItems = (floorId: string, items: Item[]) => (dispatch: any) => {
  return Promise.all([
    axios.get(`/v2/${getEndpoint('desk')}?floorId=${floorId}&includeCustomFields=true`),
    axios.get(`/v2/${getEndpoint('room')}?floorId=${floorId}&includeCustomFields=true`)
  ])
    .then(([assets, floors]) => {
      const bookings = [...assets.data.features, ...floors.data.features]
        .flatMap((feature: any) => {
          if (feature.properties.customFields && feature.properties.customFields.bookings) {
            return feature.properties.customFields.bookings.bookings.map((booking: Booking) => {
              booking['itemId'] = feature.id
              booking['date'] = moment(booking.date)
              booking['type'] = feature.resourceType === 'Space' ? 'room' : 'desk'
              return booking
            })
          }
        })
        .filter((data: any[]) => data !== undefined)
      dispatch(initBookings(bookings))
    })
    .catch(error => {
      console.error(error)
    })
}

export const selectDate = (newDate: Moment | null) => {
  return { type: SELECT_DATE, newDate }
}

export const selectTimeSlot = (newTimeSlot: number) => {
  return { type: SELECT_TIME_SLOT, newTimeSlot }
}

export const selectItem = (item: Item) => {
  return { type: SELECT_ITEM, item }
}

export const unSelectItem = () => {
  return { type: UNSELECT_ITEM }
}

// calculate time-slots available for a specific item in a day
const aggregateUsedSlots = (
  bookings: Booking[],
  dateSelected: Moment,
  selectedItem: Item | null
) => {
  if (dateSelected == null) {
    return new Array(SLOTS_COUNT).fill(false)
  }
  const bookingsOfDay = bookings.filter(
    (booking: Booking) =>
      booking.date.isSame(dateSelected, 'day') && selectedItem && booking.itemId === selectedItem.id
  )
  return new Array(SLOTS_COUNT).fill(false).map((slot, index) => {
    const slotTime = dateSelected
      .startOf('day')
      .add(8, 'hours')
      .add(index * 30, 'minutes')
      .add(5, 'minutes')
    const bookingFound = bookingsOfDay.find((eachBooking: Booking) => {
      const eachBookingStartTime = eachBooking.date
      const durationInMinutes = eachBooking.duration * 30
      const eachBookingEndTime = eachBookingStartTime
        .clone()
        .add(durationInMinutes.toString(), 'minutes')

      return (
        eachBookingStartTime.isBefore(slotTime, 'minutes') &&
        eachBookingEndTime.isAfter(slotTime, 'minutes')
      )
    })
    return bookingFound !== undefined
  })
}

// calculate used items at a specific moment
const aggregateUsedItems = (
  bookings: Booking[],
  dateSelected: Moment,
  selectedTimeSlot: number,
  items: Item[]
) => {
  if (dateSelected == null) {
    return []
  }
  const bookingsOfDay = bookings.filter((booking: Booking) =>
    booking.date.isSame(dateSelected, 'day')
  )

  const currentSlotTime = dateSelected
    .startOf('day')
    .add(8, 'hours')
    .add(selectedTimeSlot * 30, 'minutes')
    .add(5, 'minutes')
  const bookingsOfSlot = bookingsOfDay.filter((eachBooking: Booking) => {
    const eachBookingStartTime = eachBooking.date
      .startOf('day')
      .add(8, 'hours')
      .add(eachBooking.selectedTimeSlotStart * 30, 'minutes')
    const durationInMinutes = eachBooking.duration * 30
    const eachBookingEndTime = eachBookingStartTime
      .clone()
      .add(durationInMinutes.toString(), 'minutes')

    return (
      eachBookingStartTime.isBefore(currentSlotTime, 'minutes') &&
      eachBookingEndTime.isAfter(currentSlotTime, 'minutes')
    )
  })
  const bookingsOfSlotIDs = bookingsOfSlot.map(booking => booking.itemId)

  return items.filter(item => bookingsOfSlotIDs.includes(item.id))
}

export const startSaveBooking = () => {
  return { type: START_SAVE_BOOKING }
}

export const endSaveBooking = (newBookingsList: Booking[]) => {
  return { type: END_SAVE_BOOKING, newBookingsList }
}

export const saveBooking = (newBooking: Booking, bookings: Booking[]) => (dispatch: any) => {
  dispatch(startSaveBooking())

  const newBookingsList: Booking[] = [...bookings, newBooking]
  const newBookingsListForItem: Booking[] = newBookingsList.filter(
    booking => booking.itemId === newBooking.itemId
  )

  axios
    .put(
      `/v2/${getEndpoint(newBooking.type)}/${
        newBooking.itemId
      }/custom-field/properties.customFields.bookings`,
      {
        bookings: newBookingsListForItem
      }
    )
    .then((response: any) => {
      dispatch(endSaveBooking(newBookingsList))
    })
}

export const updateBooking = (updatedBooking: Booking, bookings: Booking[]) => (dispatch: any) => {
  dispatch(startSaveBooking())

  const newBookingsList: Booking[] = bookings
    .filter(booking => booking.key !== updatedBooking.key)
    .concat(updatedBooking)
  const newBookingsListForItem: Booking[] = newBookingsList.filter(
    booking => booking.itemId === updatedBooking.itemId
  )

  axios
    .put(
      `/v2/${getEndpoint(updatedBooking.type)}/${
        updatedBooking.itemId
      }/custom-field/properties.customFields.bookings`,
      {
        bookings: newBookingsListForItem
      }
    )
    .then((response: any) => {
      dispatch(endSaveBooking(newBookingsList))
    })
}

export const deleteBooking = (removeBooking: Booking, bookings: Booking[]) => (dispatch: any) => {
  dispatch(startSaveBooking())

  const newBookingsList: Booking[] = bookings.filter(booking => booking.key !== removeBooking.key)
  const newBookingsListForItem: Booking[] = newBookingsList.filter(
    booking => booking.itemId === removeBooking.itemId
  )

  axios
    .put(
      `/v2/${getEndpoint(removeBooking.type)}/${
        removeBooking.itemId
      }/custom-field/properties.customFields.bookings`,
      {
        bookings: newBookingsListForItem
      }
    )
    .then((response: any) => {
      dispatch(endSaveBooking(newBookingsList))
    })
}

export default bookings
