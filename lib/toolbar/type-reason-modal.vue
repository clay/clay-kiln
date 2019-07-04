<style lang="sass">
  .type-reason {
    .type-reason-input {
      margin: 8px 0 16px;
    }

    .ui-reason__footer {
      justify-content: flex-end;

      .ui-button {
        margin-left: 16px;
      }
    }
  }
</style>

<template>
  <div class="ui-reason type-reason">
    <div class="ui-reason__message" v-html="data.text"></div>
    <div class="ui-reason__message">This component was marked as critical and is not frequently deleted. Please specify a reason for removal.</div>
    <ui-textbox class="type-reason-input" v-model="input" @keydown-enter="onEnter"></ui-textbox>
    <div class="ui-reason__footer">
      <ui-button ref="confirmButton" color="primary" :disabled="incorrectInput" @click="confirm">Submit</ui-button>
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
        return !this.input.length;
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
  
        return this.data.onConfirm(this.input);
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
