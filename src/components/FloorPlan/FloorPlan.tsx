import React, { useEffect } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { RootState } from 'App'
import { fetchBookingFromItems, selectItem, setItems, setAssetsById } from 'reducers/bookings'
import {
  AssetsById,
  BookableDesk,
  Item,
  BookableRoom,
  Asset,
  BookableRoomDetails
} from 'shared/interfaces'

declare var FloorPlanEngine: any

const floorPlanStartupSettings = {
  hideElements: [],
  panZoom: true,
  planRotation: 0,
  roomStampSize: null,
  ui: {
    menu: false,
    scale: false,
    coordinates: false
  },
  theme: {
    background: {
      color: '#f3f5f8',
      showGrid: false
    },
    wallContours: false,
    elements: {
      roomstamp: { showArea: false }
    }
  },
  units: {
    system: 'metric',
    digits: 0,
    roomDimensions: 'area'
  }
}

const colorMap = {
  red: [241, 102, 100],
  green: [121, 204, 205],
  blue: [0, 100, 255],
  lightBlue: [207, 238, 253]
}

interface FloorPlanProps {
  sceneId: string
}

type PropsFromRedux = FloorPlanProps & ConnectedProps<typeof connector>

const isBookableRoom = (
  maybeBookableRoom: BookableRoom | any
): maybeBookableRoom is BookableRoom => {
  return maybeBookableRoom.program === 'meet' || maybeBookableRoom.usage === 'focusRoom'
}

const isBookableDesk = (maybeBookableAsset: Asset): maybeBookableAsset is BookableDesk => {
  return Boolean(maybeBookableAsset.subCategories?.includes('desk'))
}

const isSpaceWithBookableDesks = (space: BookableRoom): boolean => {
  return space.usage === 'openWorkspace'
}

export const isBookableItem = (maybeItem: Item | any): boolean => {
  return isBookableRoom(maybeItem) || isBookableDesk(maybeItem)
}

const getBookableRoomDetails = (
  space: BookableRoom,
  assetsById: AssetsById
): BookableRoomDetails => {
  const details: BookableRoomDetails = {
    tableCount: 0,
    tvCount: 0,
    seatCount: 0,
    whiteboardCount: 0,
    zoomCallSupported: false
  }

  for (const assetId of space.assets) {
    const asset = assetsById[assetId]
    const categories = asset.categories || []
    const tags = asset.tags || []
    switch (true) {
      case categories.includes('seating'):
        details.seatCount++
        break
      case categories.includes('tables'):
        details.tableCount++
        break
      case tags.includes('tv'):
        details.tvCount++
        break
      case tags.includes('whiteboard'):
        details.whiteboardCount++
        break
    }
  }

  return details
}

const getBookableItems = ({ spaces, assetsById }: { spaces: any[]; assetsById: AssetsById }) => {
  const BookableRooms: BookableRoom[] = []
  const bookableDesks: BookableDesk[] = []

  for (const space of spaces) {
    if (isBookableRoom(space)) {
      BookableRooms.push({
        ...space,
        type: 'room',
        details: getBookableRoomDetails(space, assetsById)
      })
    }
    if (isSpaceWithBookableDesks(space)) {
      for (const assetId of space.assets) {
        const maybeDesk = assetsById[assetId]
        if (isBookableDesk(maybeDesk)) {
          bookableDesks.push({ ...maybeDesk, type: 'desk' })
        }
      }
    }
  }
  return [...BookableRooms, ...bookableDesks]
}

const FloorPlan = (props: PropsFromRedux) => {
  // when sceneId is ready
  useEffect(() => {
    const container = document.getElementById('floorplan')
    const publishableToken = process.env.REACT_APP_PUBLISHABLE_TOKEN
    const fp = new FloorPlanEngine(container, floorPlanStartupSettings)
    fp.loadScene(props.sceneId, { publishableToken }).then(() => {
      const { spaces = [], assets = [] } = fp.resources
      const assetsById = Object.fromEntries(assets.map((asset: any) => [asset.id, asset]))
      const items = getBookableItems({ spaces, assetsById })

      props.setAssetsById(assetsById)
      props.setItems(items)

      onItemsLoaded(items)

      fp.on('click', (event: any) => onRoomClick(event, fp, items))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.sceneId])

  // Repaint Items
  useEffect(() => {
    props.items.forEach((item: Item) => {
      fillItemWithColor(item, undefined)
    })

    props.items.forEach(item => {
      if (props.usedItems.includes(item)) {
        fillItemWithColor(item, colorMap.red)
      } else {
        fillItemWithColor(item, colorMap.green)
      }
      if (props.selectedItem) {
        fillItemWithColor(props.selectedItem, colorMap.lightBlue)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.usedItems, props.selectedItem])

  const onRoomClick = (event: any, floorPlan: any, items: any[]) => {
    const { spaces = [], assets = [] } = floorPlan.getResourcesFromPosition(event.pos)

    const selectedAsset = assets[0]
    const selectedSpace = spaces[0]

    const nextSelected = items.find(item => {
      return selectedAsset?.id === item.id || selectedSpace?.id === item.id
    }) as Item

    if (nextSelected) {
      props.selectItem(nextSelected)
    }
  }

  const onItemsLoaded = (items: Item[]) => {
    props.fetchBookingFromItems(props.sceneId, items)
  }

  const fillItemWithColor = (item: Item, color?: number[]) => {
    if (item === undefined) {
      return
    }
    if (!item.node) {
      return
    }
    item.node.setHighlight({
      fill: color
    })
  }

  return <div id="floorplan" style={{ height: '100%', width: '100%' }}></div>
}
const mapState = (state: RootState) => ({
  items: state.bookings.items,
  usedItems: state.bookings.usedItems,
  selectedItem: state.bookings.selectedItem
})

const mapDispatch = {
  setAssetsById,
  setItems,
  selectItem,
  fetchBookingFromItems
}

const connector = connect(mapState, mapDispatch)
export default connector(FloorPlan)
