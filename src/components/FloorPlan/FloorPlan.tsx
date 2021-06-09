import React, { useEffect } from 'react';
import { connect, ConnectedProps } from 'react-redux'
import { RootState } from 'App';
import { fetchBookingFromSpaces, selectSpace, setSpaces } from 'reducers/bookings'
import { Space } from 'shared/interfaces';

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
};

interface FloorPlanProps {
    sceneId: string
}

type PropsFromRedux = FloorPlanProps & ConnectedProps<typeof connector>

const FloorPlan = (props: PropsFromRedux) => {
    // when sceneId is ready
    useEffect(() => {
        const container = document.getElementById('floorplan')
        const publishableToken = process.env.REACT_APP_PUBLISHABLE_TOKEN
        const fp = new FloorPlanEngine(container, floorPlanStartupSettings)
        fp.loadScene(props.sceneId, { publishableToken }).then(() => {
            props.setSpaces(fp.resources.spaces)
            onSpacesLoaded(fp.resources.spaces)

            fp.on('click', (event: any) => onRoomClick(event, fp));
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.sceneId]);

    // Repaint Spaces
    useEffect(() => {
        props.spaces.forEach((space: Space) => {
            fillSpaceWithColor(space, undefined)
        });
        
        
        props.spaces.filter(space => space.usage === "meet" || space.usage === "meetingRoom").forEach(space => {
            if (props.usedSpaces.includes(space)) {
                fillSpaceWithColor(space, colorMap.red);
            } else {
                fillSpaceWithColor(space, colorMap.green);
            }
            if (props.selectedSpace){
                fillSpaceWithColor(props.selectedSpace, colorMap.lightBlue);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.usedSpaces, props.selectedSpace])

    const onRoomClick = (event: any, floorPlan: any) => {
        const { spaces } = floorPlan.getResourcesFromPosition(event.pos);
        if (spaces.length === 0) return;
        props.selectSpace(spaces[0]);
    }
    

    const onSpacesLoaded = (spaces: Space[]) => {
        props.fetchBookingFromSpaces(props.sceneId, spaces)
    }

    const fillSpaceWithColor = (space: Space, color?: number[]) => {
        if (space === undefined) {
            return
        }
        if (!space.node) {
            return
        }
        space.node.setHighlight({
            fill: color
        });
    }

    return (<div id="floorplan" style={{ height: '100%', width: '100%' }}></div>)

}
const mapState = (state: RootState) => ({
    spaces: state.bookings.spaces,
    usedSpaces: state.bookings.usedSpaces,
    selectedSpace: state.bookings.selectedSpace
})

const mapDispatch = {
    setSpaces,
    selectSpace,
    fetchBookingFromSpaces
}



const connector = connect(mapState, mapDispatch)
export default connector(FloorPlan);
