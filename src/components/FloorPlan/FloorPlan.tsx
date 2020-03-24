import React, { useEffect } from 'react';
import { connect, ConnectedProps } from 'react-redux'
import { RootState } from 'App';
import { fetchBookingFromSpaces, selectSpace, setSpaces } from 'reducers/bookings'
import { Space } from 'shared/interfaces';

declare var FloorPlanEngine: any

const floorPlanStartupSettings = {
    hideElements: [],
    panZoom: true,
    planRotation: 180,
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
        const fp = new FloorPlanEngine(container, floorPlanStartupSettings)
        fp.loadScene(props.sceneId).then(() => {
            props.setSpaces(fp.state.computed.spaces)
            onSpacesLoaded(fp.state.computed.spaces)
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.sceneId]);

    // when spaces are available
    useEffect(() => {
        props.spaces.forEach((space: Space) => {
            document.getElementById(`el-${space.id}`)?.addEventListener("click", (e: any) => {
                const spaceId = getIdFromEvent(e);
                const space = findSpaceById(spaceId);
                props.selectSpace(space!);
            })
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.spaces]);

    // Repaint Spaces
    useEffect(() => {
        props.spaces.forEach((space: Space) => {
            fillSpaceWithColor(space, undefined)
        });
        props.spaces.filter(space => space.usage === "Meet").forEach(space => {
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

    const findSpaceById = (id: string) => props.spaces.find(space => space.id === id);

    const getIdFromEvent = (e: any) => {
        return e.currentTarget.id.replace('el-', '')
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
