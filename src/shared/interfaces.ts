import { Moment } from 'moment'

export interface Booking {
  type: 'desk' | 'room'
  key: string
  date: Moment
  firstName: string
  lastName: string
  email: string
  selectedTimeSlotStart: number
  duration: number
  itemId: string | undefined
}

export interface FormInitialValues {
  firstName: string
  lastName: string
  email: string
  duration: number
}

export interface Asset {
  id: string
  node: any
  subCategories?: string[]
  categories?: string[]
  tags?: string[]
  productId: string
}

export type AssetsById = Record<string, Asset>
export interface BookableRoom {
  type: 'room'
  id: string
  node: any
  usage: string
  usageName?: string
  program?: string
  assets: string[]
  details: BookableRoomDetails
  customId?: string
}
export interface BookableRoomDetails {
  zoomCallSupported?: boolean
  assetMap?: any
}

export interface BookableDesk extends Asset {
  type: 'desk'
  subCategories: ['desk']
}

export type Item = BookableDesk | BookableRoom
