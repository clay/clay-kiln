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
    <div class="ui-reason__message"><p>Are you sure you want to restore to the published version? This action cannot be undone and <b>all of the changes since the page was last published will be lost permanently</b>.</p><p>Please type "restore page" to verify you wish to continue.</p></div>
    <ui-textbox class="type-reason-input" v-model="input" @keydown-enter="onEnter"></ui-textbox>
    <div class="ui-reason__footer">
      <ui-button ref="confirmButton" color="primary" :disabled="!correctInput" @click="confirm">Submit</ui-button>
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
      correctInput() {
        return this.input.toLowerCase() === 'restore page';
      }
    },
    methods: {
      onEnter() {
        if (this.correctInput) {
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
