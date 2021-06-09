import moment, { Moment } from 'moment'
import axios from 'axios'
import {
    INIT_BOOKINGS, SELECT_DATE, SELECT_TIME_SLOT, SELECT_SPACE, SET_SPACES, START_SAVE_BOOKING, END_SAVE_BOOKING, UNSELECT_SPACE
} from './actions'
import { Booking, Space } from 'shared/interfaces'

export const SLOTS_COUNT = 22; // from 8 am to 7 pm

interface Action {
    newBookingsList: Booking[]
    type: string,
    spaces: Space[],
    bookings: Booking[],
    spaceId: string,
    booking: Booking,
    newTimeSlot: number,
    newDate: Moment,
    space: Space,
}

export interface BookingsState {
    spaces: Space[],
    bookings: Booking[],
    loading: boolean,
    selectedDate: Moment,
    selectedTimeSlot: number,
    usedSlots: boolean[],
    selectedSpace: Space | null,
    usedSpaces: Space[]
}

const initialState: BookingsState = {
    spaces: [],
    bookings: [],
    selectedDate: moment('1000', 'Hmm'),
    selectedTimeSlot: 3,
    loading: true,
    usedSlots: new Array(SLOTS_COUNT).fill(false),
    selectedSpace: null,
    usedSpaces: []
}

const bookings = (state = initialState, action: Action) => {
    switch (action.type) {
        case SET_SPACES:
            return {
                ...state,
                spaces: action.spaces,
            }
        case INIT_BOOKINGS:
            return {
                ...state,
                bookings: action.bookings,
                usedSpaces: aggregateUsedSpaces(action.bookings, state.selectedDate, state.selectedTimeSlot, state.spaces),
                loading: false
            }
        case SELECT_TIME_SLOT:
            return {
                ...state,
                selectedTimeSlot: action.newTimeSlot,
                selectedSpace: null,
                usedSpaces: aggregateUsedSpaces(state.bookings, state.selectedDate, action.newTimeSlot, state.spaces)
            }
        case SELECT_DATE:
            if (action.newDate == null) return state

            return {
                ...state,
                selectedDate: action.newDate,
                selectedSpace: null,
                usedSpaces: aggregateUsedSpaces(state.bookings, action.newDate, state.selectedTimeSlot, state.spaces)

            }
        case SELECT_SPACE:
            if (action.space.usage !== "meet" && action.space.usage !== "meetingRoom") return state
            return {
                ...state,
                selectedSpace: action.space,
                usedSlots: aggregateUsedSlots(state.bookings, state.selectedDate, action.space),

            }
            case UNSELECT_SPACE:
                return {
                    ...state,
                    selectedSpace: undefined,
                    usedSlots: new Array(SLOTS_COUNT).fill(false)
                }
        case END_SAVE_BOOKING:
            return {
                ...state,
                bookings: action.newBookingsList,
                usedSpaces: aggregateUsedSpaces(action.newBookingsList, state.selectedDate, state.selectedTimeSlot, state.spaces),
                selectedSpace: null,
                loading: false
            }
        default:
            return state
    }
}

export const setSpaces = (spaces: Space[]) => {
    return { type: SET_SPACES, spaces }
}

export const initBookings = (bookings: Booking[]) => {
    return { type: INIT_BOOKINGS, bookings }
}

// extract booking data from each space
export const fetchBookingFromSpaces = (floorId: string, spaces: Space[]) => (dispatch: any) => {
    return axios.get(`/v2/space?floorId=${floorId}&includeCustomFields=true`).then(response => {
        const bookings = response.data.features.flatMap((feature: any) => {
            if (feature.properties.customFields && feature.properties.customFields.bookings) {
                console.log(feature.properties.customFields.bookings);
                

                return feature.properties.customFields.bookings.bookings.map((booking: Booking) => {
                    booking['spaceId'] = feature.id;
                    booking['date'] = moment(booking.date);
                    return booking;
                })
            }
        }).filter((data: any[]) => data !== undefined)
        dispatch(initBookings(bookings));
    }).catch(error => {
        console.log(error)
    })
}

export const selectDate = (newDate: Moment | null) => {
    return { type: SELECT_DATE, newDate }
}

export const selectTimeSlot = (newTimeSlot: number) => {
    return { type: SELECT_TIME_SLOT, newTimeSlot }
}

export const selectSpace = (space: Space) => {
    return { type: SELECT_SPACE, space }
}

