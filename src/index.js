import React from 'react';
import T from 'prop-types';
import addons from '@storybook/addons';

export class Store {
  constructor(initialState) {
    this.initialState = Object.freeze({ ...initialState });
    this.state = this.initialState;
    this.handlers = [];
  }

  set(state) {
    this.state = Object.freeze({ ...this.state, ...state });
    this.fireStateChange();
  }

  reset() {
    if (this.initialState !== this.state) {
      this.state = this.initialState;
      this.fireStateChange();
    }
  }

  subscribe(handler) {
    if (this.handlers.indexOf(handler) < 0) {
      this.handlers.push(handler);
    }
  }

  unsubscribe(handler) {
    const handlerIndex = this.handlers.indexOf(handler);
    if (handlerIndex >= 0) {
      this.handlers.splice(handlerIndex, 1);
    }
  }

  fireStateChange() {
    const state = this.state;

    this.handlers.forEach(handler => handler(state));
  }
}

export class StoryState extends React.Component {
  static propTypes = {
    channel: T.object.isRequired,
    store: T.object.isRequired,
    storyFn: T.func.isRequired,
    context: T.object,
  };

  state = {
    storyState: this.props.store.state,
  };

  componentDidMount() {
    const { store, channel } = this.props;

    store.subscribe(this.handleStateChange);
    channel.on('dump247/state/reset', this.handleResetEvent);
    channel.emit('dump247/state/change', { state: store.state });
  }

  componentWillUnmount() {
    const { store, channel } = this.props;

    store.unsubscribe(this.handleStateChange);
    channel.removeListener('dump247/state/reset', this.handleResetEvent);
    channel.emit('dump247/state/change', { state: null });
  }

  handleResetEvent = () => {
    const { store } = this.props;

    store.reset();
  };

  handleStateChange = (storyState) => {
    const { channel } = this.props;

    this.setState({ storyState });
    channel.emit('dump247/state/change', { state: storyState });
  };

  render() {
    const { store, storyFn, context } = this.props;

    const child = context ? storyFn(context) : storyFn(store);
    return React.isValidElement(child) ? child : child();
  }
}

let counter = 0;

function originalWithState(initialState, storyFn = null) {
  const store = new Store(initialState || {});
  const channel = addons.getChannel();

  counter += 1;
  if (storyFn) {
    // Support legacy withState signature
    return () => (
      <StoryState
        channel={channel}
        key={counter}
        store={store}
        storyFn={storyFn}
      />
    );
  }
  return storyFn => context => (
    <StoryState
      channel={channel}
      context={{ ...context, store }}
      key={counter}
      store={store}
      storyFn={storyFn}
    />
  );
}

// https://github.com/bluealba/withState/blob/master/index.js
export const withState = initialState => (story, context) => {
  const state = context ? context.parameters.initialState || initialState : initialState;

  return originalWithState(state)((copiedContext) => {
    context.store = copiedContext.store;

    return story(context);
  })(context);
};
