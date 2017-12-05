<template>
  <div class="kiln-attached-buttons ui-button-group" v-if="args.attachedButton">
    <component v-for="button in buttons" :key="button.name" slot="icon" :is="button.name" :name="name" :data="data" :schema="schema" :args="button" @disable="onDisable" @enable="onEnable"></component>
  </div>
</template>

<script>
  import _ from 'lodash';
  import logger from '../lib/utils/log';

  const log = logger(__filename);

  export default {
    name: 'attached-button',
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {};
    },
    computed: {
      buttons() {
        const attachedButton = _.get(this, 'args.attachedButton');

        let buttons;

        // munge them into an array
        if (!!attachedButton) {
          buttons = _.isArray(attachedButton) ? attachedButton : [attachedButton];
        } else {
          buttons = [];
        }

        // expand any syntax sugar, so they're an array of objects
        buttons = _.map(buttons, (button) => _.isString(button) ? { name: button } : button);

        return _.filter(buttons, (button) => {
          if (!_.get(window, `kiln.inputs['${button.name}']`)) {
            log.warn(`Attached button (${button.name}) for '${this.name}' not found!`, { action: 'hasButton', input: this.args });
            return false;
          } else {
            return true;
          }
        });
      }
    },
    methods: {
      onDisable() {
        this.$emit('disable');
      },
      onEnable() {
        this.$emit('enable');
      }
    },
    components: window.kiln.inputs // attached button
  };
</script>
