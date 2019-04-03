const { of: libOf, from: libFrom, fromEvent: libFromEvent,
    interval: libInterval, timer: libTimer, merge: libMerge } = require('rxjs');
const { map } = require('rxjs/operators')
const { detcTimeLens } = require('./helperTime');
const { flatStream } = require('./helperFunctions');

const R = require('ramda');

const EventStream = require('../eventstream');
const EventType = require('../eventtype');

/**
 * @param {*[]} values - values that are emitted in sequence.
 * @param {Function} [adaptor] - a function responsable for mapping the values emitted by the stream into instances
 * of the EventType class or its subclasses.
 * @return {EventStream} a new event stream instance.
 */
function of(/*...values, adaptor*/){
    const args = [...arguments];
    const adaptor = args[args.length - 1];

    const currTime = Date.now();
    let newEvtOccurence = new EventType('of event', 'of operation', currTime, currTime);

    return new EventStream(arguments.length > 1 && typeof adaptor === 'function'
        ? libOf(...(R.dropLast(1, args))).pipe(map(adaptor), map(R.set(detcTimeLens, currTime)))
        : libOf(...args).pipe(map(val => R.assoc('payload', val, newEvtOccurence)))
        );
}

/**
 * 
 * @param {Array|Promise|Iterable} source
 * @param {Function} [adaptor] - a function responsable for mapping the values emitted by the stream into instances
 * of the EventType class or its subclasses.
 * @return {EventStream} a new event stream instance.
 */
function from(source, adaptor){
    const currTime = Date.now();
    let newEvtOccurence = new EventType('from event', 'from operation', currTime, currTime);

    return new EventStream(typeof adaptor === 'function'
        ? libFrom(source).pipe(map(adaptor), map(R.set(detcTimeLens, currTime)))
        : libFrom(source).pipe(map(val => R.assoc('payload', val, newEvtOccurence)))
        );
}

/**
 * 
 * @param {EventTargetLike} target 
 * @param {string} eventName 
 * @param {Function} adaptor - adaptor is a function responsable
 * for mapping the values emitted by the stream into instances of the EventType class or any EventType's subclass.
 * @return {EventStream} a new event stream instance.
 */
function fromEvent(target, eventName, adaptor) {
    const currTime = Date.now();
    let newEvtOccurence = new EventType('fromEvent event', 'fromEvent operation', currTime, currTime);
    
    return new EventStream(typeof adaptor === 'function'
        ? libFromEvent(target, eventName).pipe(map(adaptor), map(R.set(detcTimeLens, currTime)))
        : libFromEvent(target, eventName).pipe(map(val => R.assoc('payload', val, newEvtOccurence)))
        );
}

const createNewEvtOccurrence = (eventTypeId, eventSource, occurrenceTime) => {
    const currTime = occurrenceTime ? occurrenceTime : Date.now();
    return new EventType(eventTypeId, eventSource, currTime, currTime);
}

/**
 * 
 * @param {number} period 
 * @param {Function} [adaptor] - a function responsable for mapping the values emitted by the stream into instances
 * of the EventType class or its subclasses.
 * @return {EventStream} a new event stream instance.
 */
function interval(period, adaptor){
    return new EventStream(typeof adaptor === 'function'
    ? libInterval(period).pipe(map(adaptor),
        map(x => createNewEvtOccurrence(x.eventTypeId, x.eventSource, x.occurrenceTime)))
    : libInterval(period).pipe(
        map(val => R.assoc('payload', val, createNewEvtOccurrence('interval event', 'interval operation'))))
    );
}

/**
 * @param {number|Date} initialDelay
 * @param {Object} optionalParameters - an object that can have two optional attributes: period and adaptor.
 * period dictates how often subsequent values should be emitted. adaptor is a function responsable
 * for mapping the values emitted by the stream into instances of the EventType class or any EventType's subclass.
 * @return {EventStream} a new event stream instance.
 */
function timer(initialDelay, {period, adaptor} = {}){
    return new EventStream(typeof adaptor === 'function'
        ? libTimer(initialDelay, period).pipe(map(adaptor),
            map(x => createNewEvtOccurrence(x.eventTypeId, x.eventSource, x.occurrenceTime)))
        : libTimer(initialDelay, period).pipe(
            map(val => R.assoc('payload', val, createNewEvtOccurrence('timer event', 'timer operation'))))
        );
}

/**
 * 
 * @param  {...EventStream} eventStreams
 * @return {EventStream} a new event stream instance.
 */
const merge = (...eventStreams) => {
    const streams = eventStreams.map((eventStream) => flatStream(eventStream));
    return new EventStream(libMerge(...streams));
}

module.exports = {
    of,
    from,
    fromEvent,
    interval,
    timer,
    merge
};