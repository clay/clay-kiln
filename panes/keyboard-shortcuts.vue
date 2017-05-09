<style lang="sass">
  @import '../styleguide/colors';
  @import '../styleguide/typography';

  .keyboard-shortcuts {
    max-height: 100%;
    overflow-y: scroll;

    .shortcut {
      align-items: center;
      display: flex;
      flex-flow: row wrap;
      padding: 10px 17px 10px;
    }

    .shortcut + .shortcut {
      border-top: 1px solid $pane-list-divider;
      margin-top: 10px;
    }

    .shortcut:first-of-type {
      padding-top: 20px;
    }

    .shortcut:last-of-type {
      padding-bottom: 20px;
    }

    .shortcut-title {
      @include input-label();

      color: $subtitle;
      flex: 1 0 auto;
    }

    .shortcut-key {
      @include keyboard-keys();

      flex: 0 0 auto;
      margin-left: 5px;
    }

    .shortcut-description {
      @include tertiary-text();

      flex: 1 0 100%;
      margin-top: 5px;
    }
  }
</style>

<template>
  <div class="keyboard-shortcuts">
    <div v-for="shortcut in shortcuts" class="shortcut">
      <span class="shortcut-title">{{ shortcut.title }}</span>
      <span v-for="key in shortcut.keys" class="shortcut-key">{{ key }}</span>
      <span class="shortcut-description">{{ shortcut.description }}</span>
    </div>
  </div>
</template>


<script>
  export default {
    data() {
      return {
        shortcuts: [{
          title: 'Undo and Redo',
          keys: ['⌘+Z / Ctrl+Z', 'Shift+⌘+Z / Shift+Ctrl+Z'],
          description: 'Undo (or redo) your saves, up to 50 times. Navigating away from the page will erase the save history.'
        }, {
          title: 'Navigate Components',
          keys: ['↑', '↓'],
          description: 'When a component is selected, use arrows to navigate to the previous or next component on the page. Useful for selecting parent components when they occupy the same visual space.'
        }, {
          title: 'Close Forms and Panes',
          keys: ['Esc', 'Enter'],
          description: 'Esc closes the current form or pane. Enter closes forms when in single-line text inputs. Closing a form will always save your data.'
        }, {
          title: 'Add Items to Lists',
          keys: ['Enter / Tab / ,'],
          description: 'Use Enter, Tab, or comma to add items to lists.'
        }, {
          title: 'Open Cheat Sheet',
          keys: ['?'],
          description: 'Open this keyboard shortcut cheat sheet.'
        }, {
          title: 'Enter Edit Mode',
          keys: ['Shift+CLAY'],
          description: 'Hold Shift and type "CLAY" to enter edit mode on any Clay page. If you\'re not logged in, you will be prompted to do so.'
        }, {
          title: 'Navigate Rich Text Fields',
          keys: ['← / ↑', '→ / ↓'],
          description: 'Use arrows to navigate between components when editing rich text fields such as paragraphs.'
        }, {
          title: 'Split Text Between Components',
          keys: ['Enter'],
          description: 'Like Google Docs or Microsoft Word, use Enter to split paragraphs when text is after the cursor.'
        }, {
          title: 'Merge Text Between Components',
          keys: ['Backspace'],
          description: 'Like Google Docs or Microsoft Word, use Backspace to merge paragraphs when text is after the cursor.'
        }, {
          title: 'Insert Fake Bullet',
          keys: ['Tab'],
          description: 'In field where it is enabled, Tab will insert a fake bullet at the beginning of a line.'
        }, {
          title: 'Bold Text',
          keys: ['⌘+B / Ctrl+B'],
          description: 'In a field where it is enabled, embolden the highlighted text.'
        }, {
          title: 'Italicize Text',
          keys: ['⌘+I / Ctrl+I'],
          description: 'In a field where it is enabled, italicize the highlighted text.'
        }, {
          title: 'Underline Text',
          keys: ['⌘+U / Ctrl+U'],
          description: 'In a field where it is enabled, underline the highlighted text.'
        }, {
          title: 'Create Link',
          keys: ['⌘+K / Ctrl+K'],
          description: 'In a field where it is enabled, create a link from the highlighted text.'
        }]
      };
    }
  };
</script>
