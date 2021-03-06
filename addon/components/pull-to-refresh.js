import Ember from 'ember';
import jQuery from 'jquery';

export default Ember.Component.extend({
  classNames: 'pull-to-refresh-parent',
  classNameBindings: ['refreshing', 'pulling'],
  scrollable: undefined,
  disableMouseEvents: false,
  threshold: 50,
  refreshing: false,
  _startY: undefined,
  _lastY: undefined,

  init() {
    this._super();
    this.guid = Ember.guidFor(this);
  },

  didInsertElement() {
    this.$().on(`touchstart.${this.guid}`, this._touchStart.bind(this));
    this.$().on(`touchmove.${this.guid}`, this._touchMove.bind(this));
    this.$().on(`touchend.${this.guid}`, this._touchEnd.bind(this));
    this.$().on(`mousedown.${this.guid}`, this._mouseDown.bind(this));
    this.$().on(`mousemove.${this.guid}`, this._mouseMove.bind(this));
    this.$().on(`mouseup.${this.guid}`, this._mouseUp.bind(this));
    this.$().on(`mouseleave.${this.guid}`, this._mouseLeave.bind(this));
  },

  willDestroyElement() {
    this.$().off(`touchstart.${this.guid}`);
    this.$().off(`touchmove.${this.guid}`);
    this.$().off(`touchend.${this.guid}`);
    this.$().off(`mousedown.${this.guid}`);
    this.$().off(`mousemove.${this.guid}`);
    this.$().off(`mouseup.${this.guid}`);
    this.$().off(`mouseleave.${this.guid}`);
  },

  _touchStart(e) {
    const y = e.originalEvent.targetTouches[0].pageY;
    this._start(y);
  },

  _mouseDown(e) {
    if (this.get('disableMouseEvents')) {
      return;
    }

    const y = e.pageY;
    this._start(y);
  },

  _start(y) {
    if (this.get('refreshing') || !this._canPullDown()) {
      return;
    }

    this.setProperties({
      _startY: y,
      _lastY: y
    });
  },


  _touchMove(e) {
    const y = e.originalEvent.targetTouches[0].pageY;
    this._move(y);
  },

  _mouseMove(e) {
    const y = e.pageY;
    this._move(y);
  },

  _move(y) {
    if (this.get('refreshing') || !this.get('_startY')) {
      return;
    }

    this.set('_lastY', y);

    if (!this.get('pulling')) {
      return;
    }

    const dy = Math.min(
      this.get('_dy'),
      (this.get('threshold') * 2)
    );

    this._setTop(dy);
  },

  _touchEnd() {
    this._end();
  },

  _mouseUp() {
    this._end();
  },

  _mouseLeave() {
    this._end();
  },

  _end() {
    if (!this.get('_startY')) {
      return;
    }

    const threshold = this.get('threshold');
    const refreshing = this.get('_dy') >= threshold;

    Ember.run.once(() => {
      this.setProperties({
        _startY: undefined,
        _lastY: undefined,
        refreshing: refreshing
      });

      this._reset();
    });

    if (refreshing) {
      this.sendAction('refresh');
    }
  },

  _reset: Ember.observer('refreshing', function () {
    let top = 0;
    if (this.get('refreshing')) {
      top = this.get('threshold');
    }

    this._setTop(top);
  }),

  _setTop(y) {
    this.$('.pull-to-refresh-child')
      .css('transform', `translate3d(0, ${y}px, 0)`);
  },

  _dy: Ember.computed('_lastY', '_startY', function () {
    return this.get('_lastY') - this.get('_startY');
  }),

  _canPullDown() {
    let scrollable = this.get('_scrollableEl');

    if (!scrollable) {
      scrollable = jQuery(this.get('scrollable'));

      if (scrollable.length > 0) {
        this.set('_scrollableEl', scrollable);
      }
    }

    return (scrollable.length === 0 ||
      scrollable.scrollTop() === 0);
  },

  pulling: Ember.computed('_startY', '_dy', function () {
    return this.get('_startY') && this._canPullDown() && this.get('_dy') > 0;
  })
});
