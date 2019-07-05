<style lang="sass">
  .type-confirm {
    .type-confirm-input {
      margin: 8px 0 16px;
    }

    .ui-confirm__footer {
      justify-content: flex-end;

      .ui-button {
        margin-left: 16px;
      }
    }
  }
</style>

<template>
  <div class="ui-confirm type-confirm">
    <div class="ui-confirm__message" v-html="data.text"></div>
    <div class="ui-confirm__message">Please type the component name to continue</div>
    <ui-textbox class="type-confirm-input" v-model="input" @keydown-enter="onEnter"></ui-textbox>
    <div class="ui-confirm__footer">
      <ui-button ref="confirmButton" color="primary" :disabled="incorrectInput" @click="confirm">Confirm</ui-button>
      <ui-button ref="denyButton" @click="deny">Cancel</ui-button>
    </div>
  </div>
</template>

<script>
  import UiTextbox from 'keen/UiTextbox';
  import UiButton from 'keen/UiButton';

  export default {
    props: ['data'],
    data() {
      return {
        input: ''
      };
    },
    computed: {
      incorrectInput() {
        return this.input !== this.data.name;
      }
    },
    methods: {
      onEnter() {
        if (!this.incorrectInput) {
          this.confirm();
        }
      },
      confirm() {
        this.$emit('close');
  
        return this.data.onConfirm();
      },
      deny() {
        this.$emit('close');
      }
    },
    components: {
      UiTextbox,
      UiButton
    }
  };
</script>
