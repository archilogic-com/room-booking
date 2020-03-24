import { createStore, applyMiddleware, compose } from 'redux'
import { combineReducers } from 'redux'
import thunk from 'redux-thunk';

import bookings from 'reducers/bookings'
import floor from 'reducers/floor'

declare var window:any
const reducers = combineReducers({bookings, floor})
export const store = createStore(
    reducers,
    compose(
        applyMiddleware(thunk),
        // window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
        )
    )