export const unSelectSpace = () => {
    return { type: UNSELECT_SPACE }
}

// calculate time-slots available for a specific space in a day 
const aggregateUsedSlots = (bookings: Booking[], dateSelected: Moment, selectedSpace: Space | null) => {
    if (dateSelected == null) {
        return new Array(SLOTS_COUNT).fill(false);
    }
    const bookingsOfDay = bookings.filter((booking: Booking) => booking.date.isSame(dateSelected, "day") && selectedSpace && booking.spaceId === selectedSpace.id);
    return new Array(SLOTS_COUNT).fill(false).map((slot, index) => {
        const slotTime = dateSelected.startOf('day').add(8, 'hours').add(index * 30, 'minutes').add(5, "minutes");
        const bookingFound = bookingsOfDay.find((eachBooking: Booking) => {
            const eachBookingStartTime = eachBooking.date;
            const durationInMinutes = eachBooking.duration * 30;
            const eachBookingEndTime = eachBookingStartTime.clone().add(durationInMinutes.toString(), "minutes");

            return eachBookingStartTime.isBefore(slotTime, "minutes") && eachBookingEndTime.isAfter(slotTime, "minutes")
        });
        return bookingFound !== undefined;
    });
}

// calculate used spaces at a especific moment
const aggregateUsedSpaces = (bookings: Booking[], dateSelected: Moment, selectedTimeSlot: number, spaces: Space[]) => {
    if (dateSelected == null) {
        return [];
    }
    const bookingsOfDay = bookings.filter((booking: Booking) => booking.date.isSame(dateSelected, "day"));

    const currentSlotTime = dateSelected.startOf('day').add(8, 'hours').add(selectedTimeSlot * 30, 'minutes').add(5, "minutes");
    const bookingsOfSlot = bookingsOfDay.filter((eachBooking: Booking) => {
        const eachBookingStartTime = eachBooking.date.startOf('day').add(8, 'hours').add(eachBooking.selectedTimeSlotStart * 30, 'minutes');
        const durationInMinutes = eachBooking.duration * 30;
        const eachBookingEndTime = eachBookingStartTime.clone().add(durationInMinutes.toString(), "minutes");

        return eachBookingStartTime.isBefore(currentSlotTime, "minutes") && eachBookingEndTime.isAfter(currentSlotTime, "minutes");
    })
    const bookingsOfSlotIDs = bookingsOfSlot.map(booking => booking.spaceId);
    return spaces.filter(space => bookingsOfSlotIDs.includes(space.id));
}

export const startSaveBooking = () => {
    return { type: START_SAVE_BOOKING }
}

export const endSaveBooking = (newBookingsList: Booking[]) => {
    return { type: END_SAVE_BOOKING, newBookingsList }
}

export const saveBooking = (newBooking: Booking, bookings: Booking[]) => (dispatch: any) => {
    dispatch(startSaveBooking());
    let newBookingsList = bookings.filter(booking => booking.spaceId === newBooking.spaceId);

    newBookingsList.push(newBooking);

    axios.put(`/v2/space/${newBooking.spaceId}/custom-field/properties.customFields.bookings`, { bookings: newBookingsList }).then((response: any) => {
        dispatch(endSaveBooking(newBookingsList));
    });
}

export const updateBooking = (updatedBooking: Booking, bookings: Booking[]) => (dispatch: any) => {
    dispatch(startSaveBooking());
    let newBookingsList = bookings.filter(booking => booking.spaceId === updatedBooking.spaceId)
        .filter(booking => booking.key !== updatedBooking.key);

    newBookingsList.push(updatedBooking);

    axios.put(`/v2/space/${updatedBooking.spaceId}/custom-field/properties.customFields.bookings`, { bookings: newBookingsList }).then((response: any) => {
        dispatch(endSaveBooking(newBookingsList));
    });
}

export const deleteBooking = (removeBooking: Booking, bookings: Booking[]) => (dispatch: any) => {
    dispatch(startSaveBooking());
    let newBookingsList = bookings.filter(booking => booking.spaceId === removeBooking.spaceId)
        .filter(booking => booking.key !== removeBooking.key);

    axios.put(`/v2/space/${removeBooking.spaceId}/custom-field/properties.customFields.bookings`, { bookings: newBookingsList }).then((response: any) => {
        dispatch(endSaveBooking(newBookingsList));
    });
}

export default bookings