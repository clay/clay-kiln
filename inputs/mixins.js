export const DynamicEvents = {
  directives: {
    DynamicEvents: {
      bind: function (el, binding, vnode) {
        const allEvents = binding.value;

        allEvents.forEach((event) => {
          // register handler in the dynamic component
          vnode.componentInstance.$on(event, (eventData) => {
            // when the event is fired, the proxyEvent function is going to be called
            vnode.context.proxyEvent(event, eventData);
          });
        });
      },
      unbind: function (el, binding, vnode) {
        vnode.componentInstance.$off();
      }
    }
  },
  computed: {
    customEvents() {
      return this.schema.events ? Object.keys(this.schema.events).map(key => key) : [];
    }
  },
  methods: {
    proxyEvent(eventName, eventData) {
    // called by the custom directive
      if (this.schema.events[eventName]) {
        this.schema.events[eventName](eventData);
      }
    }
  }
};
