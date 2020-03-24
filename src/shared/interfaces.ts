import { Moment } from "moment";

export interface Booking {
    key: string,
    date: Moment,
    firstName : string,
    lastName : string,
    email : string,
    selectedTimeSlotStart: number,
    duration: number,
    spaceId: string | undefined
}

export interface FormInitialValues {
    firstName : string,
    lastName : string,
    email : string,
    duration: number
}

export interface Space {
    id: string, 
    node: any,
    usage: string
}