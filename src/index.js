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
    initialState: T.object.isRequired,
    storyFn: T.func.isRequired,
    context: T.object,
  };

  store = new Store(this.props.initialState || {});

  state = {
    storyState: this.store.state,
  };

  componentDidMount() {
    const { channel } = this.props;

    this.store.subscribe(this.handleStateChange);
    channel.on('versafleet/state/reset', this.handleResetEvent);
    channel.emit('versafleet/state/change', { state: this.store.state });
  }

  componentWillUnmount() {
    const { channel } = this.props;

    this.store.unsubscribe(this.handleStateChange);
    channel.removeListener('versafleet/state/reset', this.handleResetEvent);
    channel.emit('versafleet/state/change', { state: null });
  }

  handleResetEvent = () => {
    this.store.reset();
  };

  handleStateChange = (storyState) => {
    const { channel } = this.props;

    this.setState({ storyState });
    channel.emit('versafleet/state/change', { state: storyState });
  };

  render() {
    const { storyFn, context } = this.props;
    const store = this.store;

    const child = context ? storyFn({ ...context, store }) : storyFn(store);
    return React.isValidElement(child) ? child : child();
  }
}

function originalWithState(initialState, storyFn = null) {
  const channel = addons.getChannel();

  if (storyFn) {
    // Support legacy withState signature
    return () => (
      <StoryState
        channel={channel}
        initialState={initialState}
        storyFn={storyFn}
      />
    );
  }
  return storyFn => context => (
    <StoryState
      channel={channel}
      context={context}
      initialState={initialState}
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
